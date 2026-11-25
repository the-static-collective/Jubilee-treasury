import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {join} from 'node:path';
import {lstatSync,readFileSync} from 'node:fs';
import {rootPath,writeNew} from './ark.mjs';
function context(root,slot,key){
 if(!Number.isInteger(slot)||slot<1||slot>8||!Buffer.isBuffer(key)||key.length!==32)throw Error('fixture slot and 32-byte key required');
 const dir=join(rootPath(root),'private'),s=lstatSync(dir);
 if(!s.isDirectory()||s.isSymbolicLink()||(process.platform!=='win32'&&(s.mode&0o077)!==0))throw Error('unsafe private directory');
 return {dir,name:'fixture-'+slot+'.json',aad:Buffer.from('ARK-SYNTHETIC:'+slot)};
}
// Fixed fictional identity only. Caller holds key; no real personal data accepted.
export function sealFixture(root,slot,key){
 const {dir,name,aad}=context(root,slot,key),iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);c.setAAD(aad);
 const ciphertext=Buffer.concat([c.update('SYNTHETIC-IDENTITY-'+slot,'utf8'),c.final()]);
 writeNew(dir,name,{iv:iv.toString('hex'),tag:c.getAuthTag().toString('hex'),ciphertext:ciphertext.toString('hex')});
}
export function readFixture(root,slot,key){
 const {dir,name,aad}=context(root,slot,key),path=join(dir,name),s=lstatSync(path);
 if(!s.isFile()||s.isSymbolicLink()||s.size>1024||(process.platform!=='win32'&&(s.mode&0o077)!==0))throw Error('unsafe fixture vault record');
 const r=JSON.parse(readFileSync(path,'utf8')),d=createDecipheriv('aes-256-gcm',key,Buffer.from(r.iv,'hex'));d.setAAD(aad);d.setAuthTag(Buffer.from(r.tag,'hex'));
 return Buffer.concat([d.update(Buffer.from(r.ciphertext,'hex')),d.final()]).toString('utf8');
}
