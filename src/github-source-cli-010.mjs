#!/usr/bin/env node
import { mkdirSync, existsSync, readFileSync, writeFileSync, openSync, closeSync, renameSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { keysForSource, policyFor, newInbox, project, relatteObservationSpec } from './ambient-trickle-009.mjs';
import { configureRepo, discoverRecentMerges, observeMergedPull } from './github-source-010.mjs';

const usage = 'Usage: github:source init DIR owner/repo purpose-id source-id [base-branch] | pull DIR PR_NUMBER | scan DIR [PAGES=1] | show DIR | hold DIR PR_NUMBER OUT_JSON';
const load=path=>JSON.parse(readFileSync(path,'utf8'));
function createExclusive(path,data) {
  const fd=openSync(path,'wx',0o600);
  try{ writeFileSync(fd,JSON.stringify(data,null,2)+'\n'); }
  finally{closeSync(fd);}
}
function replaceJson(path,data){
  const temp=path+'.pending-'+process.pid;
  createExclusive(temp,data);
  try{renameSync(temp,path);}catch(error){try{unlinkSync(temp);}catch{}throw error;}
}
function lock(path,work){
  let fd;
  try{fd=openSync(path+'.lock','wx',0o600);}
  catch{throw Error('GitHub source writer locked; inspect interrupted prior operation');}
  try{return work();}finally{closeSync(fd);unlinkSync(path+'.lock');}
}
function state(root){
  const r=resolve(root),settings=load(join(r,'github-adapter.json')),keys=load(join(r,'source-key.json')),inbox=load(join(r,'inbox.json'));
  const config=configureRepo(settings.repoFullName,settings.purposeId,settings.sourceId,{baseBranch:settings.baseBranch});
  return {root:r,config,keys,inbox};
}
function save(state,next){
  if(next.signals.length!==state.inbox.signals.length) replaceJson(join(state.root,'inbox.json'),next);
}
export async function main(args=process.argv.slice(2),opts={}) {
  const [command,dir,...rest]=args;
  if(command==='init' && dir && (rest.length===3||rest.length===4)){
    const [repo,purpose,sourceId,baseBranch]=rest,root=resolve(dir);
    const config=configureRepo(repo,purpose,sourceId,{baseBranch:baseBranch??'main'});
    mkdirSync(root,{recursive:true,mode:0o700});
    const paths=['github-adapter.json','source-key.json','inbox.json'].map(p=>join(root,p));
    if(paths.some(existsSync))throw Error('Refusing existing source state');
    const keys=keysForSource();
    const policy=policyFor(config.sourceId,keys.publicKey,['software'],[config.purposeId]);
    createExclusive(paths[0],config);createExclusive(paths[1],keys);createExclusive(paths[2],newInbox(policy));
    return {source:config.repoFullName,purpose:config.purposeId,privateRoot:root,
      notice:'GitHub API read-only. Source key lives in privateRoot. Signed report does not convey ownership or source repository approval.'};
  }
  if(!dir)throw Error(usage);
  if(command==='show' && rest.length===0)return project(state(dir).inbox);
  if(command==='hold' && rest.length===2){
    const [number,out]=rest,n=Number(number),s=state(dir);
    if(!Number.isSafeInteger(n)||n<1)throw Error('Valid PR required');
    const spec=relatteObservationSpec(s.inbox,s.config.sourceId,'ghpr-'+n,new Date().toISOString());
    createExclusive(resolve(out),spec);
    return {output:resolve(out),authority:'HOLD_OBSERVATION_ONLY',assetAdmitted:false};
  }
  if(command==='pull' && rest.length===1){
    const n=Number(rest[0]);if(!Number.isSafeInteger(n)||n<1)throw Error('Valid merged PR number required');
    const current=state(dir);
    if(current.inbox.signals.some(s=>s.sourceId===current.config.sourceId && s.payload?.eventId==='ghmerge-'+n))
      return {added:0,replayed:1,projection:project(current.inbox)};
    const r=await observeMergedPull(current.inbox,current.config,current.keys,n,opts);
    return lock(join(current.root,'inbox.json'),()=>{
      const refreshed=state(dir);
      if(refreshed.inbox.signals.some(s=>s.sourceId===refreshed.config.sourceId && s.payload?.eventId==='ghmerge-'+n))
        return {added:0,replayed:1,projection:project(refreshed.inbox)};
      // Reverify against current persisted state; no authority drift.
      const next={...refreshed.inbox,signals:[...refreshed.inbox.signals,...r.inbox.signals.slice(current.inbox.signals.length)]};
      const view=project(next);
      save(refreshed,next);
      return {added:1,replayed:0,source:r.source,projection:view};
    });
  }
  if(command==='scan' && rest.length<=1){
    const pages=rest.length?Number(rest[0]):1;
    const initial=state(dir), numbers=await discoverRecentMerges(initial.config,{...opts,pages});
    const existing=new Set(initial.inbox.signals.filter(s=>s.sourceId===initial.config.sourceId).map(s=>s.payload.eventId));
    let staged=initial.inbox,verified=0;
    for(const n of numbers){
      if(existing.has('ghmerge-'+n))continue;
      const result=await observeMergedPull(staged,initial.config,initial.keys,n,opts);
      staged=result.inbox;verified+=result.added;
    }
    return lock(join(initial.root,'inbox.json'),()=>{
      const current=state(dir);
      if(project(current.inbox).head!==project(initial.inbox).head)throw Error('Concurrent inbox change; retry the scan');
      save(current,staged);
      return {repository:initial.config.repoFullName,listed:numbers.length,newReports:verified,
        ignoredAsPreviouslyRecorded:numbers.length-verified,projection:project(staged)};
    });
  }
  throw Error(usage);
}
if(process.argv[1] && import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  main().then(v=>console.log(JSON.stringify(v,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
}
