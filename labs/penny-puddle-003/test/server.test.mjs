import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
const here=dirname(fileURLToPath(import.meta.url));
test('local browser laboratory serves all module dependencies without a remote endpoint',async()=>{
  const port=18799;
  const processChild=spawn(process.execPath,['server.mjs'],{
    cwd:resolve(here,'..'),env:{...process.env,PORT:String(port)},stdio:'ignore'
  });
  try{
    let response;
    for(let tries=0;tries<30;tries++){
      try {response=await fetch('http://127.0.0.1:'+port+'/');break;}
      catch {await sleep(50);}
    }
    assert.ok(response,'Local server did not start');
    assert.equal(response.status,200);
    assert.match(response.headers.get('content-security-policy')||'',/connect-src 'none'/);
    const html=await response.text();
    assert.match(html,/Small money/);
    assert.match(html,/LABORATORY ONLY/);
    for(const path of ['/ui.mjs','/demo.mjs','/weave.mjs','/penny-bank.mjs',
      '/batch-net.mjs','/puddle-001/penny-campaign.mjs']){
      const r=await fetch('http://127.0.0.1:'+port+path);
      assert.equal(r.status,200,'missing '+path);
      assert.match(r.headers.get('content-type')||'',/javascript/);
      assert.ok((await r.text()).length>50);
    }
    const missing=await fetch('http://127.0.0.1:'+port+'/secret.txt');
    assert.equal(missing.status,404);
  }finally{processChild.kill('SIGTERM');}
});
