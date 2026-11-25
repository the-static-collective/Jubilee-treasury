import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { Journal, createNeed, createObservation, replay } from '../src/ledger.mjs';
import { createPennyBox } from '../src/server.mjs';

const TOKEN = 'test-steward-local-secret-with-length-01';
const temp = () => mkdtempSync(join(tmpdir(), 'penny-box-'));
async function start(path) {
  const server=createPennyBox({journalPath:path,stewardToken:TOKEN});
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  return {server,base:'http://127.0.0.1:'+server.address().port};
}
async function request(base,path,{method='GET',body,token}={}) {
  const response=await fetch(base+path,{
    method,
    headers:{...(body?{'Content-Type':'application/json'}:{}),
      ...(token?{'Authorization':'Bearer '+token}:{})},
    ...(body?{body:JSON.stringify(body)}:{})
  });
  const type=response.headers.get('Content-Type')||'';
  return {status:response.status,
    data:type.includes('text/html')||type.includes('javascript')
      ?await response.text():await response.json()};
}
const stop=server=>new Promise(resolve=>server.close(resolve));

test('physical coins, completed deliveries, received devices stay separate from anonymous offers',async()=>{
  const dir=temp(),file=join(dir,'data.jsonl'),journal=new Journal(file);
  let app;
  try {
    const coin=journal.append(createNeed({title:'Penny box',summary:'Collect pocket change',goal:100,unit:'pennies'})).event.need;
    const service=journal.append(createNeed({title:'Grocery delivery',summary:'Help local pantry',goal:8,unit:'deliveries'})).event.need;
    const equipment=journal.append(createNeed({title:'Old computers',summary:'Community repair shelf',goal:2,unit:'devices'})).event.need;
    app=await start(file);
    assert.equal((await request(app.base,'/api/board')).data.needs.length,3);
    const offer=await request(app.base,'/api/interest',{
      method:'POST',body:{needId:equipment.id,kind:'equipment'}});
    assert.equal(offer.status,202);
    assert.equal(offer.data.status,'CANDIDATE_ONLY');
    assert.equal((await request(app.base,'/api/board')).data.needs[2].observed,0);
    assert.equal((await request(app.base,'/api/steward/ledger')).status,401);
    assert.equal((await request(app.base,'/api/steward/ledger',{token:TOKEN})).data.offers.length,1);
    assert.equal((await request(app.base,'/api/steward/observe',{method:'POST',
      body:{needId:coin.id,quantity:3,unit:'pennies',basis:'STEWARDS_COUNTED_COINS'}})).status,401);
    assert.equal((await request(app.base,'/api/steward/observe',{method:'POST',token:TOKEN,
      body:{needId:coin.id,quantity:3,unit:'pennies',basis:'STEWARDS_COUNTED_COINS'}})).status,201);
    assert.equal((await request(app.base,'/api/steward/observe',{method:'POST',token:TOKEN,
      body:{needId:service.id,quantity:2,unit:'deliveries',basis:'STEWARD_CONFIRMED_DELIVERY'}})).status,201);
    assert.equal((await request(app.base,'/api/steward/observe',{method:'POST',token:TOKEN,
      body:{needId:equipment.id,quantity:1,unit:'devices',basis:'STEWARD_RECEIVED_DEVICE'}})).status,201);
    assert.deepEqual((await request(app.base,'/api/board')).data.needs.map(n=>[n.unit,n.observed]),
      [['pennies',3],['deliveries',2],['devices',1]]);
    assert.equal((await request(app.base,'/api/steward/observe',{method:'POST',token:TOKEN,
      body:{needId:service.id,quantity:1,unit:'pennies',basis:'STEWARDS_COUNTED_COINS'}})).status,400);
    assert.equal((await request(app.base,'/api/interest',{method:'POST',
      body:{needId:coin.id,kind:'transport',name:'DO NOT COLLECT'}})).status,400);
    assert.equal((await request(app.base,'/api/steward/close',{method:'POST',token:TOKEN,
      body:{needId:equipment.id}})).status,200);
    assert.equal((await request(app.base,'/api/interest',{method:'POST',
      body:{needId:equipment.id,kind:'equipment'}})).status,400);
    assert.equal(readFileSync(file,'utf8').includes('DO NOT COLLECT'),false);
  } finally {
    if(app)await stop(app.server);
    rmSync(dir,{recursive:true,force:true});
  }
});

test('public display and QR poster escape steward-authored text; private journal is never an endpoint',async()=>{
  const dir=temp(),file=join(dir,'data.jsonl');let app;
  try {
    new Journal(file).append(createNeed({title:'<script>injection</script>',
      summary:'A <br> ordinary need',goal:9,unit:'pennies'}));
    app=await start(file);
    const page=await request(app.base,'/');
    assert.equal(page.status,200);
    assert.ok(page.data.includes('&lt;script&gt;injection&lt;/script&gt;'));
    assert.equal(page.data.includes('<script>injection</script>'),false);
    assert.ok(page.data.includes('Small things count'));
    assert.ok(page.data.includes('Raise a hand (anonymous)'));
    assert.equal((await request(app.base,'/ui.js')).status,200);
    const poster=await request(app.base,'/print');
    assert.equal(poster.status,200);
    assert.ok(poster.data.includes('Approved QR goes here'));
    assert.equal((await request(app.base,'/api/steward/ledger')).status,401);
    assert.equal((await request(app.base,'/events.jsonl')).status,404);
  } finally {
    if(app)await stop(app.server);
    rmSync(dir,{recursive:true,force:true});
  }
});

test('recomputed or tampered external ledger is not served as verified progress',async()=>{
  const dir=temp(),file=join(dir,'data.jsonl');let app;
  try {
    new Journal(file).append(createNeed({title:'Penny box',summary:'Coin observation',goal:25,unit:'pennies'}));
    writeFileSync(file,readFileSync(file,'utf8').replace('Penny box','Changed tally'));
    assert.throws(()=>new Journal(file).state(),/Journal chain does not verify/);
    app=await start(file);
    assert.equal((await request(app.base,'/api/board')).status,503);
    assert.equal((await request(app.base,'/health')).status,503);
  } finally {
    if(app)await stop(app.server);
    rmSync(dir,{recursive:true,force:true});
  }
});

test('no currency mint, settlement or automatic service credit can enter the typed journal',()=>{
  const event=createNeed({title:'Small coin',summary:'A tiny community gift',goal:1,unit:'pennies'});
  assert.throws(()=>createNeed({title:'Dollars',summary:'bad',goal:5,unit:'usd'}),/Unrecognized unit/);
  assert.throws(()=>createObservation({needId:event.need.id,quantity:100,
    unit:'pennies',basis:'BANK_SETTLEMENT'}),/Wrong observation basis/);
  assert.throws(()=>replay([{type:'penny.issued',amount:1}]),/Unknown event type/);
  assert.throws(()=>replay([{type:'money.settled',amount:1}]),/Unknown event type/);
  assert.equal(replay([event]).needs[0].done,0);
});
