import test from 'node:test';
import assert from 'node:assert/strict';
import {generateSteward,newLedger,append,inspect} from '../src/asset-treasury-007.mjs';
import {livingIndex} from '../src/living-capacity-index-008.mjs';

const keys=generateSteward();
const t={id:'asset-hours-008',kind:'time',label:'Four voluntary repair hours',quantity:4,unit:'hour',
  mode:'service',purposeIds:['purpose-repair-008'],termsRef:'terms-hours-008'};
const g={id:'asset-kits-008',kind:'goods',label:'Two spare repair kits',quantity:2,unit:'kit',
  mode:'gift',purposeIds:['purpose-repair-008'],termsRef:'terms-kits-008'};
const need={id:'need-kit-008',title:'One repair kit requested',kind:'goods',
  unit:'kit',quantity:1,purposeId:'purpose-repair-008'};
const recipe={id:'recipe-repair-008',purposeId:'purpose-repair-008',termsRef:'terms-recipe-008',
  inputs:[{kind:'goods',unit:'kit',quantity:1},{kind:'time',unit:'hour',quantity:2}],
  output:{kind:'service',unit:'repair_session',quantity:1}};
const add=(l,type,p)=>append(l,keys,type,p);
const receive=(l,a)=> {
  l=add(l,'OFFER',a);
  l=add(l,'ACCEPT',{assetId:a.id,termsEvidenceRef:'terms-evidence-008'});
  return add(l,'RECEIVE',{assetId:a.id,evidenceRef:'receipt-attestation-008',assertion:'asset_received_attested'});
};
const base=()=>add(receive(receive(newLedger(keys),t),g),'NEED',need);

test('signed history projects only noncash available and open need',()=>{
  const p=livingIndex(base(),{recipes:[recipe]});
  assert.equal(p.assets.length,2);
  assert.deepEqual(p.assets.map(x=>x.available),[4,2]); // asset ID order
  assert.equal(p.needs[0].open,1);
  assert.equal(p.routes.length,1);
  assert.equal(p.routes[0].status,'PROPOSAL_ONLY');
  assert.equal(p.compositions[0].maximumBatchesIfExclusivelyAllocated,2);
  assert.equal(p.noSpendableMoney,true);
  assert.ok(!JSON.stringify(p).includes('Four voluntary repair hours'));
});
test('JSON cold replay produces identical index cut and deterministic hash',()=>{
  const l=base();
  const one=livingIndex(l,{recipes:[recipe]});
  const two=livingIndex(JSON.parse(JSON.stringify(l)),{recipes:[recipe]});
  assert.deepEqual(one,two);
  assert.match(one.cutHash,/^[a-f0-9]{64}$/);
});
test('stale source head fails closed, fresh source head works',()=>{
  const l=base(),head=inspect(l).head;
  const newer=add(l,'RESERVE',{id:'reserve-kit-008',assetId:g.id,needId:need.id,quantity:1});
  assert.throws(()=>livingIndex(newer,{expectedHead:head}),/stale signed history head/);
  assert.equal(livingIndex(l,{expectedHead:head}).sourceHistoryHead,head);
});
test('actual reservation reduces matching and later index cut; no speculative output minted',()=>{
  const l=base(),before=livingIndex(l,{recipes:[recipe]});
  const reserved=add(l,'RESERVE',{id:'reserve-kit-008',assetId:g.id,needId:need.id,quantity:1});
  const after=livingIndex(reserved,{recipes:[recipe]});
  assert.notEqual(after.cutHash,before.cutHash);
  assert.equal(after.assets.find(x=>x.id===g.id).available,1);
  assert.equal(after.needs[0].open,0);
  assert.equal(after.routes.length,0);
  assert.equal(after.compositions.length,1);
  assert.equal(after.compositions[0].maximumBatchesIfExclusivelyAllocated,1);
  assert.equal(after.assets.some(x=>x.kind==='service'),false);
  const fulfilled=add(reserved,'FULFILL',{reservationId:'reserve-kit-008',evidenceRef:'human-report-008'});
  assert.equal(livingIndex(fulfilled).needs[0].fulfilled,1);
});
test('OFFER and ACCEPT are not capacity without distinct RECEIVE',()=>{
  let l=newLedger(keys);
  l=add(l,'OFFER',t);
  assert.equal(livingIndex(l,{recipes:[recipe]}).compositions.length,0);
  l=add(l,'ACCEPT',{assetId:t.id,termsEvidenceRef:'terms-evidence-008'});
  assert.equal(livingIndex(l).assets[0].available,0);
});
test('no invented value from missing complementary input',()=>{
  const onlyTime=receive(newLedger(keys),t);
  const idx=livingIndex(onlyTime,{recipes:[recipe]});
  assert.equal(idx.compositions.length,0);
  assert.equal(idx.blockedRecipes.length,1);
  assert.equal(idx.blockedRecipes[0].maximumBatchesIfExclusivelyAllocated,0);
});
test('wrong purpose cannot compose even with quantities present',()=>{
  const other={...recipe,id:'recipe-other-008',purposeId:'purpose-other-008'};
  const p=livingIndex(base(),{recipes:[other]});
  assert.equal(p.compositions.length,0);
  assert.equal(p.blockedRecipes[0].maximumBatchesIfExclusivelyAllocated,0);
});
test('duplicate recipe input requirement is added, never double-uses capacity',()=>{
  const costly={...recipe,inputs:[
    {kind:'time',unit:'hour',quantity:3},
    {kind:'time',unit:'hour',quantity:3},
    {kind:'goods',unit:'kit',quantity:1}]};
  const p=livingIndex(base(),{recipes:[costly]});
  assert.equal(p.compositions.length,0);
  assert.equal(p.blockedRecipes[0].inputs.find(x=>x.kind==='time').neededPerBatch,6);
});
test('two recipes compete against the same inventory; they do not mint two outputs',()=>{
  const other={...recipe,id:'recipe-second-008'};
  const p=livingIndex(base(),{recipes:[recipe,other]});
  assert.equal(p.compositions.length,2);
  assert.deepEqual(p.compositions.map(x=>x.maximumBatchesIfExclusivelyAllocated),[2,2]);
  assert.equal(p.assets.find(x=>x.id===t.id).available,4);
  assert.match(p.notice,/not additive inventory/);
});
test('money exists only as a separate external attestation count, never cash available',()=>{
  const m={id:'asset-money-008',kind:'money',label:'Outside pledge',quantity:700,unit:'usd',
    mode:'external-funds',purposeIds:['purpose-repair-008'],termsRef:'terms-money-008'};
  let l=base();
  l=add(l,'OFFER',m);
  l=add(l,'ACCEPT',{assetId:m.id,termsEvidenceRef:'terms-evidence-008'});
  l=add(l,'RECEIVE',{assetId:m.id,evidenceRef:'bank-outside-008',assertion:'external_settlement_attested'});
  const p=livingIndex(l,{recipes:[recipe]});
  assert.equal(p.externalFundsAttestationCount,1);
  assert.equal(p.assets.some(x=>x.kind==='money'),false);
  assert.equal(p.routes.every(x=>x.assetId!==m.id),true);
  assert.equal(p.noSpendableMoney,true);
});
test('malformed, monetary, oversized and duplicate recipes fail closed',()=>{
  const l=base();
  assert.throws(()=>livingIndex(l,{recipes:[{...recipe,output:{kind:'money',unit:'usd',quantity:1}}]}),/invalid recipe output/);
  assert.throws(()=>livingIndex(l,{recipes:[recipe,recipe]}),/duplicate/);
  assert.throws(()=>livingIndex(l,{recipes:[{...recipe,unsafeContact:'private'}]}),/recipe schema/);
  assert.throws(()=>livingIndex(l,{recipes:[{...recipe,inputs:[{kind:'time',unit:'hour',quantity:1}]}]}),/2-12/);
});
test('signed tampering refused before any capacity appears',()=>{
  const altered=structuredClone(base());
  altered.events[0].payload.quantity=999;
  assert.throws(()=>livingIndex(altered,{recipes:[recipe]}),/invalid ledger signature/);
});
test('zero-money and empty histories are ordinary index cuts, not worthless people',()=>{
  const p=livingIndex(newLedger(keys));
  assert.equal(p.sourceHistoryHead,null);
  assert.equal(p.compositions.length,0);
  assert.equal(p.noSpendableMoney,true);
});
