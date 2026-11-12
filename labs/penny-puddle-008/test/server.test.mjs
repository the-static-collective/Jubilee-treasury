import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';

test('Angel Circle serves only loopback UI and modules and prohibits external connections',async()=>{
  const port=18804;
  const cwd=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const child=spawn(process.execPath,['server.mjs'],{
    cwd,env:{...process.env,PORT:String(port)},stdio:'ignore'
  });
  try{
    let root;
    for(let i=0;i<45;i++){
      try{root=await fetch('http://127.0.0.1:'+port+'/');break;}
      catch{await sleep(40);}
    }
    assert.ok(root,'Local server must start');
    assert.equal(root.status,200);
    assert.match(root.headers.get('content-security-policy')||'',/connect-src 'none'/);
    const html=await root.text();
    assert.match(html,/ALL PEOPLE & PAYMENTS ARE FICTIONAL/);
    assert.match(html,/The rent is paid/);
    for(const path of ['/ui.mjs','/angel-puddle.mjs']){
      const r=await fetch('http://127.0.0.1:'+port+path);
      assert.equal(r.status,200,path);
      assert.match(r.headers.get('content-type')||'',/javascript/);
      assert.ok((await r.text()).length>100);
    }
    assert.equal((await fetch('http://127.0.0.1:'+port+'/real-payment')).status,404);
  } finally {child.kill('SIGTERM');}
});
