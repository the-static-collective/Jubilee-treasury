import {createHash,createPublicKey,sign,verify} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {canonical,digest} from './penny-work-matter-014.mjs';
import {
  inspectField,inspectNode,inspectFourthBox,makeCompletion,applyAtNode
} from './penny-box-composer-016.mjs';

export const FAB_SCHEMA='jubilee.box-hardware-evidence/v0.1';
const DOMAIN='JUBILEE-BOX-017-WITNESS\n';
const HASH=/^[0-9a-f]{64}$/;
const fail=m=>{throw Error('BOX_017_HOLD: '+m)};
const must=(p,m)=>{if(!p)fail(m)};
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&
  Object.keys(x).sort().join('|')===keys.slice().sort().join('|');
const time=t=>typeof t==='string'&&Number.isFinite(Date.parse(t))&&new Date(t).toISOString()===t;
const fileName=n=>typeof n==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,100}\.gcode$/i.test(n);
const bHash=b=>createHash('sha256').update(b).digest('hex');
const publicOf=s=>createPublicKey(s).export({type:'spki',format:'pem'});
const roles=['fabricator','witness','new_box_owner'];
const nodeNames=['box-a','box-b','box-c'];
function checkSelected(field,candidate) {
  const f=inspectField(field);
  must(candidate?.schema==='jubilee.penny-composition-proposal/v0.1'&&
    typeof candidate.planId==='string'&&HASH.test(candidate.proposalHash)&&
    candidate.missing?.length===0&&
    candidate.role==='PROPOSAL_NOT_AUTHORITY'&&
    candidate.resourceEffects?.pennyBackingConsumed===0&&
    candidate.newBoxId==='box-d','valid nonspendable fourth-box plan required');
  must(f.sourceHeads['penny-014']===candidate.sourceHeads['penny-014']&&
    f.pennyAuditShortfall===0,'penny source stale or physically impaired');
  must(nodeNames.every(id=>f.boxes[id].approvals.some(a=>
    a.planId===candidate.planId&&a.proposalHash===candidate.proposalHash)),
    'independent approval of all three resource owners required');
  must(nodeNames.every(id=>
    f.boxes[id].applied.length===0),'hardware evidence must precede APPLY');
  return f;
}
const BOUND_MAX=8*1024*1024;
export function fingerprintGcode(data,file){
  const b=Buffer.isBuffer(data)?data:Buffer.from(data);
  must(fileName(file)&&b.length>=12&&b.length<=BOUND_MAX,'bounded G-code filename/size');
  const s=b.toString('utf8');
  must(!s.includes('\uFFFD')&&/^\s*(?:N\d+\s+)?G1\s/im.test(s)&&
    !/(^|\n)\s*(?:N\d+\s+)?(?:M112|M500|M502|M997|M303)\b/im.test(s),
    'unsupported or unusual G-code; manual safety review required');
  return {fileName:file,byteLength:b.length,sha256:bHash(b),
    mediaType:'text/x.gcode',safeToAutomaticallyExecute:false};
}
export function fingerprintPhoto(data){
  const b=Buffer.isBuffer(data)?data:Buffer.from(data);
  must(b.length>=16&&b.length<=BOUND_MAX,'photo bytes must be bounded');
  const png=b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg=b[0]===255&&b[1]===216&&b.at(-2)===255&&b.at(-1)===217;
  must(png||jpeg,'only PNG/JPEG file signatures accepted');
  return {sha256:bHash(b),byteLength:b.length,
    mediaType:png?'image/png':'image/jpeg',depictsCompletedBox:false,
    note:'Hash confirms file bytes, not scene truth or contemporaneous camera capture.'};
}
export function limitLocalOctoPrintUrl(url) {
  let u;try{u=new URL(url)}catch{fail('invalid OctoPrint target')};
  must(u.protocol==='http:'&&u.username===''&&u.password===''&&
    u.search===''&&u.hash===''&&(u.pathname===''||u.pathname==='/'),
    'read-only OctoPrint base must be bare local HTTP with no credentials or path');
  const host=u.hostname.replace(/^\[|\]$/g,'');
  const parts=host.split('.').map(Number);
  const ipv4=parts.length===4&&parts.every(n=>Number.isInteger(n)&&n>=0&&n<=255);
  const local=host==='localhost'||host==='::1'||
    (ipv4&&(parts[0]===10||parts[0]===127||
      (parts[0]===192&&parts[1]===168)||
      (parts[0]===172&&parts[1]>=16&&parts[1]<=31)));
  must(local,'refuse public, dynamic-DNS and remote printer hosts');
  return u.origin;
}
function jobData(obj){
  must(obj&&typeof obj==='object'&&typeof obj.state==='string'&&
    obj.state.length<=60,'unrecognized OctoPrint job response');
  const name=obj.job?.file?.name??null;
  must(name===null||fileName(name),'invalid job file name');
  const completion=obj.progress?.completion;
  must(completion===null||completion===undefined||
    (typeof completion==='number'&&Number.isFinite(completion)&&
      completion>=0&&completion<=100),'untrusted completion percentage');
  return {state:obj.state,fileName:name,
    completion:completion??null,source:'OCTOPRINT_READ_ONLY_STATUS'};
}
function connectionData(obj){
  const current=obj?.current;
  must(current&&typeof current.state==='string'&&current.state.length<=60,
    'unrecognized OctoPrint connection response');
  const profile=current.printerProfile??current.profile??null;
  must(profile===null||(typeof profile==='string'&&profile.length<=100),
    'malformed printer profile');
  return {state:current.state,profileId:profile,
    capabilityAuthority:'REPORTED_CONNECTION_ONLY'};
}
/**
 * Read only: GET /api/connection and /api/job. No upload/start/pause/cancel,
 * no printer control, no automatic print and no camera stream.
 */
export async function observeOctoPrint({baseUrl,apiKey,fetchImpl=fetch}){
  const base=limitLocalOctoPrintUrl(baseUrl);
  must(typeof apiKey==='string'&&apiKey.length>=8&&apiKey.length<=256,
    'private read-only API key needed');
  async function get(path){
    const res=await fetchImpl(base+path,{
      method:'GET',redirect:'error',
      headers:{'X-Api-Key':apiKey,'Accept':'application/json'},
      signal:AbortSignal.timeout(5000)
    });
    must(res?.ok,'OctoPrint not available or no STATUS permission');
    const data=await res.json();
    must(JSON.stringify(data).length<=65536,'unbounded device reply');
    return data;
  }
  const connection=connectionData(await get('/api/connection'));
  const job=jobData(await get('/api/job'));
  return {schema:'jubilee.machine-readonly-snapshot/v0.1',
    adapter:'octoprint-status-v1',connection,job,
    controlsExecuted:false,verifiedHardwareIdentity:false,
    note:'Read-only remote machine reports. Authentication does not independently prove hardware motion or printed object.'};
}
export function inspectMachineTrace(trace,job){
  must(exact(trace,['during','after','duringAt','afterAt'])&&
    time(trace.duringAt)&&time(trace.afterAt)&&
    trace.afterAt>trace.duringAt,'two ordered distinct real-world observations required');
  for(const s of [trace.during,trace.after]){
    must(s?.schema==='jubilee.machine-readonly-snapshot/v0.1'&&
      s.adapter==='octoprint-status-v1'&&s.controlsExecuted===false&&
      s.job?.fileName===job.fileName,'read-only observed machine and exact file required');
  }
  must(trace.during.job.state==='Printing'&&
    trace.after.job.state==='Operational'&&
    trace.after.job.completion>=99.9&&
    trace.during.connection?.profileId===trace.after.connection?.profileId,
    'printing-to-operational sequence and reported completion required');
  return {
    source:'TWO_UNTRUSTED_OCTOPRINT_STATUS_REPORTS',
    reportedJobCompletion:true,reportedProfileId:trace.after.connection.profileId,
    proofOfObjectExistence:false,
    note:'OctoPrint status alone cannot distinguish a real object, dry-run, manual override or mistaken file.'
  };
}
export function createEvidence(field,candidate,{gcodeBytes,gcodeFileName,
  photoBytes,trace,inspection}){
  checkSelected(field,candidate);
  const gcode=fingerprintGcode(gcodeBytes,gcodeFileName),photo=fingerprintPhoto(photoBytes);
  const machine=inspectMachineTrace(trace,gcode);
  must(exact(inspection,['newBoxId','inspectedAt','widthMm','heightMm','depthMm',
    'assembled','looksSafeForUse','inspectionNotesHash'])&&
    inspection.newBoxId===candidate.newBoxId&&time(inspection.inspectedAt)&&
    inspection.inspectedAt>=trace.afterAt&&
    [inspection.widthMm,inspection.heightMm,inspection.depthMm].every(n=>
      Number.isSafeInteger(n)&&n>=20&&n<=1000)&&
    inspection.assembled===true&&inspection.looksSafeForUse===true&&
    HASH.test(inspection.inspectionNotesHash),
    'independent post-print physical inspection and bounded measurements required');
  const body={
    schema:FAB_SCHEMA,planId:candidate.planId,proposalHash:candidate.proposalHash,
    sourcePennyHead:candidate.sourceHeads['penny-014'],
    gcode,photo,machine,trace:structuredClone(trace),
    inspection:structuredClone(inspection),
    pennyBackingConsumed:0,pennyTokensCreated:0,
    significance:'EVIDENCE_PACKET_REQUIRES_INDEPENDENT_HUMAN_SIGNATURES'
  };
  return {...body,evidenceHash:digest(body)};
}
function exactEvidence(bundle) {
  must(exact(bundle,['schema','planId','proposalHash','sourcePennyHead',
    'gcode','photo','machine','trace','inspection','pennyBackingConsumed',
    'pennyTokensCreated','significance','evidenceHash'])&&bundle.schema===FAB_SCHEMA,
    'evidence bundle fields');
  const {evidenceHash,...body}=bundle;
  must(HASH.test(evidenceHash)&&digest(body)===evidenceHash&&
    bundle.pennyBackingConsumed===0&&bundle.pennyTokensCreated===0,
    'tampered evidence manifest');
  must(exact(bundle.gcode,['fileName','byteLength','sha256','mediaType',
    'safeToAutomaticallyExecute'])&&bundle.gcode.safeToAutomaticallyExecute===false&&
    fileName(bundle.gcode.fileName)&&HASH.test(bundle.gcode.sha256)&&
    bundle.gcode.byteLength>=12&&bundle.gcode.byteLength<=BOUND_MAX,
    'G-code manifest invalid');
  must(exact(bundle.photo,['sha256','byteLength','mediaType',
    'depictsCompletedBox','note'])&&bundle.photo.depictsCompletedBox===false&&
    HASH.test(bundle.photo.sha256)&&bundle.photo.byteLength>=16&&
    bundle.photo.byteLength<=BOUND_MAX&&
    ['image/png','image/jpeg'].includes(bundle.photo.mediaType),
    'camera manifest invalid');
  inspectMachineTrace(bundle.trace,bundle.gcode);
  must(bundle.machine.reportedJobCompletion===true&&
    bundle.machine.proofOfObjectExistence===false,'machine cannot attest physical proof');
}
function signingBody(evidence,role){
  return {schema:'jubilee.box017-role-proof/v0.1',role,
    evidenceHash:evidence.evidenceHash,planId:evidence.planId,
    proposalHash:evidence.proposalHash,
    inspectionNotesHash:evidence.inspection.inspectionNotesHash,
    assertion:'I_ATTEST_THIS_RECORD_NOT_FINANCIAL_AUTHORITY'};
}
export function signEvidence(evidence,role,keys){
  exactEvidence(evidence);
  must(roles.includes(role),'unknown independent witness role');
  must(keys?.publicKey===publicOf(keys.privateKey),'role signer mismatch');
  const unsigned=signingBody(evidence,role);
  return {...unsigned,signature:sign(null,Buffer.from(DOMAIN+canonical(unsigned)),
    keys.privateKey).toString('base64')};
}
export function validateEvidence(field,candidate,evidence,proofs){
  checkSelected(field,candidate);exactEvidence(evidence);
  must(evidence.planId===candidate.planId&&
    evidence.proposalHash===candidate.proposalHash&&
    evidence.sourcePennyHead===candidate.sourceHeads['penny-014'],
    'evidence is not bound to selected source');
  must(exact(proofs,roles),'all three independent witnesses required');
  const {roles:roster}= {roles:field.boxes['box-a'].roles};
  for(const [name,key] of [
    ['fabricator',roster.fabricatorPublicKey],
    ['witness',roster.witnessPublicKey],
    ['new_box_owner',roster.newBoxOwnerPublicKey]
  ]){
    const p=proofs[name];
    const unsigned=signingBody(evidence,name);
    must(p&&exact(p,[...Object.keys(unsigned),'signature'])&&
      canonical(unsigned)===canonical(Object.fromEntries(
        Object.entries(p).filter(([k])=>k!=='signature'))),
      'witness signoff did not bind exactly same evidence');
    let good=false;
    try {
      const b=Buffer.from(p.signature,'base64');
      good=b.length===64&&b.toString('base64')===p.signature&&
        verify(null,Buffer.from(DOMAIN+canonical(unsigned)),key,b);
    }catch{}
    must(good,'independent evidence witness signature failed');
  }
  return {status:'INDEPENDENT_HUMAN_SIGNOFFS_ON_MACHINE_AND_PHOTO_EVIDENCE',
    evidenceHash:evidence.evidenceHash,
    underlyingFilesRetainedExternally:true,actualPhysicalBuildIndependentlyProvenBySoftware:false};
}
export function applyHardwareEvidence(field,candidate,evidence,proofs,owners,at){
  const validated=validateEvidence(field,candidate,evidence,proofs);
  must(owners&&nodeNames.every(id=>owners[id])&&owners.fabricator&&
    owners.witness&&owners.newBox,'owner role keyset required');
  const completion=makeCompletion(candidate,{
    fabricator:owners.fabricator,witness:owners.witness,newOwner:owners.newBox
  },evidence.evidenceHash,at);
  let next=structuredClone(field);
  for(const id of nodeNames){
    next=applyAtNode(next,candidate,id,owners[id],completion,at);
  }
  const result=inspectFourthBox(next,candidate);
  must(result.status==='SIGNED_COMPLETION_ATTESTED_NOT_PHYSICALLY_VERIFIED'&&
    result.pennySpentByComposition===0&&result.pennyTokensCreated===0&&
    result.commonCompletionHash,'native PENNY-016 invariant failed');
  return {field:next,completion,
    result:{
      schema:'jubilee.hardware-assisted-fourth-box/v0.1',
      status:'HUMAN_ATTESTED_WITH_MACHINE_EVIDENCE_NOT_AUTONOMOUSLY_PHYSICALLY_VERIFIED',
      planId:candidate.planId,proposalHash:candidate.proposalHash,
      evidenceHash:validated.evidenceHash,
      nativeCompletionHash:result.commonCompletionHash,
      boxDMayAcceptCustody:false,
      machineJobObserved:true,independentInspectionsSigned:3,
      photoFileHashBound:true,pennyConsumed:0,pennyIssued:0,
      actualHardwareVerifiedBySoftware:false,
      caveat:'All local witness signatures and data may be false or collusive. Physical outcome, material quality, legal rights and machine identity require real independent checks.'
    }};
}
export function reportHold(field,candidate,parts){
  const s=inspectField(field);
  const missing=[];
  if(nodeNames.some(id=>!s.boxes[id].approvals.some(a=>a.planId===candidate.planId)))
    missing.push('independent source-owner selection');
  if(!parts?.gcode)missing.push('approved G-code file bytes');
  if(!parts?.twoMachineSnapshots)missing.push('observed printer job transition');
  if(!parts?.photo)missing.push('retained camera/image evidence bytes');
  if(!parts?.inspection)missing.push('post-build independent physical measurements');
  if(!parts?.witnesses)missing.push('three matching independent witness signatures');
  return {status:missing.length?'HOLD_MISSING_PHYSICAL_EVIDENCE':'REVIEW_READY_NOT_AUTO_EXECUTE',
    missing,automaticFabrication:false,automaticTokenIssuance:false};
}
