#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, lstatSync, readFileSync, writeFileSync, openSync, closeSync, renameSync, unlinkSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { keysForSource, policyFor, newInbox, importBatch, project, relatteObservationSpec, signSignal, contentHash } from './ambient-trickle-009.mjs';

const usage='Usage: node src/ambient-trickle-cli-009.mjs demo | init DIRECTORY POLICY.json | scan DIRECTORY DROP_DIRECTORY | ingest DIRECTORY SIGNED.json | show DIRECTORY | hold DIRECTORY SOURCE_ID ASSET_ID OUTPUT.json';
const load = path => JSON.parse(readFileSync(path,'utf8'));
function exclusive(path, data) {
  const fd=openSync(path,'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(data,null,2)+'\n');}finally{closeSync(fd);}
}
function replace(path,data) {
  const tmp=path+'.tmp-'+process.pid;
  exclusive(tmp,data);
  try{renameSync(tmp,path);}catch(error){try{unlinkSync(tmp);}catch{}throw error;}
}
function withLock(path,fn) {
  const lock=path+'.lock'; let fd;
  try{fd=openSync(lock,'wx',0o600);}catch{throw Error('Trickle importer already locked; inspect incomplete prior operation');}
  try{return fn();}finally{closeSync(fd);unlinkSync(lock);}
}
function importer(root,signals){
  const path=join(resolve(root),'inbox.json');
  return withLock(path,()=>{
    const inbox=load(path),before=inbox.signals.length;
    const next=importBatch(inbox,signals);
    if(next.signals.length!==before)replace(path,next);
    return {accepted:next.signals.length-before,replayed:signals.length-(next.signals.length-before),projection:project(next)};
  });
}
export function main(args=process.argv.slice(2)) {
  const [command,...rest]=args;
  if(command==='demo' && rest.length===0){
    const keys=keysForSource(), sourceId='synthetic-source-001';
    const policy=policyFor(sourceId,keys.publicKey,['money','goods','service'],['purpose-radio-001','purpose-help-001']);
    const signal=(payload)=>signSignal(sourceId,payload,keys);
    const first=signal({
      eventId:'event-gift-001',assetId:'asset-cash-001',revision:1,previousHash:null,
      kind:'money',status:'pledge_reported',quantity:1500,unit:'minor_usd',purposeId:'purpose-radio-001',
      evidenceHash:'a'.repeat(64),observedAt:'2026-10-08T19:00:00.000Z'
    });
    const second=signal({
      eventId:'event-gift-002',assetId:'asset-cash-001',revision:2,previousHash:contentHash(first),
      kind:'money',status:'settlement_reported',quantity:1500,unit:'minor_usd',purposeId:'purpose-radio-001',
      evidenceHash:'b'.repeat(64),observedAt:'2026-10-08T19:05:00.000Z'
    });
    const wood=signal({
      eventId:'event-firewood-001',assetId:'asset-wood-001',revision:1,previousHash:null,
      kind:'goods',status:'offer_reported',quantity:2,unit:'cord',purposeId:'purpose-help-001',
      evidenceHash:'c'.repeat(64),observedAt:'2026-10-08T19:05:00.000Z'
    });
    const inbox=importBatch(newInbox(policy),[first,second,wood,second]);
    return {projection:project(inbox),holdSpec:relatteObservationSpec(inbox,sourceId,'asset-wood-001','2026-10-08T19:10:00.000Z'),
      note:'Synthetic source adapter. Nothing imported from Kinship or any payment provider. No donor data or funds handled.'};
  }
  if(command==='init' && rest.length===2){
    const [directory,policyFile]=rest,root=resolve(directory),path=join(root,'inbox.json');
    mkdirSync(root,{recursive:true,mode:0o700});
    if(existsSync(path))throw Error('Existing inbox will not be overwritten');
    exclusive(path,newInbox(load(resolve(policyFile))));
    return {privateInbox:path,note:'Policy is a human-authorized pin for a source adapter key; not a payment provider identity credential.'};
  }
  if(command==='ingest'&&rest.length===2){
    const [directory,file]=rest,data=load(resolve(file));
    return importer(directory,Array.isArray(data)?data:[data]);
  }
  if(command==='scan'&&rest.length===2){
    const [directory,drop]=rest,root=resolve(drop);
    const files=readdirSync(root).filter(x=>/^[A-Za-z0-9_.-]{1,160}\.json$/.test(x)).sort();
    if(files.length>100)throw Error('One scan may import at most 100 drop files');
    const packets=[];
    for(const name of files){
      const path=join(root,basename(name)),meta=lstatSync(path);
      if(!meta.isFile()||meta.size>1000000)throw Error('Drop must be a regular JSON file up to 1MB');
      const file=load(path);packets.push(...(Array.isArray(file)?file:[file]));
    }
    if(packets.length>1000)throw Error('Drop has too many signals');
    return {scanned:files.length,...importer(directory,packets)};
  }
  if(command==='show' && rest.length===1)return project(load(join(resolve(rest[0]),'inbox.json')));
  if(command==='hold' && rest.length===4){
    const [directory,sourceId,assetId,out]=rest;
    const spec=relatteObservationSpec(load(join(resolve(directory),'inbox.json')),sourceId,assetId,new Date().toISOString());
    exclusive(resolve(out),spec);
    return {candidate:resolve(out),note:'Observation HOLD only. No asset ownership, money settlement or receiver authority.'};
  }
  throw Error(usage);
}
if(process.argv[1] && import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
