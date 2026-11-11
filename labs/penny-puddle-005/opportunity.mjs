/**
 * PUDDLE-005 — finite synthetic collector-demand graph and bounded contingent
 * search. MOTIF-003-inspired affordance comparison plus classical DP baseline.
 * No bank rails, real bids, coin appraisal, authority, or money movement.
 *
 * Hypotheses (kind, screening signal) are weighted FICTIONAL counterfactuals.
 * The planner never sees the selected hidden-world outcome before requesting
 * the simulated observation. Demand and costs are scenario assumptions.
 */
const integer=(n,label,zero=false)=>{
  if(!Number.isSafeInteger(n)||n<(zero?0:1)||n>1_000_000_000)
    throw new TypeError(label+' must be a bounded '+(zero?'nonnegative':'positive')+' integer');
  return n;
};
const id=(x,label)=>{if(typeof x!=='string'||!x.trim())throw new TypeError(label+' must be a string ID');return x;};
const cents=v=>' $'+(v/100).toFixed(2);
export function makeFixture(overrides={}) {
  const defaults={
    name:'fictional-local-collector-network',
    specimen:{id:'fictional-specimen-A',denominationCents:1,ownerConsentsToModel:true,
      alreadyCollateralized:false,ownerOptInCommunityBps:500},
    goal:{kind:'community-need',targetCents:85000,currentlyFundedCents:61000},
    beliefs:{rarePriorBps:1400,screenSensitivityBps:9000,screenFalsePositiveBps:1000},
    limits:{maxMoves:5,maxDays:30,serviceSpendBudgetCents:3000},
    services:{
      screen:{id:'steward-photo-screen',costCents:100,days:1,permissionForModel:true},
      certify:{id:'independent-expert-review',costCents:2500,days:14,permissionForModel:true}
    },
    demand:[
      {id:'local-raw-buyer',kind:'raw',offerCents:400,fixedFeesCents:30,
        days:1,permissionForModel:true,offerVerified:false},
      {id:'regional-raw-buyer',kind:'raw',offerCents:500,fixedFeesCents:120,
        days:3,permissionForModel:true,offerVerified:false},
      {id:'collector-after-certification',kind:'certified',rareOfferCents:14000,
        ordinaryOfferCents:100,fixedFeesCents:400,feeBps:1000,
        days:3,permissionForModel:true,offerVerified:false}
    ],
    creativeSponsor:{id:'fictional-story-sponsor',grantCents:300,productionCostCents:150,
      days:2,fundedInFixture:true,ownerLicenseAssumed:true}
  };
  return {
    ...defaults,...overrides,
    specimen:{...defaults.specimen,...overrides.specimen},
    goal:{...defaults.goal,...overrides.goal},
    beliefs:{...defaults.beliefs,...overrides.beliefs},
    limits:{...defaults.limits,...overrides.limits},
    services:{...defaults.services,...overrides.services},
    demand:overrides.demand||defaults.demand,
    creativeSponsor:overrides.creativeSponsor===null?null:{
      ...defaults.creativeSponsor,...overrides.creativeSponsor
    }
  };
}
export function validateFixture(f){
  id(f?.name,'fixture.name');
  const s=f.specimen;
  id(s?.id,'specimen.id');integer(s.denominationCents,'denominationCents');
  if(s.ownerConsentsToModel!==true||s.alreadyCollateralized!==false)
    throw new Error('Hold: must assert owner consent and explicit absence of preexisting collateral');
  integer(s.ownerOptInCommunityBps,'community bps',true);
  if(s.ownerOptInCommunityBps>10000)throw new Error('Community split > 100%');
  integer(f.goal.targetCents,'goal target');integer(f.goal.currentlyFundedCents,'goal already funded',true);
  if(f.goal.currentlyFundedCents>f.goal.targetCents)throw new Error('Campaign overfunded');
  for(const x of Object.values(f.beliefs)) {
    integer(x,'belief bps',true);
    if(x>10000)throw new Error('Invalid hypothetical world weight');
  }
  integer(f.limits.maxMoves,'maxMoves');integer(f.limits.maxDays,'maxDays');
  integer(f.limits.serviceSpendBudgetCents,'budget',true);
  if(f.limits.maxMoves>8||f.limits.maxDays>365||f.limits.serviceSpendBudgetCents>100000)
    throw new RangeError('Synthetic search limits exceeded');
  for(const name of ['screen','certify']){
    const service=f.services[name];
    id(service?.id,'service ID');integer(service.costCents,'service cost',true);integer(service.days,'service days',true);
    if(typeof service.permissionForModel!=='boolean')throw new Error('Explicit modeled service permission required');
  }
  if(!Array.isArray(f.demand)||f.demand.length>10)throw new TypeError('At most 10 fictional buyers');
  const seen=new Set();
  for(const buyer of f.demand){
    id(buyer?.id,'buyer ID');
    if(seen.has(buyer.id))throw new Error('Duplicate buyer ID');
    seen.add(buyer.id);
    if(!['raw','certified'].includes(buyer.kind))throw new Error('Unknown buyer kind');
    for(const key of buyer.kind==='raw'?['offerCents','fixedFeesCents','days']:
      ['rareOfferCents','ordinaryOfferCents','fixedFeesCents','feeBps','days'])
      integer(buyer[key],'buyer.'+key, key!=='offerCents'&&key!=='rareOfferCents'&&key!=='ordinaryOfferCents');
    if(buyer.kind==='certified'&&buyer.feeBps>10000)throw new Error('Fee bps > 100%');
    if(typeof buyer.permissionForModel!=='boolean'||typeof buyer.offerVerified!=='boolean')
      throw new Error('Buyer permission and quote verification flags required');
  }
  if(f.creativeSponsor){
    const a=f.creativeSponsor;
    id(a.id,'sponsor ID');integer(a.grantCents,'sponsor grant',true);
    integer(a.productionCostCents,'creative production cost',true);
    integer(a.days,'creative days',true);
    if(a.fundedInFixture!==true||a.ownerLicenseAssumed!==true)
      throw new Error('No unbudgeted or unauthorized creative reward');
  }
  return true;
}
function possibleWorlds(f){
  const p=f.beliefs;
  // All weights are integers out of 10000; no frequency claims are made.
  const r=p.rarePriorBps;
  const weights=[
    {id:'rare-positive',kind:'rare',signal:'positive',weight:r*p.screenSensitivityBps},
    {id:'rare-negative',kind:'rare',signal:'negative',weight:r*(10000-p.screenSensitivityBps)},
    {id:'ordinary-positive',kind:'ordinary',signal:'positive',weight:(10000-r)*p.screenFalsePositiveBps},
    {id:'ordinary-negative',kind:'ordinary',signal:'negative',weight:(10000-r)*(10000-p.screenFalsePositiveBps)}
  ];
  return weights.filter(w=>w.weight>0);
}
const sumWeight=worlds=>worlds.reduce((a,w)=>a+w.weight,0);
const baseState=()=>({
  phase:'raw',storyMade:false,elapsedDays:0,serviceCostsCents:0,terminal:false
});
function netOffer(price,buyer){
  const fee=buyer.fixedFeesCents+(buyer.kind==='certified'?Math.ceil(price*buyer.feeBps/10000):0);
  return {priceCents:price,feesCents:fee,netCents:price-fee};
}
function options(state,f) {
  if(state.terminal)return [];
  const legal=(days,spend=0)=>state.elapsedDays+days<=f.limits.maxDays &&
    state.serviceCostsCents+spend<=f.limits.serviceSpendBudgetCents;
  const choices=[];
  if(state.phase==='raw'&&f.services.screen.permissionForModel&&
    legal(f.services.screen.days,f.services.screen.costCents))
    choices.push({id:'inspect',type:'inspect',days:f.services.screen.days,
      costCents:f.services.screen.costCents,immediateCents:-f.services.screen.costCents});
  if(state.phase==='screen-positive'&&f.services.certify.permissionForModel&&
    legal(f.services.certify.days,f.services.certify.costCents))
    choices.push({id:'authenticate',type:'authenticate',days:f.services.certify.days,
      costCents:f.services.certify.costCents,immediateCents:-f.services.certify.costCents});
  if(!state.storyMade&&f.creativeSponsor&&legal(f.creativeSponsor.days)){
    const sponsor=f.creativeSponsor;
    if(sponsor.grantCents>=sponsor.productionCostCents)
      choices.push({id:'publish-sponsored-story',type:'story',days:sponsor.days,
        costCents:0,immediateCents:sponsor.grantCents-sponsor.productionCostCents});
  }
  for(const buyer of f.demand){
    if(!buyer.permissionForModel||!legal(buyer.days))continue;
    if(buyer.kind==='raw'){
      const net=netOffer(buyer.offerCents,buyer);
      if(net.netCents>0)choices.push({id:'sell:'+buyer.id,type:'raw-sale',days:buyer.days,
        buyerId:buyer.id,priceCents:net.priceCents,feesCents:net.feesCents,
        immediateCents:net.netCents,costCents:0});
    }else if(state.phase==='certified-rare'||state.phase==='certified-ordinary'){
      const price=state.phase==='certified-rare'?buyer.rareOfferCents:buyer.ordinaryOfferCents;
      const net=netOffer(price,buyer);
      if(net.netCents>0)choices.push({id:'sell:'+buyer.id,type:'certified-sale',days:buyer.days,
        buyerId:buyer.id,priceCents:net.priceCents,feesCents:net.feesCents,
        immediateCents:net.netCents,costCents:0});
    }
  }
  choices.push({id:'keep-owner-property',type:'keep',days:0,immediateCents:0,costCents:0});
  return choices.sort((a,b)=>a.id.localeCompare(b.id));
}
function branches(state,worlds,action) {
  if(action.type==='inspect')return ['positive','negative'].map(signal=>({
    label:signal,worlds:worlds.filter(w=>w.signal===signal),
    state:{...state,phase:'screen-'+signal,elapsedDays:state.elapsedDays+action.days,
      serviceCostsCents:state.serviceCostsCents+action.costCents},
    deltaCents:action.immediateCents
  })).filter(b=>b.worlds.length);
  if(action.type==='authenticate')return ['rare','ordinary'].map(kind=>({
    label:kind,worlds:worlds.filter(w=>w.kind===kind),
    state:{...state,phase:'certified-'+kind,elapsedDays:state.elapsedDays+action.days,
      serviceCostsCents:state.serviceCostsCents+action.costCents},
    deltaCents:action.immediateCents
  })).filter(b=>b.worlds.length);
  const terminal=['raw-sale','certified-sale','keep'].includes(action.type);
  return [{label:'deterministic',worlds,
    state:{...state,elapsedDays:state.elapsedDays+action.days,
      storyMade:state.storyMade||action.type==='story',terminal},
    deltaCents:action.immediateCents}];
}
function expectedValue(state,worlds,f,remainingMoves,memo,visited) {
  if(!remainingMoves||state.terminal) return {valueCents:0,action:null};
  const cacheKey=JSON.stringify([state,worlds.map(w=>w.id),remainingMoves]);
  if(memo.has(cacheKey))return memo.get(cacheKey);
  visited.count++;
  if(visited.count>50000)throw new RangeError('Plan space cap reached');
  let result={valueCents:0,action:null};
  for(const action of options(state,f)){
    const b=branches(state,worlds,action);
    let value=0;
    for(const out of b){
      const next=expectedValue(out.state,out.worlds,f,remainingMoves-1,memo,visited);
      value+=(sumWeight(out.worlds)/sumWeight(worlds))*(out.deltaCents+next.valueCents);
    }
    if(value>result.valueCents+1e-9||
      (Math.abs(value-result.valueCents)<=1e-9&&result.action&&action.id<result.action.id))
      result={valueCents:value,action:action.id};
  }
  memo.set(cacheKey,result);return result;
}
function calculateNewActions(state,worlds,f,action) {
  const current=new Set(options(state,f).map(a=>a.id));
  const after=new Set();
  for(const out of branches(state,worlds,action)){
    for(const a of options(out.state,f))after.add(a.id);
  }
  return [...after].filter(x=>!current.has(x)).sort();
}
export function planOpportunity(f) {
  validateFixture(f);
  const worlds=possibleWorlds(f);
  if(!worlds.length)throw new Error('No positive-weight scenarios');
  const state=baseState(),memo=new Map(),visited={count:0};
  const optimal=expectedValue(state,worlds,f,f.limits.maxMoves,memo,visited);
  const roots=options(state,f).map(action=>{
    const outs=branches(state,worlds,action);
    const continuation=outs.reduce((value,out)=>{
      const future=expectedValue(out.state,out.worlds,f,f.limits.maxMoves-1,memo,visited);
      return value+sumWeight(out.worlds)/sumWeight(worlds)*(out.deltaCents+future.valueCents);
    },0);
    return {
      actionId:action.id,type:action.type,
      immediateCents:action.immediateCents,
      contingentExpectedValueCents:Math.round(continuation*100)/100,
      newAffordances:calculateNewActions(state,worlds,f,action),
      hypotheticalOutcomes:outs.map(x=>({label:x.label,weightWithinRoot:sumWeight(x.worlds)/sumWeight(worlds)})),
      realWorldActionPermitted:false
    };
  });
  const immediate=[...roots].sort((a,b)=>b.immediateCents-a.immediateCents||a.actionId.localeCompare(b.actionId))[0];
  const opportunityFirst=[...roots].sort((a,b)=>b.newAffordances.length-a.newAffordances.length||
    b.contingentExpectedValueCents-a.contingentExpectedValueCents||
    a.actionId.localeCompare(b.actionId))[0];
  return {
    experiment:'PUDDLE-005 / MOTIF-003-inspired affordance ranking + classical belief-state DP',
    ownerAuthorization:'fictional scenario assertion only',
    marketQuotesVerified:false,appraisalsVerified:false,realFundsReceivedCents:0,
    personalAccountConnected:false,financialExecutionEnabled:false,
    hypotheticalWorldWeights:worlds.map(w=>({...w})),
    firstMoves:roots,optimalClassicalExpected:optimal,
    greedyImmediateFirst:immediate?.actionId||null,
    affordanceFirst:opportunityFirst?.actionId||null,
    exploredStates:visited.count,
    goal:{...f.goal,additionalReallyFundedCents:0},
    methodology:'Exact small finite-horizon search over explicit invented outcomes. World weights are hypothetical, not calibrated probabilities.'
  };
}
export function replayPolicy(f,worldId,kind='expected') {
  const all=possibleWorlds(f),world=all.find(w=>w.id===worldId);
  if(!world)throw new Error('Unknown fictional world');
  let state=baseState(),belief=all,cumulativeCents=0,storySponsorSpentCents=0,
    serviceSpendCents=0,potentialCommunityPremiumCents=0,modeledSaleProceedsCents=0;
  const trace=[];
  for(let step=0;step<f.limits.maxMoves&&!state.terminal;step++){
    const allMoves=options(state,f);
    if(!allMoves.length)break;
    let chosen;
    if(kind==='greedy'){
      chosen=[...allMoves].sort((a,b)=>b.immediateCents-a.immediateCents||a.id.localeCompare(b.id))[0];
    }else if(kind==='affordance'&&step===0){
      chosen=[...allMoves].sort((a,b)=>
        calculateNewActions(state,belief,f,b).length-calculateNewActions(state,belief,f,a).length||
        b.immediateCents-a.immediateCents||a.id.localeCompare(b.id))[0];
    }else if(kind==='expected'||kind==='affordance'){
      const memo=new Map(),visited={count:0};
      const best=expectedValue(state,belief,f,f.limits.maxMoves-step,memo,visited);
      chosen=allMoves.find(a=>a.id===best.action)||allMoves.find(a=>a.type==='keep');
    }else throw new Error('Unknown comparison policy');
    if(!chosen)break;
    const allOutcomes=branches(state,belief,chosen);
    const observed=allOutcomes.find(o=>o.worlds.some(x=>x.id===world.id));
    if(!observed)throw new Error('Hidden world not represented in observation');
    if(chosen.type==='story') storySponsorSpentCents+=f.creativeSponsor.grantCents;
    if(chosen.costCents)serviceSpendCents+=chosen.costCents;
    if(['raw-sale','certified-sale'].includes(chosen.type)){
      modeledSaleProceedsCents=chosen.immediateCents;
      const premium=Math.max(0,modeledSaleProceedsCents-f.specimen.denominationCents);
      potentialCommunityPremiumCents=Math.floor(premium*f.specimen.ownerOptInCommunityBps/10000);
    }
    cumulativeCents+=observed.deltaCents;
    trace.push({step:step+1,actionId:chosen.id,
      observedOnlyAfterAction:observed.label,deltaCents:observed.deltaCents,
      accumulatedHypotheticalCents:cumulativeCents,
      candidateNotExecuted:true});
    state=observed.state;belief=observed.worlds;
  }
  return {
    worldId,policy:kind,trace,hypotheticalNetParticipantCents:cumulativeCents,
    hypotheticalServiceCostsCents:serviceSpendCents,
    hypotheticalCreativeSponsorOutlayCents:storySponsorSpentCents,
    hypotheticalSaleNetCents:modeledSaleProceedsCents,
    ownerConsentShareBps:f.specimen.ownerOptInCommunityBps,
    hypotheticalCommunityPremiumCents:potentialCommunityPremiumCents,
    cashActuallySettledCents:0,coinTransferred:false,
    actualCampaignFundingCents:0,
    remainingHypotheticalCampaignShortfallCents:f.goal.targetCents-f.goal.currentlyFundedCents,
    finalPhase:state.phase,realWorldActionPermitted:false
  };
}
export function benchmark(f) {
  const p=planOpportunity(f);
  const worlds=possibleWorlds(f),strategies=['greedy','affordance','expected'];
  const results=Object.fromEntries(strategies.map(strategy=>{
    let weighted=0,worst=Infinity,best=-Infinity;
    const outcomes=worlds.map(world=>{
      const row=replayPolicy(f,world.id,strategy);
      weighted+=row.hypotheticalNetParticipantCents*world.weight/sumWeight(worlds);
      worst=Math.min(worst,row.hypotheticalNetParticipantCents);
      best=Math.max(best,row.hypotheticalNetParticipantCents);
      return {worldId:world.id,worldWeight:world.weight,netCents:row.hypotheticalNetParticipantCents,
        firstMove:row.trace[0]?.actionId||null,actions:row.trace.map(x=>x.actionId)};
    });
    return [strategy,{expectedNetCents:Math.round(weighted*100)/100,worstCaseNetCents:worst,
      bestCaseNetCents:best,realizedFundsCents:0,outcomes}];
  }));
  return {planner:p,comparisons:results,
    controlNote:'Greedy is an intentionally weak one-step control. Classical finite-horizon DP is the strong control and is used for contingent continuation; affordance-first is not proven better than optimal classical planning.'};
}
