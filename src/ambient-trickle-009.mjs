import { createHash, createPublicKey, generateKeyPairSync, sign as edSign, verify as edVerify } from 'node:crypto';

export const POLICY_SCHEMA = 'jubilee.trickle-policy/v0.1';
export const INBOX_SCHEMA = 'jubilee.trickle-inbox/v0.1';
export const SIGNAL_SCHEMA = 'jubilee.trickle-signal/v0.1';
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{2,127}$/;
const TOKEN = /^[a-z][a-z0-9_-]{1,63}$/;
const HASH = /^[a-f0-9]{64}$/;
const STATUSES = ['offer_reported','pledge_reported','settlement_reported','delivery_reported','revoked'];
const only = (v, keys) => v && typeof v === 'object' && !Array.isArray(v) &&
  Object.keys(v).length === keys.length && Object.keys(v).every(k => keys.includes(k));
const validId = v => typeof v === 'string' && ID.test(v);
const validToken = v => typeof v === 'string' && TOKEN.test(v);
const fail = x => {throw new Error('TRICKLE_HOLD: '+x);};
const check = (c,x) => {if(!c) fail(x);};

export function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  check(value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype, 'not portable JSON');
  return '{'+Object.keys(value).sort().map(k => JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
}
export const contentHash = x => createHash('sha256').update(canonical(x)).digest('hex');
const isHash = x => typeof x === 'string' && HASH.test(x);
function validTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value;
}
function validatePolicy(policy) {
  check(only(policy,['schema','policyId','sources','visibility','automaticDisposition']), 'policy fields');
  check(policy.schema === POLICY_SCHEMA && validId(policy.policyId), 'policy identity');
  check(policy.visibility === 'private' && policy.automaticDisposition === false,
    'no public publication or automatic disposition');
  check(Array.isArray(policy.sources) && policy.sources.length > 0 && policy.sources.length <= 16, 'source whitelist');
  const ids = new Set();
  for (const source of policy.sources) {
    check(only(source,['sourceId','publicKey','allowedKinds','allowedPurposes']), 'source policy fields');
    check(validId(source.sourceId) && !ids.has(source.sourceId), 'duplicate source identity');
    ids.add(source.sourceId);
    check(typeof source.publicKey === 'string' && source.publicKey.length <= 2048 &&
      source.publicKey.includes('BEGIN PUBLIC KEY'), 'pinned key required');
    try {createPublicKey(source.publicKey);}catch {fail('malformed source public key');}
    for (const field of ['allowedKinds','allowedPurposes']) {
      const vals = source[field];
      check(Array.isArray(vals) && vals.length > 0 && vals.length <= 40, field+' required');
      check(vals.every(field==='allowedKinds' ? validToken : validId) && new Set(vals).size === vals.length, field+' invalid');
    }
  }
  return policy;
}
export function keysForSource() {
  const {publicKey,privateKey} = generateKeyPairSync('ed25519');
  return {publicKey:publicKey.export({type:'spki',format:'pem'}),
    privateKey:privateKey.export({type:'pkcs8',format:'pem'})};
}
export function policyFor(sourceId, publicKey, allowedKinds, allowedPurposes) {
  const policy={schema:POLICY_SCHEMA,policyId:'policy-ambient-trickle-009',
    sources:[{sourceId,publicKey,allowedKinds,allowedPurposes}],visibility:'private',automaticDisposition:false};
  validatePolicy(policy);return policy;
}
export function newInbox(policy) {
  validatePolicy(policy);
  return {schema:INBOX_SCHEMA,policy:structuredClone(policy),signals:[]};
}
function validatePayload(p) {
  check(only(p,['eventId','assetId','revision','previousHash','kind','status','quantity','unit','purposeId','evidenceHash','observedAt']), 'signal payload fields');
  check(validId(p.eventId) && validId(p.assetId) && Number.isSafeInteger(p.revision) && p.revision > 0, 'invalid event/asset/version');
  check(p.revision === 1 ? p.previousHash === null : isHash(p.previousHash), 'invalid predecessor hash');
  check(validToken(p.kind) && validToken(p.unit), 'invalid resource kind or unit');
  check(STATUSES.includes(p.status), 'invalid status');
  check(Number.isSafeInteger(p.quantity) && p.quantity >= 1 && p.quantity <= 1000000000000, 'quantity must be bounded integer');
  check(validId(p.purposeId) && isHash(p.evidenceHash), 'purpose/evidence identity malformed');
  check(validTimestamp(p.observedAt), 'invalid reported time');
  check(p.kind === 'money' ? p.unit.startsWith('minor_') : !p.unit.startsWith('minor_'), 'money units must be explicitly minor-denominated');
  check(p.status !== 'settlement_reported' || p.kind === 'money', 'settlement only for external money claims');
  check(p.status !== 'delivery_reported' || p.kind !== 'money', 'delivery claims do not settle money');
  check(p.status !== 'offer_reported' || p.kind !== 'money', 'money offer must be marked pledge, not received');
}
export function signSignal(sourceId, payload, keys) {
  check(validId(sourceId) && typeof keys?.privateKey === 'string', 'source signer required');
  validatePayload(payload);
  const publicKey = createPublicKey(keys.privateKey).export({type:'spki',format:'pem'});
  check(publicKey === keys.publicKey, 'mismatched keypair');
  const content = {schema:SIGNAL_SCHEMA,sourceId,payload:structuredClone(payload)};
  const signature = edSign(null,Buffer.from('JUBILEE-TRICKLE-SOURCE-V0.1\n'+canonical(content)),keys.privateKey).toString('base64');
  return {...content,signature};
}
function verifySignal(signed, policy) {
  check(only(signed,['schema','sourceId','payload','signature']) &&
    signed.schema === SIGNAL_SCHEMA, 'signed signal fields');
  const source = policy.sources.find(x=>x.sourceId===signed.sourceId);
  check(source,'source not authorized by local policy');
  validatePayload(signed.payload);
  check(source.allowedKinds.includes(signed.payload.kind) && source.allowedPurposes.includes(signed.payload.purposeId),
    'source scope mismatch');
  check(typeof signed.signature === 'string' && signed.signature.length <= 128,'invalid signature encoding');
  const signature = Buffer.from(signed.signature,'base64');
  check(signature.length === 64 && signature.toString('base64') === signed.signature,
    'noncanonical signature encoding');
  const {signature:_,...body}=signed;
  let verified=false;
  try {
    verified=edVerify(null,Buffer.from('JUBILEE-TRICKLE-SOURCE-V0.1\n'+canonical(body)),source.publicKey,signature);
  } catch {}
  check(verified,'untrusted or forged source signature');
  return signed.payload;
}
// A source is a configured signing adaptor, not an issuer of legal payment truth.
function fold(inbox) {
  check(only(inbox,['schema','policy','signals']) && inbox.schema === INBOX_SCHEMA,'inbox schema');
  validatePolicy(inbox.policy);
  check(Array.isArray(inbox.signals) && inbox.signals.length <= 100000,'bounded inbox');
  const bySourceEvent=new Map(),latest=new Map();
  for(const signal of inbox.signals){
    const p=verifySignal(signal,inbox.policy);
    const id=signal.sourceId+':'+p.eventId;
    check(!bySourceEvent.has(id),'duplicate event not collapsed');
    bySourceEvent.set(id,contentHash(signal));
    const key=signal.sourceId+':'+p.assetId,older=latest.get(key);
    if(!older){
      check(p.revision === 1 && p.previousHash === null,'missing source origin');
    }else{
      check(p.revision === older.payload.revision+1 && p.previousHash === contentHash(older),
        'history gap, replay or fork');
      check(older.payload.status !== 'revoked','revoked item cannot reappear');
      for(const field of ['assetId','kind','unit','purposeId']){
        check(older.payload[field] === p[field],'immutable resource identity changed');
      }
      check(!['settlement_reported','delivery_reported'].includes(older.payload.status) ||
         [older.payload.status,'revoked'].includes(p.status),'settled/delivered claim cannot go backwards');
    }
    latest.set(key,signal);
  }
  return {latest,bySourceEvent,head:contentHash({policy:inbox.policy,signals:inbox.signals.map(contentHash)})};
}
export function ingest(inbox, signal) {
  const state=fold(inbox);
  const p=verifySignal(signal,inbox.policy),key=signal.sourceId+':'+p.eventId;
  if(state.bySourceEvent.has(key)){
    check(state.bySourceEvent.get(key) === contentHash(signal),'same source event id with contradictory content');
    return structuredClone(inbox); // Replay is harmless.
  }
  const next={...structuredClone(inbox),signals:[...inbox.signals,structuredClone(signal)]};
  fold(next);
  return next;
}
export function importBatch(inbox, signals) {
  check(Array.isArray(signals) && signals.length <= 1000,'bounded batch required');
  let staged=structuredClone(inbox);
  for(const signal of signals) staged=ingest(staged,signal);
  // All-or-nothing: failed import cannot mutate the prior inbox.
  return staged;
}
export function project(inbox) {
  const folded=fold(inbox);
  const claims=[...folded.latest.entries()].map(([key,s])=>({
    address:key,sourceId:s.sourceId,assetId:s.payload.assetId,revision:s.payload.revision,
    kind:s.payload.kind,status:s.payload.status,quantity:s.payload.quantity,unit:s.payload.unit,
    purposeId:s.payload.purposeId,evidenceHash:s.payload.evidenceHash,signalHash:contentHash(s)
  })).sort((a,b)=>a.address.localeCompare(b.address));
  const active=claims.filter(x=>x.status!=='revoked');
  return {
    schema:'jubilee.trickle-projection/v0.1',
    status:'PRIVATE_OBSERVED_HOLD',
    sourceCount:inbox.policy.sources.length,
    signalCount:inbox.signals.length,head:folded.head,
    currentSourceReports:active,
    revokedReports:claims.filter(x=>x.status==='revoked').map(x=>({address:x.address,signalHash:x.signalHash})),
    claimedMoneyReports:active.filter(x=>x.kind==='money' && x.status==='settlement_reported'),
    noncashOffers:active.filter(x=>x.kind!=='money'),
    fundsTransferred:false,assetsAdmitted:false,publicExposure:false,
    warning:'Source-signed claims only. No station accounting, actual receipt verification, gift ownership, recipient consent, or distributable balance.'
  };
}
// Deliberately inert: reLATTE can HOLD a source observation without receiving money,
// inventory or legal title. This does not sign a reLATTE CrossingEnvelope.
export function relatteObservationSpec(inbox,sourceId,assetId,createdAt) {
  const view=project(inbox);
  check(validTimestamp(createdAt),'crossing timestamp required');
  const item=view.currentSourceReports.find(x=>x.sourceId===sourceId && x.assetId===assetId);
  check(item,'only current nonrevoked observation may be proposed for HOLD');
  return {
    schema:'relatte.opaque-organ-spec/v0',
    family_ref:'jubilee.trickle-inbox/v0.1',
    donor_contract_ref:'jubilee.trickle-observation-hold-only/v0.1',
    artifact_kind:'OBSERVATION_NOT_ASSET',
    source_world:'jubilee-trickle:operator-private',
    source_particular:item.address,
    source_history_head:'sha256:'+view.head,
    payload_refs:[{address:'urn:sha256:'+item.signalHash,role:'source-signed-observation',media_type:'application/json'}],
    donor_claims:{
      kind:item.kind,status:item.status,unit:item.unit,quantity:item.quantity,
      purposeId:item.purposeId,sourceId:item.sourceId,
      semanticStatus:'source_report_only_no_settlement_or_asset_admission'
    },
    requested_effect:{kind:'HOLD_OBSERVATION_ONLY',permissionGranted:false},
    return_address:null,created_at:createdAt
  };
}
