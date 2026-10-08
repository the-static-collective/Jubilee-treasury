import test from 'node:test';
import assert from 'node:assert/strict';
import {newKeys,createWorld,attest,append,inspectWorld,relatteStateSpec} from '../src/penny-work-matter-014.mjs';
import {AT,evhash,demoWorld,createScenario,demo} from '../src/penny-work-matter-demo-014.mjs';

function reject(f,pattern=/PENNY_014_HOLD/){assert.throws(f,pattern);}
const state=(name)=>createScenario().stages[name];
function deposit(box,keys,quantity,id='deposit-new-014'){
  const claim={depositId:id,boxId:box.boxId,depositorId:'person:maker-001',
    quantity,evidenceHash:evhash,consentRef:'consent-owner-extra-001',
    backingTermsRef:box.backingTermsRef,observedAt:AT};
  return {claim,proofs:{
    depositor:attest('depositor',claim,keys.maker),
    custodian:attest('custodian',claim,keys.custodian),
    counter:attest('counter',claim,keys.counter)
  }};
}
function release(keys,quantity,id='release-extra-014'){
  const instruction={releaseId:id,workId:'work-verified-100-001',
    boxId:'box-jubilee-001',holderId:'person:maker-001',quantity,
    termsRef:'terms-explicit-100-pennies-for-work-001'};
  return {instruction,holderConsent:attest('holder_release',instruction,keys.maker)};
}
function move(keys,quantity=1,id='transfer-new-014'){
  const instruction={transferId:id,workId:'work-verified-100-001',boxId:'box-jubilee-001',
    fromId:'person:maker-001',toId:'org:station-001',quantity};
  return {instruction,proofs:{
    sender:attest('token_sender',instruction,keys.maker),
    recipient:attest('token_recipient',instruction,keys.org)
  }};
}
function redeem(keys,quantity=1,id='withdraw-new-014'){
  const instruction={withdrawalId:id,workId:'work-verified-100-001',
    boxId:'box-jubilee-001',holderId:'org:station-001',quantity,
    evidenceHash:evhash,observedAt:AT};
  return {instruction,proofs:{
    surrender:attest('token_surrender',instruction,keys.org),
    custodian:attest('custodian',instruction,keys.custodian),
    counter:attest('counter',instruction,keys.counter)
  }};
}
function audit(keys,actualCount,id='audit-new-014'){
  const claim={auditId:id,boxId:'box-jubilee-001',actualCount,
    evidenceHash:evhash,observedAt:AT};
  return {claim,proofs:{
    custodian:attest('custodian',claim,keys.custodian),
    counter:attest('counter',claim,keys.counter)
  }};
}
function loss(keys,quantity,id='loss-new-014'){
  const claim={lossId:id,boxId:'box-jubilee-001',quantity,evidenceHash:evhash,observedAt:AT};
  return {claim,proofs:{
    custodian:attest('custodian',claim,keys.custodian),
    counter:attest('counter',claim,keys.counter)
  }};
}
const summary=w=>inspectWorld(w);

test('work issues 100 PENDING only, never active, cash or box collateral',()=>{
  const p=summary(state('work'));
  assert.equal(p.workProducedPending,100);
  assert.equal(p.workFundedReleased,0);
  assert.equal(p.outstandingPennyUnits,0);
  assert.equal(p.boxBookCoinCount,0);
  assert.equal(p.bankSettledFunds,0);
  assert.equal(p.interestEarned,0);
});
test('37 dual-counted+depositor-signed coins support at most 37 releases',()=>{
  const d=createScenario(),p=summary(d.stages.intake37);
  assert.equal(p.workProducedPending,100);assert.equal(p.boxBookCoinCount,37);
  assert.equal(p.outstandingPennyUnits,0);
  const v=summary(d.stages.release37);
  assert.equal(v.workProducedPending,63);
  assert.equal(v.outstandingPennyUnits,37);
  assert.equal(v.freeCoinBacking,0);
  reject(()=>append(d.stages.release37,d.keys.treasury,'RELEASE',
    release(d.keys,1),'2026-10-08T20:00:00.000Z'),/backing/);
});
test('a separate 63-penny intake completes 100 funded but cannot mint the same work twice',()=>{
  const d=createScenario(),p=summary(d.stages.release100);
  assert.equal(p.workProducedPending,0);
  assert.equal(p.boxBookCoinCount,100);
  assert.equal(p.outstandingPennyUnits,100);
  assert.equal(p.positions.length,1);
  reject(()=>append(d.stages.release100,d.keys.treasury,'RELEASE',
    release(d.keys,1),'2026-10-08T20:00:00.000Z'),/exhausted/);
});
test('holder consent moves 12 tokens to an org, but physical pennies stay in their box',()=>{
  const p=summary(state('transferred'));
  assert.deepEqual(p.positions.map(v=>[v.holderId,v.quantity]),
    [['org:station-001',12],['person:maker-001',88]]);
  assert.equal(p.boxBookCoinCount,100);
  assert.equal(p.outstandingPennyUnits,100);
});
test('surrender + independent physical withdrawal witnesses retire 7 and release 7 physical pennies',()=>{
  const p=summary(state('redeemed'));
  assert.equal(p.workFundedReleased,100);
  assert.equal(p.retiredByRedemption,7);
  assert.equal(p.outstandingPennyUnits,93);
  assert.equal(p.boxBookCoinCount,93);
  assert.equal(p.positions.find(x=>x.holderId==='org:station-001').quantity,5);
  assert.equal(p.positions.find(x=>x.holderId==='person:maker-001').quantity,88);
  assert.equal(p.freeCoinBacking,0);
});
test('independent count of 93 matches box book after redemption',()=>{
  const p=summary(state('audited'));
  assert.equal(p.boxes[0].auditedCoins,93);
  assert.equal(p.boxes[0].impaired,false);
  assert.equal(p.auditedPhysicalShortfall,0);
  assert.equal(p.status,'LOCAL_ATTESTATIONS_ONLY');
});
test('duplicate source deposit ID cannot back two PENNY releases',()=>{
  const d=createScenario();
  reject(()=>append(d.stages.intake37,d.keys.treasury,'DEPOSIT',
    deposit(d.box,d.keys,37,'deposit-37-001'),AT),/deposit ID/);
});
test('depositor consent must be signed by actual registered depositor, not custodian',()=>{
  const d=demoWorld();
  const e=deposit(d.box,d.keys,37);
  e.proofs.depositor=attest('depositor',e.claim,d.keys.custodian);
  reject(()=>append(d.world,d.keys.treasury,'DEPOSIT',e,AT),/authority/);
});
test('physical count needs two distinct pinned signatures, not one role signing twice',()=>{
  const d=demoWorld();
  const e=deposit(d.box,d.keys,37);
  e.proofs.counter=attest('counter',e.claim,d.keys.custodian);
  reject(()=>append(d.world,d.keys.treasury,'DEPOSIT',e,AT),/authority/);
  delete e.proofs.counter;
  reject(()=>append(d.world,d.keys.treasury,'DEPOSIT',e,AT),/three-party physical custody proof/);
});
test('depositor can deny backing terms / wrong box without releasing token',()=>{
  const d=demoWorld();
  const e=deposit(d.box,d.keys,37);
  e.claim.backingTermsRef='terms-no-legal-backing-001';
  reject(()=>append(d.world,d.keys.treasury,'DEPOSIT',e,AT),/backing terms/);
  const e2=deposit(d.box,d.keys,37);
  e2.claim.boxId='fake-box-001';
  reject(()=>append(d.world,d.keys.treasury,'DEPOSIT',e2,AT),/box/);
});
test('unsanctioned work, invented work units and duplicated work IDs refused',()=>{
 const d=createScenario(),w=d.work;
 reject(()=>append(d.stages.work,d.keys.treasury,'WORK',{
   certificate:attest('work_witness',w,d.keys.work)},AT),/duplicate work/);
 const bad={...w,quantity:999};
 reject(()=>append(d.stages.work,d.keys.treasury,'WORK',{
   certificate:attest('work_witness',bad,d.keys.maker)},AT),/authority/);
 reject(()=>append(d.stages.work,d.keys.treasury,'WORK',{
   certificate:attest('work_witness',{...w,workId:'work-another-001',quantity:1000001},d.keys.work)},AT),
   /quantity/);
});
test('treasury steward cannot impersonate work witness; no self-certified rewards',()=>{
  const d=demoWorld(),q={workId:'work-fake-001',holderId:'person:maker-001',quantity:100,
    termsRef:'terms-work-001',evidenceHash:evhash,completedAt:AT};
  reject(()=>append(d.world,d.keys.treasury,'WORK',{
    certificate:attest('work_witness',q,d.keys.treasury)},AT),/authority/);
});
test('release recipient must be original work beneficiary and explicitly consent',()=>{
 const d=createScenario(),e=release(d.keys,1);
 e.instruction.holderId='org:station-001';
 reject(()=>append(d.stages.intake37,d.keys.treasury,'RELEASE',e,AT),/recipient/);
 const consentWrong=release(d.keys,1);
 consentWrong.holderConsent=attest('holder_release',consentWrong.instruction,d.keys.org);
 reject(()=>append(d.stages.intake37,d.keys.treasury,'RELEASE',consentWrong,AT),/authority/);
});
test('forged trustee signed event, history gap and altered work/custody all fail cold replay',()=>{
 const d=createScenario();
 const edit=structuredClone(d.stages.audited);
 edit.events[0].payload.certificate.payload.quantity=100000;
 reject(()=>summary(edit),/invalid steward/);
 const cut=structuredClone(d.stages.audited);cut.events.splice(2,1);
 reject(()=>summary(cut),/journal gap/);
 const broken=structuredClone(d.stages.audited);broken.events[2].previous='a'.repeat(64);
 reject(()=>summary(broken),/journal gap/);
});
test('not enough token balance, sender nonce reuse, wrong recipient proof and no consent fail closed',()=>{
 const d=createScenario();
 reject(()=>append(d.stages.release100,d.keys.treasury,'TRANSFER',move(d.keys,101),AT),/unavailable token balance/);
 const wrong=move(d.keys);
 wrong.proofs.recipient=attest('token_recipient',wrong.instruction,d.keys.node);
 reject(()=>append(d.stages.release100,d.keys.treasury,'TRANSFER',wrong,AT),/authority/);
 reject(()=>append(d.stages.transferred,d.keys.treasury,'TRANSFER',
   move(d.keys,1,'transfer-12-to-org-001'),AT),/duplicate transfer/);
});
test('redemption cannot be duplicated, forged or exceed holder balance',()=>{
 const d=createScenario();
 reject(()=>append(d.stages.redeemed,d.keys.treasury,'REDEEM',
   redeem(d.keys,7,'withdrawal-7-001'),AT),/unique physical withdrawal/);
 reject(()=>append(d.stages.transferred,d.keys.treasury,'REDEEM',
   redeem(d.keys,13,'withdraw-13-001'),AT),/insufficient/);
 const wrong=redeem(d.keys);
 wrong.proofs.counter=attest('counter',wrong.instruction,d.keys.org);
 reject(()=>append(d.stages.transferred,d.keys.treasury,'REDEEM',wrong,AT),/authority/);
});
test('disputed work freezes release, transfer and physical redemption without destroying backing',()=>{
 const d=createScenario(),q={workId:d.work.workId,evidenceHash:evhash,observedAt:AT};
 const dispute=append(d.stages.transferred,d.keys.treasury,'DISPUTE',{
   certificate:attest('work_dispute',q,d.keys.work)},AT);
 const v=summary(dispute);
 assert.equal(v.work[0].status,'disputed');
 assert.equal(v.outstandingPennyUnits,100);
 assert.equal(v.boxBookCoinCount,100);
 reject(()=>append(dispute,d.keys.treasury,'TRANSFER',move(d.keys),AT),/frozen/);
 reject(()=>append(dispute,d.keys.treasury,'REDEEM',redeem(d.keys),AT),/frozen/);
 const cleared=append(dispute,d.keys.treasury,'CLEAR',{
   certificate:attest('work_clear',q,d.keys.work)},AT);
 assert.equal(summary(cleared).work[0].status,'approved');
 assert.equal(summary(cleared).outstandingPennyUnits,100);
});
test('a custody count shortfall is visible, freezes circulation and cannot be hidden by recursion',()=>{
 const d=createScenario();
 const short=append(d.stages.release100,d.keys.treasury,'AUDIT',
   audit(d.keys,88),AT);
 const p=summary(short);
 assert.equal(p.boxBookCoinCount,100);
 assert.equal(p.boxes[0].auditedCoins,88);
 assert.equal(p.auditedPhysicalShortfall,12);
 assert.equal(p.boxes[0].discrepancy,-12);
 assert.equal(p.status,'HOLD_REVIEW_REQUIRED');
 reject(()=>append(short,d.keys.treasury,'TRANSFER',move(d.keys),AT),/impairment/);
 reject(()=>append(short,d.keys.treasury,'REDEEM',redeem(d.keys),AT),/mismatch/);
});
test('witnessed loss is recorded, but does not cancel the holders shortfall claims',()=>{
 const d=createScenario();
 const audited=append(d.stages.release100,d.keys.treasury,'AUDIT',audit(d.keys,88),AT);
 const lowered=append(audited,d.keys.treasury,'LOSS',loss(d.keys,12),AT);
 const p=summary(lowered);
 assert.equal(p.boxBookCoinCount,88);
 assert.equal(p.outstandingPennyUnits,100);
 assert.equal(p.auditedPhysicalShortfall,12);
 assert.equal(p.status,'HOLD_REVIEW_REQUIRED');
 reject(()=>append(lowered,d.keys.treasury,'TRANSFER',move(d.keys),AT),/undercollateralization/);
 reject(()=>append(lowered,d.keys.treasury,'REDEEM',redeem(d.keys),AT),/undercollateralization/);
 const newDeposit=append(lowered,d.keys.treasury,'DEPOSIT',
   deposit(d.box,d.keys,12),AT);
 assert.equal(summary(newDeposit).boxBookCoinCount,100);
 assert.equal(summary(newDeposit).auditedPhysicalShortfall,0);
 assert.equal(summary(newDeposit).status,'LOCAL_ATTESTATIONS_ONLY');
});
test('audit count and loss events need distinct signed physical evidence',()=>{
 const d=createScenario(),e=audit(d.keys,93);
 e.proofs.counter=attest('counter',e.claim,d.keys.maker);
 reject(()=>append(d.stages.redeemed,d.keys.treasury,'AUDIT',e,AT),/authority/);
 const f=loss(d.keys,3);f.proofs.counter=attest('counter',f.claim,d.keys.custodian);
 reject(()=>append(d.stages.redeemed,d.keys.treasury,'LOSS',f,AT),/authority/);
});
test('owner scope disallows shared role key impersonation and duplicate participant keys',()=>{
 const d=demoWorld();
 reject(()=>createWorld({
  stewardPublicKey:d.keys.treasury.publicKey,workWitnessPublicKey:d.keys.work.publicKey,
  boxes:[{...d.box,counterPublicKey:d.keys.custodian.publicKey}],
  holders:[{holderId:'person:maker-001',publicKey:d.keys.maker.publicKey}]
 }),/independent role/);
 reject(()=>createWorld({
  stewardPublicKey:d.keys.treasury.publicKey,workWitnessPublicKey:d.keys.work.publicKey,
  boxes:[d.box],holders:[
   {holderId:'person:maker-001',publicKey:d.keys.maker.publicKey},
   {holderId:'org:station-001',publicKey:d.keys.maker.publicKey}
  ]
 }),/reused/);
});
test('forged release history cannot create more backed units than physical coin count',()=>{
  const d=createScenario();
  const e=release(d.keys,38);
  reject(()=>append(d.stages.intake37,d.keys.treasury,'RELEASE',e,AT),/backing/);
  const invalid=release(d.keys,1000,'release-bad-001');
  reject(()=>append(d.stages.intake37,d.keys.treasury,'RELEASE',invalid,AT),/exhausted/);
});
test('strictly typed participant keys support person, org and node without any implied legal identity',()=>{
 const d=demoWorld();
 assert.deepEqual(d.world.policy.holders.map(x=>x.holderId),
   ['person:maker-001','org:station-001','node:workbench-001']);
 const p=summary(d.world);
 assert.equal(p.positions.length,0);
 assert.equal(p.simulatedEvidenceOnly,true);
});
test('reLATTE artifact is HOLD-only observation, not bearer, settlement or fund grant',()=>{
 const d=createScenario(),spec=relatteStateSpec(d.stages.audited,AT);
 assert.equal(spec.schema,'relatte.opaque-organ-spec/v0');
 assert.equal(spec.artifact_kind,'PENNY_STATE_OBSERVATION_NOT_SPENDABLE_TOKEN');
 assert.equal(spec.requested_effect.permissionGranted,false);
 assert.equal(spec.donor_claims.bankSettledFunds,0);
 assert.equal(spec.donor_claims.interestEarned,0);
 assert.ok(spec.source_history_head.startsWith('sha256:'));
});
test('same signed world produces stable projection/cold replay, not additional minted units',()=>{
 const d=createScenario(),a=summary(d.stages.audited),b=summary(structuredClone(d.stages.audited));
 assert.deepEqual(a,b);
 assert.equal(a.workProducedPending,0);
 assert.equal(a.workFundedReleased,100);
 assert.equal(a.outstandingPennyUnits,93);
 assert.equal(a.retiredByRedemption,7);
});
test('full synthetic scenario includes zero bank settlement and only 100 independently counted pennies',()=>{
 const d=demo();
 assert.equal(d.stages.work.pending,100);
 assert.equal(d.stages.work.active,0);
 assert.equal(d.stages.intake37.bookCoins,37);
 assert.equal(d.stages.release37.active,37);
 assert.equal(d.stages.intake100.bookCoins,100);
 assert.equal(d.stages.release100.active,100);
 assert.equal(d.stages.transferred.positions.find(x=>x.holderId==='org:station-001').quantity,12);
 assert.equal(d.stages.redeemed.active,93);
 assert.equal(d.stages.audited.bookCoins,93);
 assert.equal(d.relatteSpec.requested_effect.permissionGranted,false);
});
