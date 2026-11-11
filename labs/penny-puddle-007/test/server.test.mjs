import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';

test('mobile dealmaker serves only read-only local script assets with no external network',async()=>{
  const port=18803;
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
    assert.match(html,/ALL FIGURES AND PEOPLE ARE FICTIONAL/);
    assert.match(html,/A gold brick the size of a table/);
    for(const route of ['/ui.mjs','/dealweaver.mjs','/asset-doors.mjs','/principal-only.mjs']){
      const response=await fetch('http://127.0.0.1:'+port+route);
      assert.equal(response.status,200,route);
      assert.match(response.headers.get('content-type')||'',/javascript/);
      assert.ok((await response.text()).length>100);
    }
    assert.equal((await fetch('http://127.0.0.1:'+port+'/payments')).status,404);
  }finally{child.kill('SIGTERM');}
});
