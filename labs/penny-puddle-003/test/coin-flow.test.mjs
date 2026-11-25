import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeCoinCirculation} from '../coin-flow.mjs';
const sample=()=>({
 stewards:[{id:'A',availableUnencumberedCoins:100},{id:'B',availableUnencumberedCoins:40}],
 requests:[{id:'grocer',coinsRequested:90,consentForModel:true},{id:'shop',coinsRequested:80,consentForModel:true}],
 links:[
   {id:'A-grocer',fromSteward:'A',toRequest:'grocer',maxCoins:100,perTripCostCents:30,per100CoinHandlingCents:5,consentForModel:true},
   {id:'B-grocer',fromSteward:'B',toRequest:'grocer',maxCoins:40,perTripCostCents:15,per100CoinHandlingCents:5,consentForModel:true},
   {id:'A-shop',fromSteward:'A',toRequest:'shop',maxCoins:100,perTripCostCents:10,per100CoinHandlingCents:5,consentForModel:true},
 ]
});
test('physical coin circulation never allocates more than witnessed-model inventory',()=>{
 const p=proposeCoinCirculation(sample());
 assert.equal(p.status,'physical-circulation-proposal-only');
 assert.ok(p.totalProposedCoins<=140);
 assert.equal(p.assignments.reduce((n,x)=>n+x.coins,0),p.totalProposedCoins);
 assert.equal(p.residualUnencumberedStock.reduce((n,x)=>n+x.coins,0)+p.totalProposedCoins,140);
 assert.equal(p.actualCoinMovement,false);
 assert.equal(p.realCentsIssued,0);
});
test('computed weight follows standard 2.5g current cent nominal unit',()=>{
 const p=proposeCoinCirculation({
  stewards:[{id:'A',availableUnencumberedCoins:100}],
  requests:[{id:'B',coinsRequested:100,consentForModel:true}],
  links:[{id:'AB',fromSteward:'A',toRequest:'B',maxCoins:100,perTripCostCents:25,per100CoinHandlingCents:10,consentForModel:true}]
 });
 assert.equal(p.grossWeightGrams,250);
 assert.equal(p.modeledServiceCostCents,35);
});
test('unconsented or capacity-restricted routes preserve unmet merchant request',()=>{
 const fixture=sample();
 fixture.requests[0].consentForModel=false;
 fixture.links[2].consentForModel=false;
 const p=proposeCoinCirculation(fixture);
 assert.equal(p.totalProposedCoins,0);
 assert.equal(p.unmetRequests.length,2);
 assert.equal(p.residualUnencumberedStock.reduce((n,x)=>n+x.coins,0),140);
});
test('fail closed for duplicate evidence, nonexistent endpoints and negative coins',()=>{
 const fixture=sample();fixture.links[0].id=fixture.links[1].id;
 assert.throws(()=>proposeCoinCirculation(fixture),/Duplicate/);
 const wrong=sample();wrong.links[0].toRequest='ghost';
 assert.throws(()=>proposeCoinCirculation(wrong),/Unknown/);
 const negative=sample();negative.stewards[0].availableUnencumberedCoins=-1;
 assert.throws(()=>proposeCoinCirculation(negative),/nonnegative/);
});
