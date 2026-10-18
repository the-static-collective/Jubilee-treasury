import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createNeed, Journal } from '../src/ledger.mjs';
import { createPennyBox } from '../src/server.mjs';

test('mobile board and print assets share original editable design without inventing payments',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'penny-box-design-'));
 const journalPath=join(dir,'events.jsonl');
 new Journal(journalPath).append(createNeed({title:'A mock need',summary:'A synthetic box',goal:50,unit:'pennies'}));
 const server=createPennyBox({journalPath});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const base='http://127.0.0.1:'+server.address().port;
 try {
  const page=await (await fetch(base+'/')).text();
  assert.ok(page.includes('Small things count'));
  assert.ok(page.includes('name="viewport"'));
  assert.ok(page.includes('Raise a hand (anonymous)'));
  assert.ok(page.includes('href="/print"'));
  assert.equal(page.includes('owner-private.pem'),false);
  assert.equal(page.includes('payment card'),false);
  const css=await (await fetch(base+'/brand.css')).text();
  assert.ok(css.includes('--forest:#163e32'));
  assert.ok(css.includes('max-width:650px'));
  assert.ok(css.includes('focus-visible'));
  const preview=await (await fetch(base+'/print')).text();
  assert.ok(preview.includes('Approved QR goes here'));
  assert.ok(preview.includes('Place a QR code here'));
  for(const [path,width] of [
   ['/kit/poster-letter.svg','8.5in'],
   ['/kit/box-front-5x7.svg','5in'],
   ['/kit/box-top-8x2.svg','8in']
  ]){
   const r=await fetch(base+path);assert.equal(r.status,200);
   assert.match(r.headers.get('content-type'),/image\/svg\+xml/);
   const svg=await r.text();
   assert.ok(svg.includes('width="'+width+'"'),path);
   assert.ok(svg.includes('SMALL THINGS COUNT'),path);
   assert.equal(svg.includes('<script'),false);
   assert.equal(svg.includes('http://127.0.0.1:'),false);
  }
  assert.ok((await (await fetch(base+'/kit/poster-letter.svg')).text()).includes('id="qr-placeholder"'));
  assert.equal((await fetch(base+'/kit/owner-private.pem')).status,404);
  assert.equal((await fetch(base+'/api/board')).status,200);
 } finally {await new Promise(resolve=>server.close(resolve));rmSync(dir,{recursive:true,force:true});}
});

test('no QR generated before approval or for localhost/cleartext/private endpoints',()=>{
 const script=fileURLToPath(new URL('../scripts/build-poster.py',import.meta.url));
 const dir=mkdtempSync(join(tmpdir(),'penny-qr-'));
 const output=join(dir,'poster.svg');
 try {
  for(const args of [
   ['https://community.org/penny','--output',output],
   ['http://community.org/penny','--approved-by-steward','--output',output],
   ['https://localhost/penny','--approved-by-steward','--output',output],
   ['https://127.0.0.1/penny','--approved-by-steward','--output',output],
   ['https://username:password@community.org/penny','--approved-by-steward','--output',output],
   ['https://community.invalid/penny','--approved-by-steward','--output',output]
  ]){
   const r=spawnSync('python3',[script,...args],{encoding:'utf8',timeout:7000});
   assert.notEqual(r.status,0,JSON.stringify(args)); assert.equal(existsSync(output),false);
  }
 } finally {rmSync(dir,{recursive:true,force:true});}
});