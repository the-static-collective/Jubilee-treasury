import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  keysForSource,policyFor,newInbox,signSignal,ingest,importBatch,project,
  contentHash,relatteObservationSpec,canonical
} from '../src/ambient-trickle-009.mjs';
import {main} from '../src/ambient-trickle-cli-009.mjs';

const keys=keysForSource(),other=keysForSource();
const source='station-approved-adapter-001';
const policy=()=>policyFor(source,keys.publicKey,['money','goods','service','broadcast_rights'],['radio-work-001','neighbors-001']);
const payload=(patch={})=>({
  eventId:'event-wood-001',assetId:'asset-wood-001',revision:1,previousHash:null,
  kind:'goods',status:'offer_reported',quantity:2,unit:'cord',purposeId:'neighbors-001',
  evidenceHash:'a'.repeat(64),observedAt:'2026-10-08T19:00:00.000Z',...patch
});
const signed=(p=payload(),actor=keys)=>signSignal(source,p,actor);
const next=(old,patch={})=>signed(payload({
  ...old.payload,eventId:'event-wood-002',revision:old.payload.revision+1,
  previousHash:contentHash(old),...patch
}));
test('same logical JSON has stable content identity',()=>{
  assert.equal(canonical({z:[1,2],a:{b:3}}),canonical({a:{b:3},z:[1,2]}));
});
test('new inbox has no station connection, publication or automatic power',()=>{
  const b=newInbox(policy()), p=project(b);
  assert.equal(p.status,'PRIVATE_OBSERVED_HOLD');
  assert.equal(p.fundsTransferred,false);
  assert.equal(p.assetsAdmitted,false);
  assert.equal(p.publicExposure,false);
  assert.equal(p.signalCount,0);
});
test('valid signed report becomes only a private observation',()=>{
  const b=ingest(newInbox(policy()),signed());
  assert.equal(project(b).currentSourceReports.length,1);
  assert.equal(project(b).noncashOffers[0].kind,'goods');
  assert.equal(project(b).claimedMoneyReports.length,0);
});
test('identical signed event replay is idempotent',()=>{
  const a=signed(),b=ingest(newInbox(policy()),a);
  assert.deepEqual(ingest(b,a),b);
  assert.equal(project(ingest(b,a)).signalCount,1);
});
test('source cannot equivocate under the same event identity',()=>{
  const a=signed(),b=ingest(newInbox(policy()),a);
  assert.throws(()=>ingest(b,signed(payload({quantity:3}))),/contradictory content/);
});
test('forged source private key and altered bytes are refused',()=>{
  const a=signed(payload(),other);
  assert.throws(()=>ingest(newInbox(policy()),a),/forged source signature/);
  const b=signed(),altered=structuredClone(b);altered.payload.quantity=100;
  assert.throws(()=>ingest(newInbox(policy()),altered),/forged source signature/);
});
test('no source may enter outside explicit policy or purpose',()=>{
  assert.throws(()=>ingest(newInbox(policy()),signSignal('unapproved-source-001',payload(),keys)),/not authorized/);
  assert.throws(()=>ingest(newInbox(policy()),signed(payload({purposeId:'some-other-cause'}))),/scope mismatch/);
  assert.throws(()=>ingest(newInbox(policy()),signed(payload({kind:'medical_record'}))),/scope mismatch/);
});
test('unknown free text and donor identity fields are structurally excluded',()=>{
  assert.throws(()=>signSignal(source,payload({donorEmail:'private@example.com'}),keys),/payload fields/);
  assert.throws(()=>signSignal(source,payload({cardNumber:'4111111111111111'}),keys),/payload fields/);
  const a=signed(),changed={...a,listenerPhone:'555-1212'};
  assert.throws(()=>ingest(newInbox(policy()),changed),/signed signal fields/);
});
test('money uses integer minor units and pledge is not settlement',()=>{
  const first=signed(payload({eventId:'event-cash-001',assetId:'asset-money-001',kind:'money',unit:'minor_usd',
    status:'pledge_reported',quantity:12345,purposeId:'radio-work-001'}));
  const p=project(ingest(newInbox(policy()),first));
  assert.equal(p.claimedMoneyReports.length,0);
  assert.equal(p.currentSourceReports[0].quantity,12345);
  assert.equal(p.fundsTransferred,false);
  assert.throws(()=>signSignal(source,{...first.payload,unit:'usd'},keys),/minor-denominated/);
  assert.throws(()=>signSignal(source,{...first.payload,status:'delivery_reported'},keys),/delivery claims/);
});
test('external money settlement report stays a claim, not an account balance',()=>{
  const first=signed(payload({eventId:'event-cash-001',assetId:'asset-money-001',kind:'money',unit:'minor_usd',
    status:'pledge_reported',quantity:5000,purposeId:'radio-work-001'}));
  const second=next(first,{eventId:'event-cash-002',status:'settlement_reported',quantity:5000,
    evidenceHash:'b'.repeat(64)});
  const p=project(importBatch(newInbox(policy()),[first,second]));
  assert.equal(p.claimedMoneyReports.length,1);
  assert.equal(p.claimedMoneyReports[0].quantity,5000);
  assert.equal(p.fundsTransferred,false);
  assert.match(p.warning,/No station accounting/);
});
test('historical revision must bind exact predecessor, not just same asset',()=>{
  const a=signed(),b=next(a);
  assert.equal(project(importBatch(newInbox(policy()),[a,b])).signalCount,2);
  assert.throws(()=>importBatch(newInbox(policy()),[b]),/missing source origin/);
  const fork=signed({...b.payload,eventId:'event-wood-003',previousHash:'f'.repeat(64)});
  assert.throws(()=>importBatch(newInbox(policy()),[a,fork]),/history gap/);
});
test('kind, unit and purpose cannot be silently rewritten on revision',()=>{
  const a=signed();
  for(const change of [{unit:'box'},{kind:'service'},{purposeId:'radio-work-001'}]){
    const attempt=next(a,change);
    assert.throws(()=>importBatch(newInbox(policy()),[a,attempt]),/immutable resource identity/);
  }
});
test('revocation withdraws current projection but preserves historical source fact',()=>{
  const a=signed(),b=next(a,{status:'revoked'});
  const p=project(importBatch(newInbox(policy()),[a,b]));
  assert.equal(p.currentSourceReports.length,0);
  assert.equal(p.revokedReports.length,1);
  assert.equal(p.signalCount,2);
  assert.throws(()=>importBatch(newInbox(policy()),[a,b,next(b,{eventId:'event-wood-003'})]),/cannot reappear/);
});
test('settlement cannot be downgraded into pledge',()=>{
  const a=signed(payload({eventId:'event-cash-001',assetId:'asset-money-001',kind:'money',unit:'minor_usd',
    status:'settlement_reported',quantity:5000,purposeId:'radio-work-001'}));
  const b=next(a,{status:'pledge_reported',eventId:'event-cash-002'});
  assert.throws(()=>importBatch(newInbox(policy()),[a,b]),/cannot go backwards/);
});
test('invalid batch is atomic and cannot corrupt previously held source history',()=>{
  const a=signed(), prior=newInbox(policy()),bad=signed(payload({eventId:'event-bad-001',assetId:'asset-other-001',purposeId:'other'}));
  assert.throws(()=>importBatch(prior,[a,bad]),/scope mismatch/);
  assert.equal(project(prior).signalCount,0);
});
test('projection retains no unrestricted title, donor name or free-text narrative',()=>{
  const a=signed(), p=project(ingest(newInbox(policy()),a));
  assert.deepEqual(Object.keys(p.currentSourceReports[0]).sort(),[
    'address','assetId','evidenceHash','kind','purposeId','quantity','revision','signalHash','sourceId','status','unit'
  ].sort());
});
test('crossing request is an opaque reLATTE candidate to HOLD observation only',()=>{
  const b=ingest(newInbox(policy()),signed());
  const spec=relatteObservationSpec(b,source,'asset-wood-001','2026-10-08T19:20:00.000Z');
  assert.equal(spec.schema,'relatte.opaque-organ-spec/v0');
  assert.equal(spec.artifact_kind,'OBSERVATION_NOT_ASSET');
  assert.equal(spec.requested_effect.kind,'HOLD_OBSERVATION_ONLY');
  assert.equal(spec.requested_effect.permissionGranted,false);
  assert.equal(spec.source_history_head,'sha256:'+project(b).head);
  assert.equal(spec.signing,undefined);
});
test('retracted observations cannot be transmitted as current proposals',()=>{
  const a=signed(),b=next(a,{status:'revoked'});
  assert.throws(()=>relatteObservationSpec(importBatch(newInbox(policy()),[a,b]),source,'asset-wood-001','2026-10-08T19:20:00.000Z'),/nonrevoked/);
});
test('offline drop scanner ingests idempotently without deleting source file',()=>{
  const root=mkdtempSync(join(tmpdir(),'trickle-test-')),drop=join(root,'drop'),dir=join(root,'private');
  mkdirSync(drop);
  const policyFile=join(root,'policy.json');writeFileSync(policyFile,JSON.stringify(policy()));
  main(['init',dir,policyFile]);
  const s=signed();writeFileSync(join(drop,'first.json'),JSON.stringify(s));
  const first=main(['scan',dir,drop]);
  assert.equal(first.accepted,1);assert.equal(first.projection.signalCount,1);
  const second=main(['scan',dir,drop]);
  assert.equal(second.accepted,0);assert.equal(second.replayed,1);
  assert.equal(project(JSON.parse(readFileSync(join(dir,'inbox.json'),'utf8'))).signalCount,1);
  assert.doesNotThrow(()=>JSON.parse(readFileSync(join(drop,'first.json'),'utf8')));
});
test('CLI reports a generated inert hold descriptor after source admission into private inbox',()=>{
  const root=mkdtempSync(join(tmpdir(),'trickle-hold-')),dir=join(root,'private'),drop=join(root,'drop');
  mkdirSync(drop);const policyFile=join(root,'policy.json');writeFileSync(policyFile,JSON.stringify(policy()));
  main(['init',dir,policyFile]);writeFileSync(join(drop,'source.json'),JSON.stringify(signed()));
  main(['scan',dir,drop]);
  const output=join(root,'hold.json');main(['hold',dir,source,'asset-wood-001',output]);
  const spec=JSON.parse(readFileSync(output,'utf8'));
  assert.equal(spec.requested_effect.permissionGranted,false);
});
test('synthetic demo deliberately excludes station affiliation and real money custody',()=>{
  const demo=main(['demo']);
  assert.equal(demo.projection.claimedMoneyReports.length,1);
  assert.equal(demo.projection.noncashOffers.length,1);
  assert.equal(demo.holdSpec.artifact_kind,'OBSERVATION_NOT_ASSET');
  assert.match(demo.note,/Synthetic source adapter/);
});
