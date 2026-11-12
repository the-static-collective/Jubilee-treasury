/**
 * JUBILEE / MOTIF-inspired QUESTION-012 / THE RIGHT QUESTION
 *
 * Finite decision-focused value-of-information on a fully synthetic set of
 * explicit hypothetical worlds. NOT native MOTIF runtime, not a psychologist,
 * real-world inference, human utility measure, or authority to contact anyone.
 * A prior is a modeling assumption, never evidence about a person.
 *
 * Important distinction: entropy about a person's answer is not the same as
 * information that helps two people reach a mutually acceptable arrangement.
 */
const key=(x,label)=>{
  if(typeof x!=='string'||!x.trim()||x.length>100)
    throw new TypeError(label+' requires a short nonempty string');
  return x;
};
const safeNumber=(x,label,min=0,max=1000000)=>{
  if(!Number.isFinite(x)||x<min||x>max)
    throw new TypeError(label+' must be a finite bounded number');
  return x;
};
const clone=x=>JSON.parse(JSON.stringify(x));
const comparisonActions=['teach-together','repair-for-hire','remote-guidance','no-deal'];
const privatePersonTypes=new Set(['learner','mechanic']);
const EPS=1e-8;

/**
 * Eight "worlds": four hypothetical decision-outcome profiles crossed with
 * an independent red/blue paint variable. Paint has 1 bit of entropy but
 * ZERO expected decision value in this synthetic model.
 *
 * Numbers below are NOT calibrated happiness, market values or inferences
 * about any real mechanic or student. "no-deal" always yields zero; negative
 * outcomes mean the proposed agreement would be unwelcome.
 */
export function makeQuestionFixture(){
  const profiles=[
    {id:'teacher-and-learner',weight:90,teach:'yes',learner:'yes',
      utility:{'teach-together':12,'repair-for-hire':-8,'remote-guidance':6,'no-deal':0}},
    {id:'repairer-not-teacher',weight:40,teach:'no',learner:'yes',
      utility:{'teach-together':-8,'repair-for-hire':9,'remote-guidance':2,'no-deal':0}},
    {id:'teacher-and-done-for-me',weight:50,teach:'yes',learner:'no',
      utility:{'teach-together':2,'repair-for-hire':8,'remote-guidance':4,'no-deal':0}},
    {id:'neither-format',weight:20,teach:'no',learner:'yes',
      utility:{'teach-together':-8,'repair-for-hire':-8,'remote-guidance':6,'no-deal':0}}
  ];
  return {
    purpose:'repair-learning',nowDay:30,expiresDay:37,
    people:[{id:'learner',role:'requester'},{id:'mechanic',role:'subject'}],
    actions:[...comparisonActions],
    worlds:profiles.flatMap(p=>['red','blue'].map(color=>({
      id:p.id+'-'+color,weight:p.weight/2,
      answers:{
        'ask-mechanic-teaching':p.teach,
        'ask-learner-learning':p.learner,
        'ask-tractor-paint':color
      },
      outcomes:{...p.utility}
    }))),
    questions:[
      {id:'ask-mechanic-teaching',asker:'mechanic',
        prompt:'Would you want to explore teaching diagnostics together, rather than taking on a repair job?',
        scope:'repair-learning',costPoints:0.2,privacyWeight:1,
        answers:['yes','no'],subjectSensitive:true},
      {id:'ask-learner-learning',asker:'learner',
        prompt:'Would you like to learn the repair yourself, or would you prefer it done for you?',
        scope:'repair-learning',costPoints:0.1,privacyWeight:0,
        answers:['yes','no'],subjectSensitive:false},
      {id:'ask-tractor-paint',asker:'learner',
        prompt:'What color is the tractor?',
        scope:'repair-learning',costPoints:0.02,privacyWeight:0,
        answers:['red','blue'],subjectSensitive:false}
    ]
  };
}
export function validateQuestionFixture(f){
  key(f?.purpose,'purpose');
  if(!Number.isSafeInteger(f.nowDay)||!Number.isSafeInteger(f.expiresDay)||
     f.nowDay<0||f.expiresDay<f.nowDay||f.expiresDay>36500)
    throw new Error('Explicit bounded scenario freshness required');
  if(!Array.isArray(f.worlds)||f.worlds.length<2||f.worlds.length>32)
    throw new Error('Bounded hypotheses required');
  if(!Array.isArray(f.questions)||!f.questions.length||f.questions.length>10)
    throw new Error('Bounded question catalog required');
  if(!Array.isArray(f.people)||f.people.length!==2 ||
     new Set(f.people.map(x=>x.id)).size!==2 ||
     !privatePersonTypes.has(f.people[0].id) ||
     !privatePersonTypes.has(f.people[1].id))
    throw new Error('The synthetic requester and subject must be distinct');
  if(!Array.isArray(f.actions)||f.actions.length!==comparisonActions.length ||
     new Set(f.actions).size!==f.actions.length ||
     !comparisonActions.every(x=>f.actions.includes(x)))
    throw new Error('Explicit finite decision set required');
  const qIds=new Set(),wIds=new Set();
  for(const q of f.questions){
    key(q?.id,'question id');
    if(qIds.has(q.id))throw new Error('Duplicate question');
    qIds.add(q.id);
    if(!privatePersonTypes.has(q.asker)||typeof q.prompt!=='string'||
       !q.prompt.trim()||q.prompt.length>250||q.scope!==f.purpose||
       typeof q.subjectSensitive!=='boolean' ||
       (q.asker==='mechanic')!==q.subjectSensitive)
      throw new Error('No hidden target or unsolicited personal-topic question');
    safeNumber(q.costPoints,'asking burden',0,50);
    safeNumber(q.privacyWeight,'privacy burden',0,10);
    if(!Array.isArray(q.answers)||q.answers.length<2||q.answers.length>6||
       new Set(q.answers).size!==q.answers.length ||
       !q.answers.every(x=>typeof x==='string'&&x.trim()&&x.length<=40))
      throw new Error('Explicit finite answer choices required');
  }
  let total=0;
  for(const w of f.worlds){
    key(w?.id,'world id');
    if(wIds.has(w.id))throw new Error('Duplicate hypothesis');
    wIds.add(w.id);
    if(!Number.isSafeInteger(w.weight)||w.weight<1||w.weight>10000)
      throw new Error('Positive integer hypothesis weights required');
    total+=w.weight;
    if(!w.answers||!w.outcomes||typeof w.answers!=='object'||
       Object.keys(w.answers).length!==qIds.size ||
       Object.keys(w.outcomes).length!==f.actions.length)
      throw new Error('Each world must carry complete answers and action outcomes');
    for(const q of f.questions)if(!q.answers.includes(w.answers[q.id]))
      throw new Error('Every hypothetical answer must belong to its declared choices');
    for(const a of f.actions){
      safeNumber(w.outcomes[a],'synthetic action result',-100,100);
    }
    if(w.outcomes['no-deal']!==0)throw new Error('No-deal payoff must remain zero');
  }
  if(total>100000)throw new Error('Unbounded synthetic sample weights');
  return f;
}
const sumWeight=worlds=>worlds.reduce((s,w)=>s+w.weight,0);
const weighted=(worlds,fn)=>{
  const n=sumWeight(worlds);
  if(!n)throw new Error('Impossible posterior: no positive-prior worlds');
  return worlds.reduce((s,w)=>s+w.weight*fn(w),0)/n;
};
export function optimalDirectAction(worlds,actions=comparisonActions){
  if(!worlds.length)throw new Error('No compatible worlds');
  const possible=actions.map(action=>({
    action,expectedScenarioPoints:weighted(worlds,w=>w.outcomes[action])
  }));
  possible.sort((a,b)=>b.expectedScenarioPoints-a.expectedScenarioPoints ||
    a.action.localeCompare(b.action));
  return possible[0];
}
function possibleAnswers(worlds,q){
  return q.answers.flatMap(answer=>{
    const branch=worlds.filter(w=>w.answers[q.id]===answer);
    return branch.length?[{answer,worlds:branch,weight:sumWeight(branch)}]:[];
  });
}
const entropy=distribution=>-distribution.reduce((x,p)=>p>0?x+p*Math.log2(p):x,0);
export function questionValue(worlds,q,actions=comparisonActions){
  const base=optimalDirectAction(worlds,actions);
  const total=sumWeight(worlds);
  const branches=possibleAnswers(worlds,q);
  const net=branches.reduce((acc,b)=>
    acc+b.weight/total*optimalDirectAction(b.worlds,actions).expectedScenarioPoints,0);
  const h=entropy(branches.map(b=>b.weight/total));
  return {
    id:q.id,target:q.asker,prompt:q.prompt,
    answerEntropyBits:h,
    baselineExpectedPoints:base.expectedScenarioPoints,
    postAnswerExpectedPoints:net,
    grossDecisionValuePoints:net-base.expectedScenarioPoints,
    askingCostPoints:q.costPoints,
    netDecisionValuePoints:net-base.expectedScenarioPoints-q.costPoints,
    modeledAnswerCounts:branches.length,
    privateResponseNotPredictedForPerson:true,
    realQuestionAsked:false
  };
}
/** Exact finite lookahead across ask/answer branches with optional stopping. */
export function optimalQuestionPolicy(worlds,questions,actions=comparisonActions,steps=2){
  if(!Number.isSafeInteger(steps)||steps<0||steps>3)
    throw new Error('Finite question lookahead depth only');
  const base=optimalDirectAction(worlds,actions);
  if(steps===0||!questions.length)return {
    firstQuestionId:null,expectedScenarioPointsNet:base.expectedScenarioPoints,
    stopActionIfNoQuestion:base.action,expectedQuestionsAsked:0
  };
  const total=sumWeight(worlds);
  let best={firstQuestionId:null,expectedScenarioPointsNet:base.expectedScenarioPoints,
    stopActionIfNoQuestion:base.action,expectedQuestionsAsked:0};
  for(const q of questions){
    const remaining=questions.filter(x=>x.id!==q.id);
    let expected=-q.costPoints,count=1;
    for(const branch of possibleAnswers(worlds,q)){
      const sub=optimalQuestionPolicy(branch.worlds,remaining,actions,steps-1);
      expected+=(branch.weight/total)*sub.expectedScenarioPointsNet;
      count+=(branch.weight/total)*sub.expectedQuestionsAsked;
    }
    if(expected>best.expectedScenarioPointsNet+EPS){
      best={firstQuestionId:q.id,expectedScenarioPointsNet:expected,
        expectedQuestionsAsked:count,
        stopActionIfNoQuestion:base.action};
    }
  }
  return best;
}
export function benchmarkQuestionPolicies(f=makeQuestionFixture()){
  validateQuestionFixture(f);
  const q=f.questions;
  const ranked=q.map(item=>questionValue(f.worlds,item,f.actions));
  const byEntropy=[...ranked].sort((a,b)=>
    b.answerEntropyBits-a.answerEntropyBits||a.id.localeCompare(b.id));
  const byDecision=[...ranked].sort((a,b)=>
    b.netDecisionValuePoints-a.netDecisionValuePoints||a.id.localeCompare(b.id));
  const dynamic=optimalQuestionPolicy(f.worlds,q,f.actions,2);
  return {
    scenario:'Synthetic 8-world weighted hypothesis and four hypothetical deal outcomes',
    priorSource:'invented weights, not sourced from real people',
    noQuestion:optimalDirectAction(f.worlds,f.actions),
    naiveEntropyQuestion:byEntropy[0].id,
    naiveEntropyGrossDecisionValuePoints:byEntropy[0].grossDecisionValuePoints,
    decisionQuestion:byDecision[0].id,
    decisionExpectedNetValuePoints:byDecision[0].netDecisionValuePoints,
    ranking:ranked,
    exactTwoQuestionPolicy:dynamic,
    calibratedRealWorldOutcome:false,
    realPersonProfiled:false,questionsActuallySent:0
  };
}
/**
 * Consent and privacy-limited decision session. Mechanic questions cannot
 * even appear as selectable until a separate RELAY-011 introduction+subject
 * opt-in has occurred (asserted only inside the fake demo).
 */
export function createQuestionLab(f=makeQuestionFixture(),{
  learnerOptedIntoQuestionsInFixture=true,maxQuestions=2,
  maxPrivacyWeight=1,lookaheadSteps=2
}={}){
  validateQuestionFixture(f);
  if(typeof learnerOptedIntoQuestionsInFixture!=='boolean')
    throw new TypeError('Learner consent must be explicitly asserted');
  if(!Number.isSafeInteger(maxQuestions)||maxQuestions<0||maxQuestions>3)
    throw new TypeError('Bounded questions per encounter');
  if(!Number.isSafeInteger(maxPrivacyWeight)||maxPrivacyWeight<0||maxPrivacyWeight>3)
    throw new TypeError('Bounded privacy question budget');
  if(!Number.isSafeInteger(lookaheadSteps)||lookaheadSteps<1||lookaheadSteps>3)
    throw new TypeError('Lookahead must be finite and at most three');
  const scenario=clone(f),now=scenario.nowDay;
  let worlds=[...scenario.worlds],mechanicConsent=false,asked=[],pending=null,
    privacySpent=0,day=now;
  const seenEventIds=new Set(),history=[];
  const record=(eventId,kind)=>{
    key(eventId,'eventId');
    if(seenEventIds.has(eventId))throw new Error('Duplicate event receipt');
    seenEventIds.add(eventId);
    history.push({eventId,kind,realHumanIdentityChecked:false,
      actualMessageOrPaymentSent:false});
  };
  const eligible=()=>scenario.questions.filter(q=>
    !asked.includes(q.id) && !pending &&
    day<=scenario.expiresDay &&
    (q.asker==='learner'?learnerOptedIntoQuestionsInFixture:mechanicConsent) &&
    privacySpent+q.privacyWeight<=maxPrivacyWeight);
  const currentDecision=()=>optimalDirectAction(worlds,scenario.actions);
  function permitSubjectQuestions({eventId,actorId,purpose,
    relayIntroductionsCompleteInFixture,subjectExplicitlyOptedInToAskInFixture}){
    if(actorId!=='mechanic'||purpose!==scenario.purpose)
      throw new Error('Wrong person or question purpose');
    if(relayIntroductionsCompleteInFixture!==true ||
       subjectExplicitlyOptedInToAskInFixture!==true)
      throw new Error('No independent introduction plus subject invitation consent');
    if(day>scenario.expiresDay)throw new Error('Questions already expired');
    if(mechanicConsent)throw new Error('Subject consent already recorded');
    record(eventId,'MECHANIC_AUTHORIZE_NEUTRAL_QUESTIONS');
    mechanicConsent=true;
    return {status:'fictional-subject-consent-confirmed',
      privatePreferencesRevealed:false,realIdentityAuthenticated:false};
  }
  function planNext(){
    const direct=currentDecision();
    const candidates=eligible().map(q=>questionValue(worlds,q,scenario.actions));
    candidates.sort((a,b)=>b.netDecisionValuePoints-a.netDecisionValuePoints ||
      a.id.localeCompare(b.id));
    // Crucial counterfactual: ask the learner first if that can avoid
    // an unnecessary sensitive question of the mechanic later. The optimal
    // horizon may differ from the greedy maximum one-question EVSI policy.
    const remainingBudget=Math.max(0,maxQuestions-asked.length);
    const optimal=(!pending&&remainingBudget>0) ?
      optimalQuestionPolicy(worlds,eligible(),scenario.actions,
        Math.min(lookaheadSteps,remainingBudget)) : {
          firstQuestionId:null,expectedScenarioPointsNet:direct.expectedScenarioPoints
        };
    const winner=candidates.find(x=>x.id===optimal.firstQuestionId);
    const justified=!!winner &&
      optimal.expectedScenarioPointsNet>direct.expectedScenarioPoints+EPS;
    return {
      status:pending?'awaiting-first-person-answer':
        asked.length>=maxQuestions?'HOLD-question-budget-exhausted':
        day>scenario.expiresDay?'HOLD-expired':
        justified?'ask-if-person-chooses':'stop-asking',
      recommendedQuestion:!pending&&asked.length<maxQuestions&&
        justified?{
        id:winner.id,actorId:winner.target,neutralPrompt:winner.prompt,
        modeledDecisionValuePoints:winner.netDecisionValuePoints,
        expectedValueOfFullRemainingPlanPoints:optimal.expectedScenarioPointsNet-
          direct.expectedScenarioPoints,
        answerEntropyBits:winner.answerEntropyBits,
        decisionPolicy:'exact-bounded-lookahead-not-personality-inference',
        mustAskPersonDirectly:true,askAutomatically:false
      }:null,
      availableCandidates:pending?[]:candidates.map(q=>({
        id:q.id,target:q.target,
        expectedNetDecisionValuePoints:q.netDecisionValuePoints,
        answerEntropyBits:q.answerEntropyBits
      })),
      currentDecisionUnderPrior:direct.action,
      currentModeledExpectedScenarioPoints:direct.expectedScenarioPoints,
      questionsAsked:asked.length,maxQuestions,
      privacyWeightSpent:privacySpent,maxPrivacyWeight,
      privatePersonalFactsInferred:false,
      actualParticipantQuestionSent:false,
      allActionAuthority:'OFFER_ONLY_HOLD'
    };
  }
  function poseQuestion({eventId,questionId,actorId,personAgreedToThisQuestionInFixture}){
    key(questionId,'questionId');
    if(pending)throw new Error('Must resolve the previous question first');
    if(asked.length>=maxQuestions)throw new Error('Question budget exhausted');
    const q=eligible().find(x=>x.id===questionId);
    if(!q)throw new Error('Question not eligible under scoped consent or budget');
    if(q.asker!==actorId)throw new Error('Only the actual subject of question may be addressed');
    if(personAgreedToThisQuestionInFixture!==true)
      throw new Error('Must explicitly opt into this individual question');
    const planned=planNext().recommendedQuestion;
    if(!planned||planned.id!==questionId)
      throw new Error('Question is not currently justified by the permitted finite policy');
    record(eventId,'FICTIONAL_QUESTION_PRESENTED_TO_SELF');
    pending={id:q.id,actorId:q.asker,choices:[...q.answers]};
    return {
      question:q.prompt,actorId:q.asker,answers:[...q.answers],
      simulatedOnly:true,realPromptDispatched:false,
      noAnswerPredictedForPerson:true
    };
  }
  function answerQuestion({eventId,actorId,answer,firstPersonAnswerInFixture}){
    if(!pending)throw new Error('No live participant question');
    if(actorId!==pending.actorId||firstPersonAnswerInFixture!==true)
      throw new Error('Cannot answer on behalf of another person');
    if(!pending.choices.includes(answer))throw new Error('Undeclared answer');
    const worldsNext=worlds.filter(w=>w.answers[pending.id]===answer);
    if(!worldsNext.length)throw new Error('Impossible response under this declared toy model; update hypotheses instead');
    record(eventId,'FICTIONAL_FIRST_PERSON_ANSWER_RECEIVED');
    asked.push(pending.id);
    const q=scenario.questions.find(x=>x.id===pending.id);
    privacySpent+=q.privacyWeight;
    worlds=worldsNext;
    pending=null;
    return {
      source:'first-person-assertion-in-synthetic-fixture',
      answerUsedToUpdateToyModel:true,
      nextSuggestedAction:currentDecision().action,
      questionsAsked:asked.length,privacyWeightSpent:privacySpent,
      actualPreferenceVerifiedInRealLife:false,
      realContractOrServicePerformed:false
    };
  }
  function declineQuestion({eventId,actorId}){
    if(!pending||actorId!==pending.actorId)
      throw new Error('Only the asked person can decline this prompt');
    record(eventId,'PARTICIPANT_DECLINED_QUESTION');
    const declined=pending.id;pending=null;asked.push(declined);
    return {status:'declined-without-penalty',answerInferred:false,
      questionRetired:true,realWorldMessagesSent:0};
  }
  function revokeConsent({eventId,actorId}){
    if(actorId!=='mechanic')throw new Error('Only mechanic can revoke mechanic question permission');
    record(eventId,'SUBJECT_REVOKES_QUESTION_CONSENT');
    mechanicConsent=false;
    if(pending?.actorId==='mechanic')pending=null;
    // Previously shared answers must not remain active for new targeting.
    worlds=[...scenario.worlds];
    asked=[];privacySpent=0;
    return {status:'subject-consent-revoked',
      privateAnswerNoLongerUsedForPlanning:true,
      previouslyEmittedActionsStillNotBinding:true};
  }
  function advanceDay(newDay){
    if(!Number.isSafeInteger(newDay)||newDay<day||newDay>36500)
      throw new Error('Time only advances, within bounded scenario horizon');
    day=newDay;
    if(day>scenario.expiresDay){mechanicConsent=false;pending=null;
      worlds=[...scenario.worlds];asked=[];privacySpent=0;}
    return {currentDay:day,expired:day>scenario.expiresDay,
      modelResetOnExpiry:day>scenario.expiresDay};
  }
  function audit(){
    return {
      nowDay:day,syntheticOnly:true,
      publicToyPosteriorWeight:sumWeight(worlds),
      questionIdsPreviouslyAsked:[...asked],
      subjectCanStillBeAsked:mechanicConsent&&day<=scenario.expiresDay,
      events:clone(history),rawPersonalAnswersNotLogged:true,
      anyRealPrivateDataStored:false,realIdentityAuthenticated:false,
      moneyMovedCents:0,messagesActuallySent:0
    };
  }
  return {permitSubjectQuestions,planNext,poseQuestion,answerQuestion,
    declineQuestion,revokeConsent,advanceDay,audit,
    directDecision:currentDecision};
}
