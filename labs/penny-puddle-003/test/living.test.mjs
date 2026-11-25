import test from 'node:test';
import assert from 'node:assert/strict';
import {weaveToDestination} from '../weave.mjs';
import {createStewardBankLab} from '../penny-bank.mjs';
import {proposeBatchNetting} from '../batch-net.mjs';
import {runSyntheticEconomy,scenario} from '../demo.mjs';

const weave = (horizonMinutes, variants={}) =>
  weaveToDestination({...scenario,horizonMinutes,...variants});
const bank = () => createStewardBankLab({
  banks:[{id:'steward',storageCapacityCoins:10}],
  fictionalSponsorBudgetCents:3
});
const tally = (lab) => lab.snapshot().banks[0];
test('same $3.58 dispersed across wallets does not necessarily buy a $3.25 item immediately', () => {
  const p=weave(30);
  assert.equal(p.status,'not-feasible-in-window');
  assert.equal(p.totalReportedCents,358);
  assert.equal(p.netArrivingCents,308);
  assert.equal(p.shortfallCents,17);
  assert.equal(p.modeledFeeCents,50);
  assert.equal(p.settlementCompleted,false);
});
test('modeled fee-free slow routes deliver a $3.25 target after modeled latency', () => {
  const p=weave(4320);
  assert.equal(p.status,'feasible-in-model');
  assert.ok(p.netArrivingCents>=325);
  assert.equal(p.modeledFeeCents,0);
  assert.equal(p.maxArrivalMinutes,4320);
  assert.equal(p.providerExecutionAvailable,false);
});
test('0.58 balance with hypothetical 0.25 instant fee nets 0.33', () => {
  const p=weaveToDestination({
    goalCents:34,horizonMinutes:30,destinationId:'bank',
    sources:[{id:'wallet',availableCents:58}],
    routes:[{id:'instant',fromId:'wallet',toId:'bank',minGrossCents:1,maxGrossCents:58,
      fixedFeeCents:25,feeBasisPoints:0,arrivalMinutes:30,
      consentedForModel:true,providerPermitted:true,evidence:'assumed',rail:'manual-wallet'}]
  });
  assert.equal(p.status,'not-feasible-in-window');
  assert.equal(p.netArrivingCents,33);
  assert.equal(p.modeledFeeCents,25);
});
test('unsupported route or no scenario consent contributes zero cents', () => {
  let p=weave(4320,{routes:scenario.routes.map(r=>({...r,providerPermitted:false}))});
  assert.equal(p.netArrivingCents,0);
  p=weave(4320,{routes:scenario.routes.map(r=>({...r,consentedForModel:false}))});
  assert.equal(p.status,'not-feasible-in-window');
});
test('routes must not silently hop between providers or double spend a source', () => {
  const invalid=[{...scenario.routes[0],toId:'some-other-wallet'}];
  assert.throws(()=>weave(30,{routes:invalid}),/directly/);
  const p=weave(4320);
  assert.equal(new Set(p.actions.map(x=>x.sourceId)).size,p.actions.length);
  assert.ok(p.actions.every(x => x.grossCents >= x.netCents));
});
test('penny bank requires witnessed and matching coin counts; mismatch credits nothing', () => {
  const lab=bank();
  assert.throws(()=>lab.countCoins({bankId:'steward',batchId:'batch',reportedCoins:4,countedCoins:4,witnessIds:['same','same']}),/distinct/);
  assert.equal(lab.countCoins({bankId:'steward',batchId:'bad',reportedCoins:5,countedCoins:4,witnessIds:['a','b']}).status,'count-mismatch-held');
  assert.equal(tally(lab).recordedCoins,0);
  assert.equal(lab.countCoins({bankId:'steward',batchId:'good',reportedCoins:5,countedCoins:5,witnessIds:['a','b']}).status,'synthetic-count-entered');
  assert.equal(tally(lab).recordedCoins,5);
  assert.equal(lab.snapshot().realPennyTokensIssued,0);
});
test('penny bank refuses double earmarking and exceeding capacity', () => {
  const lab=bank();
  lab.countCoins({bankId:'steward',batchId:'one',reportedCoins:5,countedCoins:5,witnessIds:['a','b']});
  lab.earmark({bankId:'steward',requestId:'need1',coins:4});
  assert.throws(()=>lab.earmark({bankId:'steward',requestId:'need2',coins:2}),/double-encumber/);
  assert.throws(()=>lab.earmark({bankId:'steward',requestId:'need1',coins:1}),/Duplicate/);
  assert.throws(()=>lab.countCoins({bankId:'steward',batchId:'two',reportedCoins:6,countedCoins:6,witnessIds:['a','b']}),/capacity/);
  assert.equal(tally(lab).availableUnencumberedCoins,1);
});
test('steward work is compensated only from separately budgeted sponsor fund', () => {
  const lab=bank();
  lab.countCoins({bankId:'steward',batchId:'one',reportedCoins:3,countedCoins:3,witnessIds:['a','b']});
  lab.payForService({bankId:'steward',serviceId:'svc',batchId:'one',category:'counting',cents:2});
  assert.equal(lab.snapshot().sponsorBudgetCents,1);
  assert.equal(tally(lab).hypotheticalServiceEarningsCents,2);
  assert.equal(tally(lab).recordedCoins,3);
  assert.throws(()=>lab.payForService({bankId:'steward',serviceId:'svc',batchId:'one',category:'counting',cents:1}),/Duplicate/);
  assert.throws(()=>lab.payForService({bankId:'steward',serviceId:'new',batchId:'one',category:'counting',cents:2}),/exhausted/);
});
test('loss freezes custodian and exposes undercollateralization', () => {
  const lab=bank();
  lab.countCoins({bankId:'steward',batchId:'one',reportedCoins:5,countedCoins:5,witnessIds:['a','b']});
  lab.earmark({bankId:'steward',requestId:'need',coins:4});
  const loss=lab.reportLoss({bankId:'steward',coins:3,incidentId:'incident'});
  assert.equal(loss.underCollateralizedCoins,2);
  assert.equal(tally(lab).frozen,true);
  assert.throws(()=>lab.earmark({bankId:'steward',requestId:'need2',coins:1}),/frozen/);
  assert.throws(()=>lab.payForService({bankId:'steward',serviceId:'svc',batchId:'one',category:'storage',cents:1}),/frozen/);
});
test('consentless netting must hold even when arithmetic suggests zero net obligations', () => {
  const lab=proposeBatchNetting({
    obligations:[{id:'1',from:'A',to:'B',cents:25},{id:'2',from:'B',to:'A',cents:25}],
    explicitModelAuthorizations:['A']
  });
  assert.equal(lab.status,'hold-for-participant-and-rail-review');
  assert.deepEqual(lab.proposedSettlementMoves,[]);
});
test('authorized *mathematical* netting conserves obligations but does not settle', () => {
  const lab=proposeBatchNetting({
    obligations:[{id:'1',from:'A',to:'B',cents:50},{id:'2',from:'B',to:'C',cents:50}],
    explicitModelAuthorizations:['A','B','C']
  });
  assert.equal(lab.status,'mathematical-netting-proposal-only');
  assert.equal(lab.grossCents,100);
  assert.deepEqual(lab.proposedSettlementMoves,[{from:'A',to:'C',cents:50}]);
  assert.equal(lab.externalMovesMade,0);
  assert.equal(lab.legalNettingAuthorized,false);
});
test('duplicate obligations and fractional cents fail before settlement proposal', () => {
  assert.throws(()=>proposeBatchNetting({
    obligations:[{id:'dup',from:'A',to:'B',cents:1},{id:'dup',from:'B',to:'C',cents:2}],
    explicitModelAuthorizations:['A','B','C']
  }),/Duplicate|duplicate/);
  assert.throws(()=>proposeBatchNetting({
    obligations:[{id:'one',from:'A',to:'B',cents:1.5}],
    explicitModelAuthorizations:['A','B']
  }),/integer/);
});
test('complete synthetic economy distinguishes loan, payment, claim and proposal', () => {
  const demo=runSyntheticEconomy();
  assert.equal(demo.realMoneyMoved,false);
  assert.equal(demo.pennyTokensIssued,0);
  assert.equal(demo.comparison.immediate.status,'not-feasible-in-window');
  assert.equal(demo.comparison.patient.status,'feasible-in-model');
  assert.equal(demo.sponsoredCampaign.campaigns[0].phase,'ready-for-payee-review');
  assert.equal(demo.sponsoredCampaign.campaigns[0].externalPaymentMade,false);
  assert.equal(demo.sponsoredCampaign.campaigns[0].pledgedCents,3);
  assert.equal(demo.localCoinSteward.banks[0].hypotheticalServiceEarningsCents,2);
  assert.equal(demo.netting.realFundsMoved,false);
});
