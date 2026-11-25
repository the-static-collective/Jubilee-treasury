/**
 * CONCORD-014 / ANSWER → NEW STRUCTURE → NEXT QUESTION
 *
 * Actual imports:
 *  - 014: generative AND/OR offer composition
 *  - 012: exact finite response-tree choice of next question
 *  - 010: consented, redacted introduction routes
 *  - 009: independent, read-only legal-discharge HOLD boundary
 *
 * The synthetic prior is a COUNTERFACTUAL exercise. No data is inferred
 * about people. Real rights, money, work and legally discharged debt stay 0.
 */
import {
  makeAgreementFixture,validateAgreementFixture,
  synthesizeAgreements,applyFirstPersonOfferAnswer,fixedRepairOnlyControl
} from './composer.mjs';
import {makeRelayFixture,createRelayLab} from '../penny-puddle-010/relay.mjs';
import {optimalDirectAction,optimalQuestionPolicy,
  questionValue} from '../penny-puddle-012/question-value.mjs';
import {makeSatisfactionFixture,createSatisfactionWeave} from '../penny-puddle-009/satisfaction.mjs';

const copy=x=>JSON.parse(JSON.stringify(x));
const id=(x,k)=>{if(typeof x!=='string'||!x.trim()||x.length>120)
  throw new TypeError(k+' requires short ID');return x;};
const SCORE_FOR_VIABLE=15,REJECTION_PENALTY=-20;
function planScore(p){
  // This is only a hypothetical score for RESEARCH HORIZON COMPARISON.
  // The shorter, simpler plan has a small synthetic preference.
  return SCORE_FOR_VIABLE+Math.max(0,5-p.numberOfDependencies);
}
export function makeDiscoveryModel({
  offers=makeAgreementFixture(),network=makeRelayFixture(),blocked=[]
}={}){
  validateAgreementFixture(offers);
  const compositions=synthesizeAgreements(offers);
  const unknownIds=[...new Set(compositions.plans.flatMap(p=>
    p.unknownFirstPersonQuestions))].filter(x=>!blocked.includes(x));
  const known=offers.offers.filter(x=>unknownIds.includes(x.id));
  if(known.length>8)throw new Error('At most 8 unknown participant questions in finite research model');
  const routeMap=new Map();
  for(const op of known){
    if(op.actor===offers.originActor){
      // An owner may be directly asked; no friend-of-friend required.
      routeMap.set(op.id,{lab:null,routeId:null,
        firstKnownContact:offers.originActor,introductions:0,
        targetActor:op.actor});
    }else{
      const lab=createRelayLab(network,{from:offers.originActor,to:op.actor,
        purpose:offers.purpose});
      const first=lab.publicPreview().candidates[0];
      routeMap.set(op.id,first?{
        lab,routeId:first.routeId,firstKnownContact:first.firstKnownContact,
        introductions:first.introductionCount,targetActor:op.actor
      }:null);
    }
  }
  const viable=compositions.plans.filter(p=>
    p.unknownFirstPersonQuestions.every(x=>routeMap.get(x))&&
    !p.unknownFirstPersonQuestions.some(x=>blocked.includes(x)));
  const questionIds=[...new Set(viable.flatMap(p=>p.unknownFirstPersonQuestions))];
  const questions=questionIds.map(offerId=>{
    const o=offers.offers.find(x=>x.id===offerId);
    const route=routeMap.get(offerId);
    return {
      id:offerId,asker:o.actor,
      prompt:o.question,
      answers:['yes','no'],
      costPoints:o.directQuestionBurden+route.introductions*.15,
      firstKnownContactOnly:route.firstKnownContact,
      introductionHops:route.introductions,
      priorYesBps:o.priorYesBps,
      purpose:o.purpose
    };
  });
  // This is a Cartesian product of explicitly INVENTED private answer
  // hypotheses, never a model built by scraping or profiling anyone.
  let worlds=[{weight:1,answers:{}}];
  for(const q of questions){
    const next=[];
    for(const w of worlds){
      next.push({weight:w.weight*q.priorYesBps,
        answers:{...w.answers,[q.id]:'yes'}});
      next.push({weight:w.weight*(10000-q.priorYesBps),
        answers:{...w.answers,[q.id]:'no'}});
    }
    worlds=next;
  }
  const actions=['no-deal',...viable.map(p=>p.id)];
  worlds=worlds.map((w,i)=>({
    id:'hypothetical-'+i,weight:w.weight,answers:w.answers,
    outcomes:Object.fromEntries(actions.map(action=>{
      if(action==='no-deal')return [action,0];
      const p=viable.find(x=>x.id===action);
      return [action,p.unknownFirstPersonQuestions.every(x=>w.answers[x]==='yes')?
        planScore(p):REJECTION_PENALTY];
    }))
  }));
  const priorWorlds=worlds.length?worlds:[{
    id:'hypothetical-certain',weight:1,answers:{},
    outcomes:Object.fromEntries(actions.map(a=>[a,
      a==='no-deal'?0:planScore(viable.find(p=>p.id===a))]))
  }];
  return {questions,worlds:priorWorlds,actions,viable,
    compositions,routeMap,
    evidence:'invented-independent-priors, entirely uncalibrated',
    modeledDecisionOnly:true,noMoneyAssetOrContractCreated:true};
}
function describeNext(model,remaining){
  const base=optimalDirectAction(model.worlds,model.actions);
  const d=optimalQuestionPolicy(model.worlds,model.questions,model.actions,
    Math.min(3,remaining,model.questions.length));
  const q=model.questions.find(x=>x.id===d.firstQuestionId);
  return {base,policy:d,question:q};
}
export function compareDiscoveryControls({
  offers=makeAgreementFixture(),network=makeRelayFixture()
}={}){
  const unrestricted=makeDiscoveryModel({offers,network});
  const fixed=fixedRepairOnlyControl(offers);
  const full=describeNext(unrestricted,3);
  const originalIDs=new Set(fixed.plans.map(x=>x.proofSignature));
  const generated=unrestricted.compositions.plans.filter(x=>
    !originalIDs.has(x.proofSignature));
  return {
    baselineSingleHardcodedChainCount:fixed.numberOfDistinctConditionalStructures,
    generatedDistinctChainCount:unrestricted.compositions.numberOfDistinctConditionalStructures,
    independentlyComposedNewStructures:generated.length,
    newStructureProofs:generated.map(p=>({
      id:p.id,dependencyOperators:p.generatedOperatorIds,
      unresolvedQuestions:p.unknownFirstPersonQuestions,
      realCounterpartyAcceptance:false
    })),
    noQuestionBestHypotheticalAction:full.base.action,
    exactBoundedFirstQuestion:full.question?.id??null,
    exactBoundedExpectedScenarioPoints:full.policy.expectedScenarioPointsNet,
    questionCounterfactuals:unrestricted.questions.map(q=>({
      questionId:q.id,person:q.asker,
      stepsToIntroduction:q.introductionHops,
      hypotheticalOneStepDecisionGain:questionValue(
        unrestricted.worlds,q,unrestricted.actions).netDecisionValuePoints
    })),
    unverifiedSyntheticPrior:true,realWorldUtilityValidated:false,
    realWelfareProducedCents:0,realDebtDischargedCents:0
  };
}
export function createAgreementInvestigator({
  offers=makeAgreementFixture(),network=makeRelayFixture(),maxQuestions=6
}={}){
  validateAgreementFixture(offers);
  if(!Number.isInteger(maxQuestions)||maxQuestions<1||maxQuestions>8)
    throw new Error('Bounded inquiry budget 1–8');
  const initial=copy(offers);
  let fixture=copy(offers),tenantConsent=false,ownerConsent=false,
    withdrawn=false,active=null,pending=null,answered=0;
  const blocked=new Set(),events=[],eventIds=new Set();
  const record=(eventId,kind,subjectId)=>{
    id(eventId,'eventId');
    if(eventIds.has(eventId))throw new Error('Duplicate audit event');
    eventIds.add(eventId);
    events.push({eventId,kind,subjectId,
      verifiedRealPerson:false,realMessageSent:false,
      personalAnswerNotLogged:true});
  };
  const gate=()=>tenantConsent&&ownerConsent&&!withdrawn;
  const getModel=()=>makeDiscoveryModel({offers:fixture,network,
    blocked:[...blocked]});
  function priority(){
    const model=getModel();
    const composed=model.compositions;
    const ready=composed.plans.filter(x=>x.status==='ready-to-discuss-specific-terms-HOLD');
    const direct=optimalDirectAction(model.worlds,model.actions);
    const common={
      structuresGenerated:composed.numberOfDistinctConditionalStructures,
      structuresAwaitingUnaskedPeople:composed.plans.filter(x=>x.unknownFirstPersonQuestions.length).length,
      discussOnlyCandidates:ready.map(p=>({
        synthesizedPlanId:p.id,numberOfAgreements:p.numberOfDependencies,
        proofSignature:p.proofSignature,
        independentlyCompleted:false,actualLegalDischargeCents:0
      })),
      noParticipantForcedIntoWork:true,
      goldActuallyLicensed:false,creditorWaiverActuallyVerified:false,
      realPeopleMessaged:0,moneyMovedCents:0,reliefLegallyCompletedCents:0,
      hypotheticalBestAction:direct.action,
      hypotheticalDecisionScore:direct.expectedScenarioPoints
    };
    if(!gate())return {...common,
      status:'HOLD-tenant-owner-consent-missing',recommendedQuestion:null};
    if(active||pending)return {...common,
      status:pending?'HOLD-awaiting-first-person-answer':'HOLD-awaiting-separate-introduction-approvals',
      recommendedQuestion:null};
    if(answered>=maxQuestions)return {...common,
      status:'HOLD-inquiry-budget-exhausted',recommendedQuestion:null};
    const future=describeNext(model,maxQuestions-answered);
    const q=future.question;
    return {
      ...common,
      status:q?'request-permission-to-ask':'no-further-worthwhile-questions-under-toy-model',
      recommendedQuestion:q?{
        offerCardId:q.id,askerId:q.asker,
        neutralQuestion:q.prompt,
        firstKnownContactOnly:q.firstKnownContactOnly,
        introductionHops:q.introductionHops,
        hypothesizedCostPoints:q.costPoints,
        purpose:q.purpose,
        personalAnswerUnknown:true,
        noMessageAutomaticallyDispatched:true
      }:null,
      expectedModeledDecisionAfterPolicy:future.policy.expectedScenarioPointsNet,
      expectedModeledQuestions:future.policy.expectedQuestionsAsked
    };
  }
  function tenantChooses({eventId,actorId,approve}){
    if(actorId!==fixture.beneficiaryActor||typeof approve!=='boolean')
      throw new Error('Only the original beneficiary may opt into the inquiry');
    if(tenantConsent||withdrawn)throw new Error('Prior resident choice or withdrawal exists');
    record(eventId,approve?'RESIDENT_RESEARCH_YES':'RESIDENT_RESEARCH_NO',actorId);
    if(approve)tenantConsent=true;
    else withdrawn=true;
    return {status:approve?'consented-in-fictitious-fixture':'HOLD-declined',
      noIdentityVerification:true,noFundsMoved:true};
  }
  function ownerChooses({eventId,actorId,approve}){
    if(actorId!==fixture.originActor||typeof approve!=='boolean')
      throw new Error('Only the owner can choose whether to initiate inquiry');
    if(ownerConsent||withdrawn)throw new Error('Prior owner choice or withdrawal exists');
    record(eventId,approve?'OWNER_INQUIRY_YES':'OWNER_INQUIRY_NO',actorId);
    if(approve)ownerConsent=true;
    else withdrawn=true;
    return {status:approve?'consented-in-fictitious-fixture':'HOLD-declined',
      actualTitleVerified:false,noPropertyRightsIssued:true};
  }
  function initiate({eventId,initiatorId,offerCardId}){
    if(!gate())throw new Error('Need consent from owner and beneficiary first');
    if(active||pending)throw new Error('Previous introduction or question remains pending');
    const preferred=priority().recommendedQuestion;
    if(!preferred||preferred.offerCardId!==offerCardId)
      throw new Error('Question not currently selected by bounded decision search');
    if(initiatorId!==fixture.originActor)
      throw new Error('Only origin may initiate route through its contacts');
    const model=getModel();
    const route=model.routeMap.get(offerCardId);
    if(!route)throw new Error('No purpose-scoped valid route');
    if(route.lab){
      route.lab.request({eventId,routeId:route.routeId,initiatorId});
    }else if(route.targetActor!==initiatorId){
      throw new Error('No direct actor route permission');
    }
    record(eventId,'INTRODUCTION_REQUESTED_IN_FIXTURE',initiatorId);
    active={offerCardId,route,routeApproved:!route.lab};
    return {
      status:'introduction-only',firstPersonQuestionNotYetAsked:true,
      firstKnownContactOnly:route.firstKnownContact,
      hopsNeeded:route.introductions,realMessagesSent:0
    };
  }
  function nextInboxFor(actorId){
    id(actorId,'actorId');
    if(!active||!active.route.lab)return [];
    return active.route.lab.inboxFor(actorId);
  }
  function replyIntroduction({eventId,actorId,approve}){
    if(!active||!active.route.lab)throw new Error('No outstanding interpersonal route');
    const state=active.route.lab.respond({
      eventId,routeId:active.route.routeId,actorId,approve});
    record(eventId,approve?'FICTIONAL_REFERRAL_YES':'FICTIONAL_REFERRAL_NO',actorId);
    if(state.status==='refused'){
      blocked.add(active.offerCardId);active=null;
    }else if(state.allRelaysInFixtureAccepted)active.routeApproved=true;
    return {
      status:state.status,
      completedHopCount:state.approvedHopCount,
      totalHopCount:state.totalHopCount,
      actualPersonalAnswerKnown:false,
      noRemoteContactsPubliclyDisclosed:true,realContactMessagesSent:0
    };
  }
  function pose({eventId,actorId,offerCardId,
    personConsentsToExactQuestionInFixture}){
    if(!active||active.offerCardId!==offerCardId||!active.routeApproved)
      throw new Error('Must complete independently approved intro route');
    const card=fixture.offers.find(x=>x.id===offerCardId);
    if(!card||card.actor!==actorId ||
       personConsentsToExactQuestionInFixture!==true)
      throw new Error('Only targeted subject may explicitly opt into their question');
    record(eventId,'PERSON_CHOSES_TO_HEAR_EXACT_QUESTION',actorId);
    pending={offerCardId,actorId};
    active=null;
    return {
      question:card.question,target:actorId,
      answers:['yes','no'],noAnswerInferred:true,
      actualMessageSent:false,authorizesRealWork:false
    };
  }
  function reply({eventId,actorId,answer,firstPersonAnswerInFixture}){
    if(!pending)throw new Error('No unanswered, consented question');
    if(pending.actorId!==actorId||firstPersonAnswerInFixture!==true)
      throw new Error('Only questioned person can submit a response');
    if(!['yes','no'].includes(answer))throw new Error('Unexpected first-person answer');
    const updated=applyFirstPersonOfferAnswer(fixture,pending.offerCardId,actorId,answer);
    record(eventId,'ANSWER_RECORDED_WITHOUT_RAW_CONTENT',actorId);
    fixture=updated;answered++;pending=null;
    const state=priority();
    return {
      status:'subject-offer-preference-modeled',
      possibleNewConditionalStructures:state.structuresGenerated,
      currentlyWillingToDiscuss:state.discussOnlyCandidates.length,
      nextQuestion:state.recommendedQuestion?.offerCardId??null,
      actualServicesPerformed:0,realRentDischargedCents:0,
      rawAnswerNotStoredInPublicAudit:true
    };
  }
  function decline({eventId,actorId}){
    if(!pending||pending.actorId!==actorId)
      throw new Error('Only target may decline their own prompt');
    record(eventId,'SUBJECT_DECLINES_WITHOUT_ANSWER',actorId);
    blocked.add(pending.offerCardId);pending=null;
    return {
      status:'HOLD-question-declined-without-penalty',
      unknownNotConvertedIntoNo:true,noProfileInferred:true
    };
  }
  function revoke({eventId,actorId}){
    if(![fixture.beneficiaryActor,fixture.originActor].includes(actorId))
      throw new Error('Only recipient or owner may withdraw the inquiry');
    record(eventId,'INQUIRY_WITHDRAWN_BY_PARTICIPANT',actorId);
    withdrawn=true;tenantConsent=false;ownerConsent=false;
    fixture=copy(initial);blocked.clear();active=null;pending=null;answered=0;
    return {status:'HOLD-revoked',modeledAnswersRetained:0,
      furtherQuestioningAuthorized:false};
  }
  function legalBoundary(){
    const source=createSatisfactionWeave(makeSatisfactionFixture());
    const s=source.snapshot();
    return {
      composedOptionCount:priority().structuresGenerated,
      sourceOriginal:'penny-puddle-009/satisfaction.mjs',
      source009StillHOLD:s.status==='HOLD-no-independent-real-world-creditor-discharge',
      fictionalPotentialNegotiationsOnly:priority().discussOnlyCandidates.length,
      actualCreditorWaiverVerified:false,
      authenticatedOwnerTitle:false,verifiedLaborOrRights:false,
      legallyDischargedCents:s.legallyWaivedDebtCents,
      realMoneyMovedCents:s.cashActuallyChangedHandsCents,
      noAutomaticDebtAgainstBeneficiary:true
    };
  }
  function audit(){
    return {
      events:copy(events),
      questionResponsesModeled:answered,
      questionIdsDeniedOrDeclined:[...blocked],
      activeContactMessageActuallySent:false,
      realIdentityAuthImplemented:false,
      realFinancialRightsGranted:false,
      actualTransactions:0,
      existingHumanAnswersScraped:false
    };
  }
  return {priority,tenantChooses,ownerChooses,initiate,
    nextInboxFor,replyIntroduction,pose,reply,decline,revoke,
    legalBoundary,audit,benchmark:()=>compareDiscoveryControls({offers:initial,network})};
}
