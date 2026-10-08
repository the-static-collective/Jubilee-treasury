import test from 'node:test';
import assert from 'node:assert/strict';
import {generateSteward,newLedger,append,inspect} from '../src/asset-treasury-007.mjs';
import {
  pennySource,recursivePennyOptions,defaultPennyRecipes,
  hypotheticalInterest,validateRecipes
} from '../src/penny-recursion-013.mjs';
import {buildSyntheticPennyWorld,demo,PURPOSE} from '../src/penny-recursion-cli-013.mjs';
const AT='2026-10-08T20:00:00.000Z';
function offerWithoutReceipt(){
  const keys=generateSteward();
  return {keys,ledger:append(newLedger(keys),keys,'OFFER',{
    id:'unreceived-pennies-001',kind:'coins',label:'Declared penny jar',
    quantity:37,unit:'penny',mode:'gift',purposeIds:[PURPOSE],
    termsRef:'terms-unaccepted-001'
  },AT)};
}
function receiptFor(ledger,keys,id){
  const accepted=append(ledger,keys,'ACCEPT',{assetId:id,termsEvidenceRef:'terms-accepted-001'},AT);
  return append(accepted,keys,'RECEIVE',{assetId:id,evidenceRef:'local-steward-receipt-001',
    assertion:'asset_received_attested'},AT);
}
function fake(label='stage_cycle_001'){
  return {id:label,purposeId:PURPOSE,termsRef:'local-consent-required-001',
    from:'held',to:'counted',minimumPennies:1,laborMinutes:1,evidenceClass:'inspection'};
}
test('37p local signed attestation and later separate 63p receipt accumulate exactly 100 units',()=>{
  const {after37,after100,withLabor}=buildSyntheticPennyWorld();
  assert.equal(pennySource(after37,PURPOSE).heldCoinCountFromSignedStewardClaims,37);
  assert.equal(pennySource(after100,PURPOSE).heldCoinCountFromSignedStewardClaims,100);
  assert.equal(pennySource(withLabor,PURPOSE).heldCoinCountFromSignedStewardClaims,100);
  assert.equal(pennySource(withLabor,PURPOSE).sourceLots.length,2);
  assert.equal(pennySource(withLabor,PURPOSE).laborMinutesFromSignedStewardClaims,15);
  assert.notEqual(inspect(after37).head,inspect(after100).head);
});
test('unsigned offer cannot enter held inventory until explicitly locally accepted/received',()=>{
  const {keys,ledger}=offerWithoutReceipt();
  assert.equal(pennySource(ledger,PURPOSE).heldCoinCountFromSignedStewardClaims,0);
  const accepted=append(ledger,keys,'ACCEPT',{assetId:'unreceived-pennies-001',termsEvidenceRef:'consent-001'},AT);
  assert.equal(pennySource(accepted,PURPOSE).heldCoinCountFromSignedStewardClaims,0);
  assert.equal(pennySource(receiptFor(ledger,keys,'unreceived-pennies-001'),PURPOSE).heldCoinCountFromSignedStewardClaims,37);
});
test('read-only source refuses forged evidence, bad signature and wrong head',()=>{
  const {after37,withLabor}=buildSyntheticPennyWorld();
  const fake=structuredClone(after37);
  fake.events[0].payload.quantity=100000;
  assert.throws(()=>pennySource(fake,PURPOSE),/signature/);
  assert.throws(()=>recursivePennyOptions(withLabor,{purposeId:PURPOSE,
    recipes:defaultPennyRecipes(PURPOSE),expectedHead:'f'.repeat(64)}),/stale/);
});
test('unverified pledge in Trickle is not a physical coin receipt in signed Asset Treasury',()=>{
  const {keys,ledger}=offerWithoutReceipt();
  assert.equal(pennySource(ledger,PURPOSE).heldCoinCountFromSignedStewardClaims,0);
  assert.equal(recursivePennyOptions(ledger,{purposeId:PURPOSE,
    recipes:defaultPennyRecipes(PURPOSE)}).projectedRoutes.length,0);
});
test('coins reserved through signed Treasury need cannot be counted as available twice',()=>{
  const {withLabor,keys}=buildSyntheticPennyWorld();
  const needId='need-counted-pennies-001',reserveId='reserve-actual-pennies-001';
  let ledger=append(withLabor,keys,'NEED',{id:needId,title:'Another independent receiving commitment',
    kind:'coins',unit:'penny',quantity:37,purposeId:PURPOSE},AT);
  ledger=append(ledger,keys,'RESERVE',{id:reserveId,assetId:'lot-penny-037-001',
    needId,quantity:37},AT);
  const p=pennySource(ledger,PURPOSE);
  assert.equal(p.heldCoinCountFromSignedStewardClaims,63);
  assert.equal(p.sourceLots.length,1);
});
test('no script step invents fresh coin count, deposited cash, legal title or interest income',()=>{
  const {withLabor}=buildSyntheticPennyWorld();
  const r=recursivePennyOptions(withLabor,{purposeId:PURPOSE,recipes:defaultPennyRecipes(PURPOSE)});
  assert.ok(r.projectedRoutes.length>3);
  assert.equal(r.rootCoinCount,100);
  assert.equal(r.newAssetsCreated,0);
  assert.equal(r.earnedInterestMinorUsd,0);
  assert.equal(r.operatorCashAvailableMinorUsd,0);
  for(const option of r.projectedRoutes){
    assert.equal(option.pennyCountIfThisExclusiveRouteSelected,100);
    assert.equal(option.actualCoinDelta,0);
    assert.equal(option.interestPaidMinorUsd,0);
    assert.equal(option.custodyChanged,false);
    assert.equal(option.newDonationsReceived,0);
    assert.equal(option.alternativeNotAdditive,true);
  }
});
test('recursive sorting, story, deposit and invitation paths branch but never sum',()=>{
 const {withLabor}=buildSyntheticPennyWorld();
 const r=recursivePennyOptions(withLabor,{purposeId:PURPOSE,recipes:defaultPennyRecipes(PURPOSE)});
 const destinations=r.projectedRoutes.map(x=>x.to);
 assert.ok(destinations.includes('counted'));
 assert.ok(destinations.includes('sorted'));
 assert.ok(destinations.includes('story_ready'));
 assert.ok(destinations.includes('deposit_candidate'));
 assert.ok(destinations.includes('interest_account_candidate'));
 assert.ok(destinations.includes('invitation_candidate'));
 assert.ok(destinations.includes('external_gift_request'));
 assert.equal(r.source.sourceLots.length,2);
 assert.equal(new Set(r.projectedRoutes.map(x=>x.optionId)).size,r.projectedRoutes.length);
 assert.notEqual(r.indexHash,r.source.sourceDigest);
});
test('without separately received labor minutes, more pennies do not magically perform processing',()=>{
 const {after100}=buildSyntheticPennyWorld();
 const r=recursivePennyOptions(after100,{purposeId:PURPOSE,recipes:defaultPennyRecipes(PURPOSE)});
 assert.equal(r.projectedRoutes.length,0);
 assert.ok(r.blockedRoutes.some(x=>x.reason==='insufficient_independently_received_labor'));
});
test('a bounded shared work pool cannot be spent twice along one recursive path',()=>{
 const {withLabor}=buildSyntheticPennyWorld();
 const recipes=defaultPennyRecipes(PURPOSE).map(r=>({...r,laborMinutes:10}));
 const r=recursivePennyOptions(withLabor,{purposeId:PURPOSE,recipes,maxDepth:7});
 assert.ok(r.projectedRoutes.some(x=>x.to==='counted'));
 assert.ok(!r.projectedRoutes.some(x=>x.to==='sorted'));
 assert.ok(r.blockedRoutes.some(x=>x.reason==='insufficient_independently_received_labor'));
});
test('unrelated purpose cannot convert the same signed lots without terms approval',()=>{
 const {withLabor}=buildSyntheticPennyWorld();
 const r=recursivePennyOptions(withLabor,{purposeId:'purpose-another-cause-001',
   recipes:defaultPennyRecipes('purpose-another-cause-001')});
 assert.equal(r.rootCoinCount,0);
 assert.equal(r.projectedRoutes.length,0);
});
test('recipe may not run backwards, mint coins, claim money outputs or recurse without work',()=>{
 const arr=[
  {...fake(),from:'counted',to:'held'},
  {...fake(),from:'held',to:'held'},
  {...fake(),from:'held',to:'bank_account'},
  {...fake(),laborMinutes:0},
  {...fake(),minimumPennies:-1},
  {...fake(),interestRateBasisPoints:600}
 ];
 for(const r of arr)assert.throws(()=>validateRecipes([r]),/PENNY_RECURSION_HOLD/);
});
test('duplicate recipe IDs, unbounded recursion, too many scenarios and stale head fail closed',()=>{
 assert.throws(()=>validateRecipes([fake(),fake()]),/duplicate/);
 const {withLabor}=buildSyntheticPennyWorld();
 const cfg={purposeId:PURPOSE,recipes:defaultPennyRecipes(PURPOSE)};
 assert.throws(()=>recursivePennyOptions(withLabor,{...cfg,maxDepth:800}),/maxDepth/);
 assert.throws(()=>recursivePennyOptions(withLabor,{...cfg,maxCandidates:10000}),/scenario/);
});
test('truncated exploration advertises incompleteness and does not fabricate further income',()=>{
 const {withLabor}=buildSyntheticPennyWorld();
 const r=recursivePennyOptions(withLabor,{purposeId:PURPOSE,recipes:defaultPennyRecipes(PURPOSE),maxCandidates:2});
 assert.equal(r.projectedRoutes.length,2);
 assert.equal(r.truncated,true);
 assert.equal(r.earnedInterestMinorUsd,0);
});
test('replaying the unchanged ledger yields exact deterministic source and candidate IDs',()=>{
 const {withLabor}=buildSyntheticPennyWorld();
 const cfg={purposeId:PURPOSE,recipes:defaultPennyRecipes(PURPOSE)};
 const a=recursivePennyOptions(withLabor,cfg),b=recursivePennyOptions(structuredClone(withLabor),cfg);
 assert.deepEqual(a,b);
});
test('a signed new asset changes head and options, cannot rewrite historical alternatives',()=>{
 const {after37,withLabor}=buildSyntheticPennyWorld();
 const a=recursivePennyOptions(after37,{purposeId:PURPOSE,recipes:defaultPennyRecipes(PURPOSE)});
 const b=recursivePennyOptions(withLabor,{purposeId:PURPOSE,recipes:defaultPennyRecipes(PURPOSE)});
 assert.notEqual(a.indexHash,b.indexHash);
 assert.notEqual(a.source.sourceHistoryHead,b.source.sourceHistoryHead);
});
test('illustrative APR is not claimed bank interest and cannot mutate local source inventory',()=>{
 const {withLabor}=buildSyntheticPennyWorld();
 const ledgerBefore=JSON.stringify(withLabor);
 const result=hypotheticalInterest(withLabor,{purposeId:PURPOSE,aprBasisPoints:500,months:12});
 assert.equal(result.sourcePennyCount,100);
 assert.equal(result.actuallyEarnedInterestCents,0);
 assert.equal(result.actualFundsDepositedCents,0);
 assert.equal(result.actualNewCoins,0);
 assert.equal(result.sourceInventoryUnchanged,true);
 assert.equal(JSON.stringify(withLabor),ledgerBefore);
 assert.ok(result.timeline.every(x=>Number.isSafeInteger(x.imaginedInterestCents)));
});
test('hypothetical contributions and possible interest never become holdings; guards refuse rate spoofing',()=>{
 const {after37}=buildSyntheticPennyWorld();
 const r=hypotheticalInterest(after37,{
   purposeId:PURPOSE,aprBasisPoints:1200,months:12,monthlyFutureContributionPennies:100});
 assert.equal(r.actuallyEarnedInterestCents,0);
 assert.equal(r.sourcePennyCount,37);
 assert.ok(r.imaginedFinalBalanceCents>37);
 assert.throws(()=>hypotheticalInterest(after37,{purposeId:PURPOSE,aprBasisPoints:-1}),/APR/);
 assert.throws(()=>hypotheticalInterest(after37,{purposeId:PURPOSE,aprBasisPoints:30000}),/APR/);
 assert.throws(()=>hypotheticalInterest(after37,{purposeId:PURPOSE,months:10000}),/months/);
});
test('producer demo documents real signed synthetic accumulation vs alternative-only recursive routes',()=>{
 const r=demo();
 assert.equal(r.before.coins,37);
 assert.equal(r.after.coins,100);
 assert.equal(r.separateOutcomes.realNewCoinsInSyntheticSignedFixture,63);
 assert.equal(r.separateOutcomes.newAssetsFromRecursion,0);
 assert.equal(r.separateOutcomes.moneyFromRecursionCents,0);
 assert.equal(r.hypotheticalOnly.actuallyEarnedInterestCents,0);
});
