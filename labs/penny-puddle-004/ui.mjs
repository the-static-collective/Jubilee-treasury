import {screenCoinCandidate} from './triage.mjs';
import {createRareCoinLab} from './collector.mjs';
const $=s=>document.querySelector(s);
const say=(where,text)=>{$(where).textContent=text;};
const scenarios={
  '1943':{denominationCents:1,observedYear:1943,features:['copper-like'],description:'Copper-looking 1943 cent'},
  '1955':{denominationCents:1,observedYear:1955,features:['doubled-lettering'],description:'Doubled-looking 1955 cent'},
  '1964':{denominationCents:25,observedYear:1964,features:[],description:'1964 quarter'},
  'normal':{denominationCents:1,observedYear:2023,features:[],description:'2023 cent'}
};
let lab=null,screen=null;
function stopForNewSpecimen(){
  for(const button of ['#review','#authenticate','#approve','#sale']) $(button).disabled=true;
  say('#review-result','On HOLD until reviewed.');
  say('#owner-result','No payout authorization.');
  say('#sale-result','No real offer exists. No buyer has paid.');
}
function run(fn,target){
  try{fn();}
  catch(error){say(target,error instanceof Error?error.message:'Invalid simulation state');}
}
$('#screen').addEventListener('click',()=>run(()=>{
  stopForNewSpecimen();
  const chosen=scenarios[$('#sample').value];
  screen=screenCoinCandidate({denominationCents:chosen.denominationCents,
    observedYear:chosen.observedYear,reportedFeatures:chosen.features});
  lab=createRareCoinLab({specimens:[{
    id:'fictional-object',denominationCents:chosen.denominationCents,
    declaredOwnerId:'hypothetical-owner',declaredFinderId:'hypothetical-finder',
    observedYear:chosen.observedYear,observedSignals:chosen.features,
    collateralized:false
  }]});
  const lines=[chosen.description,
    screen.flags.length?'POSSIBLE INTEREST — HOLD FOR HUMAN REVIEW':'NO AUTOMATIC RULE MATCH — ordinary does not mean valueless',
    ...screen.flags.map(f=>'· '+f.reason),
    'No authenticity, market value or title has been established.'];
  say('#screen-result',lines.join(' | '));
  $('#review').disabled=false;
},'#screen-result'));
$('#review').addEventListener('click',()=>run(()=>{
  if(!lab)throw new Error('Select a fictional specimen first.');
  const disposition=screen.flags.length?'needs-expert':'cleared-ordinary';
  lab.review({specimenId:'fictional-object',reviewerId:'fictional-independent-reviewer',
    disposition,evidenceReference:'not-a-real-report'});
  $('#review').disabled=true;
  $('#authenticate').disabled=disposition!=='needs-expert';
  say('#review-result',disposition==='needs-expert'?
    'MOCK independent screening: unresolved candidate. Real expert confirmation still needed.':
    'MOCK ordinary review: owner may keep or circulate with consent. No collectible premium is assumed.');
},'#review-result'));
$('#authenticate').addEventListener('click',()=>run(()=>{
  lab.authenticate({specimenId:'fictional-object',expertId:'fictional-expert',
    reference:'unverified-demo-grade',outcome:'authentic-collectible'});
  $('#authenticate').disabled=true;
  $('#approve').disabled=false;
  say('#review-result','FICTIONAL expert assertion used to explore the later steps. Not a real appraisal, identity check or authentication.');
},'#review-result'));
$('#approve').addEventListener('click',()=>run(()=>{
  lab.proposeOwnerChoice({specimenId:'fictional-object',ownerId:'hypothetical-owner',
    choice:'collector-offer',reference:'mock-opt-in-written-agreement',
    sharesBasisPoints:{owner:8000,finder:1000,steward:500,community:500}});
  $('#approve').disabled=true;
  $('#sale').disabled=false;
  say('#owner-result','FICTIONAL owner terms: retain face value, then share any actually realized collector premium as 80% owner, 10% finder, 5% steward, 5% community. No real owner has agreed.');
},'#owner-result'));
const dollars=c=>(c/100).toFixed(2);
$('#sale').addEventListener('click',()=>run(()=>{
  lab.simulateSale({specimenId:'fictional-object',externalSalePriceCents:10001,
    externalCostsCents:1000,buyerReference:'not-a-real-buyer',
    ownerReference:'not-a-real-settlement-approval'});
  $('#sale').disabled=true;
  const s=lab.inspect().coins[0].settlement;
  const a=s.allocationsCents;
  const display=[
    'FICTIONAL collector price: $'+dollars(s.externalSalePriceCents),
    'FICTIONAL external costs: $'+dollars(s.externalCostsCents),
    'Face value reserved to owner: $'+dollars(s.faceValueCents),
    'Remaining collector premium: $'+dollars(s.collectorPremiumCents),
    'Possible owner allocation: $'+dollars(a.owner),
    'Possible finder reward: $'+dollars(a.finder),
    'Possible steward compensation: $'+dollars(a.steward),
    'Possible community contribution: $'+dollars(a.community),
    'REAL FUNDS SPENDABLE IN PUDDLE: $0.00. No sale, real buyer, verified title or settlement exists.'
  ];
  say('#sale-result',display.join(' | '));
},'#sale-result'));
