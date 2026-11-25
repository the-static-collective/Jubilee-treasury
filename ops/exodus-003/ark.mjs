import {mkdirSync,lstatSync,readdirSync,readFileSync,writeFileSync,openSync,closeSync,fsyncSync,linkSync,unlinkSync,rmdirSync,realpathSync} from 'node:fs';
import {join,resolve,dirname,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomBytes} from 'node:crypto';
import {MODE,replay} from '../exodus-002/returning-node.mjs';
const rootRepo=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const fail=m=>{throw Error('ARK HOLD: '+m)};
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(v,keys)=>v&&Object.getPrototypeOf(v)===Object.prototype&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(v,k)??{},'value'));
function outside(root){
 if(!isAbsolute(root))fail('absolute external data directory required');
 const p=join(realpathSync(dirname(resolve(root))),resolve(root).split(/[\\/]/).pop());
 const rel=relative(realpathSync(rootRepo),p);
 if(!rel||(!rel.startsWith('..'+(process.platform==='win32'?'\\':'/'))&&rel!=='..'&&!isAbsolute(rel)))fail('data must remain outside repository');
 return p;
}
function directory(path){
 const s=lstatSync(path);if(!s.isDirectory()||s.isSymbolicLink()||(process.platform!=='win32'&&(s.mode&0o077)!==0))fail('unsafe directory');
 return path;
}
export function rootPath(root){const p=outside(root);directory(p);return p;}
export function init(root){
 const p=outside(root);mkdirSync(p,{mode:0o700});
 mkdirSync(join(p,'node'),{mode:0o700});mkdirSync(join(p,'private'),{mode:0o700});
 return load(p);
}
function read(path){
 const s=lstatSync(path);
 if(!s.isFile()||s.isSymbolicLink()||s.size>8192||(process.platform!=='win32'&&(s.mode&0o077)!==0))fail('unsafe record');
 try{return JSON.parse(readFileSync(path,'utf8'));}catch{fail('corrupt record');}
}
function flushDir(dir){const fd=openSync(dir,'r');try{fsyncSync(fd)}finally{closeSync(fd)}}
// Exclusive hard-link commit: never replaces an existing record. Orphan temp files cause visible HOLD.
export function writeNew(dir,name,value){
 directory(dir);const temp=join(dir,'.pending-'+randomBytes(12).toString('hex'));
 const fd=openSync(temp,'wx',0o600);
 try{writeFileSync(fd,JSON.stringify(value)+'\n');fsyncSync(fd);}finally{closeSync(fd);}
 try{linkSync(temp,join(dir,name));flushDir(dir);}finally{unlinkSync(temp);flushDir(dir);}
}
export function load(root){
 const p=rootPath(root),dir=directory(join(p,'node'));
 const names=readdirSync(dir).sort();if(names.length>64)fail('bounded record count');
 const records=[];let prev='GENESIS';
 for(let i=0;i<names.length;i++){
  const n=String(i+1).padStart(4,'0')+'.json';
  if(names[i]!==n)fail('missing, unexpected or torn record');
  const r=read(join(dir,n));
  if(!exact(r,['schema','seq','previous','origin','event','digest'])||r.schema!=='jubilee.ark.record/v1'||r.seq!==i+1||r.previous!==prev||!['ORIGINAL_DIGITAL','RECONSTRUCTED_PAPER'].includes(r.origin)||r.digest!==digest([r.seq,r.previous,r.origin,r.event]))fail('integrity mismatch');
  records.push(r);prev=r.digest;
 }
 const result=replay(records.map(r=>r.event),{mode:MODE});
 return {records,result,head:prev};
}
export function append(root,event,{origin='ORIGINAL_DIGITAL'}={}){
 if(!['ORIGINAL_DIGITAL','RECONSTRUCTED_PAPER'].includes(origin))fail('invalid origin');
 const p=rootPath(root),lock=join(p,'writer.lock');mkdirSync(lock,{mode:0o700});
 try{
  const before=load(p);replay([...before.records.map(r=>r.event),event],{mode:MODE});
  const seq=before.records.length+1,previous=before.head;
  const r={schema:'jubilee.ark.record/v1',seq,previous,origin,event,digest:digest([seq,previous,origin,event])};
  writeNew(join(p,'node'),String(seq).padStart(4,'0')+'.json',r);
  return load(p);
 }finally{rmdirSync(lock);}
}
// Explicit fixed projection; never reads or imports private directory.
export function prepareBridge(root,{decision}={}){
 const {result,head}=load(root),f=result.fixture;
 if(decision!=='PREPARE_SYNTHETIC_RETURN'||f.admission!=='ADMIT'||f.simulatedMovementMinor===0||f.simulatedReceiptMinor!==f.simulatedMovementMinor)fail('reconciled fixture review required');
 return {schema:'jubilee.ark.return/v1',mode:MODE,status:'HOLD',authority:'none',publicationAllowed:false,contactAllowed:false,settlementAllowed:false,actualMovementMinor:0,fixture:{needMinor:f.needMinor,simulatedReceiptMinor:f.simulatedReceiptMinor,remainingMinor:f.remainingMinor},head};
}
