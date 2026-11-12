import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';

test('Network Investigator runs only on loopback and exposes no contact/transaction API',async()=>{
 const cwd=resolve(dirname(fileURLToPath(import.meta.url)),'..');
 const port=18809;
 const child=spawn(process.execPath,['server.mjs'],{
  cwd,env:{...process.env,PORT:String(port)},stdio:'ignore'
 });
 try{
  let response;
  for(let n=0;n<55;n++){
   try{response=await fetch('http://127.0.0.1:'+port+'/');break;}
   catch{await sleep(40);}
  }
  assert.ok(response,'Server must start');
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-security-policy')||'',/connect-src 'none'/);
  const html=await response.text();
  assert.match(html,/EVERY PERSON, ANSWER & PAYMENT HERE IS INVENTED/);
  assert.match(html,/Who do we/);
  for(const path of [
   '/ui.mjs','/network.mjs','/penny-puddle-010/relay.mjs',
   '/penny-puddle-012/question-value.mjs',
   '/penny-puddle-009/satisfaction.mjs'
  ]){
   const r=await fetch('http://127.0.0.1:'+port+path);
   assert.equal(r.status,200,path);
   assert.match(r.headers.get('content-type')||'',/javascript/);
   assert.ok((await r.text()).length>100);
  }
  for(const path of ['/api/search-contacts','/api/send','/api/pay',
   '/api/landlord-accept','/api/real-identity']){
   assert.equal((await fetch('http://127.0.0.1:'+port+path)).status,404);
  }
 }finally{child.kill('SIGTERM');}
});
