#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync,renameSync,openSync,
  closeSync,unlinkSync,existsSync,statSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';
import {createPublicKey} from 'node:crypto';
import {observeOctoPrint} from './penny-hardware-witness-017.mjs';
import {
  startSession,appendObservation,makeInspectionBundle,signBundleRole,
  verifyReady,publicHandoff
} from './penny-field-capture-018.mjs';

const readJson=path=>JSON.parse(readFileSync(path,'utf8'));
const readJSONFile=path=>readJson(resolve(path));
const at=()=>new Date().toISOString();
const sourceFiles=dir=>({
  session:join(dir,'session.json'),field:join(dir,'field.json'),
  candidate:join(dir,'candidate.json'),inputs:join(dir,'private-input-paths.json'),
  bundle:join(dir,'inspection-evidence.json'),lock:join(dir,'.lock')
});
function writeNew(path,value){
  writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
}
function atomicWrite(path,value){
  const temp=path+'.incoming-'+process.pid;
  writeNew(temp,value);
  renameSync(temp,path);
}
function locked(dir,action){
  const lock=sourceFiles(dir).lock;
  const fd=openSync(lock,'wx',0o600);
  try{return action();}
  finally{closeSync(fd);unlinkSync(lock);}
}
function get(dir){
  const p=sourceFiles(dir),session=readJson(p.session);
  const field=readJson(p.field),candidate=readJson(p.candidate);
  return {p,session,field,candidate};
}
function inspectPrivInputs(dir){
  const paths=readJson(sourceFiles(dir).inputs);
  if(!paths||typeof paths!=='object'||
    !['gcodePath','photoPath','notesPath'].every(k=>typeof paths[k]==='string'))
    throw Error('BOX_018_HOLD: independently retained local file paths required');
  return {
    gcodeBytes:readFileSync(paths.gcodePath),
    photoBytes:readFileSync(paths.photoPath),
    notesBytes:readFileSync(paths.notesPath)
  };
}
export async function main(args=process.argv.slice(2)){
  const [cmd,...rest]=args;
  if(cmd==='init'&&rest.length===4){
    const [fieldPath,candidatePath,gcodePath,outDir]=rest,dir=resolve(outDir);
    const field=readJSONFile(fieldPath),candidate=readJSONFile(candidatePath),
      gcode=readFileSync(resolve(gcodePath));
    const session=startSession(field,candidate,gcode,basename(gcodePath),at());
    mkdirSync(dir,{recursive:false,mode:0o700});
    writeNew(join(dir,'field.json'),field);
    writeNew(join(dir,'candidate.json'),candidate);
    writeNew(join(dir,'session.json'),session);
    writeNew(join(dir,'private-input-paths.json'),{
      gcodePath:resolve(gcodePath),photoPath:null,notesPath:null
    });
    return {status:'FIELD_CHALLENGE_CREATED',dir,challenge:session.challenge,
      requiredNext:'Run a supervised physical printer job externally, then observe the same G-code twice (Printing and Operational). No machine command is sent.',
      sourceGcodeSha256:session.gcode.sha256};
  }
  if(cmd==='observe'&&rest.length===2){
    const [dirArg,baseUrl]=rest,dir=resolve(dirArg);
    const apiKey=process.env.OCTOPRINT_API_KEY;
    if(!apiKey)throw Error('BOX_018_HOLD: OCTOPRINT_API_KEY environment variable required');
    const snapshot=await observeOctoPrint({baseUrl,apiKey});
    const capturedAt=at();
    return locked(dir,()=>{
      const {p,session}=get(dir);
      const next=appendObservation(session,snapshot,capturedAt);
      atomicWrite(p.session,next);
      return {status:next.state,challenge:session.challenge,
        observedPrinterState:snapshot.job.state,reportedCompletion:snapshot.job.completion,
        actualBoxIndependentlyProven:false,commandsSent:false};
    });
  }
  if(cmd==='inspect'&&rest.length===4){
    const [dirArg,photoPath,notesPath,measurementsPath]=rest,
      dir=resolve(dirArg);
    return locked(dir,()=>{
      const {p,session,field,candidate}=get(dir);
      if(existsSync(p.bundle))throw Error('BOX_018_HOLD: inspection immutable; new session for new evidence');
      const paths=readJson(p.inputs);
      const inspectionData=readJSONFile(measurementsPath);
      if(!inspectionData||!['widthMm','heightMm','depthMm','assembled','looksSafeForUse']
        .every(k=>Object.hasOwn(inspectionData,k))||
        Object.keys(inspectionData).length!==5)
        throw Error('BOX_018_HOLD: measurements must have exact five fields');
      const photo=readFileSync(resolve(photoPath)),notes=readFileSync(resolve(notesPath));
      const bundle=makeInspectionBundle(field,candidate,session,{
        gcodeBytes:readFileSync(paths.gcodePath),
        photoBytes:photo,notesBytes:notes,dimensions:inspectionData,inspectedAt:at()
      });
      atomicWrite(p.inputs,{...paths,photoPath:resolve(photoPath),notesPath:resolve(notesPath)});
      writeNew(p.bundle,bundle);
      return {status:'INSPECTION_PACKET_UNISSUED_HOLD',
        evidenceHash:bundle.evidence.evidenceHash,
        requiredSigners:['fabricator','witness','new_box_owner'],
        privateFilesUploaded:false,
        physicalBoxIndependentlyProven:false};
    });
  }
  if(cmd==='sign'&&rest.length===3){
    const [dirArg,role,privatePemPath]=rest,dir=resolve(dirArg);
    return locked(dir,()=>{
      const {p,session,field,candidate}=get(dir);
      const raw=readFileSync(resolve(privatePemPath),'utf8');
      // Require an existing operator-provisioned private PEM. Never generate keys
      // for all roles or print any private key in a real field trial.
      const publicKey=createPublicKey(raw).export({type:'spki',format:'pem'});
      const next=signBundleRole(field,candidate,session,readJson(p.bundle),role,
        {publicKey,privateKey:raw});
      atomicWrite(p.bundle,next);
      return {status:'ROLE_SIGNED',role,acceptedRoles:Object.keys(next.proofs),
        privateKeyPersistedInTrial:false,mayCommission:false};
    });
  }
  if((cmd==='verify'||cmd==='handoff')&&rest.length===1){
    const dir=resolve(rest[0]),{p,session,field,candidate}=get(dir);
    const bundle=readJson(p.bundle);
    const verified=verifyReady(field,candidate,session,bundle,
      Object.keys(bundle.proofs).length===3?inspectPrivInputs(dir):{});
    if(cmd==='verify')return verified;
    if(verified.status!=='EVIDENCE_READY_FOR_MANUAL_OWNER_REVIEW_NO_AUTOMATIC_APPLY')
      throw Error('BOX_018_HOLD: cannot hand off incomplete/invalid witness evidence');
    const handoff=publicHandoff(session,bundle);
    writeNew(join(dir,'handoff-public-review.json'),handoff);
    return {status:'HANDOFF_CREATED_FOR_INDEPENDENT_REVIEW',
      output:join(dir,'handoff-public-review.json'),evidenceHash:verified.evidenceHash,
      commissioned:false,pennyMinted:0};
  }
  if(cmd==='status'&&rest.length===1){
    const {session}=get(resolve(rest[0]));
    return {sessionId:session.sessionId,challenge:session.challenge,
      state:session.state,observations:session.observations.length,
      movementsExecuted:session.movementCommandsAuthorized,
      independentlyVerifiedPhysicalObject:false};
  }
  throw Error('Usage:\n'+[
    'penny018 init FIELD.json PROPOSAL.json PART.gcode EMPTY_PRIVATE_DIR',
    'penny018 observe PRIVATE_DIR http://127.0.0.1:5000   (requires OCTOPRINT_API_KEY)',
    'penny018 inspect PRIVATE_DIR PHOTO.png NOTES.txt FIVE_FIELDS_MEASUREMENTS.json',
    'penny018 sign PRIVATE_DIR fabricator|witness|new_box_owner PINNED_PRIVATE_KEY.pem',
    'penny018 verify PRIVATE_DIR',
    'penny018 handoff PRIVATE_DIR',
    'penny018 status PRIVATE_DIR'
  ].join('\n'));
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  main().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{
    console.error(e.message);process.exitCode=1;
  });
}
