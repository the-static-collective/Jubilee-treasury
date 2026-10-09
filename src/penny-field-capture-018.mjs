import {randomBytes,createHash,createPublicKey} from 'node:crypto';
import {canonical,digest} from './penny-work-matter-014.mjs';
import {inspectField} from './penny-box-composer-016.mjs';
import {
  fingerprintGcode,fingerprintPhoto,inspectMachineTrace,
  createEvidence,signEvidence,validateEvidence
} from './penny-hardware-witness-017.mjs';

export const SESSION_SCHEMA='jubilee.penny-physical-field-trial/v0.1';
const HASH=/^[a-f0-9]{64}$/;
const ROLE_KEY={fabricator:'fabricatorPublicKey',witness:'witnessPublicKey',
  new_box_owner:'newBoxOwnerPublicKey'};
const fail=s=>{throw Error('BOX_018_HOLD: '+s)};
const need=(x,s)=>{if(!x)fail(s)};
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).sort().join('|')===keys.slice().sort().join('|');
const iso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const bytesHash=v=>createHash('sha256').update(v).digest('hex');
const CHALLENGE=/^JUBILEE-018-[a-f0-9]{32}$/;

export function startSession(field,candidate,gcodeBytes,gcodeFileName,createdAt,
  challenge='JUBILEE-018-'+randomBytes(16).toString('hex')){
  const source=inspectField(field);
  const gcode=fingerprintGcode(gcodeBytes,gcodeFileName);
  need(iso(createdAt)&&CHALLENGE.test(challenge),'bounded witnessed challenge and timestamp required');
  need(candidate?.schema==='jubilee.penny-composition-proposal/v0.1'&&
    candidate.role==='PROPOSAL_NOT_AUTHORITY'&&
    candidate.missing?.length===0&&
    candidate.pennyBackingMode==='READ_ONLY_SOURCE_REFERENCE_NO_COIN_CONSUMPTION'&&
    candidate.resourceEffects?.pennyBackingConsumed===0,
    'approved safe fourth-box candidate required');
  need(source.sourceHeads['penny-014']===candidate.sourceHeads['penny-014']&&
    source.pennyAuditShortfall===0,'stale or impaired PENNY backing source');
  for(const id of ['box-a','box-b','box-c']){
    need(source.boxes[id].approvals.some(p=>p.planId===candidate.planId&&
      p.proposalHash===candidate.proposalHash),
      'all independent resource owners must SELECT first');
    need(source.boxes[id].applied.length===0,'trial must start before construction APPLY');
  }
  return {
    schema:SESSION_SCHEMA,sessionId:'trial-'+digest({
      challenge,planId:candidate.planId,proposalHash:candidate.proposalHash,
      fieldDigest:digest(field),createdAt
    }).slice(0,32),
    challenge,createdAt,planId:candidate.planId,
    proposalHash:candidate.proposalHash,fieldDigest:digest(field),
    sourcePennyHead:source.sourceHeads['penny-014'],
    gcode,observations:[],
    state:'AWAITING_MACHINE_OBSERVATIONS',
    machineAuthority:'READ_ONLY_UNTRUSTED_TELEMETRY',
    movementCommandsAuthorized:false,actualPrintVerified:false
  };
}
function verifySession(session){
  need(exact(session,['schema','sessionId','challenge','createdAt','planId',
    'proposalHash','fieldDigest','sourcePennyHead','gcode','observations',
    'state','machineAuthority','movementCommandsAuthorized','actualPrintVerified'])&&
    session.schema===SESSION_SCHEMA&&CHALLENGE.test(session.challenge)&&
    iso(session.createdAt)&&session.machineAuthority==='READ_ONLY_UNTRUSTED_TELEMETRY'&&
    session.movementCommandsAuthorized===false&&session.actualPrintVerified===false&&
    HASH.test(session.fieldDigest)&&HASH.test(session.proposalHash)&&
    HASH.test(session.sourcePennyHead),'invalid field capture session');
  need(Array.isArray(session.observations)&&session.observations.length<=2&&
    exact(session.gcode,['fileName','byteLength','sha256','mediaType','safeToAutomaticallyExecute'])&&
    session.gcode.safeToAutomaticallyExecute===false,
    'unsupported capture scope');
  need(session.sessionId==='trial-'+digest({
    challenge:session.challenge,planId:session.planId,
    proposalHash:session.proposalHash,fieldDigest:session.fieldDigest,
    createdAt:session.createdAt}).slice(0,32),'session identity diverged');
  for(const item of session.observations){
    need(exact(item,['capturedAt','snapshot'])&&iso(item.capturedAt)&&
      item.snapshot?.job?.fileName===session.gcode.fileName&&
      item.snapshot?.schema==='jubilee.machine-readonly-snapshot/v0.1'&&
      item.snapshot?.controlsExecuted===false,
      'invalid claimed machine snapshot');
  }
  if(session.observations.length===2)inspectMachineTrace({
    during:session.observations[0].snapshot,
    after:session.observations[1].snapshot,
    duringAt:session.observations[0].capturedAt,
    afterAt:session.observations[1].capturedAt
  },session.gcode);
  need(session.state===(session.observations.length===2?'READY_FOR_PHYSICAL_INSPECTION':
      'AWAITING_MACHINE_OBSERVATIONS'),
    'invalid capture progression');
}
export function appendObservation(session,snapshot,capturedAt){
  verifySession(session);
  need(iso(capturedAt)&&capturedAt>=session.createdAt,
    'observation earlier than challenge');
  need(session.observations.length<2,'capture sealed; extra or replayed status refused');
  need(snapshot?.schema==='jubilee.machine-readonly-snapshot/v0.1'&&
    snapshot.adapter==='octoprint-status-v1'&&snapshot.controlsExecuted===false&&
    snapshot.job?.fileName===session.gcode.fileName,
    'read-only status must report exact approved G-code');
  const expected=session.observations.length===0?'Printing':'Operational';
  need(snapshot.job?.state===expected,'wrong print sequence phase: expected '+expected);
  const out=structuredClone(session);
  out.observations.push({capturedAt,snapshot:structuredClone(snapshot)});
  out.state=out.observations.length===2?'READY_FOR_PHYSICAL_INSPECTION':
    'AWAITING_MACHINE_OBSERVATIONS';
  verifySession(out);
  return out;
}
export function makeInspectionBundle(field,candidate,session,{gcodeBytes,
  photoBytes,notesBytes,dimensions,inspectedAt}){
  verifySession(session);
  need(session.observations.length===2&&
    session.state==='READY_FOR_PHYSICAL_INSPECTION',
    'print observation sequence incomplete');
  need(digest(field)===session.fieldDigest&&
    candidate.planId===session.planId&&
    candidate.proposalHash===session.proposalHash,
    'stale or incompatible selected owner source');
  const gcode=fingerprintGcode(gcodeBytes,session.gcode.fileName);
  need(canonical(gcode)===canonical(session.gcode),
    'on-disk G-code modified after session creation');
  const photo=fingerprintPhoto(photoBytes);
  const notes=Buffer.isBuffer(notesBytes)?notesBytes:Buffer.from(notesBytes??'');
  need(notes.length>=48&&notes.length<=65536,'bounded independent inspection notes required');
  const text=notes.toString('utf8');
  need(!text.includes('\uFFFD')&&
    text.includes('JUBILEE-CHALLENGE '+session.challenge),
    'human inspection notes must copy exact fresh session challenge');
  need(exact(dimensions,['widthMm','heightMm','depthMm','assembled','looksSafeForUse'])&&
    iso(inspectedAt)&&inspectedAt>session.observations[1].capturedAt,
    'post-print human measurements and explicit assertions required');
  const inspection={
    newBoxId:candidate.newBoxId,inspectedAt,
    ...structuredClone(dimensions),
    inspectionNotesHash:bytesHash(notes)
  };
  const trace={
    during:structuredClone(session.observations[0].snapshot),
    after:structuredClone(session.observations[1].snapshot),
    duringAt:session.observations[0].capturedAt,
    afterAt:session.observations[1].capturedAt
  };
  const evidence=createEvidence(field,candidate,{
    gcodeBytes,gcodeFileName:session.gcode.fileName,photoBytes,trace,inspection
  });
  need(evidence.gcode.sha256===gcode.sha256&&
    evidence.photo.sha256===photo.sha256,
    'file bytes disagree after capture');
  return {
    schema:'jubilee.penny-physical-inspection-bundle/v0.1',
    sessionId:session.sessionId,challenge:session.challenge,
    fieldDigest:session.fieldDigest,evidence,proofs:{},
    note:'OBSERVATION_AND_HUMAN_ASSERTION_ONLY_NOT_VERIFIED_HARDWARE_OR_COMMISSIONING'
  };
}
export function validateBundle(field,candidate,session,bundle){
  verifySession(session);
  need(exact(bundle,['schema','sessionId','challenge','fieldDigest',
    'evidence','proofs','note'])&&
    bundle.schema==='jubilee.penny-physical-inspection-bundle/v0.1'&&
    bundle.sessionId===session.sessionId&&bundle.challenge===session.challenge&&
    bundle.fieldDigest===digest(field)&&bundle.fieldDigest===session.fieldDigest&&
    bundle.note==='OBSERVATION_AND_HUMAN_ASSERTION_ONLY_NOT_VERIFIED_HARDWARE_OR_COMMISSIONING',
    'inspection packet not source bound');
  need(exact(bundle.proofs,Object.keys(bundle.proofs))&&
    Object.keys(bundle.proofs).every(k=>Object.hasOwn(ROLE_KEY,k)),
    'unrecognized participant role');
  const x=bundle.evidence;
  need(x?.planId===session.planId&&x?.proposalHash===session.proposalHash&&
    x?.gcode?.sha256===session.gcode.sha256,
    'evidence not from the selected machine session');
  need(x?.trace?.duringAt===session.observations[0]?.capturedAt&&
    x?.trace?.afterAt===session.observations[1]?.capturedAt&&
    canonical(x.trace.during)===canonical(session.observations[0].snapshot)&&
    canonical(x.trace.after)===canonical(session.observations[1].snapshot),
    'fabrication packet rewritten after observations');
}
export function signBundleRole(field,candidate,session,bundle,role,keys){
  validateBundle(field,candidate,session,bundle);
  need(Object.hasOwn(ROLE_KEY,role),'unsupported physical witness role');
  need(!Object.hasOwn(bundle.proofs,role),'existing witness decision cannot be overwritten');
  const pinned=field.boxes['box-a'].roles[ROLE_KEY[role]];
  need(keys?.publicKey===pinned&&
    createPublicKey(keys.privateKey).export({type:'spki',format:'pem'})===pinned,
    'private key does not match independently pinned role');
  const proof=signEvidence(bundle.evidence,role,keys);
  const next=structuredClone(bundle);
  next.proofs[role]=proof;
  validateBundle(field,candidate,session,next);
  return next;
}
export function verifyReady(field,candidate,session,bundle,{gcodeBytes,photoBytes,
  notesBytes}={}){
  validateBundle(field,candidate,session,bundle);
  const pending=Object.keys(ROLE_KEY).filter(role=>!Object.hasOwn(bundle.proofs,role));
  if(pending.length)return {status:'HOLD_INDEPENDENT_SIGNATURES_REQUIRED',
    missingRoles:pending,mayCommission:false,mayMintPenny:false};
  need(gcodeBytes&&photoBytes&&notesBytes,
    'file bytes must be re-read and retained for independent verification');
  const noteBytes=Buffer.isBuffer(notesBytes)?notesBytes:Buffer.from(notesBytes);
  need(fingerprintGcode(gcodeBytes,session.gcode.fileName).sha256===
    bundle.evidence.gcode.sha256&&
    fingerprintPhoto(photoBytes).sha256===bundle.evidence.photo.sha256&&
    bytesHash(noteBytes)===bundle.evidence.inspection.inspectionNotesHash&&
    noteBytes.toString('utf8').includes('JUBILEE-CHALLENGE '+session.challenge),
    'the originally witnessed G-code/image/notes bytes are missing or modified');
  const status=validateEvidence(field,candidate,bundle.evidence,bundle.proofs);
  return {
    status:'EVIDENCE_READY_FOR_MANUAL_OWNER_REVIEW_NO_AUTOMATIC_APPLY',
    evidenceHash:status.evidenceHash,sessionId:session.sessionId,
    signedRoles:Object.keys(ROLE_KEY),
    mayCommission:false,mayMintPenny:false,mayActivateBox:false,
    physicalBoxIndependentlyVerifiedBySoftware:false,
    noPrinterControl:true
  };
}
export function publicHandoff(session,bundle){
  verifySession(session);
  need(bundle?.sessionId===session.sessionId&&
    Object.keys(bundle.proofs??{}).length===3,'only complete signed packet can be exported');
  return {
    schema:'jubilee.penny-field-trial-handoff/v0.1',
    challenge:session.challenge,sessionId:session.sessionId,
    planId:session.planId,sourceFieldDigest:session.fieldDigest,
    gcodeHash:session.gcode.sha256,
    evidence:structuredClone(bundle.evidence),
    roleProofs:structuredClone(bundle.proofs),
    result:'MANUAL_REVIEW_ONLY',
    commissioningAuthorized:false,pennyTokensIssued:0,boxActivated:false,
    note:'Private source history, retained source files, human identity, and independent key pinning must be checked separately. This is not a claim of certified fabrication.'
  };
}
