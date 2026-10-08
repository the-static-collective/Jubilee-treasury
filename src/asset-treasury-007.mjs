import { createHash, createPublicKey, generateKeyPairSync, sign, verify as verifySignature } from 'node:crypto';

const SCHEMA = 'jubilee.asset-treasury/v0.1';
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{2,127}$/;
const TOKEN = /^[a-z][a-z0-9_-]{1,63}$/;
const HASH = /^[a-f0-9]{64}$/;
const kindsOfEvents = new Set(['OFFER','ACCEPT','RECEIVE','DECLINE','WITHDRAW','NEED','RESERVE','RELEASE','FULFILL']);
const modes = new Set(['gift','loan','license','service','external-funds']);
const own = (v, ks) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === ks.length && Object.keys(v).every(k=>ks.includes(k));
const fail = (s) => {throw new Error('TREASURY_REFUSED: '+s);};
const assert = (test,s) => {if(!test)fail(s);};
const id = (s) => typeof s === 'string' && ID.test(s);
const token = (s) => typeof s === 'string' && TOKEN.test(s);
const txt = (s,max=220) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;
const positive = (v) => Number.isSafeInteger(v) && v > 0 && v <= 1000000;

export function canonical(v) {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return JSON.stringify(v);
  if (typeof v === 'number' && Number.isFinite(v)) return JSON.stringify(v);
  if (Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
  assert(v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype,'nonportable JSON');
  return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
}
export const digest = v=>createHash('sha256').update(canonical(v)).digest('hex');
const isHash = x=>typeof x === 'string' && HASH.test(x);
function requireKeys(value, keys, what) {assert(own(value,keys),what+' schema mismatch');}
function requirementList(purposeIds) {
  assert(Array.isArray(purposeIds) && purposeIds.length > 0 && purposeIds.length <= 24,'purpose list required');
  assert(purposeIds.every(id) && new Set(purposeIds).size === purposeIds.length,'purpose list malformed or duplicated');
}
export function generateSteward() {
  const {publicKey, privateKey}=generateKeyPairSync('ed25519');
  return {publicKey:publicKey.export({type:'spki',format:'pem'}),privateKey:privateKey.export({type:'pkcs8',format:'pem'})};
}
export function newLedger(keys) {
  assert(keys && typeof keys.publicKey === 'string','steward public key required');
  createPublicKey(keys.publicKey);
  return {schema:SCHEMA,stewardPublicKey:keys.publicKey,events:[]};
}
function validateOffer(p) {
  requireKeys(p,['id','kind','label','quantity','unit','mode','purposeIds','termsRef'],'offer');
  assert(id(p.id)&&token(p.kind)&&txt(p.label,150),'invalid asset');
  assert(positive(p.quantity)&&token(p.unit)&&modes.has(p.mode),'invalid measurement/mode');
  assert((p.kind === 'money') === (p.mode === 'external-funds'),'money must use external-funds mode');
  requirementList(p.purposeIds);
  assert(id(p.termsRef),'terms reference required; never assume gift rights');
}
function validateNeed(p) {
  requireKeys(p,['id','title','kind','unit','quantity','purposeId'],'need');
  assert(id(p.id)&&txt(p.title,150)&&token(p.kind)&&token(p.unit)&&positive(p.quantity)&&id(p.purposeId),'invalid need');
}
function validateReference(p, keys) {
  requireKeys(p,keys,'event');
  for (const k of keys) assert(id(p[k]),'invalid event reference: '+k);
}
function fold(events) {
  const assets=new Map(), needs=new Map(), reservations=new Map();
  for (const {type,payload:p} of events) {
    if(type==='OFFER') {validateOffer(p);assert(!assets.has(p.id),'duplicate asset');assets.set(p.id,{...structuredClone(p),state:'offered',receivedEvidence:null,consumed:0,reserved:0});continue;}
    if(type==='NEED') {validateNeed(p);assert(!needs.has(p.id),'duplicate need');needs.set(p.id,{...p,fulfilled:0,reserved:0});continue;}
    if(['ACCEPT','DECLINE','WITHDRAW'].includes(type)) {
      validateReference(p,['assetId','termsEvidenceRef']);
      const a=assets.get(p.assetId);assert(a && a.state==='offered','asset not open for disposition');
      a.state=type==='ACCEPT'?'accepted':type==='DECLINE'?'declined':'withdrawn';
      continue;
    }
    if(type==='RECEIVE') {
      requireKeys(p,['assetId','evidenceRef','assertion'],'receipt');
      assert(id(p.assetId)&&id(p.evidenceRef),'receipt evidence reference required');
      const a=assets.get(p.assetId);assert(a && a.state==='accepted','only accepted assets can be received');
      assert(p.assertion === (a.kind==='money'?'external_settlement_attested':'asset_received_attested'),'receipt assertion mismatches asset kind');
      a.state='received';a.receivedEvidence=p.evidenceRef;continue;
    }
    if(type==='RESERVE') {
      requireKeys(p,['id','assetId','needId','quantity'],'reservation');
      assert(id(p.id)&&id(p.assetId)&&id(p.needId)&&positive(p.quantity),'invalid reservation');
      assert(!reservations.has(p.id),'duplicate reservation');
      const a=assets.get(p.assetId), n=needs.get(p.needId);
      assert(a?.state==='received' && n,'asset and need must exist and be received');
      assert(a.kind!=='money' && n.kind!=='money','money is not a transferable balance in this treasury');
      assert(a.kind===n.kind && a.unit===n.unit,'kind/unit mismatch; no automatic conversion');
      assert(a.purposeIds.includes(n.purposeId),'asset restricted to other purposes');
      assert(p.quantity <= a.quantity-a.reserved-a.consumed && p.quantity <= n.quantity-n.reserved-n.fulfilled,'insufficient available capacity');
      a.reserved+=p.quantity;n.reserved+=p.quantity;
      reservations.set(p.id,{...p,state:'reserved',evidenceRef:null});continue;
    }
    if(type==='RELEASE'||type==='FULFILL') {
      requireKeys(p,['reservationId','evidenceRef'],'reservation disposition');
      assert(id(p.reservationId)&&id(p.evidenceRef),'disposition evidence required');
      const r=reservations.get(p.reservationId);assert(r?.state==='reserved','reservation no longer active');
      const a=assets.get(r.assetId),n=needs.get(r.needId);
      a.reserved-=r.quantity;n.reserved-=r.quantity;
      if(type==='FULFILL'){a.consumed+=r.quantity;n.fulfilled+=r.quantity;}
      r.state=type==='FULFILL'?'fulfilled':'released';r.evidenceRef=p.evidenceRef;continue;
    }
    fail('unsupported event type');
  }
  return {assets,needs,reservations};
}
function validateJournal(ledger) {
  requireKeys(ledger,['schema','stewardPublicKey','events'],'ledger');
  assert(ledger.schema===SCHEMA && Array.isArray(ledger.events)&&ledger.events.length<=100000,'wrong ledger version/size');
  assert(txt(ledger.stewardPublicKey,2048),'invalid steward key');
  let prev=null;
  for (let i=0;i<ledger.events.length;i++) {
    const e=ledger.events[i];
    requireKeys(e,['seq','type','payload','previous','createdAt','signature'],'signed event');
    assert(e.seq===i+1 && kindsOfEvents.has(e.type),'event order/type invalid');
    assert(e.previous===prev,'history gap or rewrite');
    assert(typeof e.createdAt==='string' && Number.isFinite(Date.parse(e.createdAt)) && new Date(e.createdAt).toISOString()===e.createdAt,'invalid timestamp');
    assert(typeof e.signature==='string'&&e.signature.length<=100,'invalid event signature');
    const {signature,...unsigned}=e;
    let ok=false;try {
      const signatureBytes=Buffer.from(signature,'base64');
      ok=signatureBytes.length===64 && signatureBytes.toString('base64')===signature &&
        verifySignature(null,Buffer.from('JUBILEE-TREASURY-EVENT-V0.1\n'+canonical(unsigned)),ledger.stewardPublicKey,signatureBytes);
    }catch{}
    assert(ok,'invalid ledger signature');
    prev=digest(e);
  }
  // Projection from verified, replayed events catches forged or invalid state transitions.
  const projection=fold(ledger.events);
  return {head:prev,...projection};
}
export function inspect(ledger) {
  const d=validateJournal(ledger);
  const assets=[...d.assets.values()].map(a=>({...a,available:a.state==='received'?a.quantity-a.reserved-a.consumed:0}));
  const needs=[...d.needs.values()].map(n=>({...n,remaining:n.quantity-n.reserved-n.fulfilled}));
  return {
    schema:SCHEMA,head:d.head,eventCount:ledger.events.length,assets,needs,reservations:[...d.reservations.values()],
    warning:'Independent local steward assertions; no payments, deliveries, beneficiary identity, or station fundraising totals verified by software.'
  };
}
export function append(ledger,keys,type,payload,createdAt='2026-10-08T00:00:00.000Z') {
  const input=structuredClone(ledger);validateJournal(input);
  assert(keys && keys.publicKey===input.stewardPublicKey,'wrong steward identity');
  assert(kindsOfEvents.has(type),'unknown event type');
  assert(typeof createdAt==='string' && !Number.isNaN(Date.parse(createdAt)) && new Date(createdAt).toISOString()===createdAt,'timestamp invalid');
  const unsigned={seq:input.events.length+1,type,payload:structuredClone(payload),previous:input.events.length?digest(input.events.at(-1)):null,createdAt};
  const publicKey=createPublicKey(keys.privateKey).export({type:'spki',format:'pem'});
  assert(publicKey===keys.publicKey,'private key does not match steward');
  const event={...unsigned,signature:sign(null,Buffer.from('JUBILEE-TREASURY-EVENT-V0.1\n'+canonical(unsigned)),keys.privateKey).toString('base64')};
  input.events.push(event);
  validateJournal(input);
  return input;
}
export function matches(ledger) {
  const d=inspect(ledger);
  const possibilities=[];
  for(const a of d.assets) for(const n of d.needs) {
    if(a.kind==='money'||n.kind==='money'||a.state!=='received'||a.available<=0||n.remaining<=0)continue;
    if(a.kind!==n.kind||a.unit!==n.unit||!a.purposeIds.includes(n.purposeId))continue;
    possibilities.push({assetId:a.id,needId:n.id,maximum:Math.min(a.available,n.remaining),unit:a.unit,
      reasons:['asset attested received','kind and unit match','purpose permitted','unreserved capacity exists'],
      status:'proposal_only_not_reservation'});
  }
  return possibilities;
}
export function summary(ledger) {
  const p=inspect(ledger);
  const externalMoney=p.assets.filter(a=>a.kind==='money'&&a.state==='received');
  return {
    eventCount:p.eventCount,head:p.head,offers:p.assets.length,receivedAssets:p.assets.filter(a=>a.state==='received').length,
    outsidePaymentAttestations:externalMoney.map(a=>({assetId:a.id,quantity:a.quantity,unit:a.unit,evidenceRef:a.receivedEvidence})),
    noncashAvailable:p.assets.filter(a=>a.kind!=='money'&&a.available>0).map(a=>({assetId:a.id,kind:a.kind,label:a.label,available:a.available,unit:a.unit,purposeIds:a.purposeIds})),
    readyToConsider:matches(ledger),
    accountingNotice:'Externally attested amounts are NOT authoritative Kinship receipts, collected funds or Fall Share goal totals. No money is held here.',
  };
}
export function relatteSpec(ledger,assetId,createdAt='2026-10-08T00:00:00.000Z') {
  const p=inspect(ledger),a=p.assets.find(x=>x.id===assetId);
  assert(a,'unknown asset');
  assert(a.state==='received','only received/attested assets are crossing candidates');
  // An opaque donor descriptor, NOT a signed reLATTE crossing or recipient admission.
  // Its payload is a digest reference; no donor names, private data or payment credentials.
  return {
    schema:'relatte.opaque-organ-spec/v0',
    family_ref:'jubilee-treasury.asset-ledger/v0.1',
    donor_contract_ref:'jubilee-treasury.owner-local-asset/v0.1',
    artifact_kind:'TREASURY_ASSET_CANDIDATE',
    source_world:'jubilee-treasury:local-steward',
    source_particular:a.id,
    source_history_head:'sha256:'+p.head,
    payload_refs:[{address:'urn:sha256:'+digest({assetId:a.id,ledgerHead:p.head}),role:'asset-state-commitment',media_type:'application/json'}],
    donor_claims:{
      kind:a.kind,quantity:a.quantity,unit:a.unit,available:a.available,
      mode:a.mode,purposeIds:a.purposeIds,termsRef:a.termsRef,localStatus:a.state,
      provenance:'steward_signed_local_claim_not_legal_title_or_settlement',
      externalMoneyNotTransferable:a.kind==='money'
    },
    requested_effect:{kind:'HOLD_PROPOSAL_ONLY',permissionGranted:false},
    return_address:null,created_at:createdAt
  };
}
