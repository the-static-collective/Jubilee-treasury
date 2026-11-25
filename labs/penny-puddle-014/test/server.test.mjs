import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';

test('CONCORD-014 is loopback only; sourced 010/012/009 modules; no messaging or finance APIs',async()=>{
 const cwd=resolve(dirname(fileURLToPath(import.meta.url)),'..'),port=18810;
 const processLocal=spawn(process.execPath,['server.mjs'],{
  cwd,env:{...process.env,PORT:String(port)},stdio:'ignore'
 });
 try{
  let root;
  for(let i=0;i<55;i++){
    try{root=await fetch('http://127.0.0.1:'+port+'/');break;}
    catch{await sleep(35);}
  }
  assert.ok(root,'Expected loopback server to start');
  assert.equal(root.status,200);
  assert.match(root.headers.get('content-security-policy')||'',/connect-src 'none'/);
  assert.match(await root.text(),/ALL PEOPLE, CAPABILITIES, PRIORS & MONEY ARE FICTIONAL/);
  for(const route of [
   '/ui.mjs','/composer.mjs','/planner.mjs',
   '/penny-puddle-010/relay.mjs',
   '/penny-puddle-012/question-value.mjs',
   '/penny-puddle-009/satisfaction.mjs'
  ]){
   const r=await fetch('http://127.0.0.1:'+port+route);
   assert.equal(r.status,200,route);
   assert.match(r.headers.get('content-type')||'',/javascript/);
   assert.ok((await r.text()).length>100);
  }
  for(const path of ['/api/contacts','/api/send','/api/charge',
   '/api/release-tenant-debt','/api/assign-service',
   '/api/gold-title','/api/guess-preferences']){
   assert.equal((await fetch('http://127.0.0.1:'+port+path)).status,404);
  }
 }finally{processLocal.kill('SIGTERM');}
});
