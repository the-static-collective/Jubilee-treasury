/**
 * JUBILEE CONCORD-014 — AGREEMENT GRAMMAR / SYNTHESIZE, DON'T PRE-LIST
 *
 * Recombine independently first-person-authored local offer cards by typed
 * prerequisite and output tokens, working backwards from an unmet obligation.
 *
 * The cards are invented; "yes" = willing to DISCUSS, not agreement to work,
 * licensed IP, creditor discharge, escrow, title, consent for disclosure,
 * or enforceable promise. It is NEVER a financing or settlement engine.
 */
const validId=(x,k)=>{if(typeof x!=='string'||!x.trim()||x.length>110)throw new TypeError(k+' requires a short ID');return x;};
const text=(x,k)=>{if(typeof x!=='string'||!x.trim()||x.length>340)throw new TypeError(k+' requires bounded text');return x;};
const clone=x=>JSON.parse(JSON.stringify(x));
const allowedStatus=new Set(['yes','unknown','no']);
const MAX_OPERATORS=28,MAX_PLANS=60,MAX_DEPTH=10;

const card=(id,actor,requires,produces,question,options={})=>({
 id,actor,requires,produces,question,
 status:options.status??'unknown',
 priorYesBps:options.priorYesBps??5000,
 declaredByActorInFixture:true,
 purpose:'settle-a-need',expiresDay:45,
 risks:options.risks??[],
 exclusiveClaims:options.exclusiveClaims??[],
 directQuestionBurden:options.directQuestionBurden??.1,
 ...options
});
export function makeAgreementFixture(){
 return {
  day:30,purpose:'settle-a-need',
  originActor:'G',beneficiaryActor:'A',creditorActor:'L',
  realGoldTitleVerified:false,realLandlordConsentVerified:false,
  rentNeedCents:30000,
  initialFacts:['asset-story-may-be-offered:G'],
  goal:'rent-satisfaction-option:A',
  actors:['G','F','E','B','L','A','H'],
  // Each card describes ONE participant's potential local exchange,
  // not an end-to-end transaction chain.
  offers:[
   card('G-image-permission','G',['asset-story-may-be-offered:G'],
      'fictional-image-permission:F',
      'Would you consider permitting a bounded nonexclusive depiction of the object?',
      {status:'yes',risks:['title-not-verified','image-rights-not-verified']}),
   card('F-produces-promo','F',['fictional-image-permission:F'],
      'promotional-video-for:E',
      'Would you consider a specified promotional video in return for those permissions?',
      {status:'yes'}),
   card('E-offers-repair','E',['promotional-video-for:E'],
      'qualified-repair-for:L',
      'Would you consider properly qualified, lawful repairs in return for a promotional film?',
      {status:'yes',risks:['actual-safety-and-licensing-unverified']}),
   card('L-considers-repair','L',['qualified-repair-for:L'],
      'rent-satisfaction-option:A',
      'Would you consider specific independently inspected repairs instead of rent, subject to advance written terms?',
      {status:'unknown',priorYesBps:6000,risks:['creditor-acceptance-not-verified']}),
   // Two *independent* local exchanges make a previously unlisted full chain:
   // G image right → F rental listing video → L proposed rent satisfaction.
   card('F-offers-listing-film','F',['fictional-image-permission:F'],
      'rental-listing-film-for:L',
      'Would you consider creating a rental listing film in exchange for limited photo rights?',
      {status:'unknown',priorYesBps:7500}),
   card('L-considers-listing-film','L',['rental-listing-film-for:L'],
      'rent-satisfaction-option:A',
      'Would a specific listing video be worth discussing as alternative rent satisfaction?',
      {status:'unknown',priorYesBps:4000,risks:['creditor-acceptance-not-verified']}),
   // A third branch synthesized from independent film, organizing, landlord
   // capabilities; no "community-class-chain" is pre-listed anywhere.
   card('F-offers-event-poster','F',['fictional-image-permission:F'],
      'event-poster-for:B',
      'Would you consider making a community learning-event poster for limited photo access?',
      {status:'unknown',priorYesBps:7500}),
   card('B-offers-skill-workshop','B',['event-poster-for:B'],
      'skills-workshop-for:L',
      'Would you consider facilitating a practical skills workshop in exchange for event promotion?',
      {status:'unknown',priorYesBps:6000}),
   card('L-considers-skill-workshop','L',['skills-workshop-for:L'],
      'rent-satisfaction-option:A',
      'Would you consider an appropriately planned workshop instead of rent, under written terms?',
      {status:'unknown',priorYesBps:4500,
       risks:['landlord-may-not-have-legitimate-use','creditor-acceptance-not-verified']})
  ]
 };
}
export function validateAgreementFixture(f){
 if(!f||!Number.isSafeInteger(f.day)||f.day<0||f.day>36500)
   throw new Error('Bounded experiment date required');
 validId(f.purpose,'purpose');validId(f.goal,'goal');
 validId(f.originActor,'origin');validId(f.beneficiaryActor,'beneficiary');
 validId(f.creditorActor,'creditor');
 if(!Number.isSafeInteger(f.rentNeedCents)||f.rentNeedCents<1||f.rentNeedCents>1_000_000_000)
   throw new Error('Bounded synthetic need required');
 if(!Array.isArray(f.actors)||f.actors.length<3||f.actors.length>30 ||
    new Set(f.actors).size!==f.actors.length ||
    !f.actors.includes(f.originActor)||!f.actors.includes(f.beneficiaryActor)||
    !f.actors.includes(f.creditorActor))
   throw new Error('Bounded distinct participating actor list required');
 f.actors.forEach(a=>validId(a,'actor'));
 if(!Array.isArray(f.initialFacts)||f.initialFacts.length>20||
    new Set(f.initialFacts).size!==f.initialFacts.length)
   throw new Error('Distinct initial facts required');
 f.initialFacts.forEach(x=>validId(x,'initial fact'));
 if(!Array.isArray(f.offers)||f.offers.length>MAX_OPERATORS)
   throw new Error('Too many offer cards');
 const seen=new Set();
 for(const o of f.offers){
   validId(o?.id,'offer');validId(o.actor,'source author');
   if(seen.has(o.id))throw new Error('Duplicate offer ID');
   seen.add(o.id);
   if(!f.actors.includes(o.actor)||o.declaredByActorInFixture!==true||
      o.purpose!==f.purpose)throw new Error('First-person, purpose-scoped author required');
   if(!allowedStatus.has(o.status))throw new Error('Unknown willingness state');
   if(!Array.isArray(o.requires)||o.requires.length>5||new Set(o.requires).size!==o.requires.length)
     throw new Error('Bounded unique prerequisite tokens required');
   o.requires.forEach(t=>validId(t,'prerequisite'));
   validId(o.produces,'output token');
   text(o.question,'neutral explicit question');
   if(!Number.isInteger(o.expiresDay)||o.expiresDay<0||o.expiresDay>36500)
     throw new Error('Explicit expiration required');
   if(!Number.isInteger(o.priorYesBps)||o.priorYesBps<1||o.priorYesBps>9999)
     throw new Error('Toy prior must be bounded and noncertain');
   if(!Number.isFinite(o.directQuestionBurden)||o.directQuestionBurden<0||
      o.directQuestionBurden>10)throw new Error('Bounded asking burden required');
   if(!Array.isArray(o.exclusiveClaims)||o.exclusiveClaims.length>5||
      !Array.isArray(o.risks)||o.risks.length>10)throw new Error('Rights and risk lists required');
   o.exclusiveClaims.forEach(x=>validId(x,'exclusive claim'));
   o.risks.forEach(x=>validId(x,'risk'));
 }
 if(f.initialFacts.includes(f.goal))throw new Error('Need must not already be satisfied by fiat');
 return true;
}
const mergeProof=(a,b)=>{
 const added=[...a,...b].filter((op,i,all)=>all.findIndex(x=>x.id===op.id)===i);
 const claims=new Map();
 for(const op of added){
  for(const exclusive of op.exclusiveClaims){
   const existing=claims.get(exclusive);
   if(existing && existing!==op.id)return null;
   claims.set(exclusive,op.id);
  }
 }
 return added;
};
/**
 * Backward-chaining AND/OR proof search.
 *
 * A plan is GENERATED by joining primitive, first-person offer cards on
 * typed input/output tokens. No full barter chain is enumerated in the
 * fixture. Cycles and contradictory exclusivity are pruned.
 *
 * Unknown card authors never count as accepting; a plan with unknown inputs
 * is only a QUESTION HYPOTHESIS, not a "ready" deal.
 */
export function synthesizeAgreements(f=makeAgreementFixture()){
 validateAgreementFixture(f);
 const byOutput=new Map();
 for(const o of f.offers){
  if(o.expiresDay<f.day||o.status==='no')continue;
  if(!byOutput.has(o.produces))byOutput.set(o.produces,[]);
  byOutput.get(o.produces).push(o);
 }
 let operationsVisited=0,cyclesPruned=0,limitHit=false;
 function prove(token,visiting,depth){
  if(f.initialFacts.includes(token))return [[]];
  if(depth>MAX_DEPTH){limitHit=true;return [];}
  if(visiting.has(token)){cyclesPruned++;return [];}
  const nextVisited=new Set([...visiting,token]);
  const choices=[];
  for(const op of byOutput.get(token)??[]){
    if(operationsVisited++>5000){limitHit=true;break;}
    let partial=[[]];
    for(const req of op.requires){
      const options=prove(req,nextVisited,depth+1);
      const next=[];
      for(const a of partial)for(const b of options){
        const merged=mergeProof(a,b);
        if(merged&&next.length<MAX_PLANS)next.push(merged);
      }
      partial=next;
      if(!partial.length)break;
    }
    for(const components of partial){
      const combo=mergeProof(components,[op]);
      if(combo&&choices.length<MAX_PLANS)choices.push(combo);
      else if(choices.length>=MAX_PLANS)limitHit=true;
    }
  }
  return choices;
 }
 const raw=prove(f.goal,new Set(),0);
 const seen=new Set();
 const plans=[];
 for(const proof of raw){
  const signature=[...new Set(proof.map(x=>x.id))].sort().join('|');
  if(seen.has(signature))continue;
  seen.add(signature);
  const unknown=proof.filter(x=>x.status==='unknown').map(x=>x.id);
  const pending=proof.filter(x=>x.status==='yes').map(x=>x.id);
  const plan={
    id:'synthesized-'+(plans.length+1),
    proofSignature:signature,
    generatedOperatorIds:proof.map(x=>x.id),
    unknownFirstPersonQuestions:unknown,
    numberOfDependencies:proof.length,
    firstPersonInterestAssertedInFixture:pending,
    status:unknown.length?'HOLD-unanswered-participants':
      'ready-to-discuss-specific-terms-HOLD',
    type:'generated-conditional-multilateral-option',
    legalAgreementVerified:false,
    realExternalWillingnessVerified:false,
    actualAssetUseRightsGranted:false,
    physicallyMovedGold:false,
    actualCreditorReleaseCents:0,
    actualMoneyMovedCents:0,
    recipientOwesMiddlemenCents:0,
    risks:[...new Set(proof.flatMap(x=>x.risks))],
    benefitMetricsMeasured:false,
    novelComparedToFixedRepairChain:!proof.some(x=>x.id==='E-offers-repair')
  };
  plans.push(plan);
  if(plans.length>=MAX_PLANS){limitHit=true;break;}
 }
 return {
  goal:f.goal,plans,
  numberOfDistinctConditionalStructures:plans.length,
  readyToDiscussInFixture:plans.filter(x=>!x.unknownFirstPersonQuestions.length).length,
  search:{algorithm:'bounded-backward-AND-OR-regression',
    maxDepth:MAX_DEPTH,cyclesPruned,operationsVisited,searchWasTruncated:limitHit},
  userAuthoredCompleteChainsRequired:false,
  legalMoneyOrWorkAuthorized:false,
  realDebtDischargedCents:0,
  actualPaymentsCents:0
 };
}
export function applyFirstPersonOfferAnswer(f,offerId,personId,answer){
 validateAgreementFixture(f);
 const o=f.offers.find(x=>x.id===offerId);
 if(!o)throw new Error('Unknown offer / no personal question');
 if(o.actor!==personId)throw new Error('Only original offer author can affirm their own preferences');
 if(o.status!=='unknown')throw new Error('Cannot rewrite a previously recorded offer response');
 if(!['yes','no'].includes(answer))throw new Error('No inferred/ambiguous answer');
 const copy=clone(f);
 const target=copy.offers.find(x=>x.id===offerId);
 target.status=answer;
 return copy;
}
export function fixedRepairOnlyControl(f=makeAgreementFixture()){
 const fixture=clone(f);
 fixture.offers=fixture.offers.filter(x=>
   ['G-image-permission','F-produces-promo','E-offers-repair',
     'L-considers-repair'].includes(x.id));
 return synthesizeAgreements(fixture);
}
