#!/usr/bin/env node
import {mkdirSync,existsSync,readFileSync,writeFileSync,openSync,closeSync,renameSync,unlinkSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {keysForSource,policyFor,newInbox,project,relatteObservationSpec} from './ambient-trickle-009.mjs';
import {configureBandcamp,importCsv,importApiV4,fetchAuthorizedBandcampV4} from './bandcamp-source-011.mjs';

const USAGE='Bandcamp Source 011: init PRIVATE_DIR BAND_ID PURPOSE_ID SOURCE_ID | csv PRIVATE_DIR OWNER_REPORT.csv | json PRIVATE_DIR API_V4_REPORT.json | api PRIVATE_DIR "YYYY-MM-DD HH:MM:SS" "YYYY-MM-DD HH:MM:SS" | show PRIVATE_DIR | hold PRIVATE_DIR ASSET_ID OUT.json';
const load=path=>JSON.parse(readFileSync(path,'utf8'));
function writeNew(file,data){
  const fd=openSync(file,'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(data,null,2)+'\n');}finally{closeSync(fd);}
}
function replace(file,data){
  const tmp=file+'.pending-'+process.pid;
  writeNew(tmp,data);
  try{renameSync(tmp,file);}catch(e){try{unlinkSync(tmp);}catch{}throw e;}
}
function withLock(root,func){
  const lock=join(root,'bandcamp-writer.lock');let fd;
  try{fd=openSync(lock,'wx',0o600);}catch{throw Error('BANDCAMP_SOURCE_HOLD: writer lock exists; inspect prior interrupted import');}
  try{return func();}finally{closeSync(fd);unlinkSync(lock);}
}
function local(dir){
  const root=resolve(dir),config=load(join(root,'bandcamp-adapter.json')),
    keys=load(join(root,'bandcamp-source-key.json')),inbox=load(join(root,'inbox.json'));
  configureBandcamp(config);project(inbox);
  return {root,config,keys,inbox};
}
function ownerFile(file,limit){
  const path=resolve(file),s=lstatSync(path);
  if(!s.isFile()||s.size>limit)throw Error('BANDCAMP_SOURCE_HOLD: expected bounded owner-exported regular file');
  return readFileSync(path,'utf8');
}
function present(result,method){
  return {method,added:result.added,reported:result.reported,heldForReview:result.heldForReview,
    projection:{signalCount:result.projection.signalCount,currentClaims:result.projection.currentSourceReports.length,
    revokedClaims:result.projection.revokedReports.length,claimedMoneyReports:result.projection.claimedMoneyReports.length,
    head:result.projection.head,fundsTransferred:false,assetsAdmitted:false},
    notice:result.note};
}
export async function main(args=process.argv.slice(2),opts={}){
  const [cmd,root,...rest]=args;
  if(cmd==='init'&&root&&rest.length===3){
    const [bandId,purposeId,sourceId]=rest,config=configureBandcamp({bandId,sourceId,purposeId}),dir=resolve(root);
    mkdirSync(dir,{recursive:true,mode:0o700});
    const configFile=join(dir,'bandcamp-adapter.json'),keyFile=join(dir,'bandcamp-source-key.json'),inboxFile=join(dir,'inbox.json');
    if([configFile,keyFile,inboxFile].some(existsSync))throw Error('BANDCAMP_SOURCE_HOLD: refusing overwrite');
    const keys=keysForSource();const policy=policyFor(sourceId,keys.publicKey,['money'],[purposeId]);
    writeNew(configFile,config);writeNew(keyFile,keys);writeNew(inboxFile,newInbox(policy));
    return {directory:dir,configuredBandId:config.bandId,
      notice:'Owner-authored source adapter keys created locally. No Bandcamp API permission or actual sales imported. Keep this directory private.'};
  }
  if(!root)throw Error(USAGE);
  if(cmd==='show'&&rest.length===0){
    const p=project(local(root).inbox);
    return {signalCount:p.signalCount,sourceCount:p.sourceCount,head:p.head,
      currentClaims:p.currentSourceReports,revokedClaims:p.revokedReports,
      fundsTransferred:false,assetsAdmitted:false,
      notice:'Source observations, not deposited funds, verified payouts, donor receipts or property.'};
  }
  if(cmd==='hold'&&rest.length===2){
    const [assetId,out]=rest,r=local(root);
    const spec=relatteObservationSpec(r.inbox,r.config.sourceId,assetId,new Date().toISOString());
    writeNew(resolve(out),spec);
    return {output:resolve(out),kind:'OBSERVATION_NOT_ASSET',permissionGranted:false};
  }
  if((cmd==='csv'&&rest.length===1)||(cmd==='json'&&rest.length===1)||(cmd==='api'&&rest.length===2)){
    const base=local(root);
    // Parse outside the local write lock. Recompute against fresh state inside it
    // to avoid concurrent writes replacing or duplicating the previous importer.
    const contents=cmd==='api'?
      await fetchAuthorizedBandcampV4(base.config,rest[0],rest[1],opts):
      cmd==='csv'?ownerFile(rest[0],12*1024*1024):
      load(resolve(rest[0]));
    return withLock(base.root,()=>{
      const current=local(root);
      const result=cmd==='csv'?
        importCsv(current.inbox,current.config,current.keys,contents):
        importApiV4(current.inbox,current.config,current.keys,contents);
      if(result.added)replace(join(current.root,'inbox.json'),result.inbox);
      return present(result,cmd==='csv'?'owner_local_csv':cmd==='json'?'owner_local_api_v4_json':'authorized_api_v4');
    });
  }
  throw Error(USAGE);
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  main().then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{
    console.error(error.message);process.exitCode=1;
  });
}
