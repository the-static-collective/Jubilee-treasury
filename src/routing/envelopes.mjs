import { createPublicKey, sign, verify as checkSignature } from 'node:crypto';
import { canonical, hash } from '../protocol.mjs';

export const VERSION = 'jubilee-routing/0.2';
export const STATES = ['available', 'reserved', 'declined', 'withdrawn', 'expired', 'contested', 'unsafe'];
export const BOUNDARIES = ['pickup', 'delivery', 'accessible-transport'];
export const RESOURCES = ['wheelchair', 'firewood', 'groceries', 'transport', 'child-care', 'tool', 'materials'];
export const UNITS = ['item', 'cord', 'bundle', 'kg', 'slot', 'hour'];
export function assert(ok, message) { if (!ok) throw new Error(message); }
export function exact(value, fields) {
  assert(value && Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(value).length === fields.length && fields.every(k => Object.hasOwn(value, k)), 'Unexpected schema/private fields');
}
export const token = v => typeof v === 'string' && /^[a-z0-9][a-z0-9:_-]{1,100}$/.test(v);
const quantity = v => Number.isSafeInteger(v) && v > 0 && v <= 10000;
const digest = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
export function timestamp(v) { return typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v; }
function boundaries(v) {
  return Array.isArray(v) && v.length <= BOUNDARIES.length && new Set(v).size === v.length && v.every(x => BOUNDARIES.includes(x));
}
function source(s) {
  exact(s, ['system', 'version', 'authority', 'object', 'revision']);
  assert(['garden-campfire', 'full-measure', 'bananagram'].includes(s.system) &&
    /^[a-f0-9]{40}$/.test(s.version) && token(s.authority) && token(s.object) && quantity(s.revision), 'Invalid source provenance');
}
function validatePayload(type, p) {
  if (type === 'consent') {
    exact(p, ['proposalId', 'party', 'decision', 'expiresAt']);
    assert(digest(p.proposalId) && ['requester', 'helper'].includes(p.party) &&
      ['allow', 'decline', 'withdraw'].includes(p.decision) && timestamp(p.expiresAt), 'Invalid private consent');
    return;
  }
  assert(['need', 'capacity'].includes(type), 'Unsupported routing kind');
  exact(p, ['id', 'revision', 'previousHash', 'source', 'status', 'resource', 'kind', 'unit', 'quantity', 'region', 'boundaries', 'validFrom', 'expiresAt']);
  source(p.source);
  assert(token(p.id) && p.id === p.source.object && quantity(p.revision) && p.source.revision === p.revision &&
    (p.revision === 1 ? p.previousHash === null : digest(p.previousHash)), 'Invalid address/revision');
  assert(RESOURCES.includes(p.resource) && UNITS.includes(p.unit) && typeof p.region === 'string' &&
    /^[a-z][a-z-]{1,63}$/.test(p.region) && quantity(p.quantity) &&
    ['goods', 'service'].includes(p.kind) && boundaries(p.boundaries), 'Invalid physical resource fields');
  assert(timestamp(p.validFrom) && timestamp(p.expiresAt) && p.validFrom < p.expiresAt, 'Invalid availability window');
  assert(type === 'need' ? ['open', 'withdrawn'].includes(p.status) : STATES.includes(p.status), 'Invalid resource status');
}
export function sealRouting(type, payload, keys) {
  validatePayload(type, payload);
  assert(createPublicKey(keys.privateKey).export({ type: 'spki', format: 'pem' }) === keys.publicKey, 'Signing key mismatch');
  const content = { version: VERSION, type, payload, publicKey: keys.publicKey };
  return { ...content, signature: sign(null, Buffer.from(VERSION + '\n' + canonical(content)), keys.privateKey).toString('base64') };
}
export function validateRouting(e) {
  exact(e, ['version', 'type', 'payload', 'publicKey', 'signature']);
  assert(e.version === VERSION && typeof e.publicKey === 'string' && typeof e.signature === 'string', 'Invalid envelope');
  validatePayload(e.type, e.payload);
  const { signature, ...content } = e;
  const bytes = Buffer.from(signature, 'base64');
  assert(bytes.length === 64 && bytes.toString('base64') === signature &&
    checkSignature(null, Buffer.from(VERSION + '\n' + canonical(content)), e.publicKey, bytes), 'Invalid source signature');
  return e.payload;
}
export function reviseRouting(previous, changes, keys) {
  const p = validateRouting(previous);
  assert(previous.type !== 'consent' && previous.publicKey === keys.publicKey && p.status !== 'withdrawn', 'Retired or foreign source');
  return sealRouting(previous.type, { ...p, ...changes, revision: p.revision + 1, previousHash: hash(previous),
    source: { ...p.source, revision: p.revision + 1 } }, keys);
}

// A history cache, with no admission or allocation method. Offline bundles cannot prove freshness.
export class RoutingMirror {
  constructor() { this.records = new Map(); }
  receive(envelope) {
    const p = validateRouting(envelope);
    assert(envelope.type !== 'consent', 'Private coordination never enters public mirrors');
    const key = `${envelope.type}:${p.id}`;
    const history = this.records.get(key) ?? [];
    const last = history.at(-1);
    if (last && hash(last) === hash(envelope)) return 'duplicate';
    assert(last ? last.publicKey === envelope.publicKey && last.payload.status !== 'withdrawn' &&
      p.revision === last.payload.revision + 1 && p.previousHash === hash(last) &&
      canonical(p.source) === canonical({ ...last.payload.source, revision: p.revision }) : p.revision === 1, 'Stale, substituted, forked or missing source history');
    this.records.set(key, [...history, structuredClone(envelope)]);
    return 'admitted';
  }
  export() { return structuredClone([...this.records.values()].flat()); }
  import(bundle) {
    assert(Array.isArray(bundle) && bundle.length <= 10000, 'Invalid mirror bundle');
    const staged = new RoutingMirror();
    for (const e of [...this.export(), ...bundle]) staged.receive(e);
    this.records = staged.records;
  }
  latest(type, id) { return structuredClone(this.records.get(`${type}:${id}`)?.at(-1) ?? null); }
}
