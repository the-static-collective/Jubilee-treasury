import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {digest,newKeys} from '../src/penny-work-matter-014.mjs';
import {
  observeOctoPrint,limitLocalOctoPrintUrl,fingerprintGcode,fingerprintPhoto,
  inspectMachineTrace,createEvidence,signEvidence,validateEvidence,
  applyHardwareEvidence,reportHold
} from '../src/penny-hardware-witness-017.mjs';
import {
  SIM_GCODE,SIM_PHOTO,APPLY_AT,approvedFabricationFixture,
  mockReadOnlyDevice,syntheticMachineTrace,createHardwareFixture,demo
} from '../src/penny-hardware-demo-017.mjs';
import {AT} from '../src/penny-box-demo-016.mjs';
import {inspectFourthBox} from '../src/penny-box-composer-016.mjs';

const deny=(fn,re=/BOX_017_HOLD/)=>assert.throws(fn,re);
const copy=x=>structuredClone(x);
const withPhoto=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(32)]);
test('approved source candidate is held pending real measured evidence, not automatically built',()=>{
 const x=approvedFabricationFixture();
 const s=reportHold(x.field,x.candidate,{});
 assert.equal(s.status,'HOLD_MISSING_PHYSICAL_EVIDENCE');
 assert.equal(s.automaticFabrication,false);
 assert.equal(s.automaticTokenIssuance,false);
 assert.equal(inspectFourthBox(x.field,x.candidate).status,'HOLD_AWAITING_INDEPENDENT_APPLY');
});
test('G-code digest is computed over actual local bytes; unsafe command refuses',()=>{
 const x=fingerprintGcode(SIM_GCODE,'box-d-part.gcode');
 assert.equal(x.sha256,createHash('sha256').update(SIM_GCODE).digest('hex'));
 assert.equal(x.safeToAutomaticallyExecute,false);
 deny(()=>fingerprintGcode('M112\nG1 X0 Y0','box-d-part.gcode'));
 deny(()=>fingerprintGcode('G1 X1','../../secrets.gcode'));
 deny(()=>fingerprintGcode(Buffer.alloc(9),'tiny.gcode'));
});
test('photo digest binds input bytes and makes no unsupported recognition claim',()=>{
 const p=fingerprintPhoto(SIM_PHOTO);
 assert.equal(p.depictsCompletedBox,false);
 assert.equal(p.sha256,createHash('sha256').update(SIM_PHOTO).digest('hex'));
 deny(()=>fingerprintPhoto(Buffer.from('not-an-image')));
 assert.notEqual(fingerprintPhoto(withPhoto).sha256,p.sha256);
});
test('OctoPrint read-only adapter makes ONLY two GET calls and no machine commands',async()=>{
 const fake=mockReadOnlyDevice();
 const s=await observeOctoPrint({baseUrl:'http://127.0.0.1:5000',
   apiKey:'synthetic-test-secret',fetchImpl:fake.fetchImpl});
 assert.deepEqual(fake.requests.map(x=>x.method),['GET','GET']);
 assert.deepEqual(fake.requests.map(x=>x.redirect),['error','error']);
 assert.ok(fake.requests.every(x=>x.headerNames.includes('X-Api-Key')));
 assert.equal(s.controlsExecuted,false);
 assert.equal(s.verifiedHardwareIdentity,false);
 assert.equal(s.job.state,'Printing');
 assert.equal(s.connection.profileId,'local-demo-profile');
});
test('private OctoPrint local IP only; public hosts, URL credentials, query and path refused',()=>{
 assert.equal(limitLocalOctoPrintUrl('http://127.0.0.1:5000'),'http://127.0.0.1:5000');
 assert.equal(limitLocalOctoPrintUrl('http://192.168.1.8:5000'),'http://192.168.1.8:5000');
 for(const host of [
  'https://127.0.0.1:5000','http://evil.example:5000',
  'http://8.8.8.8:5000','http://169.254.0.1:5000',
  'http://user:pass@127.0.0.1:5000',
  'http://127.0.0.1:5000/api/job',
  'http://127.0.0.1:5000/?some=param'
 ])deny(()=>limitLocalOctoPrintUrl(host));
});
test('wrong API key / unreachable local OctoPrint status is HOLD',async()=>{
 const mocked=async()=>({ok:false,json:async()=>({})});
 await assert.rejects(()=>observeOctoPrint({
  baseUrl:'http://127.0.0.1:5000',apiKey:'test-secret',fetchImpl:mocked}),/not available/);
});
test('machine must report this exact G-code filename at printing and operational completion',async()=>{
 const {trace}=await syntheticMachineTrace();
 const summary=inspectMachineTrace(trace,{fileName:'box-d-part.gcode'});
 assert.equal(summary.reportedJobCompletion,true);
 assert.equal(summary.proofOfObjectExistence,false);
 const wrongFile=copy(trace);
 wrongFile.after.job.fileName='another-part.gcode';
 deny(()=>inspectMachineTrace(wrongFile,{fileName:'box-d-part.gcode'}),/exact file/);
});
test('status Operational alone or reported percent 99 without Printing first is not completed',async()=>{
 const {trace}=await syntheticMachineTrace();
 const bad=copy(trace);bad.during.job.state='Operational';
 deny(()=>inspectMachineTrace(bad,{fileName:'box-d-part.gcode'}),/printing-to-operational/);
 const percent=copy(trace);percent.after.job.completion=98;
 deny(()=>inspectMachineTrace(percent,{fileName:'box-d-part.gcode'}),/reported completion/);
});
test('backdated/reordered machine reports do not support physical witnessed admission',async()=>{
 const {trace}=await syntheticMachineTrace();
 const old=copy(trace);old.afterAt=old.duringAt;
 deny(()=>inspectMachineTrace(old,{fileName:'box-d-part.gcode'}),/ordered/);
});
test('source owners must have approved and no node applied before hardware proof',async()=>{
 const x=await createHardwareFixture();
 const corrupt=copy(x.field);corrupt.boxes['box-b'].events[2].signature='wrong';
 deny(()=>validateEvidence(corrupt,x.candidate,x.evidence,x.proofs),/BOX_016_HOLD/);
});
test('local evidence ties unique source, actual G-code bytes, photo bytes and measurements',async()=>{
 const x=await createHardwareFixture();
 const e=x.evidence;
 assert.equal(e.schema,'jubilee.box-hardware-evidence/v0.1');
 assert.equal(e.gcode.sha256,fingerprintGcode(SIM_GCODE,'box-d-part.gcode').sha256);
 assert.equal(e.photo.sha256,fingerprintPhoto(SIM_PHOTO).sha256);
 assert.equal(e.inspection.widthMm,125);
 assert.equal(e.evidenceHash,digest(Object.fromEntries(Object.entries(e).filter(([k])=>k!=='evidenceHash'))));
 assert.equal(e.pennyBackingConsumed,0);
});
test('without independent post-print inspection, machine report and photo cannot create completed box',async()=>{
 const x=await createHardwareFixture();
 const bad=copy(x.evidence);
 bad.inspection.assembled=false;
 deny(()=>validateEvidence(x.field,x.candidate,bad,x.proofs),/tampered evidence/);
 const parts=reportHold(x.field,x.candidate,{gcode:true,twoMachineSnapshots:true,photo:true,
   inspection:false,witnesses:false});
 assert.ok(parts.missing.some(s=>s.includes('physical measurements')));
});
test('three separate witness keys attest exactly one manifest digest',async()=>{
 const x=await createHardwareFixture();
 const r=validateEvidence(x.field,x.candidate,x.evidence,x.proofs);
 assert.equal(r.evidenceHash,x.evidence.evidenceHash);
 assert.equal(r.actualPhysicalBuildIndependentlyProvenBySoftware,false);
 for(const role of ['fabricator','witness','new_box_owner']){
  const wrong=copy(x.proofs);
  wrong[role].signature='INVALID';
  deny(()=>validateEvidence(x.field,x.candidate,x.evidence,wrong),/signature failed/);
 }
});
test('forged inspector role from machine operator is not independent',async()=>{
 const x=await createHardwareFixture();
 const wrong=copy(x.proofs);
 wrong.witness=signEvidence(x.evidence,'witness',x.owners.fabricator);
 deny(()=>validateEvidence(x.field,x.candidate,x.evidence,wrong),/signature failed/);
});
test('even correctly signed stale evidence cannot cross into different chosen fourth-box source',async()=>{
 const x=await createHardwareFixture();
 const bogus=copy(x.candidate);
 bogus.proposalHash='0'.repeat(64);
 deny(()=>validateEvidence(x.field,bogus,x.evidence,x.proofs),/independent approval/);
});
test('fabrication evidence cannot be replayed as another plan, another image or later inspection',async()=>{
 const x=await createHardwareFixture(),bad=copy(x.evidence);
 bad.photo.sha256='2'.repeat(64);
 bad.evidenceHash=digest(Object.fromEntries(Object.entries(bad).filter(([k])=>k!=='evidenceHash')));
 deny(()=>validateEvidence(x.field,x.candidate,bad,x.proofs),/witness signoff did not bind/);
 const other=copy(x.evidence);other.inspection.widthMm=150;
 deny(()=>validateEvidence(x.field,x.candidate,other,x.proofs),/tampered evidence/);
});
test('wrong signer, or missing human role, can never APPLY even when print status says completed',async()=>{
 const x=await createHardwareFixture();
 const wrong=copy(x.proofs);delete wrong.witness;
 deny(()=>applyHardwareEvidence(x.field,x.candidate,x.evidence,wrong,x.owners,APPLY_AT),
   /independent witnesses required/);
});
test('chronology: cannot apply at timestamp earlier than machine recording and inspection',async()=>{
 const x=await createHardwareFixture();
 deny(()=>applyHardwareEvidence(x.field,x.candidate,x.evidence,x.proofs,x.owners,AT),
   /cannot precede/);
});
test('genuine byte hashes + signer-verified local claims reach PENNY-016 via all owners',async()=>{
 const x=await createHardwareFixture();
 const finished=applyHardwareEvidence(x.field,x.candidate,x.evidence,x.proofs,x.owners,APPLY_AT);
 assert.equal(finished.result.status,'HUMAN_ATTESTED_WITH_MACHINE_EVIDENCE_NOT_AUTONOMOUSLY_PHYSICALLY_VERIFIED');
 assert.equal(finished.result.boxDMayAcceptCustody,false);
 assert.equal(finished.result.pennyConsumed,0);
 assert.equal(finished.result.pennyIssued,0);
 assert.equal(finished.result.actualHardwareVerifiedBySoftware,false);
 const box=inspectFourthBox(finished.field,x.candidate);
 assert.equal(box.totalSignedApplications,3);
 assert.equal(box.pennyBookCoins,100);
 assert.equal(box.pennyOutstanding,100);
 assert.equal(box.materialsConsumedOnlyIfFullyWitnessed,1);
 assert.equal(box.laborMinutesCompletedOnlyIfFullyWitnessed,45);
});
test('identical inspection with two damaged source branches fails closed',async()=>{
 const x=await createHardwareFixture();
 const bad=copy(x.field);
 bad.pennyWorld.events[0].signature='tampered';
 deny(()=>applyHardwareEvidence(bad,x.candidate,x.evidence,x.proofs,x.owners,APPLY_AT),
   /PENNY_014_HOLD/);
});
test('fabrication observer never issues POST/DELETE and cannot activate PENNY collateral',async()=>{
 const x=await createHardwareFixture();
 assert.deepEqual(x.requests.map(r=>r.method),['GET','GET','GET','GET']);
 const s=await demo();
 assert.equal(s.underlyingPennyCoins,100);
 assert.equal(s.outstandingPennyClaims,100);
 assert.equal(s.outcome.pennyIssued,0);
 assert.equal(s.outcome.pennyConsumed,0);
});
