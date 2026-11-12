import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';

test('Ask First board is loopback-only with zero contact, payment or person-guess APIs',async()=>{
  const cwd=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const port=18807;
  const child=spawn(process.execPath,['server.mjs'],{
    cwd,env:{...process.env,PORT:String(port)},stdio:'ignore'
  });
  try{
    let response;
    for(let i=0;i<50;i++){
      try{response=await fetch('http://127.0.0.1:'+port+'/');break;}
      catch{await sleep(35);}
    }
    assert.ok(response,'Server startup failed');
    assert.equal(response.status,200);
    assert.match(response.headers.get('content-security-policy')||'',/connect-src 'none'/);
    const html=await response.text();
    assert.match(html,/FICTIONAL PEOPLE & PREFERENCES/);
    assert.match(html,/Ask, don't/);
    for(const path of ['/ui.mjs','/context.mjs','/weave.mjs',
      '/penny-puddle-010/relay.mjs','/penny-puddle-007/dealweaver.mjs']){
      const r=await fetch('http://127.0.0.1:'+port+path);
      assert.equal(r.status,200,path);
      assert.match(r.headers.get('content-type')||'',/javascript/);
      assert.ok((await r.text()).length>100);
    }
    for(const path of ['/api/contacts','/api/profile','/api/send',
      '/api/pay','/api/deanonymize']){
      assert.equal((await fetch('http://127.0.0.1:'+port+path)).status,404);
    }
  }finally{child.kill('SIGTERM');}
});
