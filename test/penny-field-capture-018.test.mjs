import test from 'node:test';
import assert from 'node:assert/strict';
import {digest,newKeys} from '../src/penny-work-matter-014.mjs';
import {approvedFabricationFixture,SIM_GCODE,SIM_PHOTO,
  syntheticMachineTrace} from '../src/penny-hardware-demo-017.mjs';
import {
  startSession,appendObservation,makeInspectionBundle,signBundleRole,
  validateBundle,verifyReady,publicHandoff
} from '../src/penny-field-capture-018.mjs';
const CREATED='2026-10-08T21:17:00.000Z';
const INSPECTED='2026-10-08T21:17:03.000Z';
const CHALLENGE='JUBILEE-018-'+'a'.repeat(32);
const PLAN_GCODE='box-d-part.gcode';
const notes=Buffer.from('JUBILEE-CHALLENGE '+CHALLENGE+'\nWitness observed hypothetical box shell; measurements in millimeters.\n');
const measurements={
  widthMm:125,heightMm:130,depthMm:95,assembled:true,looksSafeForUse:true
};
async function fixture(){
  const x=approvedFabricationFixture();
  const first=startSession(x.field,x.candidate,SIM_GCODE,PLAN_GCODE,CREATED,CHALLENGE);
  const {trace,requests}=await syntheticMachineTrace();
  const afterFirst=appendObservation(first,trace.during,trace.duringAt);
  const afterSecond=appendObservation(afterFirst,trace.after,trace.afterAt);
  const bundle=makeInspectionBundle(x.field,x.candidate,afterSecond,{
    gcodeBytes:SIM_GCODE,photoBytes:SIM_PHOTO,notesBytes:notes,
    dimensions:measurements,inspectedAt:INSPECTED
  });
  return {...x,session:afterSecond,first,afterFirst,bundle,requests};
}
async function fullySigned(){
  const f=await fixture();
  for(const [role,key] of [
    ['fabricator',f.owners.fabricator],
    ['witness',f.owners.witness],
    ['new_box_owner',f.owners.newBox]
  ])f.bundle=signBundleRole(f.field,f.candidate,f.session,f.bundle,role,key);
  return f;
}
const reject=(fn,r=/BOX_018_HOLD|BOX_017_HOLD|BOX_016_HOLD|PENNY_014_HOLD/)=>
  assert.throws(fn,r);
test('trial challenge is bound to approved field and same G-code hash',async()=>{
  const f=await fixture();
  assert.equal(f.session.schema,'jubilee.penny-physical-field-trial/v0.1');
  assert.equal(f.session.challenge,CHALLENGE);
  assert.equal(f.session.fieldDigest,digest(f.field));
  assert.equal(f.session.gcode.fileName,PLAN_GCODE);
  assert.equal(f.session.observations.length,2);
  assert.equal(f.session.movementCommandsAuthorized,false);
  assert.equal(f.session.actualPrintVerified,false);
});
test('fresh per-session challenge changes identity without changing source balances',async()=>{
 const f=approvedFabricationFixture();
 const a=startSession(f.field,f.candidate,SIM_GCODE,PLAN_GCODE,CREATED);
 const b=startSession(f.field,f.candidate,SIM_GCODE,PLAN_GCODE,CREATED);
 assert.notEqual(a.challenge,b.challenge);
 assert.notEqual(a.sessionId,b.sessionId);
 assert.equal(a.sourcePennyHead,b.sourcePennyHead);
});
test('only read-only exact-plan printing phase can enter first observation',async()=>{
 const f=approvedFabricationFixture(),start=startSession(
  f.field,f.candidate,SIM_GCODE,PLAN_GCODE,CREATED,CHALLENGE);
 const {trace}=await syntheticMachineTrace();
 reject(()=>appendObservation(start,trace.after,trace.afterAt),/wrong print sequence/);
 const altered=structuredClone(trace.during);
 altered.job.fileName='not-box-d.gcode';
 reject(()=>appendObservation(start,altered,trace.duringAt),/exact approved G-code/);
 assert.equal(start.observations.length,0);
});
test('two exact ordered machine reports are required for inspection',async()=>{
 const f=await fixture();
 assert.equal(f.afterFirst.state,'AWAITING_MACHINE_OBSERVATIONS');
 reject(()=>makeInspectionBundle(f.field,f.candidate,f.afterFirst,{
  gcodeBytes:SIM_GCODE,photoBytes:SIM_PHOTO,notesBytes:notes,
  dimensions:measurements,inspectedAt:INSPECTED
 }),/sequence incomplete/);
});
test('zero additional observed reports can replace a sealed machine trace',async()=>{
 const f=await fixture();
 reject(()=>appendObservation(f.session,f.session.observations[1].snapshot,
    '2026-10-08T21:17:04.000Z'),/capture sealed/);
});
test('machine timeline before fresh challenge is rejected',async()=>{
 const f=approvedFabricationFixture(),s=startSession(
   f.field,f.candidate,SIM_GCODE,PLAN_GCODE,'2026-10-08T21:17:04.000Z',CHALLENGE);
 const {trace}=await syntheticMachineTrace();
 reject(()=>appendObservation(s,trace.during,trace.duringAt),
   /earlier than challenge/);
});
test('changed G-code file after session creation cannot be asserted as print source',async()=>{
 const f=await fixture();
 const other=Buffer.from(SIM_GCODE.toString().replace('X20 Y20','X30 Y20'));
 reject(()=>makeInspectionBundle(f.field,f.candidate,f.session,{
   gcodeBytes:other,photoBytes:SIM_PHOTO,notesBytes:notes,
   dimensions:measurements,inspectedAt:INSPECTED
 }),/G-code modified/);
});
test('missing challenge marker in inspector notes freezes claimed fabrication',async()=>{
 const f=await fixture();
 reject(()=>makeInspectionBundle(f.field,f.candidate,f.session,{
  gcodeBytes:SIM_GCODE,photoBytes:SIM_PHOTO,
  notesBytes:Buffer.from('The operator recorded a plausible inspection. No challenge marker appears in this file.'),
  dimensions:measurements,inspectedAt:INSPECTED
 }),/exact fresh session challenge/);
});
test('human inspection must come after machine report and contain real measurements',async()=>{
 const f=await fixture();
 reject(()=>makeInspectionBundle(f.field,f.candidate,f.session,{
  gcodeBytes:SIM_GCODE,photoBytes:SIM_PHOTO,notesBytes:notes,
  dimensions:measurements,inspectedAt:'2026-10-08T21:17:02.000Z'
 }),/post-print human measurements/);
 const wrong={...measurements,widthMm:-1};
 reject(()=>makeInspectionBundle(f.field,f.candidate,f.session,{
  gcodeBytes:SIM_GCODE,photoBytes:SIM_PHOTO,notesBytes:notes,
  dimensions:wrong,inspectedAt:INSPECTED
 }),/physical inspection/);
});
test('two local witness roles are not enough to treat the trial as review-ready',async()=>{
 const f=await fixture();
 const withOne=signBundleRole(f.field,f.candidate,f.session,f.bundle,
  'fabricator',f.owners.fabricator);
 const r=verifyReady(f.field,f.candidate,f.session,withOne);
 assert.equal(r.status,'HOLD_INDEPENDENT_SIGNATURES_REQUIRED');
 assert.deepEqual(r.missingRoles,['witness','new_box_owner']);
 assert.equal(r.mayCommission,false);
 assert.equal(r.mayMintPenny,false);
});
test('cannot have fabricator sign in inspector capacity',async()=>{
 const f=await fixture();
 reject(()=>signBundleRole(f.field,f.candidate,f.session,f.bundle,
   'witness',f.owners.fabricator),/private key does not match/);
});
test('same role cannot be signed over twice or silently overwritten',async()=>{
 const f=await fixture();
 const one=signBundleRole(f.field,f.candidate,f.session,f.bundle,
   'fabricator',f.owners.fabricator);
 reject(()=>signBundleRole(f.field,f.candidate,f.session,one,
   'fabricator',f.owners.fabricator),/cannot be overwritten/);
});
test('any changed machine state invalidates originally witnessed evidence',async()=>{
 const f=await fullySigned(),bad=structuredClone(f.bundle);
 bad.evidence.trace.after.job.state='Printing';
 reject(()=>verifyReady(f.field,f.candidate,f.session,bad,{
  gcodeBytes:SIM_GCODE,photoBytes:SIM_PHOTO,notesBytes:notes
 }),/rewritten after observations/);
});
test('original machine/photo/notes file bytes required again at final review',async()=>{
 const f=await fullySigned();
 const changed=Buffer.from(notes.toString().replace('hypothetical','fictional'));
 reject(()=>verifyReady(f.field,f.candidate,f.session,f.bundle,{
  gcodeBytes:SIM_GCODE,photoBytes:SIM_PHOTO,notesBytes:changed
 }),/missing or modified/);
 reject(()=>verifyReady(f.field,f.candidate,f.session,f.bundle,{
  gcodeBytes:SIM_GCODE,photoBytes:Buffer.concat([SIM_PHOTO,Buffer.from('other')]),
  notesBytes:notes
 }),/missing or modified/);
});
test('valid evidence with three pinned independent signatures is eligible for human review only',async()=>{
 const f=await fullySigned();
 const r=verifyReady(f.field,f.candidate,f.session,f.bundle,{
  gcodeBytes:SIM_GCODE,photoBytes:SIM_PHOTO,notesBytes:notes
 });
 assert.equal(r.status,'EVIDENCE_READY_FOR_MANUAL_OWNER_REVIEW_NO_AUTOMATIC_APPLY');
 assert.equal(r.mayCommission,false);
 assert.equal(r.mayMintPenny,false);
 assert.equal(r.mayActivateBox,false);
 assert.equal(r.physicalBoxIndependentlyVerifiedBySoftware,false);
});
test('public handoff contains no signer private keys or local media paths',async()=>{
 const f=await fullySigned(),payload=publicHandoff(f.session,f.bundle);
 const serialized=JSON.stringify(payload);
 assert.equal(payload.result,'MANUAL_REVIEW_ONLY');
 assert.equal(payload.commissioningAuthorized,false);
 assert.equal(payload.pennyTokensIssued,0);
 assert.equal(payload.boxActivated,false);
 assert.doesNotMatch(serialized,/BEGIN PRIVATE KEY|OCTOPRINT_API_KEY|\/mnt\/|apiKey/);
});
test('malicious packet cannot alter source head, plan, challenge or signers',async()=>{
 const f=await fullySigned(),tampered=structuredClone(f.bundle);
 tampered.fieldDigest='f'.repeat(64);
 reject(()=>validateBundle(f.field,f.candidate,f.session,tampered),/source bound/);
 const forged=structuredClone(f.bundle);forged.proofs.witness.signature='broken';
 reject(()=>verifyReady(f.field,f.candidate,f.session,forged,{
  gcodeBytes:SIM_GCODE,photoBytes:SIM_PHOTO,notesBytes:notes
 }),/signature/);
});
test('rewritten source ledger and forged prior human approval fail closed',async()=>{
 const f=await fullySigned();
 const changed=structuredClone(f.field);
 changed.boxes['box-b'].events[0].signature='fake';
 reject(()=>verifyReady(changed,f.candidate,f.session,f.bundle,{
  gcodeBytes:SIM_GCODE,photoBytes:SIM_PHOTO,notesBytes:notes
 }),/BOX_016_HOLD/);
});
test('printer capture has no authority to issue PENNY or modify any source asset',async()=>{
 const f=await fullySigned();
 assert.equal(f.session.observations[0].snapshot.controlsExecuted,false);
 assert.equal(f.session.observations[1].snapshot.controlsExecuted,false);
 assert.equal(f.field.pennyWorld.events.filter(e=>e.type==='RELEASE').length,2);
 const r=verifyReady(f.field,f.candidate,f.session,f.bundle,{
  gcodeBytes:SIM_GCODE,photoBytes:SIM_PHOTO,notesBytes:notes
 });
 assert.equal(r.mayMintPenny,false);
 assert.equal(r.mayCommission,false);
});
