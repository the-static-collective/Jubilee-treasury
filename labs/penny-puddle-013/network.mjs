/**
 * JUBILEE QUESTION-013 — NETWORK INVESTIGATOR
 *
 * Ask WHO across an explicitly source-owned relationship network, in WHAT
 * ORDER, and only when a first-person answer could change a voluntarily
 * negotiable outcome. Source-reuses actual QUESTION-012 decision search,
 * RELAY-010 hop-by-hop invitations and SATISFACTION-009 read-only snapshots.
 *
 * Entirely SYNTHETIC: every identity, permission, relationship, probability,
 * contract, financial fallback and human preference is invented. Actor IDs
 * are never an authentication system. There is no outbound contact/finance.
 */
import {makeRelayFixture,createRelayLab} from '../penny-puddle-010/relay.mjs';
import {
  optimalDirectAction,optimalQuestionPolicy,questionValue
} from '../penny-puddle-012/question-value.mjs';
import {
  makeSatisfactionFixture,createSatisfactionWeave
} from '../penny-puddle-009/satisfaction.mjs';

const clone=x=>JSON.parse(JSON.stringify(x));
const id=(s,k)=>{if(typeof s!=='string'||!s.trim()||s.length>120)throw new TypeError(k+' must be nonempty short text');return s;};
const actions=['weave-satisfaction','angel-funded-alternative','no-deal'];
const questionSpecs=[
  {id:'ask-landlord-about-noncash',asker:'L',name:'Landlord',
    prompt:'Would you consider specific, lawful repairs instead of rent, subject to agreeing terms in advance?',
    directBurdenPoints:.15,yesWeight:6,noWeight:4},
  {id:'ask-electrician-about-repairs',asker:'E',name:'Electrician',
    prompt:'Would you consider a defined, lawful repair job if someone made a promotional film you actually wanted?',
    directBurdenPoints:.05,yesWeight:17,noWeight:3},
  {id:'ask-filmmaker-about-license',asker:'F',name:'Filmmaker',
    prompt:'Would you consider producing a film in exchange for a consensual, limited photographic license?',
    directBurdenPoints:.10,yesWeight:9,noWeight:1}
];
function paths(network,spec){
  const lab=createRelayLab(network,{from:'G',to:spec.asker,purpose:'settle-a-need'});
  const preview=lab.publicPreview();
  const first=preview.candidates[0]??null;
  return {lab,first,routeId:first?.routeId??null};
}
export function makeNetworkQuestionFixture(network=makeRelayFixture()){
  const questions=questionSpecs.map(spec=>{
    const route=paths(network,spec);
    return {
      id:spec.id,asker:spec.asker,name:spec.name,prompt:spec.prompt,
      answers:['yes','no'],
      routeFound:!!route.first,
      firstKnownContact:route.first?.firstKnownContact??null,
      introductionHops:route.first?.introductionCount??null,
      // Invented burden units; route distance has a cost, not a trust score.
      costPoints:route.first?
        spec.directBurdenPoints+route.first.introductionCount*.15:null,
      from:'G',scope:'settle-a-need',
      actualRecipientPermission:false,
      outcomeIsLegalAcceptance:false
    };
  });
  const worlds=[];
  for(const landlord of [true,false])
  for(const electrician of [true,false])
  for(const filmmaker of [true,false]){
    const values={L:landlord,E:electrician,F:filmmaker};
    const weight=questionSpecs.reduce((n,q)=>
      n*(values[q.asker]?q.yesWeight:q.noWeight),1);
    const answers=Object.fromEntries(questionSpecs.map(q=>
      [q.id,values[q.asker]?'yes':'no']));
    worlds.push({
      id:'fictional-'+Number(landlord)+Number(electrician)+Number(filmmaker),
      weight,answers,
      outcomes:{
        'weave-satisfaction':landlord&&electrician&&filmmaker?18:-15,
        'angel-funded-alternative':5, // only hypothetical; no actual donor cash!
        'no-deal':0
      }
    });
  }
  return {
    network,questions,worlds,actions:[...actions],scenarioDay:network.day,
    purpose:'settle-a-need',
    priorProvenance:'entirely invented Bernoulli frequencies; not psychological estimates',
    hypotheticalRentCents:30000
  };
}
const weight=ws=>ws.reduce((a,w)=>a+w.weight,0);
function chooseFirstValue(worlds,questions,actions,depth,first){
  const base=optimalDirectAction(worlds,actions);
  if(!first)return {
    forcedFirstQuestionId:null,
    expectedPointsNet:base.expectedScenarioPoints,
    expectedQuestions:0
  };
  const wt=weight(worlds),rest=questions.filter(q=>q.id!==first.id);
  let score=-first.costPoints,expectedQuestions=1;
  for(const ans of first.answers){
    const subset=worlds.filter(w=>w.answers[first.id]===ans);
    if(!subset.length)continue;
    const response=optimalQuestionPolicy(subset,rest,actions,depth-1);
    const p=weight(subset)/wt;
    score+=p*response.expectedScenarioPointsNet;
    expectedQuestions+=p*response.expectedQuestionsAsked;
  }
  return {forcedFirstQuestionId:first.id,
    expectedPointsNet:score,expectedQuestions};
}
export function compareNetworkQuestionStrategies(f=makeNetworkQuestionFixture()){
  const q=f.questions.filter(x=>x.routeFound);
  const base=optimalDirectAction(f.worlds,f.actions);
  const depth=Math.min(3,q.length);
  const optimal=optimalQuestionPolicy(f.worlds,q,f.actions,depth);
  const myopic=optimalQuestionPolicy(f.worlds,q,f.actions,1);
  const nearest=[...q].sort((a,b)=>
    a.introductionHops-b.introductionHops||a.id.localeCompare(b.id))[0];
  const forcedNearest=chooseFirstValue(f.worlds,q,f.actions,depth,nearest);
  const candidates=q.map(x=>({
    questionId:x.id,asker:x.name,
    firstKnownContactOnly:x.firstKnownContact,
    introductionHops:x.introductionHops,
    modeledBurdenPoints:x.costPoints,
    oneStepExpectedDecisionGainPoints:questionValue(f.worlds,x,f.actions).netDecisionValuePoints,
    realHumanContacted:false
  }));
  return {
    noQuestionAction:base.action,
    noQuestionPoints:base.expectedScenarioPoints,
    nearestContactQuestion:nearest?.id??null,
    nearestFirstOptimallyContinuedPoints:forcedNearest.expectedPointsNet,
    myopicFirstQuestion:myopic.firstQuestionId,
    myopicExpectedPointsNet:myopic.expectedScenarioPointsNet,
    exactThreeQuestionFirst:optimal.firstQuestionId,
    exactThreeQuestionExpectedPointsNet:optimal.expectedScenarioPointsNet,
    expectedQuestionsUnderOptimal:optimal.expectedQuestionsAsked,
    candidates,
    priorIsRealEvidence:false,
    permissionAndTitleActuallyVerified:false,
    realDebtsDischargedCents:0
  };
}
export function createNetworkInvestigator({
  network=makeRelayFixture(),maxQuestions=3
}={}){
  if(!Number.isInteger(maxQuestions)||maxQuestions<1||maxQuestions>3)
    throw new Error('Question budget must be 1-3');
  const fixture=makeNetworkQuestionFixture(network);
  const prior=fixture.worlds;
  let posterior=prior,questionsAnswered=new Set(),
    yesAnswered=new Set(),unreachable=new Set(),
    tenantAuthorized=false,ownerAuthorized=false,revoked=false,
    active=null,pending=null;
  const routes=new Map(questionSpecs.map(s=>[s.id,paths(network,s)]));
  const used=new Set(),events=[];
  const check=(eventId,kind)=>{
    id(eventId,'eventId');
    if(used.has(eventId))throw new Error('Duplicate evidence event ID');
    used.add(eventId);
    events.push({eventId,kind,source:'fictional-local-assertion',
      actualIdentityVerified:false,realMessageSent:false});
  };
  const gates=()=>tenantAuthorized&&ownerAuthorized&&!revoked;
  const eligible=()=>fixture.questions.filter(q=>q.routeFound&&
    !questionsAnswered.has(q.id)&&!unreachable.has(q.id));
  const selected=()=>fixture.questions.find(q=>q.id===
    optimalQuestionPolicy(posterior,eligible(),fixture.actions,
      Math.min(maxQuestions-questionsAnswered.size,3)).firstQuestionId);
  const priority=()=>{
    const direct=optimalDirectAction(posterior,fixture.actions);
    if(!gates())return {status:'HOLD-first-person-tenant-and-owner-consent',
      suggestedQuestion:null,baselineAction:direct.action,
      executionAuthorized:false};
    if(active||pending)return {status:pending?'awaiting-personal-question-response':
      'awaiting-hop-by-hop-introductions',
      suggestedQuestion:null,
      baselineAction:direct.action,executionAuthorized:false};
    if(questionsAnswered.size>=maxQuestions)return {
      status:'HOLD-question-budget-exhausted',suggestedQuestion:null,
      baselineAction:direct.action,executionAuthorized:false
    };
    const possible=eligible();
    const policy=optimalQuestionPolicy(posterior,possible,fixture.actions,
      Math.min(maxQuestions-questionsAnswered.size,3));
    const q=selected();
    return {
      status:q?'request-next-consented-introduction':'stop-no-further-useful-question',
      suggestedQuestion:q?{
        id:q.id,role:q.name,prompt:q.prompt,
        introductionHops:q.introductionHops,
        firstKnownContactOnly:q.firstKnownContact,
        assumedBurdenPoints:q.costPoints,
        mustAskActualPerson:true,
        secondhandPersonalityClaimsAccepted:false,
        realContactSent:false
      }:null,
      expectedModelPointsAfterPolicy:policy.expectedScenarioPointsNet,
      baselineAction:direct.action,baselineModelPoints:direct.expectedScenarioPoints,
      questionsAnswered:questionsAnswered.size,maximumQuestions:maxQuestions,
      posteriorIsSynthetic:true,executionAuthorized:false
    };
  };
  function tenantChooses({eventId,actorId,approve}){
    if(actorId!=='A'||typeof approve!=='boolean')
      throw new Error('Only the resident can assert tenant research consent in fixture');
    if(revoked||tenantAuthorized)throw new Error('Tenant research consent already processed or revoked');
    check(eventId,approve?'TENANT_CONSENTS_TO_RESEARCH':'TENANT_REFUSES_RESEARCH');
    if(!approve){revoked=true;return {status:'HOLD-resident-refused',realIdentityVerified:false};}
    tenantAuthorized=true;return {status:'tenant-consented-in-fixture',
      noPublicTenantDataPublished:true};
  }
  function ownerChooses({eventId,actorId,approve}){
    if(actorId!=='G'||typeof approve!=='boolean')
      throw new Error('Only the asset owner can assert inquiry consent in fixture');
    if(revoked||ownerAuthorized)throw new Error('Owner inquiry consent already processed or revoked');
    check(eventId,approve?'OWNER_CONSENTS_TO_INQUIRY':'OWNER_REFUSES_INQUIRY');
    if(!approve){revoked=true;return {status:'HOLD-owner-refused',
      actualUseRightsGranted:false};}
    ownerAuthorized=true;return {status:'owner-consented-to-asking-in-fixture',
      actualGoldTitleVerified:false,actualUseRightsGranted:false};
  }
  function startIntroduction({eventId,initiatorId,questionId}){
    if(!gates())throw new Error('Tenant and owner must first consent');
    if(active||pending)throw new Error('Complete or refuse active path first');
    const suggested=priority().suggestedQuestion;
    if(!suggested||suggested.id!==questionId)
      throw new Error('Only the current high-value question is selectable');
    const route=routes.get(questionId);
    if(!route?.routeId)throw new Error('No permitted, fresh path');
    const started=route.lab.request({
      eventId,routeId:route.routeId,initiatorId});
    check(eventId,'REQUEST_PERMISSIONED_INTRODUCTION');
    active={questionId,routeId:route.routeId,personId:fixture.questions.find(x=>x.id===questionId).asker};
    return {...started,questionId,actualMessagesSent:0};
  }
  function nextInboxFor(actorId){
    id(actorId,'actorId');
    if(!active)return [];
    return routes.get(active.questionId).lab.inboxFor(actorId).map(r=>({
      ...r,answerInferenceAllowed:false,actualDeliveryConfirmed:false
    }));
  }
  function respondIntroduction({eventId,actorId,approve}){
    if(!active)throw new Error('No currently requested route');
    const qId=active.questionId,route=routes.get(qId);
    const state=route.lab.respond({
      eventId,routeId:active.routeId,actorId,approve});
    check(eventId,approve?'CONTACT_GIVES_INTRO_PERMISSION':'CONTACT_REFUSES_INTRODUCTION');
    if(state.status==='refused'){
      // No relationship-mediated contact, no inferred YES or NO.
      unreachable.add(qId);active=null;
    }
    return {...state,subjectAnsweredQuestion:false,
      actualMessagesSent:0,creditorTermsAgreed:false};
  }
  function askQuestion({eventId,questionId,actorId,
    personIndividuallyAgreesToQuestionInFixture}){
    if(!active||active.questionId!==questionId)
      throw new Error('Question lacks a requested route');
    const route=routes.get(questionId);
    if(!route.lab.readiness(active.routeId).onlyCandidateToOpenNegotiation)
      throw new Error('Every introduction must separately consent');
    if(actorId!==active.personId ||
      personIndividuallyAgreesToQuestionInFixture!==true)
      throw new Error('Only target may opt into being asked their own question');
    check(eventId,'PERSON_CONSENTS_TO_EXPLICIT_QUESTION');
    const q=fixture.questions.find(x=>x.id===questionId);
    pending={questionId,personId:actorId};active=null;
    return {neutralQuestion:q.prompt,
      answerChoices:['yes','no'],personalAnswerPredicted:false,
      realQuestionActuallySent:false};
  }
  function answer({eventId,actorId,answer,
    firstPersonResponseInFixture}){
    if(!pending)throw new Error('No consented question pending');
    if(pending.personId!==actorId ||
       firstPersonResponseInFixture!==true)
      throw new Error('Only questioned person may answer in this fixture');
    if(!['yes','no'].includes(answer))throw new Error('Unexpected answer');
    const possible=posterior.filter(w=>w.answers[pending.questionId]===answer);
    if(!possible.length)throw new Error('Answer contradicts model; refresh prior rather than invent a person');
    check(eventId,'FIRST_PERSON_ANSWER_IN_FIXTURE');
    questionsAnswered.add(pending.questionId);
    if(answer==='yes')yesAnswered.add(pending.questionId);
    posterior=possible;pending=null;
    return {status:'synthetic-answer-received',
      possibleNextQuestion:priority().suggestedQuestion?.id??null,
      noAssumptionFromFriendOfFriend:true,
      realContractOrServiceVerified:false,realMoneyMovedCents:0};
  }
  function declineQuestion({eventId,actorId}){
    if(!pending||pending.personId!==actorId)
      throw new Error('Only the asked person can decline');
    check(eventId,'PERSON_DECLINES_QUESTION');
    unreachable.add(pending.questionId);
    pending=null;
    return {status:'declined-without-penalty',answerInferred:false,
      privateResponseStored:false};
  }
  function revoke({eventId,actorId}){
    if(!['A','G'].includes(actorId))throw new Error('Only tenant or gold owner may revoke the shared inquiry');
    check(eventId,'CONSENT_WITHDRAWN_BY_'+actorId);
    revoked=true;tenantAuthorized=false;ownerAuthorized=false;
    posterior=prior;questionsAnswered=new Set();yesAnswered=new Set();
    active=null;pending=null;
    return {status:'HOLD-inquiry-revoked',retainedPersonalAnswers:0,
      noFurtherContactPossible:true};
  }
  function agreementPreview(){
    // Only three voluntary expressions of interest allow a bounded
    // *negotiation invitation*. Nobody has agreed to actual contract terms.
    const allYes=questionSpecs.every(q=>yesAnswered.has(q.id));
    if(!gates()||!allYes)return {
      status:'HOLD-no-all-participant-interest',
      source009Consulted:false,legallyDischargedCents:0,
      moneyActuallyMovedCents:0
    };
    const source009=createSatisfactionWeave(makeSatisfactionFixture());
    const snap=source009.snapshot();
    return {
      status:'eligible-to-discuss-specific-terms-HOLD',
      originalSource:'labs/penny-puddle-009/satisfaction.mjs',
      source009Consulted:true,
      creditorPreagreementActuallyVerified:false,
      source009Status:snap.status,
      completedServices:snap.confirmedStepsInFixture,
      legallyDischargedCents:snap.legallyWaivedDebtCents,
      moneyActuallyMovedCents:snap.cashActuallyChangedHandsCents,
      physicalGoldMoved:snap.physicalGoldMoved,
      assetOwnershipValidated:false,
      ownerAssetUseActuallyLicensed:false,
      independentParticipantSatisfactionMeasured:false
    };
  }
  const audit=()=>({
    status:priority().status,
    questionsActuallyAnsweredInFixture:questionsAnswered.size,
    questionIdsAsked:[...questionsAnswered],
    pathsDeniedByPeople:[...unreachable],
    toyPosteriorWorldCount:posterior.length,
    toyPosteriorWeight:weight(posterior),
    events:clone(events),
    personalAnswersRawNotInPublicLog:true,
    realContactsMessaged:0,actualCreditOrPaymentCents:0,
    actualWorkCompleted:0,actualCreditorReliefCents:0,
    allPeopleAuthenticated:false
  });
  return {tenantChooses,ownerChooses,priority,startIntroduction,
    nextInboxFor,respondIntroduction,askQuestion,answer,
    declineQuestion,revoke,agreementPreview,audit,
    benchmark:()=>compareNetworkQuestionStrategies(fixture)};
}
