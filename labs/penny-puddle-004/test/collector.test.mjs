import test from 'node:test';
import assert from 'node:assert/strict';
import {createRareCoinLab} from '../collector.mjs';
import {screenCoinCandidate} from '../triage.mjs';
const sample=(extra={})=>createRareCoinLab({specimens:[{
  id:'cent-a',denominationCents:1,declaredOwnerId:'owner-A',declaredFinderId:'finder-F',
  observedYear:1943,observedMintMark:'unverified',observedSignals:['copper-like'],
  collateralized:false,...extra
}]});
const choose=(lab)=>lab.proposeOwnerChoice({specimenId:'cent-a',ownerId:'owner-A',
  choice:'collector-offer',reference:'mock-written-agreement',
  sharesBasisPoints:{owner:8000,finder:1000,steward:500,community:500}});
function authenticate(lab) {
  lab.review({specimenId:'cent-a',reviewerId:'reviewer-R',disposition:'needs-expert',
    evidenceReference:'mock-photo-1'});
  lab.authenticate({specimenId:'cent-a',expertId:'expert-E',reference:'mock-grade-1',
    outcome:'authentic-collectible'});
}
test('a 1943 copper-like cent triggers manual review but NO price or authenticity',()=>{
  const p=screenCoinCandidate({denominationCents:1,observedYear:1943,reportedFeatures:['copper-like']});
  assert.equal(p.disposition,'quarantine-for-human-review');
  assert.equal(p.isAuthenticated,false);
  assert.equal(p.hasPriceEstimate,false);
  assert.ok(p.flags.some(f=>f.code==='1943-off-metal-candidate'));
  assert.equal(p.noCleanOrPolish,true);
});
test('a 1955 doubling observation and old silver-era quarter are candidates only',()=>{
  const doubled=screenCoinCandidate({denominationCents:1,observedYear:1955,reportedFeatures:['doubled-lettering']});
  assert.ok(doubled.flags.some(f=>f.code==='1955-doubled-die-candidate'));
  const q=screenCoinCandidate({denominationCents:25,observedYear:1964});
  assert.ok(q.flags.some(f=>f.code==='silver-era-composition-review'));
  const h=screenCoinCandidate({denominationCents:50,observedYear:1968});
  assert.ok(h.flags.some(f=>f.code==='1965-1970-half-dollar-review'));
});
test('ordinary current coins do not get fabricated rare prices',()=>{
  const p=screenCoinCandidate({denominationCents:10,observedYear:2023});
  assert.equal(p.disposition,'no-rule-match-review-still-optional');
  assert.deepEqual(p.flags,[]);
  assert.equal(p.hasPriceEstimate,false);
});
test('fail closed for unsupported denomination and nonsensical date',()=>{
  assert.throws(()=>screenCoinCandidate({denominationCents:3,observedYear:1900}),/Unsupported/);
  assert.throws(()=>screenCoinCandidate({denominationCents:1,observedYear:1999.5}),/observed year/);
});
test('a suspected coin is excluded from coin-backed supply before ownership review',()=>{
  const lab=sample(); const s=lab.inspect();
  assert.equal(s.issuedCoinBackedCents,0);
  assert.equal(s.totalFaceValueCents,1);
  assert.equal(s.coins[0].reserveBackingIssuedCents,0);
  assert.equal(s.coins[0].status,'quarantined-for-owner-review');
  assert.equal(s.realCustodyVerified,false);
});
test('coin already collateralized in a PENNY bank cannot be re-listed as a free specimen',()=>{
  assert.throws(()=>sample({collateralized:true}),/collateral/);
  assert.throws(()=>sample({collateralized:undefined}),/Explicit noncollateralized/);
});
test('independent reviewer is required and cannot authorize a sale on its own',()=>{
  const lab=sample();
  assert.throws(()=>lab.review({specimenId:'cent-a',reviewerId:'owner-A',disposition:'needs-expert',evidenceReference:'photo'}),/Independent/);
  assert.throws(()=>choose(lab),/Held/);
  lab.review({specimenId:'cent-a',reviewerId:'reviewer-R',disposition:'needs-expert',evidenceReference:'photo'});
  assert.throws(()=>choose(lab),/Held/);
  const actions=lab.availableActions('cent-a');
  assert.deepEqual(actions.actions,['independent-expert-appraisal','preserve']);
});
test('expert may find coin ordinary without converting it to PENNY or issuing any premium',()=>{
  const lab=sample();
  lab.review({specimenId:'cent-a',reviewerId:'reviewer-R',disposition:'needs-expert',evidenceReference:'photo'});
  lab.authenticate({specimenId:'cent-a',expertId:'expert-E',reference:'grade',outcome:'not-collectible'});
  assert.equal(lab.inspect().coins[0].status,'ordinary-held-for-owner-choice');
  assert.throws(()=>choose(lab),/Only confirmed/);
  assert.equal(lab.inspect().issuedCoinBackedCents,0);
});
test('owner must explicitly opt in; finder or steward cannot sell the coin',()=>{
  const lab=sample(); authenticate(lab);
  assert.throws(()=>lab.proposeOwnerChoice({specimenId:'cent-a',ownerId:'finder-F',choice:'collector-offer',reference:'not-authorized'}),/Only declared owner/);
  assert.throws(()=>lab.simulateSale({specimenId:'cent-a',externalSalePriceCents:999,externalCostsCents:0,buyerReference:'b',ownerReference:'o'}),/No approved/);
  choose(lab);
  assert.equal(lab.inspect().coins[0].status,'offer-approval-hold');
});
test('split must be explicitly owner-approved and sum to exactly 100%',()=>{
  const lab=sample();authenticate(lab);
  assert.throws(()=>lab.proposeOwnerChoice({specimenId:'cent-a',ownerId:'owner-A',
    choice:'collector-offer',reference:'bad',sharesBasisPoints:{owner:8000,finder:500,steward:500,community:500}}),/10000/);
  assert.equal(lab.inspect().coins[0].status,'collector-confirmed-in-fixture');
});
test('gross minus costs equals owner face plus opt-in split of realized synthetic premium',()=>{
  const lab=sample();authenticate(lab);choose(lab);
  const result=lab.simulateSale({
    specimenId:'cent-a',externalSalePriceCents:10001,externalCostsCents:1000,
    buyerReference:'mock-buyer-signature',ownerReference:'mock-owner-signature'
  });
  assert.equal(result.status,'simulated-sale-not-settled');
  const settlement=lab.inspect().coins[0].settlement;
  assert.equal(settlement.faceValueCents,1);
  assert.equal(settlement.collectorPremiumCents,9000);
  assert.deepEqual(settlement.allocationsCents,{owner:7201,finder:900,steward:450,community:450});
  assert.equal(Object.values(settlement.allocationsCents).reduce((a,b)=>a+b,0)+settlement.externalCostsCents,10001);
  assert.equal(settlement.actualBuyerFundsReceived,false);
  assert.equal(settlement.coinTransferred,false);
  assert.equal(lab.inspect().realPayoutsCents,0);
  assert.equal(lab.inspect().issuedCoinBackedCents,0);
});
test('rounding residue in tiny premium belongs to owner, never creates a cent',()=>{
  const lab=sample();authenticate(lab);choose(lab);
  lab.simulateSale({specimenId:'cent-a',externalSalePriceCents:5,externalCostsCents:0,buyerReference:'b',ownerReference:'o'});
  const s=lab.inspect().coins[0].settlement;
  assert.equal(s.collectorPremiumCents,4);
  assert.equal(Object.values(s.allocationsCents).reduce((a,b)=>a+b,0),5);
  assert.equal(s.allocationsCents.owner,5);
});
test('below-face or fee-consuming sales fail before altering ownership',()=>{
  const lab=sample();authenticate(lab);choose(lab);
  assert.throws(()=>lab.simulateSale({specimenId:'cent-a',externalSalePriceCents:1,externalCostsCents:1,buyerReference:'b',ownerReference:'o'}),/No positive/);
  assert.equal(lab.inspect().coins[0].status,'offer-approval-hold');
});
test('one modeled coin can only have one simulated sale',()=>{
  const lab=sample();authenticate(lab);choose(lab);
  const offer={specimenId:'cent-a',externalSalePriceCents:500,externalCostsCents:50,buyerReference:'b',ownerReference:'o'};
  lab.simulateSale(offer);
  assert.throws(()=>lab.simulateSale(offer),/No approved/);
});
test('returned snapshot cannot mutate hidden custody state',()=>{
  const lab=sample();const s=lab.inspect();
  s.coins[0].status='collector-confirmed-in-fixture';
  s.coins[0].signals.push('fake');
  assert.equal(lab.inspect().coins[0].status,'quarantined-for-owner-review');
  assert.equal(lab.inspect().coins[0].signals.includes('fake'),false);
});
test('other U.S. denominations can be modeled with face value, not a guaranteed premium',()=>{
  const lab=createRareCoinLab({specimens:[
    {id:'dime',denominationCents:10,declaredOwnerId:'o',declaredFinderId:'f',collateralized:false},
    {id:'quarter',denominationCents:25,declaredOwnerId:'o',declaredFinderId:'f',collateralized:false},
    {id:'half',denominationCents:50,declaredOwnerId:'o',declaredFinderId:'f',collateralized:false},
    {id:'dollar',denominationCents:100,declaredOwnerId:'o',declaredFinderId:'f',collateralized:false},
    {id:'nickel',denominationCents:5,declaredOwnerId:'o',declaredFinderId:'f',collateralized:false}
  ]});
  assert.equal(lab.inspect().totalFaceValueCents,190);
  assert.equal(lab.inspect().coins.every(c=>c.collectorValueConfirmedCents===0),true);
});
