import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {makeFixture,validateFixture,planOpportunity,replayPolicy,benchmark} from '../opportunity.mjs';
import {createOpportunityGraph,proposalCarrier} from '../bridge.mjs';
import {runDiscoveryNetwork} from '../demo.mjs';

test('finite weighted counterfactuals partition the synthetic world',()=>{
  const p=planOpportunity(makeFixture());
  assert.equal(p.hypotheticalWorldWeights.reduce((a,w)=>a+w.weight,0),100000000);
  assert.equal(p.marketQuotesVerified,false);
  assert.equal(p.appraisalsVerified,false);
  assert.equal(p.financialExecutionEnabled,false);
});
test('opportunity frontier distinguishes immediate, new choices and classical optimal',()=>{
  const p=planOpportunity(makeFixture());
  assert.equal(p.greedyImmediateFirst,'sell:regional-raw-buyer');
  assert.equal(p.affordanceFirst,'inspect');
  assert.equal(p.optimalClassicalExpected.action,'inspect');
  assert.deepEqual(p.firstMoves.find(r=>r.actionId==='inspect').newAffordances,['authenticate']);
  assert.ok(p.exploredStates>1);
});
test('matched synthetic worlds: MOTIF-inspired option-first does not falsely beat strong classical',()=>{
  const b=benchmark(makeFixture());
  assert.equal(b.comparisons.affordance.expectedNetCents,b.comparisons.expected.expectedNetCents);
  assert.ok(b.comparisons.expected.expectedNetCents>b.comparisons.greedy.expectedNetCents);
  assert.equal(b.comparisons.greedy.expectedNetCents,380);
  assert.ok(b.comparisons.expected.worstCaseNetCents<0);
  assert.match(b.controlNote,/strong control/);
});
test('robust policy prioritizes protecting worst-case result even if expected return is smaller',()=>{
  const b=benchmark(makeFixture());
  assert.equal(b.planner.robustWorstCase.action,'publish-sponsored-story');
  assert.equal(b.comparisons.robust.worstCaseNetCents,530);
  assert.ok(b.comparisons.robust.worstCaseNetCents>b.comparisons.expected.worstCaseNetCents);
  assert.ok(b.comparisons.robust.expectedNetCents<b.comparisons.expected.expectedNetCents);
});
test('observations are revealed after inquiry, not before it',()=>{
  const p=replayPolicy(makeFixture(),'rare-positive');
  assert.equal(p.trace[0].actionId,'inspect');
  assert.equal(p.trace[0].observedOnlyAfterAction,'positive');
  assert.equal(p.trace[1].actionId,'authenticate');
  assert.equal(p.trace[1].observedOnlyAfterAction,'rare');
});
test('false-positive screen exposes expensive downside rather than minted benefit',()=>{
  const p=replayPolicy(makeFixture(),'ordinary-positive');
  assert.ok(p.hypotheticalNetParticipantCents<0);
  assert.ok(p.hypotheticalServiceCostsCents>=2500);
  assert.equal(p.cashActuallySettledCents,0);
  assert.equal(p.actualCampaignFundingCents,0);
  assert.equal(p.coinTransferred,false);
});
test('future community allocation remains zero actual funds even after valuable modeled sale',()=>{
  const p=replayPolicy(makeFixture(),'rare-positive');
  assert.ok(p.hypotheticalSaleNetCents>0);
  assert.ok(p.hypotheticalCommunityPremiumCents>0);
  assert.equal(p.actualCampaignFundingCents,0);
  assert.equal(p.cashActuallySettledCents,0);
  assert.equal(p.remainingHypotheticalCampaignShortfallCents,24000);
});
test('no owner consent or already encumbered coin blocks entire graph',()=>{
  assert.throws(()=>planOpportunity(makeFixture({specimen:{ownerConsentsToModel:false}})),/owner consent/);
  assert.throws(()=>planOpportunity(makeFixture({specimen:{alreadyCollateralized:true}})),/absence of preexisting collateral/);
});
test('disabled provider/buyer permissions remove raw sale routes',()=>{
  const f=makeFixture({demand:makeFixture().demand.map(d=>({...d,permissionForModel:false}))});
  const p=planOpportunity(f);
  assert.equal(p.firstMoves.some(x=>x.type==='raw-sale'),false);
});
test('without sponsor, buyers or service budget, there is no invented revenue',()=>{
  const f=makeFixture({
    services:{
      screen:{id:'s',costCents:100,days:1,permissionForModel:false},
      certify:{id:'g',costCents:2500,days:10,permissionForModel:false}
    },
    creativeSponsor:null,demand:[],limits:{...makeFixture().limits,serviceSpendBudgetCents:0}
  });
  const b=benchmark(f);
  assert.equal(b.planner.optimalClassicalExpected.valueCents,0);
  assert.deepEqual(b.planner.firstMoves.map(m=>m.actionId),['keep-owner-property']);
  assert.equal(b.comparisons.expected.expectedNetCents,0);
});
test('deadline can make grading impossible',()=>{
  const f=makeFixture({limits:{...makeFixture().limits,maxDays:5}});
  const p=planOpportunity(f);
  const ticket=p.firstMoves.find(r=>r.actionId==='inspect');
  assert.ok(ticket);
  assert.deepEqual(ticket.newAffordances,[]);
});
test('validator refuses counterfeit data such as negative fees, duplicate buyers or >100% split',()=>{
  const f=makeFixture();
  assert.throws(()=>validateFixture(makeFixture({specimen:{ownerOptInCommunityBps:10001}})),/> 100%/);
  assert.throws(()=>validateFixture(makeFixture({demand:[f.demand[0],f.demand[0]]})),/Duplicate/);
  assert.throws(()=>validateFixture(makeFixture({demand:[{...f.demand[0],fixedFeesCents:-1}]})),/integer/);
  assert.throws(()=>validateFixture(makeFixture({creativeSponsor:{fundedInFixture:false}})),/unbudgeted/);
});
test('original backing and external financial accounts remain untouched',()=>{
  const f=makeFixture();
  const carrier=proposalCarrier(f);
  const graph=createOpportunityGraph(f);
  assert.equal(carrier.contract,'penny-puddle-005/prediction-only-v0');
  assert.equal(carrier.field.authority,'OFFER_ONLY_HOLD');
  assert.equal(carrier.recipientAdmitted,false);
  assert.equal(carrier.realMoneyMovedCents,0);
  assert.equal(graph.nodes.find(n=>n.type==='particular').frozen,true);
  assert.ok(graph.edges.every(e=>e.effectiveAuthority===false));
  assert.ok(graph.nodes.filter(x=>x.type==='post-certification-buyer').every(x=>!x.authenticOffer));
});
test('source-owned bridge supplies read-only inquiry tickets, not real authorization',()=>{
  const p=proposalCarrier(makeFixture());
  assert.deepEqual(p.field.observationTickets.map(t=>t.action),['inspect','authenticate']);
  assert.ok(p.field.observationTickets.every(t=>!t.realWorldActionPermitted));
  assert.equal(p.liveConnectionExecuted,false);
  assert.equal(p.destinationConsentVerified,false);
});
test('coin triage remains unverified even when probability simulator imagines value',()=>{
  const demo=runDiscoveryNetwork();
  assert.equal(demo.candidateScreen.authenticated,false);
  assert.equal(demo.candidateScreen.status,'quarantined-for-owner-review');
  assert.equal(demo.marketGraph.authenticatedQuotes,0);
  assert.equal(demo.marketGraph.realCashSettledCents,0);
  assert.equal(demo.consentAndSettlement.actuallyFundedCampaignCents,0);
});
test('policy comparison never depends on a real buyer, custody, or collector estimate',()=>{
  const p=planOpportunity(makeFixture());
  assert.equal(p.ownerAuthorization,'fictional scenario assertion only');
  assert.equal(p.goal.additionalReallyFundedCents,0);
  assert.ok(p.firstMoves.every(x=>x.realWorldActionPermitted===false));
  assert.ok(p.firstMoves.every(x=>Number.isFinite(x.contingentExpectedValueCents)));
});

test('checked-in example receipt agrees with the re-executed benchmark',()=>{
  const stored=JSON.parse(readFileSync(new URL('../example-benchmark.json',import.meta.url),'utf8'));
  const actual=benchmark(makeFixture());
  assert.equal(stored.actualFundsMovedCents,0);
  assert.deepEqual(stored.firstMoves,{
    immediate:actual.planner.greedyImmediateFirst,
    affordance:actual.planner.affordanceFirst,
    classicalExpected:actual.planner.optimalClassicalExpected.action,
    robust:actual.planner.robustWorstCase.action
  });
  for(const [strategy,metrics] of Object.entries(stored.outcomes)){
    assert.equal(metrics.modeledWeightedNetCents,actual.comparisons[strategy].expectedNetCents);
    assert.equal(metrics.modeledWorstNetCents,actual.comparisons[strategy].worstCaseNetCents);
    assert.equal(metrics.modeledBestNetCents,actual.comparisons[strategy].bestCaseNetCents);
    assert.deepEqual(metrics.worlds,actual.comparisons[strategy].outcomes);
  }
});
