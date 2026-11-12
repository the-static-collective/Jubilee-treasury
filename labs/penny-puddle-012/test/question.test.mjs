import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeQuestionFixture,validateQuestionFixture,optimalDirectAction,
  questionValue,optimalQuestionPolicy,benchmarkQuestionPolicies,
  createQuestionLab
} from '../question-value.mjs';
import {createQuestionWeave,runQuestion012} from '../weave.mjs';

const fixture=()=>makeQuestionFixture();
const approx=(actual,expected)=>assert.ok(Math.abs(actual-expected)<0.00001,
  'expected '+expected+', got '+actual);
function askPerson(q,who,answer,step){
 const plan=q.planNext();
 assert.ok(plan.recommendedQuestion,'Planner must identify a positive-value question');
 assert.equal(plan.recommendedQuestion.actorId,who);
 const p=q.poseQuestion({eventId:'ask-'+step,questionId:plan.recommendedQuestion.id,
   actorId:who,personAgreedToThisQuestionInFixture:true});
 assert.equal(p.realPromptDispatched,false);
 const a=q.answerQuestion({eventId:'answer-'+step,actorId:who,answer,
   firstPersonAnswerInFixture:true});
 assert.equal(a.realContractOrServicePerformed,false);
 return a;
}
const withMechanicPermission=()=>{
 const q=createQuestionLab();
 q.permitSubjectQuestions({eventId:'subject-consent',actorId:'mechanic',
   purpose:'repair-learning',relayIntroductionsCompleteInFixture:true,
   subjectExplicitlyOptedInToAskInFixture:true});
 return q;
};

test('entire controlled experiment is invented and includes an opt-out action',()=>{
 const f=fixture();
 assert.equal(validateQuestionFixture(f),f);
 assert.equal(f.worlds.length,8);
 assert.equal(f.worlds.reduce((a,w)=>a+w.weight,0),200);
 assert.equal(f.worlds.every(w=>w.outcomes['no-deal']===0),true);
 assert.equal(f.questions.some(q=>q.id==='ask-tractor-paint'),true);
});
test('no-question baseline suggests only a hypothetical remote option',()=>{
 const result=optimalDirectAction(fixture().worlds);
 assert.equal(result.action,'remote-guidance');
 approx(result.expectedScenarioPoints,4.7);
});
test('entropy maximization asks irrelevant color while decision value does not',()=>{
 const b=benchmarkQuestionPolicies();
 assert.equal(b.naiveEntropyQuestion,'ask-tractor-paint');
 approx(b.naiveEntropyGrossDecisionValuePoints,0);
 assert.equal(b.decisionQuestion,'ask-mechanic-teaching');
 approx(b.noQuestion.expectedScenarioPoints,4.7);
 approx(b.decisionExpectedNetValuePoints,2.0);
 assert.ok(b.ranking.find(x=>x.id==='ask-tractor-paint').answerEntropyBits>
   b.ranking.find(x=>x.id==='ask-mechanic-teaching').answerEntropyBits);
});
test('two-step exact lookahead asks learner FIRST to save sensitive mechanic questioning',()=>{
 const f=fixture(),r=optimalQuestionPolicy(f.worlds,f.questions,f.actions,2);
 assert.equal(r.firstQuestionId,'ask-learner-learning');
 approx(r.expectedScenarioPointsNet,8.15);
 assert.ok(r.expectedQuestionsAsked>1&&r.expectedQuestionsAsked<2);
});
test('no subject question can even appear before separate introduction and subject opt-in',()=>{
 const q=createQuestionLab();
 const p=q.planNext();
 assert.equal(p.recommendedQuestion.id,'ask-learner-learning');
 assert.equal(p.availableCandidates.some(x=>x.id==='ask-mechanic-teaching'),false);
 assert.throws(()=>q.poseQuestion({eventId:'early',questionId:'ask-mechanic-teaching',
  actorId:'mechanic',personAgreedToThisQuestionInFixture:true}),/not eligible/);
 assert.throws(()=>q.permitSubjectQuestions({eventId:'fake',actorId:'mechanic',
  purpose:'repair-learning',relayIntroductionsCompleteInFixture:false,
  subjectExplicitlyOptedInToAskInFixture:true}),/introduction plus/);
 assert.equal(q.audit().events.length,0);
});
test('after subject permission, learner-first is still the stronger sequential policy',()=>{
 const q=withMechanicPermission(),p=q.planNext();
 assert.equal(p.recommendedQuestion.id,'ask-learner-learning');
 assert.equal(p.recommendedQuestion.decisionPolicy,
  'exact-bounded-lookahead-not-personality-inference');
 assert.equal(p.availableCandidates.some(x=>x.id==='ask-mechanic-teaching'),true);
 assert.ok(p.recommendedQuestion.expectedValueOfFullRemainingPlanPoints>
   p.recommendedQuestion.modeledDecisionValuePoints);
});
test('if learner wants to learn, next ask mechanic about teaching, not tractor color',()=>{
 const q=withMechanicPermission();
 const first=askPerson(q,'learner','yes',1);
 assert.equal(first.nextSuggestedAction,'remote-guidance');
 const p=q.planNext();
 assert.equal(p.recommendedQuestion.id,'ask-mechanic-teaching');
 const second=askPerson(q,'mechanic','yes',2);
 assert.equal(second.nextSuggestedAction,'teach-together');
 assert.equal(q.planNext().recommendedQuestion,null);
 assert.equal(q.planNext().status,'HOLD-question-budget-exhausted');
 assert.equal(q.audit().messagesActuallySent,0);
});
test('learner preferring completed repair needs NO personal question to mechanic',()=>{
 const q=withMechanicPermission();
 const result=askPerson(q,'learner','no',1);
 assert.equal(result.nextSuggestedAction,'repair-for-hire');
 assert.equal(q.planNext().recommendedQuestion,null);
 assert.equal(q.planNext().status,'stop-asking');
 assert.equal(q.audit().questionIdsPreviouslyAsked.length,1);
});
test('mechanic refusal to answer incurs no penalty and does not invent a preference',()=>{
 const q=withMechanicPermission();
 askPerson(q,'learner','yes',1);
 const rec=q.planNext().recommendedQuestion;
 q.poseQuestion({eventId:'ask-mechanic',questionId:rec.id,
  actorId:'mechanic',personAgreedToThisQuestionInFixture:true});
 const no=q.declineQuestion({eventId:'decline',actorId:'mechanic'});
 assert.equal(no.status,'declined-without-penalty');
 assert.equal(no.answerInferred,false);
 assert.equal(q.audit().rawPersonalAnswersNotLogged,true);
 assert.equal(q.planNext().status,'HOLD-question-budget-exhausted');
});
test('actor impersonation and guessed answer attempts are rejected',()=>{
 const q=withMechanicPermission();
 const rec=q.planNext().recommendedQuestion;
 assert.throws(()=>q.poseQuestion({eventId:'wrong',questionId:rec.id,
  actorId:'mechanic',personAgreedToThisQuestionInFixture:true}),/Only actual subject/);
 assert.throws(()=>q.poseQuestion({eventId:'without-consent',questionId:rec.id,
  actorId:'learner',personAgreedToThisQuestionInFixture:false}),/opt into/);
 assert.equal(q.audit().events.length,1);
 q.poseQuestion({eventId:'ask',questionId:rec.id,actorId:'learner',
  personAgreedToThisQuestionInFixture:true});
 assert.throws(()=>q.answerQuestion({eventId:'bad',actorId:'mechanic',answer:'yes',
   firstPersonAnswerInFixture:true}),/another person/);
 assert.throws(()=>q.answerQuestion({eventId:'bad',actorId:'learner',answer:'yes',
   firstPersonAnswerInFixture:false}),/another person/);
 assert.throws(()=>q.answerQuestion({eventId:'bad',actorId:'learner',answer:'green',
   firstPersonAnswerInFixture:true}),/Undeclared/);
 assert.equal(q.audit().events.length,2);
});
test('no positive-value or already used question can be selected on whim',()=>{
 const q=withMechanicPermission();
 assert.throws(()=>q.poseQuestion({eventId:'trivia',
  questionId:'ask-tractor-paint',actorId:'learner',
  personAgreedToThisQuestionInFixture:true}),/not currently justified/);
 askPerson(q,'learner','yes',1);
 assert.throws(()=>q.poseQuestion({eventId:'repeat',questionId:'ask-learner-learning',
  actorId:'learner',personAgreedToThisQuestionInFixture:true}),/not eligible/);
});
test('privacy question budget exhausts without repeated questions',()=>{
 const q=createQuestionLab(fixture(),{maxQuestions:3,maxPrivacyWeight:0});
 assert.throws(()=>q.permitSubjectQuestions({eventId:'wrong',actorId:'learner',
   purpose:'repair-learning',relayIntroductionsCompleteInFixture:true,
   subjectExplicitlyOptedInToAskInFixture:true}),/Wrong person/);
 q.permitSubjectQuestions({eventId:'yes',actorId:'mechanic',purpose:'repair-learning',
   relayIntroductionsCompleteInFixture:true,
   subjectExplicitlyOptedInToAskInFixture:true});
 assert.equal(q.planNext().availableCandidates.some(x=>x.id==='ask-mechanic-teaching'),false);
});
test('revoking mechanic permission stops questions and discards previous toy answer state',()=>{
 const q=withMechanicPermission();
 askPerson(q,'learner','yes',1);
 const s=q.revokeConsent({eventId:'revoke',actorId:'mechanic'});
 assert.equal(s.privateAnswerNoLongerUsedForPlanning,true);
 assert.equal(q.planNext().recommendedQuestion.id,'ask-learner-learning');
 assert.equal(q.audit().questionIdsPreviouslyAsked.length,0);
 assert.throws(()=>q.permitSubjectQuestions({eventId:'no',actorId:'learner',
   purpose:'repair-learning',relayIntroductionsCompleteInFixture:true,
   subjectExplicitlyOptedInToAskInFixture:true}),/Wrong person/);
});
test('expired hypothetical consent causes hold, no contact and no stale memory use',()=>{
 const q=withMechanicPermission();
 q.advanceDay(38);
 assert.equal(q.planNext().status,'HOLD-expired');
 assert.equal(q.planNext().recommendedQuestion,null);
 assert.equal(q.audit().subjectCanStillBeAsked,false);
 assert.throws(()=>q.permitSubjectQuestions({eventId:'late',actorId:'mechanic',
   purpose:'repair-learning',relayIntroductionsCompleteInFixture:true,
   subjectExplicitlyOptedInToAskInFixture:true}),/expired/);
});
test('a degenerate prior with invented impossible answers fails validation rather than guessing',()=>{
 const f=fixture();f.worlds[0].answers['ask-mechanic-teaching']='maybe';
 assert.throws(()=>validateQuestionFixture(f),/declared choices/);
 const g=fixture();g.worlds[0].outcomes['no-deal']=100;
 assert.throws(()=>validateQuestionFixture(g),/No-deal/);
 const h=fixture();h.questions[0].asker='learner';
 assert.throws(()=>validateQuestionFixture(h),/Unsolicited/);
});
test('source-owned RELAY-011 crossing cannot use a subject answer before introductions',()=>{
 const w=createQuestionWeave();
 assert.equal(w.planNext().recommendedQuestion.id,'ask-learner-learning');
 assert.throws(()=>w.subjectChoosesQuestionConsent({approve:true}),/Introduction/);
 assert.throws(()=>w.askAndAnswer({actorId:'mechanic',answer:'yes'}),/consented/);
 assert.equal(w.carrier().authorization,'OFFER_ONLY_HOLD');
 assert.equal(w.carrier().nativeMotifRuntimeInvoked,false);
});
test('composed 012 asks learner then mechanic and runs real source-owned 011/007 code',()=>{
 const w=createQuestionWeave();
 const intro=w.openIntroductions();
 assert.equal(intro.introReady,true);
 w.subjectChoosesQuestionConsent({approve:true});
 assert.equal(w.planNext().recommendedQuestion.actorId,'learner');
 const first=w.askAndAnswer({actorId:'learner',answer:'yes'});
 assert.equal(first.questionId,'ask-learner-learning');
 assert.deepEqual(first.contextProposals,[]);
 assert.equal(w.planNext().recommendedQuestion.id,'ask-mechanic-teaching');
 const second=w.askAndAnswer({actorId:'mechanic',answer:'yes'});
 assert.equal(second.questionId,'ask-mechanic-teaching');
 assert.deepEqual(second.contextProposals,['learn-by-repairing','short-video-call']);
 assert.ok(second.sourcedDealweaverPareto.some(ids=>ids.includes('learn-by-repairing')));
 assert.equal(w.audit().realParticipantsContacted,0);
 assert.equal(w.audit().completedContracts,0);
});
test('a no from mechanic does not generate a fake job, profiling or agreements',()=>{
 const w=createQuestionWeave();
 w.openIntroductions();w.subjectChoosesQuestionConsent({approve:true});
 w.askAndAnswer({actorId:'learner',answer:'yes'});
 const s=w.askAndAnswer({actorId:'mechanic',answer:'no'});
 assert.deepEqual(s.contextProposals,[]);
 assert.deepEqual(s.sourcedDealweaverPareto,[]);
 assert.equal(s.realAgreementMade,false);
});
test('end-to-end demo preserves all zero-authority boundaries',()=>{
 const d=runQuestion012();
 assert.equal(d.controlledPolicyComparison.informationEntropyFirst,'ask-tractor-paint');
 assert.equal(d.controlledPolicyComparison.decisionValueFirst,'ask-mechanic-teaching');
 assert.equal(d.controlledPolicyComparison.exactTwoQuestionFirst,'ask-learner-learning');
 assert.equal(d.hypotheticalFirstAnswer.questionId,'ask-learner-learning');
 assert.equal(d.hypotheticalSecondAnswerAndAgreementOptions.questionId,'ask-mechanic-teaching');
 assert.equal(d.hypotheticalSecondAnswerAndAgreementOptions.realMoneyMovedCents,0);
 assert.equal(d.realWorldIdentityVerified,false);
 assert.equal(d.realAgreementsExecuted,0);
});
