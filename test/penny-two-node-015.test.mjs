import test from 'node:test';
import assert from 'node:assert/strict';
import {attest,inspectWorld,append as appendPenny} from '../src/penny-work-matter-014.mjs';
import {AT,evhash} from '../src/penny-work-matter-demo-014.mjs';
import {
  newNodeA,newNodeB,propose,inspectA,inspectB,admitToB,acknowledgeA,
  localPhysicalB,auditPair
} from '../src/penny-two-node-015.mjs';
import {
  twoNodeFixture,workCert,boxDeposit,boxAudit,boxLoss,
  releasePayload,transferPayload,redeemPayload,disputePayload,
  createTwoNodeScenario,demo
} from '../src/penny-two-node-demo-015.mjs';
const reject=(f,pattern=/PENNY_015_HOLD|PENNY_014_HOLD/)=>assert.throws(f,pattern);
const revive=x=>JSON.parse(JSON.stringify(x));
const signedWork=s=>propose(s.source,s.keys.work,'proposal-work-001','WORK',
  {certificate:workCert(s.keys)},AT);
function start(){
  const s=twoNodeFixture();
  s.source=signedWork(s);
  return s;
}
function admitted(){
  const s=start();
  const r=admitToB(s.boxNode,s.source,'proposal-work-001',s.keys.treasury,AT);
  s.boxNode=r.node;
  s.source=acknowledgeA(s.source,s.keys.work,s.boxNode,r.receipt,AT);
  return s;
}
function addAction(s,proposalId,operation,payload){
  s.source=propose(s.source,s.keys.work,proposalId,operation,payload,AT);
  const c=admitToB(s.boxNode,s.source,proposalId,s.keys.treasury,AT);
  s.boxNode=c.node;s.source=acknowledgeA(s.source,s.keys.work,s.boxNode,c.receipt,AT);
  return s;
}
function funded(){
  const s=admitted();
  s.boxNode=boxDeposit(s.boxNode,s.keys,s.box,37,'deposit-37-peer-001');
  addAction(s,'proposal-release-37-001','RELEASE',releasePayload(s.keys,37,'release-37-peer-001'));
  s.boxNode=boxDeposit(s.boxNode,s.keys,s.box,63,'deposit-63-peer-002');
  addAction(s,'proposal-release-63-002','RELEASE',releasePayload(s.keys,63,'release-63-peer-002'));
  return s;
}
test('A and B are independent signed journals, different stewards and authority domains',()=>{
  const s=twoNodeFixture();
  assert.notEqual(s.source.sourcePublicKey,s.boxNode.treasuryPublicKey);
  assert.equal(s.source.sourcePublicKey,s.boxNode.sourcePublicKey);
  assert.equal(inspectA(s.source).sourceEventCount,0);
  assert.equal(inspectB(s.boxNode).sourceEventCount,0);
  assert.equal(auditPair(s.source,s.boxNode).activeUnits,0);
});
test('offline delivery cannot produce active units or even a B work entry',()=>{
  const s=start();
  const before=JSON.stringify(s.boxNode);
  const d=admitToB(s.boxNode,s.source,'proposal-work-001',s.keys.treasury,AT,{online:false});
  assert.equal(d.status,'PARTITIONED_NO_EFFECT');assert.equal(d.receipt,null);
  assert.equal(JSON.stringify(d.node),before);
  assert.equal(inspectB(d.node).workProducedPending,0);
  assert.deepEqual(inspectA(s.source).pending.map(p=>p.proposalId),['proposal-work-001']);
});
test('A signed work becomes pending at B only after B sovereign admission',()=>{
  const s=admitted(),a=inspectA(s.source),b=inspectB(s.boxNode);
  assert.equal(a.acknowledged.length,1);
  assert.equal(b.workProducedPending,100);
  assert.equal(b.outstandingPennyUnits,0);
  assert.equal(b.boxBookCoinCount,0);
  assert.equal(auditPair(s.source,s.boxNode).receiptCount,1);
});
test('B atomic commit / lost response / cold restore / idempotent retry',()=>{
  const s=start(),r=admitToB(s.boxNode,s.source,'proposal-work-001',
    s.keys.treasury,AT,{dropResponse:true});
  assert.equal(r.status,'COMMITTED_RESPONSE_LOST');assert.equal(r.receipt,null);
  const recovered=revive(r.node),a=revive(s.source);
  assert.equal(inspectB(recovered).workProducedPending,100);
  const retry=admitToB(recovered,a,'proposal-work-001',s.keys.treasury,AT);
  assert.equal(retry.status,'IDEMPOTENT_PRIOR_COMMIT');
  assert.equal(JSON.stringify(retry.node),JSON.stringify(recovered));
  const confirmed=acknowledgeA(a,s.keys.work,retry.node,retry.receipt,AT);
  assert.equal(inspectA(confirmed).acknowledged.length,1);
  assert.equal(inspectB(retry.node).workProducedPending,100);
});
test('duplicate transport ACK cannot append multiple signed A acknowledgments',()=>{
  const s=admitted(),receipt=s.boxNode.receipts[0];
  const again=acknowledgeA(s.source,s.keys.work,s.boxNode,receipt,AT);
  assert.deepEqual(again,s.source);
});
test('forged A messages and altered amounts rejected on full replay',()=>{
  const s=start(),f=revive(s.source);
  f.events[0].payload.pennyPayload.certificate.payload.quantity=999;
  reject(()=>inspectA(f),/source A signature invalid/);
  reject(()=>admitToB(s.boxNode,f,'proposal-work-001',s.keys.treasury,AT),
    /source A signature invalid/);
});
test('a different private key cannot imitate A work owner',()=>{
  const s=start(),other=twoNodeFixture();
  reject(()=>propose(s.source,other.keys.work,'fake-proposal-001','WORK',
    {certificate:workCert(other.keys)},AT),/A signer/);
});
test('A cannot remotely declare physical intake, current count or physical loss',()=>{
  const s=admitted();
  for(const operation of ['DEPOSIT','AUDIT','LOSS']){
    reject(()=>propose(s.source,s.keys.work,'proposal-physical-'+operation.toLowerCase(),
      operation,{some:'thing'},AT),/unauthorized/);
  }
});
test('A cannot impersonate sovereign B ledger signer',()=>{
  const s=start();
  reject(()=>admitToB(s.boxNode,s.source,'proposal-work-001',s.keys.work,AT),
    /A cannot sign B/);
});
test('B native evidence verifier denies invented work quantities despite signed A transport',()=>{
  const s=twoNodeFixture();
  s.source=propose(s.source,s.keys.work,'proposal-bad-work-001','WORK',
    {certificate:attest('work_witness',{
      workId:'work-bad-001',holderId:'person:maker-001',
      quantity:1000001,termsRef:'terms-work-peer-100-001',
      evidenceHash:evhash,completedAt:AT
    },s.keys.work)},AT);
  reject(()=>admitToB(s.boxNode,s.source,'proposal-bad-work-001',s.keys.treasury,AT),
    /work quantity/);
});
test('duplicate physical deposit ID remains refused after two-node reconnect',()=>{
  const s=admitted();
  s.boxNode=boxDeposit(s.boxNode,s.keys,s.box,37,'deposit-37-peer-001');
  reject(()=>boxDeposit(s.boxNode,s.keys,s.box,37,'deposit-37-peer-001'),/deposit ID/);
});
test('37 physical penny count cannot support a release of 38 or 100',()=>{
  const s=admitted();
  s.boxNode=boxDeposit(s.boxNode,s.keys,s.box,37,'deposit-37-peer-001');
  s.source=propose(s.source,s.keys.work,'proposal-funding-38-001','RELEASE',
    releasePayload(s.keys,38,'release-38-peer-001'),AT);
  reject(()=>admitToB(s.boxNode,s.source,'proposal-funding-38-001',s.keys.treasury,AT),/backing/);
  assert.equal(inspectB(s.boxNode).outstandingPennyUnits,0);
});
test('37 + 63 fresh physical box intake supports 100 and never 101',()=>{
  const s=funded(),v=auditPair(s.source,s.boxNode);
  assert.equal(v.pendingUnits,0);assert.equal(v.activeUnits,100);
  assert.equal(v.boxedBookPennies,100);
  reject(()=>addAction(s,'proposal-overmint-101-001','RELEASE',
    releasePayload(s.keys,1,'release-101-peer-001')),/exhausted/);
});
test('org transfer needs its own dual signed holder consent, with no box movement',()=>{
  const s=funded(),before=inspectB(s.boxNode);
  const forged=transferPayload(s.keys,12,'transfer-12-peer-001');
  forged.proofs.recipient=attest('token_recipient',forged.instruction,s.keys.node);
  s.source=propose(s.source,s.keys.work,'proposal-false-transfer-001','TRANSFER',forged,AT);
  reject(()=>admitToB(s.boxNode,s.source,'proposal-false-transfer-001',
    s.keys.treasury,AT),/invalid role signature/);
  assert.equal(inspectB(s.boxNode).outstandingPennyUnits,before.outstandingPennyUnits);
});
test('transferred units cannot be redeemed twice or moved without appropriate keys',()=>{
  const d=createTwoNodeScenario(),audit=auditPair(d.source,d.boxNode);
  assert.equal(audit.activeUnits,93);
  assert.equal(audit.boxedBookPennies,93);
  assert.equal(d.boxNode.world.events.filter(e=>e.type==='REDEEM').length,1);
});
test('miscounted physical box freezes transfers and redemption; shortfall stays visible',()=>{
  const d=createTwoNodeScenario();
  const s=d.stages.missing12,b=inspectB(s.boxNode);
  assert.equal(b.auditedPhysicalShortfall,12);
  assert.equal(b.status,'HOLD_REVIEW_REQUIRED');
  const a=propose(s.source,d.keys.work,'proposal-impaired-transfer-001',
    'TRANSFER',transferPayload(d.keys,1,'transfer-impaired-peer-001'),AT);
  reject(()=>admitToB(s.boxNode,a,'proposal-impaired-transfer-001',d.keys.treasury,AT),
    /impairment/);
  const bSource=propose(s.source,d.keys.work,'proposal-impaired-redeem-001',
    'REDEEM',redeemPayload(d.keys,1,'withdraw-impaired-peer-001'),AT);
  reject(()=>admitToB(s.boxNode,bSource,'proposal-impaired-redeem-001',
    d.keys.treasury,AT),/mismatch/);
});
test('loss writeoff does not erase 12 outstanding PENNY liabilities',()=>{
  const d=createTwoNodeScenario(),loss=d.stages.writtenOff;
  const p=inspectB(loss.boxNode);
  assert.equal(p.boxBookCoinCount,81);
  assert.equal(p.outstandingPennyUnits,93);
  assert.equal(p.auditedPhysicalShortfall,12);
  assert.equal(p.status,'HOLD_REVIEW_REQUIRED');
});
test('new independently signed box deposit restores coverage without minting claims',()=>{
  const d=createTwoNodeScenario(),b=inspectB(d.stages.restored.boxNode);
  assert.equal(b.boxBookCoinCount,93);
  assert.equal(b.outstandingPennyUnits,93);
  assert.equal(b.auditedPhysicalShortfall,0);
  assert.equal(b.workFundedReleased,100);
});
test('source fork after B commitment refuses new signed but divergent A event chain',()=>{
  const s=admitted();
  // A alternate copy from before first proposal commits a different work at seq=1.
  const alt=twoNodeFixture();
  alt.keys=s.keys;
  let fork=newNodeA(s.keys.work.publicKey,s.keys.treasury.publicKey);
  fork=propose(fork,s.keys.work,'proposal-other-work-001','WORK',{
    certificate:attest('work_witness',{
      workId:'work-other-001',holderId:'person:maker-001',quantity:100,
      termsRef:'terms-work-peer-100-001',evidenceHash:evhash,completedAt:AT
    },s.keys.work)
  },AT);
  reject(()=>admitToB(s.boxNode,fork,'proposal-other-work-001',s.keys.treasury,AT),
    /source fork or rollback/);
});
test('B journal fork after A pinned receipt cannot be misrepresented as the same B head',()=>{
  const s=admitted();
  const bad=revive(s.boxNode);
  bad.world.events[0].payload.certificate.payload.quantity=101;
  reject(()=>auditPair(s.source,bad),/invalid steward/);
  const truncated=revive(s.boxNode);
  truncated.world.events=[];
  reject(()=>auditPair(s.source,truncated),/receipt does not bind actual/);
});
test('A ACK containing fabricated B receipt is rejected even if signed by A',()=>{
  const s=admitted(),original=s.boxNode.receipts[0];
  const bad={...original,treasuryEventHash:'f'.repeat(64)};
  reject(()=>acknowledgeA(s.source,s.keys.work,s.boxNode,bad,AT),/forged box-side commitment/);
});
test('A signed receipt alone cannot replace B whole sovereign commit log',()=>{
  const s=admitted(),bad=revive(s.boxNode);
  bad.receipts=[];
  reject(()=>acknowledgeA(s.source,s.keys.work,bad,s.boxNode.receipts[0],AT),
    /part of sovereign B commit log/);
});
test('reordered unacknowledged older work after higher source sequence is quarantined',()=>{
  const s=admitted();
  const first=propose(s.source,s.keys.work,'proposal-first-pending-001',
    'DISPUTE',disputePayload(s.keys),AT);
  const second=propose(first,s.keys.work,'proposal-later-001','CLEAR',{
    certificate:attest('work_clear',{
      workId:'work-node-a-100-001',evidenceHash:evhash,observedAt:AT
    },s.keys.work)},AT);
  // B cannot CLEAR without DISPUTE; replay native guards even if network reorders.
  reject(()=>admitToB(s.boxNode,second,'proposal-later-001',s.keys.treasury,AT),
    /out-of-order message/);
});
test('A work dispute delivered to B freezes all positions without erasing them',()=>{
  const s=funded();
  addAction(s,'proposal-dispute-001','DISPUTE',disputePayload(s.keys));
  assert.equal(inspectB(s.boxNode).outstandingPennyUnits,100);
  const bad=propose(s.source,s.keys.work,'proposal-frozen-transfer-001','TRANSFER',
    transferPayload(s.keys,1,'transfer-frozen-peer-001'),AT);
  reject(()=>admitToB(s.boxNode,bad,'proposal-frozen-transfer-001',
    s.keys.treasury,AT),/frozen/);
});
test('same independent signed snapshot can restart after simulated death with exact continuity',()=>{
  const d=createTwoNodeScenario();
  const a=revive(d.source),b=revive(d.boxNode);
  assert.deepEqual(inspectA(a),inspectA(d.source));
  assert.deepEqual(inspectB(b),inspectB(d.boxNode));
  assert.deepEqual(auditPair(a,b),auditPair(d.source,d.boxNode));
});
test('full synthetic partition/crash/move/redeem/loss/recover stays conservative',()=>{
  const d=demo();
  assert.equal(d.trace[0].stage,'partition');
  assert.equal(d.trace[0].pending,0);
  assert.equal(d.trace[0].relayCount,0);
  assert.equal(d.trace[1].pending,100);
  assert.equal(d.trace[1].awaitingAcknowledgment.length,1);
  assert.equal(d.trace.find(x=>x.stage==='released_100').active,100);
  assert.equal(d.trace.find(x=>x.stage==='redeemed_7').active,93);
  assert.equal(d.trace.find(x=>x.stage==='box_shortfall_frozen').shortfall,12);
  assert.equal(d.trace.find(x=>x.stage==='loss_recorded_not_erased').active,93);
  assert.equal(d.trace.find(x=>x.stage==='fresh_custody_restored').shortfall,0);
  assert.equal(d.finalAudit.activeUnits,93);
  assert.equal(d.finalAudit.boxedBookPennies,93);
});
