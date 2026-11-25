import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';

test('RELAY-010 is loopback-only, public-demo-only, and has no private/contact endpoints',async()=>{
 const port=18806;
 const cwd=resolve(dirname(fileURLToPath(import.meta.url)),'..');
 const child=spawn(process.execPath,['server.mjs'],{
  cwd,env:{...process.env,PORT:String(port)},stdio:'ignore'
 });
 try{
  let response;
  for(let i=0;i<50;i++){
   try{response=await fetch('http://127.0.0.1:'+port+'/');break;}
   catch{await sleep(35);}
  }
  assert.ok(response,'Local server must start');
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-security-policy')||'',/connect-src 'none'/);
  const html=await response.text();
  assert.match(html,/ONLY FICTIONAL PEOPLE & CONTACTS/);
  assert.match(html,/Ask, don't assume/);
  for(const path of ['/ui.mjs','/relay.mjs','/weave.mjs','/penny-puddle-009/satisfaction.mjs']){
   const item=await fetch('http://127.0.0.1:'+port+path);
   assert.equal(item.status,200,path);
   assert.match(item.headers.get('content-type')||'',/javascript/);
   assert.ok((await item.text()).length>100);
  }
  assert.equal((await fetch('http://127.0.0.1:'+port+'/api/contacts')).status,404);
  assert.equal((await fetch('http://127.0.0.1:'+port+'/api/send-intro')).status,404);
  assert.equal((await fetch('http://127.0.0.1:'+port+'/api/execute-money')).status,404);
 }finally{child.kill('SIGTERM');}
});
