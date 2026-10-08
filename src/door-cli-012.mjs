#!/usr/bin/env node
import {readFileSync,writeFileSync,openSync,closeSync,renameSync,unlinkSync,mkdirSync,existsSync,lstatSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {
  makeKeys,newRegistry,openDoor,withdrawDoor,inspectRegistry,publicBoard,
  recordSourceReport,doorProposal,proposedRelatteHold,sampleDoorDemo
} from './door-registry-012.mjs';
import {policyFor,newInbox,project} from './ambient-trickle-009.mjs';

const help='door: init PRIVATE_DIR SOURCE_ID PURPOSE_ID [PURPOSE_ID...] | open PRIVATE_DIR DOOR.json | withdraw PRIVATE_DIR DOOR_ID EVIDENCE_REF | show PRIVATE_DIR | board PRIVATE_DIR OUTPUT.html | proposal PRIVATE_DIR DOOR_ID | record PRIVATE_DIR DOOR_ID REPORT.json | hold PRIVATE_DIR ASSET_ID OUTPUT.json | demo';
const load=path=>JSON.parse(readFileSync(resolve(path),'utf8'));
function exclusive(file,contents) {
  const fd=openSync(file,'wx',0o600);
  try{writeFileSync(fd,contents);}finally{closeSync(fd);}
}
function atomicWrite(file,contents){
  const tmp=file+'.pending-'+process.pid;
  exclusive(tmp,contents);
  try{renameSync(tmp,file);}catch(e){try{unlinkSync(tmp);}catch{}throw e;}
}
function json(v){return JSON.stringify(v,null,2)+'\n';}
function locked(root,work){
  let fd;const path=join(root,'local-door.lock');
  try{fd=openSync(path,'wx',0o600);}catch{throw Error('DOOR_HOLD: an operator is already writing or the lock needs recovery');}
  try{return work();}finally{closeSync(fd);unlinkSync(path);}
}
function readState(path){
  const root=resolve(path);
  const keys=load(join(root,'private-door-signer.json'));
  const config=load(join(root,'door-config.json'));
  const registry=load(join(root,'registry.json'));
  const inbox=load(join(root,'inbox.json'));
  inspectRegistry(registry);project(inbox);
  if(registry.stewardPublicKey!==keys.publicKey||!inbox.policy.sources.some(s=>
    s.sourceId===config.sourceId&&s.publicKey===keys.publicKey))
    throw Error('DOOR_HOLD: private source identities do not match');
  return {root,keys,config,registry,inbox};
}
const safeReport=file=>{
  const path=resolve(file),stat=lstatSync(path);
  if(!stat.isFile()||stat.size>50000)throw Error('DOOR_HOLD: report must be a bounded local regular JSON file');
  return load(path);
};
const sanitized=(p)=>({
  signalCount:p.signalCount,head:p.head,activeObservations:p.currentSourceReports,
  fundsTransferred:false,assetsOwned:false,verifiedSettlement:false,
  notice:'Source-signed local claim only, never external provider confirmation or completed custody.'
});
export function main(args=process.argv.slice(2)){
  const [cmd,dir,...rest]=args;
  if(cmd==='demo'&&args.length===1){
    const demo=sampleDoorDemo();
    return {projection:inspectRegistry(demo.registry),
      proposal:demo.proposal,note:demo.notice};
  }
  if(cmd==='init'&&dir&&rest.length>=2&&rest.length<=24){
    const [sourceId,...purposes]=rest;
    const root=resolve(dir);
    if(purposes.some(p=>typeof p!=='string'||p.length>125))throw Error('DOOR_HOLD: invalid purpose');
    mkdirSync(root,{recursive:true,mode:0o700});
    const files=['private-door-signer.json','door-config.json','registry.json','inbox.json'].map(name=>join(root,name));
    if(files.some(existsSync))throw Error('DOOR_HOLD: refusing to overwrite existing operator state');
    const keys=makeKeys();
    const config={schema:'jubilee.door-operator/v0.1',sourceId,purposes};
    const allowedKinds=['money','crypto','coins','gold','equipment','supplies','labor','compute','transport','broadcast_rights'];
    const inbox=newInbox(policyFor(sourceId,keys.publicKey,allowedKinds,purposes));
    exclusive(files[0],json(keys));exclusive(files[1],json(config));
    exclusive(files[2],json(newRegistry(keys)));exclusive(files[3],json(inbox));
    return {privateRoot:root,sourceId,purposes,
      notice:'Signer identity is local, not provider/Kinship/account verification. No live payments or webhooks are connected.'};
  }
  if(!dir)throw Error(help);
  if(cmd==='show'&&rest.length===0){
    const s=readState(dir);
    return {doors:inspectRegistry(s.registry),trickle:sanitized(project(s.inbox))};
  }
  if(cmd==='proposal'&&rest.length===1)return doorProposal(readState(dir).registry,rest[0]);
  if(cmd==='board'&&rest.length===1){
    const s=readState(dir),out=resolve(rest[0]);
    const body=publicBoard(s.registry,{pinnedPublicKey:s.keys.publicKey});
    exclusive(out,body);
    return {output:out,published:false,pinnedSourceHead:inspectRegistry(s.registry).head,
      warning:'Local HTML only; verify actual recipient identity and publication permission independently before hosting.'};
  }
  if(cmd==='open'&&rest.length===1){
    return locked(resolve(dir),()=>{
      const s=readState(dir),door=safeReport(rest[0]);
      if(!s.config.purposes.includes(door.purposeId))throw Error('DOOR_HOLD: purpose not in local owner policy');
      const next=openDoor(s.registry,s.keys,door,new Date().toISOString());
      atomicWrite(join(s.root,'registry.json'),json(next));
      return {opened:door.id,doorType:door.kind,sourceHead:inspectRegistry(next).head,
        notice:'Owner signer self-attests a destination; no provider or beneficiary affiliation verified.'};
    });
  }
  if(cmd==='withdraw'&&rest.length===2){
    return locked(resolve(dir),()=>{
      const s=readState(dir),next=withdrawDoor(s.registry,s.keys,rest[0],rest[1],new Date().toISOString());
      atomicWrite(join(s.root,'registry.json'),json(next));
      return {withdrawn:rest[0],sourceHead:inspectRegistry(next).head,
        warning:'Old shared HTML or cached links must be withdrawn separately; this does not recall copies.'};
    });
  }
  if(cmd==='record'&&rest.length===2){
    return locked(resolve(dir),()=>{
      const s=readState(dir),data=safeReport(rest[1]);
      const r=recordSourceReport(s.registry,rest[0],s.inbox,s.keys,s.config.sourceId,data);
      if(r.added)atomicWrite(join(s.root,'inbox.json'),json(r.inbox));
      return {added:r.added,observation:r.observation,received:false,
        verifiedProviderSettlement:false,verifiedChainTx:false,verifiedCustody:false,
        sourceHead:inspectRegistry(s.registry).head,
        warning:'Manual LOCAL report, not source-side receipt. Evidence hash only; no PII, payment credential, or ownership.'};
    });
  }
  if(cmd==='hold'&&rest.length===2){
    const s=readState(dir),spec=proposedRelatteHold(s.inbox,s.config.sourceId,rest[0],new Date().toISOString());
    exclusive(resolve(rest[1]),json(spec));
    return {output:resolve(rest[1]),artifactKind:'OBSERVATION_NOT_ASSET',
      admission:false,notice:'This descriptor is not a signed reLATTE crossing. Native receiver must still independently HOLD.'};
  }
  throw Error(help);
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  try{console.log(json(main()));}catch(e){console.error(e.message);process.exitCode=1;}
}
