#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {attest,inspectWorld} from './penny-work-matter-014.mjs';
import {AT,evhash,demoWorld} from './penny-work-matter-demo-014.mjs';
import {
  newNodeA,newNodeB,propose,admitToB,acknowledgeA,localPhysicalB,auditPair
} from './penny-two-node-015.mjs';

const jsonCopy=o=>JSON.parse(JSON.stringify(o));
export function twoNodeFixture(){
  const {keys,box,world}=demoWorld();
  const source=newNodeA(keys.work.publicKey,keys.treasury.publicKey);
  return {keys,box,source,boxNode:newNodeB(world)};
}
function three(c,keys){
  return {depositor:attest('depositor',c,keys.maker),
    custodian:attest('custodian',c,keys.custodian),
    counter:attest('counter',c,keys.counter)};
}
function two(c,keys){
  return {custodian:attest('custodian',c,keys.custodian),
    counter:attest('counter',c,keys.counter)};
}
export function boxDeposit(b,keys,box,coins,depositId) {
  const claim={
    depositId,boxId:box.boxId,depositorId:'person:maker-001',quantity:coins,
    evidenceHash:evhash,consentRef:'consent-backed-pennies-001',
    backingTermsRef:box.backingTermsRef,observedAt:AT
  };
  return localPhysicalB(b,keys.treasury,'DEPOSIT',{
    claim,proofs:three(claim,keys)},AT);
}
export function boxAudit(b,keys,box,actual,auditId){
  const claim={auditId,boxId:box.boxId,actualCount:actual,evidenceHash:evhash,observedAt:AT};
  return localPhysicalB(b,keys.treasury,'AUDIT',{claim,proofs:two(claim,keys)},AT);
}
export function boxLoss(b,keys,box,amount,lossId){
  const claim={lossId,boxId:box.boxId,quantity:amount,evidenceHash:evhash,observedAt:AT};
  return localPhysicalB(b,keys.treasury,'LOSS',{claim,proofs:two(claim,keys)},AT);
}
export const workCert=(keys)=>attest('work_witness',{
  workId:'work-node-a-100-001',holderId:'person:maker-001',quantity:100,
  termsRef:'terms-work-peer-100-001',evidenceHash:evhash,completedAt:AT
},keys.work);
export function releasePayload(keys,amount,releaseId){
  const instruction={releaseId,workId:'work-node-a-100-001',
    boxId:'box-jubilee-001',holderId:'person:maker-001',quantity:amount,
    termsRef:'terms-work-peer-100-001'};
  return {instruction,holderConsent:attest('holder_release',instruction,keys.maker)};
}
export function transferPayload(keys,amount,transferId){
  const instruction={transferId,workId:'work-node-a-100-001',
    boxId:'box-jubilee-001',fromId:'person:maker-001',
    toId:'org:station-001',quantity:amount};
  return {instruction,proofs:{
    sender:attest('token_sender',instruction,keys.maker),
    recipient:attest('token_recipient',instruction,keys.org)
  }};
}
export function redeemPayload(keys,amount,withdrawalId){
  const instruction={withdrawalId,workId:'work-node-a-100-001',
    boxId:'box-jubilee-001',holderId:'org:station-001',
    quantity:amount,evidenceHash:evhash,observedAt:AT};
  return {instruction,proofs:{
    surrender:attest('token_surrender',instruction,keys.org),...two(instruction,keys)
  }};
}
export function disputePayload(keys) {
  return {certificate:attest('work_dispute',{
    workId:'work-node-a-100-001',evidenceHash:evhash,observedAt:AT},keys.work)};
}
/** A -> B; acknowledgement must be explicitly delivered back to A. */
export function sendAndConfirm(state,id,operation,payload){
  const source=propose(state.source,state.keys.work,id,operation,payload,AT);
  const committed=admitToB(state.boxNode,source,id,state.keys.treasury,AT);
  return {
    ...state,source:acknowledgeA(source,state.keys.work,committed.node,committed.receipt,AT),
    boxNode:committed.node
  };
}
export function createTwoNodeScenario(){
  let s=twoNodeFixture();
  const stages={},trace=[];
  const read=stage=>{
    const a=auditPair(s.source,s.boxNode);
    trace.push({stage,pending:a.pendingUnits,active:a.activeUnits,
      physicalBoxBook:a.boxedBookPennies,shortfall:a.shortfall,
      relayCount:a.receiptCount,awaitingAcknowledgment:a.sourcePending,
      disposition:a.mode});
  };
  // A submits work and loses connectivity before the signed message reaches B.
  const signedWork=propose(s.source,s.keys.work,'proposal-work-001','WORK',
    {certificate:workCert(s.keys)},AT);
  s={...s,source:signedWork};
  const disconnected=admitToB(s.boxNode,s.source,'proposal-work-001',
    s.keys.treasury,AT,{online:false});
  if(disconnected.status!=='PARTITIONED_NO_EFFECT')throw Error('partition did not HOLD');
  stages.partition={source:s.source,boxNode:s.boxNode};
  read('partition');
  // B commits atomically, but its response is lost. Both nodes 'die':
  // the test recovers their independent signed JSON snapshots.
  const lost=admitToB(s.boxNode,s.source,'proposal-work-001',
    s.keys.treasury,AT,{dropResponse:true});
  s={...s,boxNode:jsonCopy(lost.node),source:jsonCopy(s.source)};
  stages.afterCrashBeforeAck={source:s.source,boxNode:s.boxNode};
  read('B_committed_response_lost');
  const retry=admitToB(s.boxNode,s.source,'proposal-work-001',
    s.keys.treasury,AT);
  if(retry.status!=='IDEMPOTENT_PRIOR_COMMIT')throw Error('retry duplicated work');
  s={...s,boxNode:retry.node,
    source:acknowledgeA(s.source,s.keys.work,retry.node,retry.receipt,AT)};
  stages.resumed={source:s.source,boxNode:s.boxNode};read('reconstituted_and_acked');
  // Only the local B node may process box physical custody evidence.
  s.boxNode=boxDeposit(s.boxNode,s.keys,s.box,37,'deposit-37-peer-001');
  stages.intake37={source:s.source,boxNode:s.boxNode};read('counted_37');
  s=sendAndConfirm(s,'proposal-release-37-001','RELEASE',
    releasePayload(s.keys,37,'release-37-peer-001'));
  stages.released37={source:s.source,boxNode:s.boxNode};read('released_37');
  s.boxNode=boxDeposit(s.boxNode,s.keys,s.box,63,'deposit-63-peer-002');
  s=sendAndConfirm(s,'proposal-release-63-002','RELEASE',
    releasePayload(s.keys,63,'release-63-peer-002'));
  stages.released100={source:s.source,boxNode:s.boxNode};read('released_100');
  s=sendAndConfirm(s,'proposal-transfer-12-001','TRANSFER',
    transferPayload(s.keys,12,'transfer-12-peer-001'));
  stages.transferred={source:s.source,boxNode:s.boxNode};read('moved_to_org_12');
  s=sendAndConfirm(s,'proposal-redeem-7-001','REDEEM',
    redeemPayload(s.keys,7,'withdrawal-7-peer-001'));
  s.boxNode=boxAudit(s.boxNode,s.keys,s.box,93,'audit-93-peer-001');
  stages.redeemed={source:s.source,boxNode:s.boxNode};read('redeemed_7');
  s.boxNode=boxAudit(s.boxNode,s.keys,s.box,81,'audit-loss-81-peer-002');
  stages.missing12={source:s.source,boxNode:s.boxNode};read('box_shortfall_frozen');
  s.boxNode=boxLoss(s.boxNode,s.keys,s.box,12,'writeoff-12-peer-001');
  stages.writtenOff={source:s.source,boxNode:s.boxNode};read('loss_recorded_not_erased');
  s.boxNode=boxDeposit(s.boxNode,s.keys,s.box,12,'replacement-12-peer-003');
  stages.restored={source:s.source,boxNode:s.boxNode};read('fresh_custody_restored');
  return {keys:s.keys,box:s.box,stages,trace,source:s.source,boxNode:s.boxNode};
}
export function demo(){
  const d=createTwoNodeScenario(),latest=auditPair(d.source,d.boxNode);
  return {
    schema:'jubilee.penny-two-node-demonstration/v0.1',
    trace:d.trace,
    finalAudit:latest,
    finalPositions:inspectWorld(d.boxNode.world).positions,
    notice:'All coins, people, certificates, signatures, transfers, losses, incidents and nodes are synthetic local specimens. A and B are independent signed JSON state machines, not a deployed peer-to-peer network or redeemable token.'
  };
}
export function main(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='demo')return demo();
  if(args.length===3&&args[0]==='audit'){
    const source=JSON.parse(readFileSync(resolve(args[1]),'utf8'));
    const box=JSON.parse(readFileSync(resolve(args[2]),'utf8'));
    return auditPair(source,box);
  }
  throw Error('Usage: npm run penny015:demo | npm run penny015 -- audit PRIVATE_NODE_A.json PRIVATE_NODE_B.json');
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
