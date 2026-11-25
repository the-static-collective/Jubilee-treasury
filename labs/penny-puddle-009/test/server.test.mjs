import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';
test('offline anchor board exposes no payment endpoints or network connections',async()=>{
 const cwd=resolve(dirname(fileURLToPath(import.meta.url)),'..');
 const port=18805;
 const child=spawn(process.execPath,['server.mjs'],{cwd,
  env:{...process.env,PORT:String(port)},stdio:'ignore'});
 try{
  let root;
  for(let n=0;n<50;n++){
   try{root=await fetch('http://127.0.0.1:'+port+'/');break;}
   catch{await sleep(35);}
  }
  assert.ok(root,'Server startup failed');
  assert.equal(root.status,200);
  assert.match(root.headers.get('content-security-policy')||'',/connect-src 'none'/);
  assert.match(await root.text(),/FICTIONAL PERSONS, ASSET, OFFERS & MONEY/);
  for(const modulePath of ['/ui.mjs','/anchor.mjs','/mosaic.mjs','/satisfaction.mjs']){
   const r=await fetch('http://127.0.0.1:'+port+modulePath);
   assert.equal(r.status,200,modulePath);
   assert.match(r.headers.get('content-type')||'',/javascript/);
   assert.ok((await r.text()).length>100);
  }
  assert.equal((await fetch('http://127.0.0.1:'+port+'/api/withdraw-gold')).status,404);
 }finally{child.kill('SIGTERM');}
});
