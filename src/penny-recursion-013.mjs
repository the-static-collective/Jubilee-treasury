import {inspect,digest} from './asset-treasury-007.mjs';

export const SCHEMA='jubilee.penny-recursion-index/v0.1';
const TOKEN=/^[a-z][a-z0-9_]{1,63}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9:._-]{2,127}$/;
const STAGES=new Set([
  'held','counted','sorted','story_ready','exhibit_candidate',
  'deposit_candidate','interest_account_candidate',
  'invitation_candidate','external_gift_request'
]);
const EDGES={
  held:['counted'],
  counted:['sorted','story_ready'],
  sorted:['exhibit_candidate','deposit_candidate'],
  story_ready:['invitation_candidate'],
  invitation_candidate:['external_gift_request'],
  deposit_candidate:['interest_account_candidate']
};
const err=s=>{throw Error('PENNY_RECURSION_HOLD: '+s);};
const ok=(v,s)=>{if(!v)err(s);};
const cmp=(a,b)=>a<b?-1:a>b?1:0;
const positive=n=>Number.isSafeInteger(n)&&n>0&&n<=1000000;

export function validateRecipes(recipes) {
  ok(Array.isArray(recipes)&&recipes.length<=40,'bounded recipe array required');
  const seen=new Set();
  for(const r of recipes){
    ok(r&&typeof r==='object'&&!Array.isArray(r)&&
       Object.keys(r).sort().join('|')===
       ['id','purposeId','termsRef','from','to','minimumPennies','laborMinutes','evidenceClass'].sort().join('|'),
       'recipe fields must be exact');
    ok(typeof r.id==='string'&&REF.test(r.id)&&!seen.has(r.id),'recipe ID duplicate/invalid');
    seen.add(r.id);
    ok(REF.test(r.purposeId)&&REF.test(r.termsRef),'scope and terms required');
    ok(STAGES.has(r.from)&&STAGES.has(r.to)&&EDGES[r.from]?.includes(r.to),
      'only declared strictly advancing transformations; no arbitrary cycle');
    ok(positive(r.minimumPennies)&&positive(r.laborMinutes),
      'minimum real coins and real labor required for each proposal');
    ok(['inspection','creative','bank_approach','invitation'].includes(r.evidenceClass),
      'only nonauthoritative possibility classes supported');
    ok(!r.id.includes('interest_rate'),'recipes cannot fabricate a bank rate');
  }
  return recipes;
}

function sourceHold(ledger,purposeId){
  ok(REF.test(purposeId),'purpose ID malformed');
  const projection=inspect(ledger); // Exact signed steward history + state verification
  const pennies=projection.assets.filter(a=>a.state==='received'&&a.kind==='coins'&&
     a.unit==='penny'&&a.mode==='gift'&&a.purposeIds.includes(purposeId)&&a.available>0)
     .map(a=>({id:a.id,available:a.available,termsRef:a.termsRef,mode:a.mode}))
     .sort((a,b)=>cmp(a.id,b.id));
  const labor=projection.assets.filter(a=>a.state==='received'&&a.kind==='labor'&&
     a.unit==='minute'&&a.mode==='service'&&a.purposeIds.includes(purposeId)&&a.available>0)
     .map(a=>({id:a.id,available:a.available,termsRef:a.termsRef}))
     .sort((a,b)=>cmp(a.id,b.id));
  const sum=items=>items.reduce((n,a)=>n+a.available,0);
  const facePennies=sum(pennies),laborMinutes=sum(labor);
  ok(Number.isSafeInteger(facePennies)&&facePennies<=1000000000&&
     Number.isSafeInteger(laborMinutes)&&laborMinutes<=1000000000,'inventory overflow');
  const candidate={
    schema:'jubilee.penny-attested-source/v0.1',sourceHistoryHead:projection.head,
    sourceEventCount:projection.eventCount,purposeId,
    sourceLots:pennies,laborLots:labor,
    heldCoinCountFromSignedStewardClaims:facePennies,
    pennyFaceValueCents:facePennies,
    laborMinutesFromSignedStewardClaims:laborMinutes,
    note:'Asset Treasury 007 signed local stewardship assertions. No bank custody, verification of physical count, ownership title, savings rate or realized yield established.'
  };
  return {...candidate,sourceDigest:digest(candidate)};
}
export function pennySource(ledger,purposeId){
  return sourceHold(ledger,purposeId);
}

export function recursivePennyOptions(ledger,{purposeId,recipes=[],maxDepth=4,
  maxCandidates=128,expectedHead}={}){
  const source=sourceHold(ledger,purposeId);
  if(expectedHead!==undefined)ok(expectedHead===source.sourceHistoryHead,'stale pinned ledger head');
  ok(Number.isSafeInteger(maxDepth)&&maxDepth>=1&&maxDepth<=7,'maxDepth 1..7');
  ok(Number.isSafeInteger(maxCandidates)&&maxCandidates>=1&&maxCandidates<=512,'bounded scenario count');
  validateRecipes(recipes);
  const eligible=[...recipes].filter(r=>r.purposeId===purposeId).sort((a,b)=>cmp(a.id,b.id));
  const candidates=[],blocked=[];
  const initial={stage:'held',workSpent:0,coinCount:source.heldCoinCountFromSignedStewardClaims,
    history:[],depth:0,pathId:'root:'+source.sourceDigest.slice(0,24)};
  const queue=[initial];
  let truncated=false;
  while(queue.length){
    const current=queue.shift();
    if(current.depth>=maxDepth)continue;
    for(const recipe of eligible.filter(r=>r.from===current.stage)){
      const entry={
        recipeId:recipe.id,from:current.stage,to:recipe.to,
        purposeId,termsRef:recipe.termsRef,evidenceClass:recipe.evidenceClass,
        sourceHead:source.sourceHistoryHead,
        parentPathId:current.pathId,
        sourceCoinCount:current.coinCount,
        workMinutesAlreadyUsed:current.workSpent,
        workMinutesNeeded:recipe.laborMinutes,
        status:'COUNTERFACTUAL_ONLY',
        authority:'NONE'
      };
      if(current.coinCount<recipe.minimumPennies){
        blocked.push({...entry,reason:'insufficient_pennies'});
        continue;
      }
      if(current.workSpent+recipe.laborMinutes>source.laborMinutesFromSignedStewardClaims){
        blocked.push({...entry,reason:'insufficient_independently_received_labor'});
        continue;
      }
      if(current.history.some(step=>step.to===recipe.to)||recipe.to==='held'){
        blocked.push({...entry,reason:'recursion_cycle_refused'});continue;
      }
      if(candidates.length===maxCandidates){truncated=true;break;}
      const path=[...current.history,{recipeId:recipe.id,from:recipe.from,to:recipe.to}];
      const next={
        pathId:'option-'+digest({head:source.sourceHistoryHead,source:source.sourceDigest,
          recipePath:path,workSpent:current.workSpent+recipe.laborMinutes}).slice(0,32),
        depth:current.depth+1,stage:recipe.to,coinCount:current.coinCount,
        workSpent:current.workSpent+recipe.laborMinutes,history:path
      };
      // Crucial: "counted" or "sorted" is not a second physical coin asset.
      // No recipe mutates the source ledger, mints coins, or yields interest.
      candidates.push({...entry,
        optionId:next.pathId,depth:next.depth,path:next.history,
        workMinutesHypotheticallyAllocated:next.workSpent,
        pennyCountIfThisExclusiveRouteSelected:current.coinCount,
        faceValueCentsIfIndependentlyVerified:current.coinCount,
        actualCoinDelta:0,interestPaidMinorUsd:0,custodyChanged:false,
        newDonationsReceived:0,recipientAdmission:false,
        alternativeNotAdditive:true});
      queue.push(next);
    }
    if(truncated)break;
  }
  const body={
    schema:SCHEMA,source,authority:'READ_ONLY_COUNTERFACTUAL_RECIPES',
    rootCoinCount:source.heldCoinCountFromSignedStewardClaims,
    newAssetsCreated:0,earnedInterestMinorUsd:0,
    operatorCashAvailableMinorUsd:0,
    projectedRoutes:candidates,blockedRoutes:blocked,
    truncated,limits:{maxDepth,maxCandidates},
    warning:'Scenarios are mutually competing branches based on exactly the same signed coin lots and labor pool. Never sum route face values or count an option as an asset, pledge, donated matching fund, earned yield, bank deposit, interest payment, or verified coin count.'
  };
  return {...body,indexHash:digest(body)};
}

export function hypotheticalInterest(ledger,{purposeId,aprBasisPoints=0,
  months=12,monthlyFutureContributionPennies=0,expectedHead}={}){
  const source=sourceHold(ledger,purposeId);
  if(expectedHead!==undefined)ok(expectedHead===source.sourceHistoryHead,'stale signed ledger');
  ok(Number.isSafeInteger(aprBasisPoints)&&aprBasisPoints>=0&&aprBasisPoints<=20000,
    'hypothetical APR 0..20000 basis points');
  ok(Number.isSafeInteger(months)&&months>=1&&months<=120,'months 1..120');
  ok(Number.isSafeInteger(monthlyFutureContributionPennies)&&monthlyFutureContributionPennies>=0&&
    monthlyFutureContributionPennies<=1000000,'bounded fictional future contribution');
  // Explicit floor each month avoids over-crediting fractional cents. This is
  // a hypothetical illustration, not the actual conventions of any bank.
  let balance=BigInt(source.heldCoinCountFromSignedStewardClaims);
  let imaginedInterest=0n;
  const trace=[];
  for(let m=1;m<=months;m++){
    const contribution=BigInt(monthlyFutureContributionPennies);
    balance+=contribution;
    const added=balance*BigInt(aprBasisPoints)/120000n;
    balance+=added;
    imaginedInterest+=added;
    trace.push({month:m,imaginedContributionCents:Number(contribution),
      imaginedInterestCents:Number(added),imaginedBalanceCents:Number(balance)});
  }
  const body={
    schema:'jubilee.penny-interest-illustration/v0.1',
    sourceHead:source.sourceHistoryHead,sourcePennyCount:source.heldCoinCountFromSignedStewardClaims,
    scenario:{aprBasisPoints,months,monthlyFutureContributionPennies,
      hypotheticalOnly:true},
    imaginedFinalBalanceCents:Number(balance),
    imaginedInterestTotalCents:Number(imaginedInterest),
    timeline:trace,
    actuallyEarnedInterestCents:0,actualNewCoins:0,actualFundsDepositedCents:0,
    sourceInventoryUnchanged:true,
    warning:'Pure mathematical counterfactual. Holding pennies physically earns no contractual bank interest. APR, future contributions, deposit eligibility, compounding, taxes, fees and payout were not supplied or verified by a financial institution.'
  };
  ok(Number.isSafeInteger(body.imaginedFinalBalanceCents),'illustration numeric range exceeded');
  return {...body,illustrationHash:digest(body)};
}

export function defaultPennyRecipes(purposeId){
  ok(typeof purposeId==='string'&&REF.test(purposeId),'purpose required');
  return [
    {id:'penny_counting_001',purposeId,termsRef:'terms-physical-count-human-001',
     from:'held',to:'counted',minimumPennies:1,laborMinutes:1,evidenceClass:'inspection'},
    {id:'penny_sorting_001',purposeId,termsRef:'terms-sort-without-melt-001',
     from:'counted',to:'sorted',minimumPennies:10,laborMinutes:3,evidenceClass:'inspection'},
    {id:'penny_story_001',purposeId,termsRef:'terms-consent-story-001',
     from:'counted',to:'story_ready',minimumPennies:1,laborMinutes:2,evidenceClass:'creative'},
    {id:'penny_exhibit_001',purposeId,termsRef:'terms-display-owner-001',
     from:'sorted',to:'exhibit_candidate',minimumPennies:10,laborMinutes:4,evidenceClass:'creative'},
    {id:'penny_bank_visit_001',purposeId,termsRef:'terms-bank-owner-001',
     from:'sorted',to:'deposit_candidate',minimumPennies:100,laborMinutes:2,evidenceClass:'bank_approach'},
    {id:'penny_interest_account_001',purposeId,termsRef:'terms-no-rate-assumed-001',
     from:'deposit_candidate',to:'interest_account_candidate',minimumPennies:100,
     laborMinutes:1,evidenceClass:'bank_approach'},
    {id:'penny_invite_matching_001',purposeId,termsRef:'terms-matching-not-pledge-001',
     from:'story_ready',to:'invitation_candidate',minimumPennies:1,laborMinutes:2,evidenceClass:'invitation'},
    {id:'penny_request_new_gift_001',purposeId,termsRef:'terms-no-automatic-gift-001',
     from:'invitation_candidate',to:'external_gift_request',minimumPennies:1,
     laborMinutes:1,evidenceClass:'invitation'}
  ];
}
