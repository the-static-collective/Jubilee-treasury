import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';

test('local question board serves source-owned 011/010/007 modules, no contacts or financial endpoints',async()=>{
  const cwd=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const port=18808;
  const child=spawn(process.execPath,['server.mjs'],{
    cwd,env:{...process.env,PORT:String(port)},stdio:'ignore'
  });
  try{
    let root;
    for(let n=0;n<55;n++){
      try{root=await fetch('http://127.0.0.1:'+port+'/');break;}
      catch{await sleep(40);}
    }
    assert.ok(root,'Expected local server');
    assert.equal(root.status,200);
    assert.match(root.headers.get('content-security-policy')||'',/connect-src 'none'/);
    const text=await root.text();
    assert.match(text,/PUBLIC FICTIONAL LAB/);
    assert.match(text,/Ask the right/);
    for(const route of [
      '/ui.mjs','/question-value.mjs','/weave.mjs',
      '/penny-puddle-011/weave.mjs','/penny-puddle-011/context.mjs',
      '/penny-puddle-010/relay.mjs','/penny-puddle-007/dealweaver.mjs'
    ]){
      const r=await fetch('http://127.0.0.1:'+port+route);
      assert.equal(r.status,200,route);
      assert.match(r.headers.get('content-type')||'',/javascript/);
      assert.ok((await r.text()).length>100);
    }
    for(const p of ['/api/contacts','/api/query-personality',
      '/api/send-invitation','/api/loan','/api/record-service']){
      assert.equal((await fetch('http://127.0.0.1:'+port+p)).status,404,p);
    }
  }finally{child.kill('SIGTERM');}
});
