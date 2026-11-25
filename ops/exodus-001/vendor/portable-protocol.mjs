import { createHash, createPublicKey, generateKeyPairSync, sign as edSign, verify as edVerify } from 'node:crypto';

// The v0.1 representation is a deliberately small, JSON-only, zero-dependency specimen.
const TYPES = new Set(['need', 'offer', 'decision', 'report']);
const STAGES = new Set(['accepted', 'declined', 'confirmed']);
const ALLOWED_STATUS = new Set(['open', 'withdrawn']);
const resource = /^[a-z0-9][a-z0-9_-]{1,63}$/;
const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9:._-]{2,127}$/;
const exactKeys = (object, keys) => object && typeof object === 'object' && !Array.isArray(object) &&
  Object.keys(object).every(key => keys.includes(key)) && Object.keys(object).length === keys.length;
const validText = (text, max = 220) => typeof text === 'string' && text.trim().length > 0 && text.length <= max;
const positive = n => Number.isSafeInteger(n) && n > 0 && n <= 1000000;

export function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  throw new Error('Not portable JSON');
}
export const hash = value => createHash('sha256').update(canonical(value)).digest('hex');
export function identity() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  };
}
export function seal(type, payload, keys) {
  if (!TYPES.has(type)) throw new Error('Unsupported envelope kind');
  const publicKey = createPublicKey(keys.privateKey).export({ type: 'spki', format: 'pem' });
  if (keys.publicKey !== publicKey) throw new Error('Signing identity mismatch');
  const content = { version: 'jubilee-portable/0.1', type, payload, publicKey };
  const message = Buffer.from('JUBILEE-PORTABLE-V0.1\n' + canonical(content));
  return { ...content, signature: edSign(null, message, keys.privateKey).toString('base64') };
}
export function verify(envelope) {
  if (!exactKeys(envelope, ['version', 'type', 'payload', 'publicKey', 'signature'])) return false;
  if (envelope.version !== 'jubilee-portable/0.1' || !TYPES.has(envelope.type)) return false;
  try {
    const { signature, ...content } = envelope;
    const decoded = Buffer.from(signature, 'base64');
    if (decoded.length !== 64 || decoded.toString('base64') !== signature) return false;
    return edVerify(null, Buffer.from('JUBILEE-PORTABLE-V0.1\n' + canonical(content)), envelope.publicKey, decoded);
  } catch { return false; }
}
function assert(condition, why) { if (!condition) throw new Error(why); }
function validateNeed(envelope) {
  assert(envelope.type === 'need' && verify(envelope), 'Unsigned or invalid need');
  const p = envelope.payload;
  assert(exactKeys(p, ['id', 'revision', 'previousHash', 'status', 'public']), 'Need schema mismatch');
  assert(typeof p.id === 'string' && idPattern.test(p.id), 'Invalid need id');
  assert(positive(p.revision), 'Invalid revision');
  assert(p.revision === 1 ? p.previousHash === null : typeof p.previousHash === 'string' && /^[a-f0-9]{64}$/.test(p.previousHash), 'Invalid predecessor');
  assert(ALLOWED_STATUS.has(p.status), 'Invalid status');
  const pub = p.public;
  assert(exactKeys(pub, ['title', 'summary', 'region', 'requirements']), 'Public manifest must contain only approved fields');
  assert(validText(pub.title) && validText(pub.summary, 1200) && validText(pub.region, 70), 'Invalid public text');
  assert(Array.isArray(pub.requirements) && pub.requirements.length > 0 && pub.requirements.length <= 20, 'Invalid requirements');
  const ids = new Set();
  for (const r of pub.requirements) {
    assert(exactKeys(r, ['id', 'resource', 'quantity', 'unit', 'kind']), 'Requirement schema mismatch');
    assert(typeof r.id === 'string' && idPattern.test(r.id) && !ids.has(r.id), 'Duplicate requirement');
    ids.add(r.id);
    assert(typeof r.resource === 'string' && resource.test(r.resource) && positive(r.quantity), 'Invalid resource or quantity');
    assert(typeof r.unit === 'string' && resource.test(r.unit), 'Invalid unit');
    assert(['goods', 'service', 'money'].includes(r.kind), 'Invalid requirement kind');
  }
  return p;
}
export function firstNeed(keys, { id, title, summary, region, requirements }) {
  const signed = seal('need', { id, revision: 1, previousHash: null, status: 'open', public: { title, summary, region, requirements } }, keys);
  validateNeed(signed); return signed;
}
export function nextNeed(keys, previous, { status, public: replacement } = {}) {
  validateNeed(previous);
  assert(keys.publicKey === previous.publicKey, 'Only owner may revise');
  assert(previous.payload.status === 'open', 'Withdrawn need cannot reopen under same identity');
  const signed = seal('need', {
    id: previous.payload.id, revision: previous.payload.revision + 1, previousHash: hash(previous),
    status: status ?? previous.payload.status, public: replacement ?? previous.payload.public,
  }, keys);
  validateNeed(signed); return signed;
}
export function makeOffer(keys, { id, need, requirementId, region, quantity, unit, kind }) {
  const p = validateNeed(need);
  assert(p.status === 'open', 'Withdrawn need');
  const r = p.public.requirements.find(v => v.id === requirementId);
  assert(r && r.kind === kind && r.unit === unit, 'Requirement mismatch');
  const offer = seal('offer', {
    id, needId: p.id, needHash: hash(need), requirementId, region, quantity, unit, kind,
  }, keys);
  validateOffer(offer); return offer;
}
export function validateOffer(offer) {
  assert(offer.type === 'offer' && verify(offer), 'Invalid signed offer');
  const p = offer.payload;
  assert(exactKeys(p, ['id', 'needId', 'needHash', 'requirementId', 'region', 'quantity', 'unit', 'kind']), 'Offer schema mismatch');
  assert(typeof p.id === 'string' && idPattern.test(p.id) && typeof p.needId === 'string' && idPattern.test(p.needId), 'Invalid offer id');
  assert(/^[a-f0-9]{64}$/.test(p.needHash), 'Invalid source hash');
  assert(typeof p.requirementId === 'string' && idPattern.test(p.requirementId), 'Invalid requirement');
  assert(validText(p.region, 70) && positive(p.quantity) && typeof p.unit === 'string' && resource.test(p.unit), 'Invalid offered quantity');
  assert(['goods', 'service', 'money'].includes(p.kind), 'Invalid offer kind');
  return p;
}

// Transparent *candidate* matcher: never makes decisions or asserts that anything was delivered.
export function proposeMatches(need, offers) {
  const n = validateNeed(need);
  if (n.status !== 'open') return [];
  const matches = [];
  for (const envelope of offers) {
    let o; try { o = validateOffer(envelope); } catch { continue; }
    if (o.needId !== n.id || o.needHash !== hash(need)) continue;
    const r = n.public.requirements.find(v => v.id === o.requirementId);
    if (!r || r.kind !== o.kind || r.unit !== o.unit) continue;
    if (o.region !== n.public.region && o.region !== 'remote') continue;
    matches.push({ offerHash: hash(envelope), requirementId: r.id,
      reasons: ['same signed need revision', 'same requirement', 'compatible kind and unit', 'declared delivery region'],
      state: 'proposal_not_acceptance' });
  }
  return matches;
}
export function makeDecision(ownerKeys, need, offer, stage, previous = null) {
  const n = validateNeed(need), o = validateOffer(offer);
  assert(ownerKeys.publicKey === need.publicKey, 'Recipient authority required');
  assert(n.status === 'open' && o.needId === n.id && o.needHash === hash(need), 'Stale or withdrawn offer');
  assert(STAGES.has(stage), 'Invalid stage');
  if (stage === 'confirmed') {
    assert(previous && previous.type === 'report' && verify(previous) && previous.payload.offerHash === hash(offer), 'Human confirmation requires signed helper report');
    assert(previous.publicKey === offer.publicKey, 'Report must come from helper');
  } else assert(previous === null, 'Unexpected predecessor');
  const result = seal('decision', { offerHash: hash(offer), needHash: hash(need), stage,
    reportHash: previous ? hash(previous) : null }, ownerKeys);
  validateDecision(result); return result;
}
function validateDecision(event) {
  assert(event.type === 'decision' && verify(event), 'Invalid decision signature');
  const p = event.payload;
  assert(exactKeys(p, ['offerHash', 'needHash', 'stage', 'reportHash']), 'Invalid decision schema');
  assert(/^[a-f0-9]{64}$/.test(p.offerHash) && /^[a-f0-9]{64}$/.test(p.needHash), 'Invalid refs');
  assert(STAGES.has(p.stage) && (p.reportHash === null || /^[a-f0-9]{64}$/.test(p.reportHash)), 'Invalid stage or report');
  return p;
}
export function makeReport(helperKeys, need, offer, acceptance) {
  const n = validateNeed(need), o = validateOffer(offer), d = validateDecision(acceptance);
  assert(n.status === 'open' && o.needHash === hash(need) && o.needId === n.id, 'Stale offer');
  assert(helperKeys.publicKey === offer.publicKey, 'Only helper may report');
  assert(acceptance.publicKey === need.publicKey && d.stage === 'accepted' && d.offerHash === hash(offer) && d.needHash === hash(need), 'Signed owner acceptance required');
  return seal('report', { offerHash: hash(offer), acceptanceHash: hash(acceptance), claim: 'helper_reported_delivery' }, helperKeys);
}

export class Mirror {
  constructor(name) { this.name = name; this.history = new Map(); }
  receive(signed) {
    const p = validateNeed(signed); const known = this.history.get(p.id) || [];
    if (!known.length) assert(p.revision === 1, 'Missing signed origin');
    else {
      const last = known.at(-1);
      if (hash(last) === hash(signed)) return 'duplicate';
      assert(signed.publicKey === last.publicKey, 'Owner key substitution');
      assert(last.payload.status === 'open', 'Cannot reactivate withdrawn need');
      assert(p.revision === last.payload.revision + 1, 'Stale revision, fork, or history gap');
      assert(p.previousHash === hash(last), 'Wrong parent snapshot');
    }
    this.history.set(p.id, [...known, structuredClone(signed)]);
    return 'admitted';
  }
  latest(id) { return structuredClone(this.history.get(id)?.at(-1) ?? null); }
  export(id) { return structuredClone(this.history.get(id) ?? []); }
  import(bundle) {
    assert(Array.isArray(bundle) && bundle.length > 0, 'Empty bundle');
    const staged = new Mirror('staged');
    staged.history = new Map([...this.history].map(([k, v]) => [k, structuredClone(v)]));
    const results = bundle.map(e => staged.receive(e));
    this.history = staged.history;
    return results;
  }
}
export function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function publicPage(need) {
  const p = validateNeed(need);
  const entries = p.public.requirements.map(r => `<li>${escapeHtml(r.resource)} — ${r.quantity} ${escapeHtml(r.unit)} (${r.kind})</li>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(p.public.title)}</title><main><h1>${escapeHtml(p.public.title)}</h1><p>${escapeHtml(p.public.summary)}</p><p>Region: ${escapeHtml(p.public.region)}</p><p>Status: ${p.status}</p><ul>${entries}</ul><small>Portable signed request. Signature verifies authorship by a key, not real-world identity or validity of the request. No payments processed here.</small></main></html>`;
}
