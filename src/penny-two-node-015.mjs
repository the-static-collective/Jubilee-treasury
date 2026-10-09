import {sign,verify,createPublicKey} from 'node:crypto';
import {canonical,digest,append as appendPenny,inspectWorld} from './penny-work-matter-014.mjs';

export const NODE_A_SCHEMA='jubilee.penny-node-a/v0.1';
export const NODE_B_SCHEMA='jubilee.penny-node-b/v0.1';
const A_DOMAIN='JUBILEE-PENNY-015-SOURCE\n';
const B_DOMAIN='JUBILEE-PENNY-015-COMMIT\n';
const PENNY_014_DOMAIN='JUBILEE-PENNY-014-EVENT\n';
const REF=/^[A-Za-z0-9][A-Za-z0-9:._-]{2,127}$/;
const allowed=new Set(['WORK','DISPUTE','CLEAR','RELEASE','TRANSFER','REDEEM']);
const fail=s=>{throw Error('PENNY_015_HOLD: '+s);};
const check=(condition,why)=>{if(!condition)fail(why)};
const exact=(obj,fields)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&
  Object.keys(obj).sort().join('|')===fields.slice().sort().join('|');
const validTime=t=>typeof t==='string'&&Number.isFinite(Date.parse(t))&&new Date(t).toISOString()===t;
const same=(a,b)=>canonical(a)===canonical(b);
function pub(privateKey){return createPublicKey(privateKey).export({type:'spki',format:'pem'})}
function signature(keys,domain,body) {
  check(keys&&pub(keys.privateKey)===keys.publicKey,'signer mismatch');
  return sign(null,Buffer.from(domain+canonical(body)),keys.privateKey).toString('base64');
}
function verified(key,domain,body,sig){
  if(typeof sig!=='string'||sig.length>128)return false;
  try{const bytes=Buffer.from(sig,'base64');
    return bytes.length===64&&bytes.toString('base64')===sig&&
      verify(null,Buffer.from(domain+canonical(body)),key,bytes)
  }catch{return false}
}
const getProposal=(source,proposalId)=>
  source.events.find(e=>e.type==='PROPOSE'&&e.payload.proposalId===proposalId);
function validateReceipt(receipt,source,treasuryKey) {
  check(exact(receipt,['schema','sourceSeq','sourceEventHash','proposalId',
    'treasurySeq','treasuryEventHash','signature'])&&
    receipt.schema==='jubilee.penny-two-node-receipt/v0.1','malformed B commitment');
  const {signature:proof,...body}=receipt;
  check(verified(treasuryKey,B_DOMAIN,body,proof),'forged box-side commitment');
  const sourceEvent=source.events[receipt.sourceSeq-1];
  check(sourceEvent&&sourceEvent.type==='PROPOSE'&&
    digest(sourceEvent)===receipt.sourceEventHash&&
    sourceEvent.payload.proposalId===receipt.proposalId,
    'receipt not bound to exact source message');
  check(Number.isSafeInteger(receipt.treasurySeq)&&receipt.treasurySeq>=1&&
    typeof receipt.treasuryEventHash==='string','malformed treasury event reference');
}
export function newNodeA(sourcePublicKey,treasuryPublicKey){
  check(sourcePublicKey&&treasuryPublicKey&&sourcePublicKey!==treasuryPublicKey,
    'independent source and box steward keys required');
  createPublicKey(sourcePublicKey);createPublicKey(treasuryPublicKey);
  return {schema:NODE_A_SCHEMA,sourcePublicKey,treasuryPublicKey,events:[]};
}
export function inspectA(source){
  check(exact(source,['schema','sourcePublicKey','treasuryPublicKey','events'])&&
    source.schema===NODE_A_SCHEMA&&Array.isArray(source.events)&&
    source.events.length<=100000,'invalid source A journal');
  let previous=null,previousTime=null;
  const ids=new Set(),acked=new Set(),proposals=[];
  for(const [i,e] of source.events.entries()){
    check(exact(e,['seq','type','payload','previous','createdAt','signature'])&&
      e.seq===i+1&&e.previous===previous&&validTime(e.createdAt)&&
      (previousTime===null||e.createdAt>=previousTime),'A journal gap or temporal rewind');
    const {signature,...body}=e;
    check(verified(source.sourcePublicKey,A_DOMAIN,body,signature),
      'source A signature invalid');
    if(e.type==='PROPOSE'){
      check(exact(e.payload,['proposalId','operation','pennyPayload'])&&
        typeof e.payload.proposalId==='string'&&REF.test(e.payload.proposalId)&&
        allowed.has(e.payload.operation)&&!ids.has(e.payload.proposalId),
        'duplicate/unauthorized/out-of-scope A proposal');
      ids.add(e.payload.proposalId);
      check(e.payload.pennyPayload&&typeof e.payload.pennyPayload==='object'&&
        !Array.isArray(e.payload.pennyPayload),'missing owner-authorized effect evidence');
      proposals.push({proposalId:e.payload.proposalId,seq:e.seq,
        operation:e.payload.operation,sourceEventHash:digest(e)});
    }else if(e.type==='ACK'){
      check(exact(e.payload,['receipt'])&&e.payload.receipt,
        'acknowledgment receipt only');
      validateReceipt(e.payload.receipt,source,source.treasuryPublicKey);
      check(e.payload.receipt.sourceSeq<i+1&&!acked.has(e.payload.receipt.proposalId),
        'receipt cannot acknowledge future or duplicate proposal');
      acked.add(e.payload.receipt.proposalId);
    }else fail('unknown source event type');
    previous=digest(e);previousTime=e.createdAt;
  }
  return {sourceHead:previous,sourceEventCount:source.events.length,
    proposals,pending:proposals.filter(p=>!acked.has(p.proposalId)),
    acknowledged:[...acked],effectAuthority:'NONE_WHILE_OFFLINE'};
}
function appendA(source,keys,type,payload,createdAt) {
  inspectA(source);
  check(keys?.publicKey===source.sourcePublicKey&&
    pub(keys.privateKey)===source.sourcePublicKey,'A signer must be exact pinned owner');
  check(validTime(createdAt),'timestamp invalid');
  const body={seq:source.events.length+1,type,payload:structuredClone(payload),
    previous:source.events.length?digest(source.events.at(-1)):null,createdAt};
  const event={...body,signature:signature(keys,A_DOMAIN,body)};
  const next={...structuredClone(source),events:[...source.events,event]};
  inspectA(next);return next;
}
export function propose(source,keys,proposalId,operation,pennyPayload,at){
  return appendA(source,keys,'PROPOSE',{proposalId,operation,pennyPayload},at);
}
export function newNodeB(world){
  inspectWorld(world);
  return {schema:NODE_B_SCHEMA,sourcePublicKey:world.policy.workWitnessPublicKey,
    treasuryPublicKey:world.policy.stewardPublicKey,
    world:structuredClone(world),receipts:[]};
}
export function inspectB(node){
  check(exact(node,['schema','sourcePublicKey','treasuryPublicKey','world','receipts'])&&
    node.schema===NODE_B_SCHEMA&&Array.isArray(node.receipts)&&node.receipts.length<=100000,
    'invalid box world wrapper');
  const w=inspectWorld(node.world);
  check(node.sourcePublicKey===node.world.policy.workWitnessPublicKey&&
    node.treasuryPublicKey===node.world.policy.stewardPublicKey,
    'B authority policy replaced');
  let highestSourceSeq=0;
  const seen=new Set(),seenSource=new Set();
  for(const receipt of node.receipts){
    const {signature,...body}=receipt;
    check(verified(node.treasuryPublicKey,B_DOMAIN,body,signature),
      'B receipt signature invalid');
    check(receipt.schema==='jubilee.penny-two-node-receipt/v0.1'&&
      Number.isSafeInteger(receipt.sourceSeq)&&receipt.sourceSeq>highestSourceSeq&&
      !seen.has(receipt.proposalId)&&!seenSource.has(receipt.sourceEventHash),
      'receipt order, collision or history gap');
    const e=node.world.events[receipt.treasurySeq-1];
    check(e&&digest(e)===receipt.treasuryEventHash,
      'receipt does not bind actual box journal event');
    highestSourceSeq=receipt.sourceSeq;
    seen.add(receipt.proposalId);seenSource.add(receipt.sourceEventHash);
  }
  return {
    ...w,sourceAuthority:node.sourcePublicKey,
    acceptedRelayMessages:node.receipts.length,
    lastSourceSeq:highestSourceSeq,
    relayHead:node.receipts.length?digest(node.receipts.at(-1)):null
  };
}
function pinSource(node,source){
  inspectA(source);inspectB(node);
  check(source.sourcePublicKey===node.sourcePublicKey&&
    source.treasuryPublicKey===node.treasuryPublicKey,'independent source/treasury identity mismatch');
  // The B journal pins signed A event hashes. An A-side fork at any already
  // accepted source sequence fails even if the new work certificate is valid.
  for(const receipt of node.receipts){
    const event=source.events[receipt.sourceSeq-1];
    check(event&&digest(event)===receipt.sourceEventHash&&
      event.payload?.proposalId===receipt.proposalId,
      'source fork or rollback contradicts pinned B commitment');
  }
}
function verifyNativeIntent(node,operation,payload){
  // B's existing PENNY-014 native signed policy remains independently authoritative.
  if(operation==='WORK'){
    check(payload?.certificate?.role==='work_witness'&&
      payload.certificate?.payload,'work must be signed independently by pinned A witness');
  }
  if(operation==='DISPUTE'||operation==='CLEAR'){
    check(payload?.certificate?.role===(operation==='DISPUTE'?'work_dispute':'work_clear'),
      'cannot convert source work proof into dispute authority');
  }
  if(!allowed.has(operation))fail('A may not remotely declare physical box deposits, audits or losses');
}
function appendReceipt(node,keys,proposal,treasuryEvent){
  const body={
    schema:'jubilee.penny-two-node-receipt/v0.1',
    sourceSeq:proposal.seq,
    sourceEventHash:digest(proposal),
    proposalId:proposal.payload.proposalId,
    treasurySeq:treasuryEvent.seq,treasuryEventHash:digest(treasuryEvent)
  };
  return {...body,signature:signature(keys,B_DOMAIN,body)};
}
function checkSeenEquivalent(node,proposal) {
  const prior=node.receipts.find(r=>r.proposalId===proposal.payload.proposalId||
    r.sourceEventHash===digest(proposal));
  if(prior){
    check(prior.sourceSeq===proposal.seq&&
      prior.sourceEventHash===digest(proposal)&&
      prior.proposalId===proposal.payload.proposalId,
      'conflicting retry with same proposal identity');
    return prior;
  }
  return null;
}
/** Processes exactly one A message; returns an immutable atomic B snapshot. */
export function admitToB(node,source,proposalId,stewardKeys,at,
  {online=true,dropResponse=false}={}){
  pinSource(node,source);
  const p=getProposal(source,proposalId);
  check(p,'proposal absent from signed A history');
  const state=inspectB(node),previous=checkSeenEquivalent(node,p);
  if(!online)return {node:structuredClone(node),receipt:null,
    status:'PARTITIONED_NO_EFFECT'};
  if(previous)return {node:structuredClone(node),
    receipt:dropResponse?null:structuredClone(previous),
    status:'IDEMPOTENT_PRIOR_COMMIT'};
  check(p.seq>state.lastSourceSeq,'late out-of-order source message requires reconciliation');
  check(stewardKeys?.publicKey===node.treasuryPublicKey,
    'A cannot sign B treasury events');
  verifyNativeIntent(node,p.payload.operation,p.payload.pennyPayload);
  // Atomic (pure object) transition: receiver's native effect and signed
  // source-event commitment become part of ONE returned B state.
  const newWorld=appendPenny(node.world,stewardKeys,
    p.payload.operation,p.payload.pennyPayload,at);
  const event=newWorld.events.at(-1);
  check(event.type===p.payload.operation&&same(event.payload,p.payload.pennyPayload),
    'native owner B refused exact-source payload');
  const receipt=appendReceipt(node,stewardKeys,p,event);
  const next={...structuredClone(node),world:newWorld,
    receipts:[...structuredClone(node.receipts),receipt]};
  inspectB(next);pinSource(next,source);
  return {node:next,receipt:dropResponse?null:receipt,
    status:dropResponse?'COMMITTED_RESPONSE_LOST':'COMMITTED_AND_ACK_READY'};
}
/** B's local physical handling is deliberately outside A's transport channel. */
export function localPhysicalB(node,stewardKeys,type,payload,at){
  inspectB(node);
  check(['DEPOSIT','AUDIT','LOSS'].includes(type),
    'only B owns physical intake, audit and loss events');
  const world=appendPenny(node.world,stewardKeys,type,payload,at);
  return {...structuredClone(node),world};
}
export function acknowledgeA(source,sourceKeys,node,receipt,at) {
  pinSource(node,source);
  validateReceipt(receipt,source,source.treasuryPublicKey);
  check(node.receipts.some(r=>same(r,receipt)),
    'signed receipt must be part of sovereign B commit log');
  const treasuryEvent=node.world.events[receipt.treasurySeq-1];
  check(treasuryEvent&&digest(treasuryEvent)===receipt.treasuryEventHash,
    'signed B receipt references unavailable native event');
  const original=source.events[receipt.sourceSeq-1];
  check(treasuryEvent.type===original.payload.operation&&
    same(treasuryEvent.payload,original.payload.pennyPayload),
    'B committed a different action than A requested');
  const earlier=source.events.find(e=>e.type==='ACK'&&
    e.payload.receipt.proposalId===receipt.proposalId);
  if(earlier){
    check(same(earlier.payload.receipt,receipt),'B equivocated on an earlier ack');
    return structuredClone(source);
  }
  return appendA(source,sourceKeys,'ACK',{receipt},at);
}
export function auditPair(source,node){
  pinSource(node,source);
  const a=inspectA(source),b=inspectB(node);
  const receipts=node.receipts.map(r=>{
    const sourceEvent=source.events[r.sourceSeq-1];
    const treasuryEvent=node.world.events[r.treasurySeq-1];
    check(sourceEvent&&treasuryEvent&&
      treasuryEvent.type===sourceEvent.payload.operation&&
      same(treasuryEvent.payload,sourceEvent.payload.pennyPayload),
      'two-node semantic fork: source request differs from B effect');
    return {proposalId:r.proposalId,sourceSeq:r.sourceSeq,
      boxSeq:r.treasurySeq,committedEventHash:r.treasuryEventHash};
  });
  return {
    schema:'jubilee.two-node-audit/v0.1',
    sourceHead:a.sourceHead,sourcePending:a.pending.map(x=>x.proposalId),
    sourceAcked:a.acknowledged,
    boxHead:b.sourceHead,sourcePinnedThrough:b.lastSourceSeq,
    receiptCount:receipts.length,receipts,
    activeUnits:b.outstandingPennyUnits,pendingUnits:b.workProducedPending,
    boxedBookPennies:b.boxBookCoinCount,shortfall:b.auditedPhysicalShortfall,
    mode:b.status==='HOLD_REVIEW_REQUIRED'?'HOLD_REVIEW_REQUIRED':'SOURCE_CLAIMS_ONLY',
    checks:['A signed chronology','B signed native PENNY-014 chronology',
      'B pinned A source event hashes','exact native B effects',
      'B signed receipt','separate A confirmation','no automatic offline effect'],
    note:'Two nodes are simulated locally. No live network, physical custody, public mint or legally redeemable token.'
  };
}
