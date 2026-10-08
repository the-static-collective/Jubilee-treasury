import {createHash,createPublicKey,generateKeyPairSync,sign,verify} from 'node:crypto';

export const PENNY_SCHEMA='jubilee.penny-work-matter/v0.1';
const PROOF_SCHEMA='jubilee.penny-authority-proof/v0.1';
const EVENT_DOMAIN='JUBILEE-PENNY-014-EVENT\n';
const PROOF_DOMAIN='JUBILEE-PENNY-014-PROOF\n';
const REF=/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
const HASH=/^[a-f0-9]{64}$/;
const fail=s=>{throw Error('PENNY_014_HOLD: '+s)};
const check=(a,s)=>{if(!a)fail(s)};
const validRef=s=>typeof s==='string'&&REF.test(s);
const validHash=s=>typeof s==='string'&&HASH.test(s);
const count=n=>Number.isSafeInteger(n)&&n>0&&n<=1000000;
const moment=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const own=(x,names)=>x&&typeof x==='object'&&!Array.isArray(x)&&
  Object.keys(x).sort().join('|')===names.slice().sort().join('|');
export function canonical(v){
  if(v===null||typeof v==='string'||typeof v==='boolean')return JSON.stringify(v);
  if(typeof v==='number'&&Number.isFinite(v))return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  check(v&&typeof v==='object'&&Object.getPrototypeOf(v)===Object.prototype,'nonportable evidence');
  return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
}
export const digest=v=>createHash('sha256').update(canonical(v)).digest('hex');
export function newKeys(){
  const {privateKey,publicKey}=generateKeyPairSync('ed25519');
  return {publicKey:publicKey.export({type:'spki',format:'pem'}),
    privateKey:privateKey.export({type:'pkcs8',format:'pem'})};
}
function publicOf(pem){return createPublicKey(pem).export({type:'spki',format:'pem'});}
function signature(privateKey,domain,data){
  return sign(null,Buffer.from(domain+canonical(data)),privateKey).toString('base64');
}
function verifies(publicKey,domain,data,value){
  if(typeof value!=='string'||value.length>128)return false;
  try{const bytes=Buffer.from(value,'base64');
    return bytes.length===64&&bytes.toString('base64')===value&&
      verify(null,Buffer.from(domain+canonical(data)),publicKey,bytes);
  }catch{return false;}
}
function checkKey(key){check(typeof key==='string'&&key.includes('BEGIN PUBLIC KEY')&&key.length<=2048,'public key format');try{publicOf(key);}catch{fail('invalid public key')}}
function validatePolicy(p){
  check(own(p,['schema','stewardPublicKey','workWitnessPublicKey','boxes','holders','automaticDisposition'])&&
    p.schema==='jubilee.penny-policy/v0.1'&&p.automaticDisposition===false,'immutable authority policy');
  checkKey(p.stewardPublicKey);checkKey(p.workWitnessPublicKey);
  check(Array.isArray(p.boxes)&&p.boxes.length>0&&p.boxes.length<=24,'bounded physical box registry');
  check(Array.isArray(p.holders)&&p.holders.length>0&&p.holders.length<=128,'bounded holder registry');
  const ids=new Set(),keys=new Set([p.stewardPublicKey,p.workWitnessPublicKey]);
  check(keys.size===2,'distinct steward and work witness required');
  for(const box of p.boxes){
    check(own(box,['boxId','custodianPublicKey','counterPublicKey','backingTermsRef'])&&
      validRef(box.boxId)&&validRef(box.backingTermsRef)&&!ids.has(box.boxId),'box identity and legal backing terms');
    ids.add(box.boxId);
    for(const field of ['custodianPublicKey','counterPublicKey']){
      checkKey(box[field]);check(!keys.has(box[field]),'independent role keys are required');
      keys.add(box[field]);
    }
  }
  ids.clear();
  for(const holder of p.holders){
    check(own(holder,['holderId','publicKey'])&&validRef(holder.holderId)&&
      /^(person|org|node):/.test(holder.holderId)&&!ids.has(holder.holderId),
      'participants must have typed unique IDs');
    checkKey(holder.publicKey);check(!keys.has(holder.publicKey),'participant key reused for another role');
    ids.add(holder.holderId);keys.add(holder.publicKey);
  }
  return p;
}
export function createWorld({stewardPublicKey,workWitnessPublicKey,boxes,holders}){
  const policy={schema:'jubilee.penny-policy/v0.1',stewardPublicKey,workWitnessPublicKey,
    boxes,holders,automaticDisposition:false};
  validatePolicy(policy);
  return {schema:PENNY_SCHEMA,policy:structuredClone(policy),events:[]};
}
export function attest(role,payload,keys){
  check(typeof role==='string'&&/^[a-z_]{3,30}$/.test(role)&&
    keys&&typeof keys.privateKey==='string'&&
    publicOf(keys.privateKey)===keys.publicKey,'valid signing role and private key required');
  check(payload&&typeof payload==='object'&&!Array.isArray(payload),'proof payload');
  const body={schema:PROOF_SCHEMA,role,payload:structuredClone(payload)};
  return {...body,signature:signature(keys.privateKey,PROOF_DOMAIN,body)};
}
function authorized(proof,role,payload,key){
  check(own(proof,['schema','role','payload','signature'])&&proof.schema===PROOF_SCHEMA&&
    proof.role===role&&canonical(proof.payload)===canonical(payload),
    'role-specific proof does not attest exact event');
  const {signature:s,...body}=proof;
  check(verifies(key,PROOF_DOMAIN,body,s),'false authority or invalid role signature');
}
const findHolder=(p,id)=>{
  const h=p.holders.find(h=>h.holderId===id);
  check(h,'unregistered recipient/participant');return h;
};
const findBox=(p,id)=>{
  const box=p.boxes.find(b=>b.boxId===id);
  check(box,'unregistered box');return box;
};
const proofPair=(pair,data,box)=>{
  check(own(pair,['custodian','counter']),'two witnessed custody attestations required');
  authorized(pair.custodian,'custodian',data,box.custodianPublicKey);
  authorized(pair.counter,'counter',data,box.counterPublicKey);
};
const ensureFields=(x,fields,label)=>check(own(x,fields),label+' fixed fields');
function checkBody(data,fields){
  ensureFields(data,fields,'evidence');check(Object.values(data).every(x=>x!==undefined),'missing fields');
}
const total=(xs)=>xs.reduce((a,b)=>a+b,0);
const key=(workId,boxId,holderId)=>JSON.stringify([workId,boxId,holderId]);
function replay(world){
  check(own(world,['schema','policy','events'])&&world.schema===PENNY_SCHEMA&&
    Array.isArray(world.events)&&world.events.length<=100000,'journal version or bound');
  const p=validatePolicy(world.policy),work=new Map(),boxes=new Map(),balances=new Map();
  const seenDeposits=new Set(),seenWithdrawals=new Set(),seenAudits=new Set(),
    seenLosses=new Set(),seenNonces=new Set();
  const holders=p.holders.map(x=>x.holderId);
  for(const b of p.boxes)boxes.set(b.boxId,{
    boxId:b.boxId,bookCoins:0,auditedCoins:null,outstanding:0,
    cumulativeDeposits:0,cumulativeRedemptions:0,cumulativeLoss:0,
    lastAudit:null
  });
  let prior=null,previousTime=null,totalReleased=0,totalRetired=0;
  const effect=(event)=>{
    const {type,payload:x}=event;
    if(type==='WORK'){
      ensureFields(x,['certificate'],'work event');
      const cert=x.certificate;check(own(cert,['schema','role','payload','signature']),'work proof required');
      const q=cert.payload;
      checkBody(q,['workId','holderId','quantity','termsRef','evidenceHash','completedAt']);
      check(validRef(q.workId)&&validRef(q.termsRef)&&validHash(q.evidenceHash)&&
        count(q.quantity)&&moment(q.completedAt),'work quantity, provenance and terms');
      findHolder(p,q.holderId);
      authorized(cert,'work_witness',q,p.workWitnessPublicKey);
      check(!work.has(q.workId),'duplicate work ID or reward inflation');
      work.set(q.workId,{...structuredClone(q),released:0,status:'approved'});
    }else if(type==='DISPUTE'||type==='CLEAR'){
      ensureFields(x,['certificate'],'work resolution event');
      const q=x.certificate?.payload;
      checkBody(q,['workId','evidenceHash','observedAt']);
      check(validRef(q.workId)&&validHash(q.evidenceHash)&&moment(q.observedAt),'bounded dispute witness');
      authorized(x.certificate,type==='DISPUTE'?'work_dispute':'work_clear',q,p.workWitnessPublicKey);
      const w=work.get(q.workId);check(w,'unknown disputed work');
      check(type==='DISPUTE'?w.status==='approved':w.status==='disputed',
        'invalid work status transition');
      w.status=type==='DISPUTE'?'disputed':'approved';
    }else if(type==='DEPOSIT'){
      ensureFields(x,['claim','proofs'],'deposit event');
      const q=x.claim;
      checkBody(q,['depositId','boxId','depositorId','quantity','evidenceHash','consentRef','backingTermsRef','observedAt']);
      check(validRef(q.depositId)&&validRef(q.consentRef)&&validHash(q.evidenceHash)&&
        count(q.quantity)&&moment(q.observedAt)&&!seenDeposits.has(q.depositId),
        'coin deposit ID, evidence or amount');
      const b=findBox(p,q.boxId),depositor=findHolder(p,q.depositorId);
      check(q.backingTermsRef===b.backingTermsRef,'owner authorized backing terms not accepted');
      ensureFields(x.proofs,['depositor','custodian','counter'],'three-party physical custody proof');
      authorized(x.proofs.depositor,'depositor',q,depositor.publicKey);
      proofPair({custodian:x.proofs.custodian,counter:x.proofs.counter},q,b);
      seenDeposits.add(q.depositId);
      const box=boxes.get(q.boxId);box.bookCoins+=q.quantity;box.cumulativeDeposits+=q.quantity;
      if(box.auditedCoins!==null)box.auditedCoins+=q.quantity;
    }else if(type==='RELEASE'){
      ensureFields(x,['instruction','holderConsent'],'funding release');
      const q=x.instruction;
      checkBody(q,['releaseId','workId','boxId','holderId','quantity','termsRef']);
      check(validRef(q.releaseId)&&count(q.quantity)&&validRef(q.termsRef),
        'release bounded identity and terms');
      check(!seenNonces.has('release:'+q.releaseId),'duplicate release nonce');
      const w=work.get(q.workId),b=boxes.get(q.boxId);
      check(w&&w.status==='approved','work missing, disputed or not certified');
      check(w.holderId===q.holderId&&w.termsRef===q.termsRef,'award not accepted by authorized work recipient');
      check(b,'funding box absent');
      authorized(x.holderConsent,'holder_release',q,findHolder(p,q.holderId).publicKey);
      check(w.released+q.quantity<=w.quantity,'pending allocation exhausted');
      check(b.auditedCoins===null||b.auditedCoins===b.bookCoins,'box physical discrepancy: funding frozen');
      check(b.outstanding+q.quantity<=b.bookCoins,'released PENNY exceeds physical backing');
      w.released+=q.quantity;b.outstanding+=q.quantity;
      const k=key(q.workId,q.boxId,q.holderId);
      balances.set(k,(balances.get(k)||0)+q.quantity);totalReleased+=q.quantity;
      seenNonces.add('release:'+q.releaseId);
    }else if(type==='TRANSFER'){
      ensureFields(x,['instruction','proofs'],'voluntary movement');
      const q=x.instruction;
      checkBody(q,['transferId','workId','boxId','fromId','toId','quantity']);
      check(validRef(q.transferId)&&count(q.quantity)&&q.fromId!==q.toId,
        'transfer ID, amount and distinct participants');
      check(!seenNonces.has('transfer:'+q.transferId),'duplicate transfer ID');
      const w=work.get(q.workId),b=boxes.get(q.boxId);
      check(w&&w.status==='approved'&&b,'transferring frozen or unbacked lot');
      check((b.auditedCoins===null||b.auditedCoins===b.bookCoins)&&b.outstanding<=b.bookCoins,
        'custody impairment or undercollateralization freezes transfer');
      ensureFields(x.proofs,['sender','recipient'],'both sender and recipient required');
      authorized(x.proofs.sender,'token_sender',q,findHolder(p,q.fromId).publicKey);
      authorized(x.proofs.recipient,'token_recipient',q,findHolder(p,q.toId).publicKey);
      const from=key(q.workId,q.boxId,q.fromId),to=key(q.workId,q.boxId,q.toId);
      check((balances.get(from)||0)>=q.quantity,'unavailable token balance');
      balances.set(from,balances.get(from)-q.quantity);
      balances.set(to,(balances.get(to)||0)+q.quantity);
      seenNonces.add('transfer:'+q.transferId);
    }else if(type==='REDEEM'){
      ensureFields(x,['instruction','proofs'],'token surrender and real coin release');
      const q=x.instruction;
      checkBody(q,['withdrawalId','workId','boxId','holderId','quantity','evidenceHash','observedAt']);
      check(validRef(q.withdrawalId)&&count(q.quantity)&&
        validHash(q.evidenceHash)&&moment(q.observedAt)&&
        !seenWithdrawals.has(q.withdrawalId),'unique physical withdrawal evidence');
      const w=work.get(q.workId),box=boxes.get(q.boxId);
      check(w&&w.status==='approved'&&box,'frozen work or missing box');
      check((box.auditedCoins===null||box.auditedCoins===box.bookCoins)&&box.outstanding<=box.bookCoins,
        'physical custody mismatch or undercollateralization freezes redemptions');
      ensureFields(x.proofs,['surrender','custodian','counter'],'surrender + dual physical witnesses');
      authorized(x.proofs.surrender,'token_surrender',q,findHolder(p,q.holderId).publicKey);
      proofPair({custodian:x.proofs.custodian,counter:x.proofs.counter},q,findBox(p,q.boxId));
      const k=key(q.workId,q.boxId,q.holderId);
      check((balances.get(k)||0)>=q.quantity,'redeemer has insufficient active units');
      check(box.bookCoins>=q.quantity&&box.outstanding>=q.quantity,
        'physical pennies unavailable for redemption');
      balances.set(k,balances.get(k)-q.quantity);
      box.outstanding-=q.quantity;box.bookCoins-=q.quantity;
      box.cumulativeRedemptions+=q.quantity;
      if(box.auditedCoins!==null)box.auditedCoins-=q.quantity;
      totalRetired+=q.quantity;
      seenWithdrawals.add(q.withdrawalId);
    }else if(type==='AUDIT'){
      ensureFields(x,['claim','proofs'],'physical count audit');
      const q=x.claim;
      checkBody(q,['auditId','boxId','actualCount','evidenceHash','observedAt']);
      check(validRef(q.auditId)&&Number.isSafeInteger(q.actualCount)&&q.actualCount>=0&&
        q.actualCount<=1000000000&&validHash(q.evidenceHash)&&moment(q.observedAt)&&
        !seenAudits.has(q.auditId),'untrusted or duplicate physical count audit');
      proofPair(x.proofs,q,findBox(p,q.boxId));
      seenAudits.add(q.auditId);
      const box=boxes.get(q.boxId);
      box.auditedCoins=q.actualCount;box.lastAudit=q.auditId;
    }else if(type==='LOSS'){
      ensureFields(x,['claim','proofs'],'physical loss write-off');
      const q=x.claim;
      checkBody(q,['lossId','boxId','quantity','evidenceHash','observedAt']);
      check(validRef(q.lossId)&&count(q.quantity)&&validHash(q.evidenceHash)&&
        moment(q.observedAt)&&!seenLosses.has(q.lossId),'loss quantity, event or evidence');
      proofPair(x.proofs,q,findBox(p,q.boxId));
      const b=boxes.get(q.boxId);check(b.bookCoins>=q.quantity,'negative book inventory refused');
      b.bookCoins-=q.quantity;b.cumulativeLoss+=q.quantity;
      seenLosses.add(q.lossId);
      // An existing audit represents an observation of the reduced physical
      // count. Do NOT decrement it again; mismatch and/or shortfall remains visible.
    }else fail('unknown PENNY transition');
  };
  for(const [i,e] of world.events.entries()){
    check(own(e,['seq','type','payload','previous','createdAt','signature'])&&
      e.seq===i+1&&e.previous===prior&&moment(e.createdAt)&&
      (!previousTime||e.createdAt>=previousTime),'journal gap, clock rollback or fields');
    const {signature:s,...unsigned}=e;
    check(verifies(p.stewardPublicKey,EVENT_DOMAIN,unsigned,s),'invalid steward event signature');
    effect(e);prior=digest(e);previousTime=e.createdAt;
  }
  const pending=[...work.values()].reduce((n,w)=>n+w.quantity-w.released,0);
  const issued=[...work.values()].reduce((n,w)=>n+w.released,0);
  const active=total([...balances.values()]);
  check(issued===totalReleased&&active===issued-totalRetired,'tokens minted beyond verified work or mismatched token accounting');
  check(active===total([...boxes.values()].map(x=>x.outstanding)),
    'independently held coin assignments mismatch holder token positions');
  const boxStates=[...boxes.values()].sort((a,b)=>a.boxId.localeCompare(b.boxId))
    .map(b=>{
      const impaired=b.auditedCoins!==null&&b.auditedCoins!==b.bookCoins;
      const actualCoverage=b.auditedCoins===null?b.bookCoins:Math.min(b.bookCoins,b.auditedCoins);
      const shortfall=Math.max(0,b.outstanding-actualCoverage);
      return {...b,impaired,shortfall,freeBacking:impaired?0:Math.max(0,b.bookCoins-b.outstanding),
        discrepancy:impaired?(b.auditedCoins-b.bookCoins):0};
    });
  return {p,head:prior,pending,issued,active,totalRetired,
    works:[...work.values()].sort((a,b)=>a.workId.localeCompare(b.workId)),
    boxes:boxStates,balances,holders,needsReview:boxStates.some(b=>b.impaired||b.shortfall>0)||
      [...work.values()].some(w=>w.status==='disputed')};
}
export function inspectWorld(world){
  const x=replay(world);
  const positions=[...x.balances.entries()].map(([encoded,quantity])=>{
    const [workId,boxId,holderId]=JSON.parse(encoded);
    return {workId,boxId,holderId,quantity};
  }).filter(x=>x.quantity>0).sort((a,b)=>
    canonical([a.workId,a.boxId,a.holderId]).localeCompare(canonical([b.workId,b.boxId,b.holderId])));
  const totalBookCoins=total(x.boxes.map(b=>b.bookCoins));
  const auditShortfall=total(x.boxes.map(b=>b.shortfall));
  return {
    schema:'jubilee.penny-work-matter-projection/v0.1',
    sourceHead:x.head,sourceEventCount:world.events.length,
    workProducedPending:x.pending,workFundedReleased:x.issued,
    outstandingPennyUnits:x.active,retiredByRedemption:x.totalRetired,
    boxBookCoinCount:totalBookCoins,freeCoinBacking:total(x.boxes.map(b=>b.freeBacking)),
    auditedPhysicalShortfall:auditShortfall,
    boxes:x.boxes,work:x.works,positions,
    status:x.needsReview?'HOLD_REVIEW_REQUIRED':'LOCAL_ATTESTATIONS_ONLY',
    transfersEnabledOnlyWithDualHolderConsent:true,
    simulatedEvidenceOnly:true,bankSettledFunds:0,interestEarned:0,
    heldInRealCustodyVerifiedBySoftware:false,
    warning:'All cryptographic proofs are signer attestations, not physical truth, legal title, bank settlement, a transferable public coin, regulated e-money, or independently verified human identity.'
  };
}
export function append(world,stewardKeys,type,payload,createdAt='2026-10-08T20:00:00.000Z'){
  replay(world);
  check(stewardKeys&&publicOf(stewardKeys.privateKey)===stewardKeys.publicKey&&
    stewardKeys.publicKey===world.policy.stewardPublicKey,'unauthorized treasury steward');
  check(moment(createdAt),'event time required');
  const unsigned={seq:world.events.length+1,type,payload:structuredClone(payload),
    previous:world.events.length?digest(world.events.at(-1)):null,createdAt};
  const event={...unsigned,signature:signature(stewardKeys.privateKey,EVENT_DOMAIN,unsigned)};
  const next={...structuredClone(world),events:[...world.events,event]};
  replay(next);
  return next;
}
export function relatteStateSpec(world,createdAt='2026-10-08T20:00:00.000Z'){
  const s=inspectWorld(world);
  check(moment(createdAt)&&s.sourceHead,'signed source state and UTC timestamp required');
  return {
    schema:'relatte.opaque-organ-spec/v0',
    family_ref:PENNY_SCHEMA,
    donor_contract_ref:'jubilee.penny-local-attestation-hold-only/v0.1',
    artifact_kind:'PENNY_STATE_OBSERVATION_NOT_SPENDABLE_TOKEN',
    source_world:'jubilee-penny:local-simulated-work-and-box',
    source_particular:'jubilee-penny:world-state-014',
    source_history_head:'sha256:'+digest({policy:world.policy,head:s.sourceHead}),
    payload_refs:[{
      address:'urn:sha256:'+digest({head:s.sourceHead,work:s.work,boxes:s.boxes,positions:s.positions}),
      role:'signed-journal-projection',media_type:'application/json'
    }],
    donor_claims:{
      pending:s.workProducedPending,outstanding:s.outstandingPennyUnits,
      boxBookCoinCount:s.boxBookCoinCount,shortfall:s.auditedPhysicalShortfall,
      semanticStatus:'simulation_attestation_only_not_legal_title_or_bank_settlement',
      bankSettledFunds:0,interestEarned:0
    },
    requested_effect:{kind:'HOLD_OBSERVATION_ONLY',permissionGranted:false},
    return_address:null,created_at:createdAt
  };
}
