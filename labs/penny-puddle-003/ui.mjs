import { weaveToDestination } from './weave.mjs';
import { scenario } from './demo.mjs';
import { createPennyCampaignLab } from '/puddle-001/penny-campaign.mjs';
import { createStewardBankLab } from './penny-bank.mjs';
import { proposeBatchNetting } from './batch-net.mjs';
import { proposeCoinCirculation } from './coin-flow.mjs';
const find = selector => document.querySelector(selector);
const write = (selector, value) => { find(selector).textContent = value; };
const c = n => (n/100).toFixed(2);
function priceCents() {
  const raw=find('#target').value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) throw new Error('Enter dollars and at most two decimal places.');
  const [d,f=''] = raw.split('.');
  const value=Number(d)*100+Number(f.padEnd(2,'0'));
  if(!Number.isSafeInteger(value) || value<=0 || value>1000) throw new Error('This first lab models prices between 1¢ and $10.');
  return value;
}
function renderRoute(horizonMinutes) {
  try {
    const plan=weaveToDestination({...scenario,goalCents:priceCents(),horizonMinutes});
    const lines=[
      plan.status==='feasible-in-model'?'MODELED AS POSSIBLE':'NOT POSSIBLE WITH THESE ROUTES',
      'Potentially arriving: $'+c(plan.netArrivingCents),
      'Modeled route fees: $'+c(plan.modeledFeeCents),
      'Still short: $'+c(plan.shortfallCents),
      'Latest modeled arrival: '+plan.maxArrivalMinutes+' minutes',
      '',
      ...plan.actions.map(a=>a.sourceId+' → destination: $'+c(a.netCents)+' from $'+c(a.grossCents)+' (fee $'+c(a.feeCents)+')'),
      '',
      'NO ACTUAL MONEY TRANSFER OR PROVIDER INTEGRATION.'
    ];
    write('#route-result',lines.join('\n'));
  } catch(error) {write('#route-result',error instanceof Error?error.message:'Invalid model');}
}
find('#now').addEventListener('click',()=>renderRoute(30));
find('#later').addEventListener('click',()=>renderRoute(4320));

const campaign=createPennyCampaignLab({
  reserves:[{id:'funded-fictional-sponsor',backingType:'usd-settled',availableCents:20}],
  campaigns:[{id:'fictional-request',requirementType:'electronic-bill',goalCents:8}]
});
let helperNumber=0;
find('#give').addEventListener('click',()=>{
  try {
    helperNumber++;
    campaign.sponsorLike({reserveId:'funded-fictional-sponsor',campaignId:'fictional-request',actorId:'fictional-helper-'+helperNumber});
    const state=campaign.inspect();
    const item=state.campaigns[0];
    write('#campaign-meter',item.allocatedCents+'¢ / '+item.goalCents+'¢');
    write('#campaign-result',item.phase==='ready-for-payee-review'
      ? 'Target reached using synthetic sponsor cents. READY FOR REVIEW, NOT PAID. No institution transfer happened.'
      : 'Synthetic sponsor budget remaining: '+state.reserves[0].availableCents+'¢. No actual sponsor funds or verified helpers.');
    if(item.phase!=='open') find('#give').disabled=true;
  } catch(error){write('#campaign-result',error.message);}
});
const bank=createStewardBankLab({
  banks:[{id:'fictional-custodian',storageCapacityCoins:250}],
  fictionalSponsorBudgetCents:5
});
let serviceCount=0;
find('#count').addEventListener('click',()=>{
  try {
    bank.countCoins({bankId:'fictional-custodian',batchId:'mock-coin-batch',reportedCoins:100,countedCoins:100,witnessIds:['witness-1','witness-2']});
    bank.earmark({bankId:'fictional-custodian',requestId:'simulated-neighbor-need',coins:20});
    const snap=bank.snapshot();
    write('#bank-result','MOCK: '+snap.banks[0].recordedCoins+' coins counted, '+snap.banks[0].earmarkedCoins+' earmarked for local need. Sponsor pay budget: '+snap.sponsorBudgetCents+'¢. No real coins verified.');
    find('#count').disabled=true;
    find('#earn').disabled=false;
  } catch(error){write('#bank-result',error.message);}
});
find('#earn').addEventListener('click',()=>{
  try {
    serviceCount++;
    bank.payForService({bankId:'fictional-custodian',serviceId:'fictional-service-'+serviceCount,batchId:'mock-coin-batch',category:'audit',cents:1});
    const snap=bank.snapshot();
    write('#bank-result','Fictional steward work credited: '+snap.banks[0].hypotheticalServiceEarningsCents+'¢. Separate sponsor budget remaining: '+snap.sponsorBudgetCents+'¢. Physical coin claims unchanged. No real wages paid.');
    if(snap.sponsorBudgetCents===0) find('#earn').disabled=true;
  }catch(error){write('#bank-result',error.message);}
});
find('#coin-route').addEventListener('click',()=>{
  try{
    const p=proposeCoinCirculation({
      stewards:[{id:'fictional-coin-bank',availableUnencumberedCoins:450}],
      requests:[
        {id:'fictional-grocer',coinsRequested:250,consentForModel:true},
        {id:'fictional-neighbor-desk',coinsRequested:100,consentForModel:true}
      ],
      links:[
        {id:'route1',fromSteward:'fictional-coin-bank',toRequest:'fictional-grocer',
          maxCoins:250,perTripCostCents:20,per100CoinHandlingCents:10,consentForModel:true},
        {id:'route2',fromSteward:'fictional-coin-bank',toRequest:'fictional-neighbor-desk',
          maxCoins:100,perTripCostCents:15,per100CoinHandlingCents:10,consentForModel:true}
      ],
    });
    write('#coin-result','Candidate physical pennies to circulate: '+p.totalProposedCoins+
      '\\nTotal weight: '+p.grossWeightGrams+' grams'+
      '\\nModeled service costs: 
  {id:'ab',from:'A',to:'B',cents:50},
  {id:'bc',from:'B',to:'C',cents:50}
];
function net(consented){
  try {
    const plan=proposeBatchNetting({obligations,explicitModelAuthorizations:consented?['A','B','C']:['A']});
    write('#net-result',plan.status==='mathematical-netting-proposal-only'
      ? 'GROSS OBLIGATIONS: $'+c(plan.grossCents)+'\nPROPOSED NET MOVES: '+plan.proposedSettlementMoves.map(x=>x.from+' → '+x.to+' $'+c(x.cents)).join(', ')+'\nREALLY MOVED: $0.00. Authorization and partner agreements still missing.'
      : 'ON HOLD: participant consent missing. No usable netting instruction and no real transfer.');
  } catch(error){write('#net-result',error.message);}
}
find('#net').addEventListener('click',()=>net(true));
find('#hold').addEventListener('click',()=>net(false));
renderRoute(30);
+c(p.modeledServiceCostCents)+
      '\\nNO COINS MOVED. A real paid job needs an authorized merchant, steward, custody verification and budget.');
  }catch(error){write('#coin-result',error.message);}
});
const obligations=[
  {id:'ab',from:'A',to:'B',cents:50},
  {id:'bc',from:'B',to:'C',cents:50}
];
function net(consented){
  try {
    const plan=proposeBatchNetting({obligations,explicitModelAuthorizations:consented?['A','B','C']:['A']});
    write('#net-result',plan.status==='mathematical-netting-proposal-only'
      ? 'GROSS OBLIGATIONS: $'+c(plan.grossCents)+'\nPROPOSED NET MOVES: '+plan.proposedSettlementMoves.map(x=>x.from+' → '+x.to+' $'+c(x.cents)).join(', ')+'\nREALLY MOVED: $0.00. Authorization and partner agreements still missing.'
      : 'ON HOLD: participant consent missing. No usable netting instruction and no real transfer.');
  } catch(error){write('#net-result',error.message);}
}
find('#net').addEventListener('click',()=>net(true));
find('#hold').addEventListener('click',()=>net(false));
renderRoute(30);
