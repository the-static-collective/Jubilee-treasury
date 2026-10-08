import {createHash,createPublicKey,generateKeyPairSync,sign,verify} from 'node:crypto';
import {signSignal,importBatch,project,relatteObservationSpec} from './ambient-trickle-009.mjs';

export const DOOR_SCHEMA='jubilee.door-registry/v0.1';
const SIG_DOMAIN='JUBILEE-DOOR-REGISTRY-012\n';
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(v);
const word=v=>typeof v==='string'&&/^[a-z][a-z0-9_]{1,63}$/.test(v);
const hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const positive=v=>Number.isSafeInteger(v)&&v>=1&&v<=1000000000000;
const fail=msg=>{throw Error('DOOR_HOLD: '+msg)};
const check=(condition,msg)=>{if(!condition)fail(msg)};
const exact=(obj,fields)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&
  Object.keys(obj).sort().join('|')===fields.slice().sort().join('|');
export function canonical(v){
  if(v===null||typeof v==='boolean'||typeof v==='string')return JSON.stringify(v);
  if(typeof v==='number'&&Number.isFinite(v))return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  check(v&&typeof v==='object'&&Object.getPrototypeOf(v)===Object.prototype,'nonportable JSON');
  return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
}
export const digest=v=>createHash('sha256').update(canonical(v)).digest('hex');
const validTime=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const serviceUnits={
  labor:'minute',compute:'compute_hour',transport:'mile',broadcast_rights:'license_unit'
};
const physicalUnits={pennies:'penny',gold_bullion:'milligram',equipment:'item',supplies:'item'};
const providers={
  cash_app:{host:'cash.app',regex:/^\/\$[A-Za-z0-9_]{1,35}$/},
  venmo:{host:'venmo.com',regex:/^\/u\/[A-Za-z0-9_-]{2,40}$/},
  paypal:{host:'paypal.me',regex:/^\/[A-Za-z0-9]{1,20}$/}
};
function safeProviderLink(provider,url){
  check(Object.hasOwn(providers,provider),'unsupported external payment provider');
  check(typeof url==='string'&&url.length<=200,'public URL required');
  let parsed;try{parsed=new URL(url);}catch{fail('invalid URL')}
  const p=providers[provider];
  check(parsed.protocol==='https:'&&parsed.hostname===p.host&&parsed.port===''&&
    parsed.username===''&&parsed.password===''&&parsed.search===''&&parsed.hash===''&&
    p.regex.test(parsed.pathname)&&parsed.href===url,
    'link must use exact HTTPS official provider host and restricted path, no redirects/parameters');
}
function safeWalletAddress(address){
  check(typeof address==='string'&&/^0x[0-9a-f]{40}$/.test(address)&&address!=='0x'+'0'.repeat(40),
    'EVM wallet must be 20-byte lower-case, nonzero address; mixed-case checksum is not verified here');
}
function validTarget(door){
  check(exact(door,['id','kind','purposeId','termsRef','publicationRef','target']),
    'door fields must exclude donors and free text');
  check(id(door.id)&&id(door.purposeId)&&id(door.termsRef)&&id(door.publicationRef),
    'door identity, owner terms and publication evidence refs required');
  const t=door.target;
  if(door.kind==='payment_link'){
    check(exact(t,['provider','url']),'payment-link target fields');
    safeProviderLink(t.provider,t.url);
  }else if(door.kind==='wallet'){
    check(exact(t,['chainId','address','asset']),'wallet target fields');
    check([1,10,137,42161,8453].includes(t.chainId)&&t.asset==='native_only',
      'chain allowlist and native-only asset required; no arbitrary token/contract');
    safeWalletAddress(t.address);
  }else if(door.kind==='physical'){
    check(exact(t,['assetType','unit']),'physical target fields');
    check(Object.hasOwn(physicalUnits,t.assetType)&&t.unit===physicalUnits[t.assetType],
      'physical type and explicit unit required');
  }else if(door.kind==='service'){
    check(exact(t,['serviceType','unit']),'service target fields');
    check(Object.hasOwn(serviceUnits,t.serviceType)&&t.unit===serviceUnits[t.serviceType],
      'service must specify declared unit, no implied licensed rights');
  }else fail('unknown door kind');
  return door;
}
export function makeKeys(){
  const {privateKey,publicKey}=generateKeyPairSync('ed25519');
  return {publicKey:publicKey.export({type:'spki',format:'pem'}),
    privateKey:privateKey.export({type:'pkcs8',format:'pem'})};
}
export function newRegistry(keys){
  check(keys&&typeof keys.publicKey==='string','steward pubkey required');
  createPublicKey(keys.publicKey);
  return {schema:DOOR_SCHEMA,stewardPublicKey:keys.publicKey,events:[]};
}
function readRegistry(registry){
  check(exact(registry,['schema','stewardPublicKey','events'])&&
    registry.schema===DOOR_SCHEMA&&Array.isArray(registry.events)&&registry.events.length<=100000,
    'registry fields or bound');
  const doors=new Map();let previous=null;
  for(const [i,event] of registry.events.entries()){
    check(exact(event,['seq','type','payload','previous','createdAt','signature'])&&
      event.seq===i+1&&event.previous===previous&&validTime(event.createdAt),
      'registry history gap or event fields');
    const {signature,...unsigned}=event;
    check(typeof signature==='string'&&signature.length<=128,'malformed signature');
    let good=false;try{
      const bytes=Buffer.from(signature,'base64');
      good=bytes.length===64&&bytes.toString('base64')===signature&&
        verify(null,Buffer.from(SIG_DOMAIN+canonical(unsigned)),registry.stewardPublicKey,bytes);
    }catch{}
    check(good,'invalid owner-signed registry event');
    if(event.type==='OPEN'){
      validTarget(event.payload);
      check(!doors.has(event.payload.id),'duplicate/withdrawn door identity cannot reopen');
      doors.set(event.payload.id,{door:structuredClone(event.payload),status:'open'});
    }else if(event.type==='WITHDRAW'){
      check(exact(event.payload,['doorId','evidenceRef'])&&id(event.payload.doorId)&&id(event.payload.evidenceRef),
        'withdrawal evidence and door identity required');
      const entry=doors.get(event.payload.doorId);
      check(entry&&entry.status==='open','cannot revoke unknown or already withdrawn door');
      entry.status='withdrawn';
    }else fail('unknown registry event');
    previous=digest(event);
  }
  return {doors,head:previous};
}
export function inspectRegistry(registry){
  const {doors,head}=readRegistry(registry);
  const all=[...doors.values()].map(x=>({...structuredClone(x.door),status:x.status}));
  return {
    schema:DOOR_SCHEMA,head,count:registry.events.length,
    open:all.filter(x=>x.status==='open').sort((a,b)=>a.id.localeCompare(b.id)),
    withdrawn:all.filter(x=>x.status==='withdrawn').map(x=>({doorId:x.id})),
    paymentsReceived:false,assetsOwned:false,automaticAcceptance:false,
    warning:'Door publication does not verify recipient identity, create a payment, certify wallet ownership, accept custody, license rights, or issue a tax receipt.'
  };
}
export function appendDoorEvent(registry,keys,type,payload,createdAt='2026-10-08T00:00:00.000Z'){
  readRegistry(registry);
  check(keys&&keys.publicKey===registry.stewardPublicKey,'steward key not pinned to registry');
  check(validTime(createdAt),'event timestamp must be UTC ISO');
  const unsigned={seq:registry.events.length+1,type,payload:structuredClone(payload),
    previous:registry.events.length?digest(registry.events.at(-1)):null,createdAt};
  let pem;try{pem=createPublicKey(keys.privateKey).export({type:'spki',format:'pem'});}catch{fail('private signer invalid');}
  check(pem===keys.publicKey,'signer private key mismatch');
  const e={...unsigned,signature:sign(null,Buffer.from(SIG_DOMAIN+canonical(unsigned)),keys.privateKey).toString('base64')};
  const next={...structuredClone(registry),events:[...registry.events,e]};
  readRegistry(next);
  return next;
}
export function openDoor(registry,keys,door,stamp){return appendDoorEvent(registry,keys,'OPEN',door,stamp);}
export function withdrawDoor(registry,keys,doorId,evidenceRef,stamp){
  return appendDoorEvent(registry,keys,'WITHDRAW',{doorId,evidenceRef},stamp);
}
const html=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function publicBoard(registry,{pinnedPublicKey}={}){
  check(typeof pinnedPublicKey==='string'&&pinnedPublicKey===registry.stewardPublicKey,
    'public source owner public key must be pinned externally before board generation');
  const state=inspectRegistry(registry),doors=state.open;
  const rows=doors.map(d=>{
    let detail, action='';
    if(d.kind==='payment_link'){
      detail=d.target.provider+' — verified URL syntax, not verified recipient identity';
      action='<a href="'+html(d.target.url)+'" rel="noopener noreferrer" target="_blank">Open provider (external)</a>';
    }else if(d.kind==='wallet'){
      detail='EVM chain ID '+d.target.chainId+' · native only · '+d.target.address+
        ' · verify network/address independently before any transfer';
    }else if(d.kind==='physical'){
      detail=d.target.assetType+' · unit '+d.target.unit+' · coordinate custody privately';
    }else detail=d.target.serviceType+' · unit '+d.target.unit+' · owner terms required';
    return '<li><strong>'+html(d.id)+'</strong> ('+html(d.kind)+') — '+html(detail)+
      '<div>Purpose: '+html(d.purposeId)+' · Terms reference: '+html(d.termsRef)+'</div>'+action+'</li>';
  }).join('\n');
  const warning='Links and addresses are steward-listed destinations, not verified charities or providers. Use only after independently confirming the actual recipient. No payments, contributions or asset delivery are tracked by this page.';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;">'+
    '<title>Jubilee contribution doors — owner-published</title>'+
    '<style>body{font-family:system-ui,sans-serif;max-width:48rem;margin:auto;padding:2rem;line-height:1.6}li{margin:1.5rem 0}small{color:#555}a{display:inline-block;margin:.25rem 0}</style></head>'+
    '<body><h1>Jubilee contribution doors</h1><p>'+html(warning)+'</p>'+
    '<p><small>Signed registry head: '+html(state.head||'empty')+'</small></p>'+
    '<ul>'+rows+'</ul><p><small>No donor form, analytics, cookie, payment acceptance, wallet connection or private address sharing is included.</small></p></body></html>';
}
export function doorProposal(registry,doorId){
  const state=inspectRegistry(registry),door=state.open.find(d=>d.id===doorId);
  check(door,'door unavailable, stale or withdrawn');
  return {schema:'jubilee.door-proposal/v0.1',doorId:door.id,kind:door.kind,
    sourceHead:state.head,purposeId:door.purposeId,status:'HOLD_PROPOSAL_ONLY',
    paymentReceived:false,ownershipChanged:false,rightsGranted:false,publicationVerified:false};
}
function reportKind(door){
  if(door.kind==='payment_link')return {kind:'money',unit:'minor_usd',status:'pledge_reported'};
  if(door.kind==='wallet')return {kind:'crypto',unit:'native_unit',status:'offer_reported'};
  if(door.kind==='physical')return {
    kind:door.target.assetType==='pennies'?'coins':door.target.assetType==='gold_bullion'?'gold':door.target.assetType,
    unit:door.target.unit,status:'offer_reported'
  };
  return {kind:door.target.serviceType,unit:door.target.unit,status:'offer_reported'};
}
export function recordSourceReport(registry,doorId,inbox,keys,sourceId,report) {
  const door=inspectRegistry(registry).open.find(d=>d.id===doorId);
  check(door,'only current open door may generate local manual report');
  check(exact(report,['eventId','assetId','quantity','evidenceHash','observedAt','sourceAuthority']),
    'source report has fixed privacy-preserving fields only');
  check(id(report.eventId)&&id(report.assetId)&&positive(report.quantity)&&hash(report.evidenceHash)&&
    validTime(report.observedAt)&&report.sourceAuthority==='local_operator_claim',
    'only a bounded locally asserted observation; provider or custodian unverified');
  const scope=inbox?.policy?.sources?.find(s=>s.sourceId===sourceId);
  check(scope&&scope.publicKey===keys?.publicKey,'private Trickle source key must be pinned');
  const {kind,unit,status}=reportKind(door);
  check(scope.allowedPurposes.includes(door.purposeId)&&scope.allowedKinds.includes(kind),
    'report outside approved source purpose and kind');
  // Each signed source event references the door and exact registry snapshot.
  // No recipient handle, wallet address, PII, credential or vendor claim is signed into Trickle.
  const evidenceHash=digest({operatorEvidenceHash:report.evidenceHash,doorId,registryHead:inspectRegistry(registry).head});
  const payload={
    eventId:report.eventId,assetId:report.assetId,revision:1,previousHash:null,
    kind,status,quantity:report.quantity,unit,
    purposeId:door.purposeId,evidenceHash,observedAt:report.observedAt
  };
  const next=importBatch(inbox,[signSignal(sourceId,payload,keys)]);
  return {inbox:next,added:next.signals.length-inbox.signals.length,
    observation:project(next).currentSourceReports.find(x=>x.sourceId===sourceId&&x.assetId===report.assetId),
    received:false,verifiedProviderSettlement:false,verifiedChainTx:false,
    verifiedCustody:false,verifiedAssay:false,rightsGranted:false,
    note:'Locally source-signed observation ONLY. Even delivery-reporting would require distinct verification; this is not recipient acceptance.'};
}
export function proposedRelatteHold(inbox,sourceId,assetId,createdAt){
  const spec=relatteObservationSpec(inbox,sourceId,assetId,createdAt);
  check(spec.artifact_kind==='OBSERVATION_NOT_ASSET'&&spec.requested_effect.permissionGranted===false,
    'transporting only inert observation');
  return spec;
}
export function sampleDoorDemo() {
  const keys=makeKeys(),root=newRegistry(keys);
  const stamp='2026-10-08T18:00:00.000Z';
  const common={purposeId:'purpose-neighbor-support-001',termsRef:'terms-pending-owner-review-001',
    publicationRef:'demo-only-no-public-authorization-001'};
  const a=openDoor(root,keys,{id:'demo-penny-jar-001',kind:'physical',...common,
    target:{assetType:'pennies',unit:'penny'}},stamp);
  const b=openDoor(a,keys,{id:'demo-bullion-001',kind:'physical',...common,
    target:{assetType:'gold_bullion',unit:'milligram'}},stamp);
  const c=openDoor(b,keys,{id:'demo-work-001',kind:'service',...common,
    target:{serviceType:'labor',unit:'minute'}},stamp);
  return {registry:c,keys,proposal:doorProposal(c,'demo-penny-jar-001'),
    head:inspectRegistry(c).head,notice:'Synthetic only; no owner receipts, public deployment, payment addresses, gold assay or bank valuation.'};
}
