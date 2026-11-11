import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
test('local discovery front-end is read-only, serves its dependencies and disallows network requests',async()=>{
  const port=18801;
  const child=spawn(process.execPath,['server.mjs'],{
    cwd:root,env:{...process.env,PORT:String(port)},stdio:'ignore'
  });
  try{
    let response;
    for(let i=0;i<40;i++){
      try{response=await fetch('http://127.0.0.1:'+port+'/');break;}
      catch{await sleep(40);}
    }
    assert.ok(response,'Local server did not start');
    assert.equal(response.status,200);
    assert.match(response.headers.get('content-security-policy')||'',/connect-src 'none'/);
    const html=await response.text();
    assert.match(html,/FICTIONAL MARKET/);
    assert.match(html,/MOTIF-style affordance search/);
    for(const path of ['/ui.mjs','/opportunity.mjs','/bridge.mjs']){
      const r=await fetch('http://127.0.0.1:'+port+path);
      assert.equal(r.status,200,path);
      assert.match(r.headers.get('content-type')||'',/javascript/);
      assert.ok((await r.text()).length>100);
    }
    const forbidden=await fetch('http://127.0.0.1:'+port+'/payout');
    assert.equal(forbidden.status,404);
  }finally{child.kill('SIGTERM');}
});
