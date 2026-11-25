import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRelayFixture} from '../../penny-puddle-010/relay.mjs';
import {
  makeNetworkQuestionFixture,compareNetworkQuestionStrategies,createNetworkInvestigator
} from '../network.mjs';

function gates(lab){
  lab.tenantChooses({eventId:'tenant-yes',actorId:'A',approve:true});
  lab.ownerChooses({eventId:'owner-yes',actorId:'G',approve:true});
  return lab;
}
function completeRoute(lab){
  const q=lab.priority().suggestedQuestion;
  assert.ok(q,'Expected useful question before route');
  let state=lab.startIntroduction({eventId:'start-'+q.id,initiatorId:'G',questionId:q.id});
  let steps=0;
  while(state.status==='awaiting-individual-choice'){
    const receiver=['F','E','L','B','A','H'].find(person=>lab.nextInboxFor(person).length);
    assert.ok(receiver,'Must not reveal private path from public preview');
    state=lab.respondIntroduction({eventId:'intro-'+q.id+'-'+receiver,
      actorId:receiver,approve:true});
    if(++steps>7)throw new Error('Path should be bounded');
  }
  assert.equal(state.status,'all-introductions-accepted-in-fixture');
  assert.equal(state.subjectAnsweredQuestion,false);
  return q;
}
function questionAndAnswer(lab,value){
  const q=completeRoute(lab);
  const request=lab.askQuestion({eventId:'ask-'+q.id,
    actorId:q.role==='Landlord'?'L':q.role==='Electrician'?'E':'F',
    questionId:q.id,personIndividuallyAgreesToQuestionInFixture:true});
  assert.equal(request.realQuestionActuallySent,false);
  const actor=q.role==='Landlord'?'L':q.role==='Electrician'?'E':'F';
  lab.answer({eventId:'answer-'+q.id,actorId:actor,
    answer:value,firstPersonResponseInFixture:true});
  return q.id;
}
test('the experiment contains 8 weighted worlds and only synthetic outcomes',()=>{
 const f=makeNetworkQuestionFixture();
 assert.equal(f.worlds.length,8);
 assert.equal(f.worlds.reduce((n,w)=>n+w.weight,0),2000);
 assert.deepEqual(f.actions,['weave-satisfaction','angel-funded-alternative','no-deal']);
 assert.equal(f.questions.length,3);
 assert.ok(f.worlds.every(w=>w.outcomes['no-deal']===0));
 assert.equal(f.priorProvenance.includes('invented'),true);
});
test('native 010 source determines route lengths and first known person',()=>{
 const f=makeNetworkQuestionFixture();
 const land=f.questions.find(q=>q.asker==='L');
 const filmmaker=f.questions.find(q=>q.asker==='F');
 const electrician=f.questions.find(q=>q.asker==='E');
 assert.equal(land.introductionHops,3);
 assert.equal(electrician.introductionHops,2);
 assert.equal(filmmaker.introductionHops,1);
 assert.equal(land.firstKnownContact,'F');
 assert.equal(electrician.firstKnownContact,'F');
 assert.equal(filmmaker.firstKnownContact,'F');
 assert.equal(land.outcomeIsLegalAcceptance,false);
});
test('a faraway creditor veto can be more important than the nearest introduction',()=>{
 const b=compareNetworkQuestionStrategies();
 assert.equal(b.noQuestionAction,'angel-funded-alternative');
 assert.equal(b.noQuestionPoints,5);
 assert.equal(b.nearestContactQuestion,'ask-filmmaker-about-license');
 assert.equal(b.myopicFirstQuestion,'ask-landlord-about-noncash');
 assert.equal(b.exactThreeQuestionFirst,'ask-landlord-about-noncash');
 assert.ok(b.exactThreeQuestionExpectedPointsNet>b.nearestFirstOptimallyContinuedPoints);
 assert.ok(b.exactThreeQuestionExpectedPointsNet>b.myopicExpectedPointsNet);
 assert.ok(b.expectedQuestionsUnderOptimal<3);
 assert.equal(b.permissionAndTitleActuallyVerified,false);
});
test('sensitive inquiry cannot start without separately asserted resident AND owner permission',()=>{
 const l=createNetworkInvestigator();
 assert.equal(l.priority().status,'HOLD-first-person-tenant-and-owner-consent');
 assert.equal(l.priority().suggestedQuestion,null);
 assert.throws(()=>l.startIntroduction({
   eventId:'bad',initiatorId:'G',questionId:'ask-landlord-about-noncash'
 }),/Tenant and owner/);
 l.tenantChooses({eventId:'tenant',actorId:'A',approve:true});
 assert.equal(l.priority().status,'HOLD-first-person-tenant-and-owner-consent');
 l.ownerChooses({eventId:'owner',actorId:'G',approve:true});
 assert.equal(l.priority().suggestedQuestion.id,'ask-landlord-about-noncash');
});
test('only the tenant and asset owner can give their separate research approvals',()=>{
 const l=createNetworkInvestigator();
 assert.throws(()=>l.tenantChooses({eventId:'x',actorId:'G',approve:true}),/Only the resident/);
 assert.throws(()=>l.ownerChooses({eventId:'y',actorId:'A',approve:true}),/Only the asset owner/);
 assert.equal(l.audit().events.length,0);
});
test('resident refusal ends the opportunity without acquiring additional personal facts',()=>{
 const l=createNetworkInvestigator();
 const r=l.tenantChooses({eventId:'tenant-declines',actorId:'A',approve:false});
 assert.equal(r.status,'HOLD-resident-refused');
 assert.equal(l.priority().suggestedQuestion,null);
 assert.equal(l.audit().questionsActuallyAnsweredInFixture,0);
 assert.equal(l.audit().realContactsMessaged,0);
});
test('routes ask each person one-by-one, and an intermediary cannot answer for creditor',()=>{
 const l=gates(createNetworkInvestigator());
 const q=l.priority().suggestedQuestion;
 assert.equal(q.firstKnownContactOnly,'F');
 assert.equal(q.introductionHops,3);
 l.startIntroduction({eventId:'start',initiatorId:'G',questionId:q.id});
 assert.equal(l.nextInboxFor('F').length,1);
 assert.equal(l.nextInboxFor('E').length,0);
 assert.equal(l.nextInboxFor('L').length,0);
 assert.throws(()=>l.respondIntroduction({eventId:'skip',actorId:'L',approve:true}),/Only the next/);
 assert.throws(()=>l.askQuestion({eventId:'ask',actorId:'L',
    questionId:q.id,personIndividuallyAgreesToQuestionInFixture:true}),/Every introduction/);
 l.respondIntroduction({eventId:'F-yes',actorId:'F',approve:true});
 assert.equal(l.nextInboxFor('E').length,1);
 assert.equal(l.nextInboxFor('L').length,0);
 l.respondIntroduction({eventId:'E-yes',actorId:'E',approve:true});
 assert.equal(l.nextInboxFor('L').length,1);
 const done=l.respondIntroduction({eventId:'L-yes',actorId:'L',approve:true});
 assert.equal(done.allRelaysInFixtureAccepted,true);
 assert.equal(l.audit().realContactsMessaged,0);
 assert.throws(()=>l.askQuestion({eventId:'fake',actorId:'E',questionId:q.id,
    personIndividuallyAgreesToQuestionInFixture:true}),/Only target/);
});
test('any intermediary refusing ends that route, not a speculative answer about landlord',()=>{
 const l=gates(createNetworkInvestigator());
 const q=l.priority().suggestedQuestion;
 l.startIntroduction({eventId:'start',initiatorId:'G',questionId:q.id});
 const refused=l.respondIntroduction({eventId:'F-no',actorId:'F',approve:false});
 assert.equal(refused.status,'refused');
 assert.equal(l.audit().toyPosteriorWorldCount,8);
 assert.equal(l.audit().questionIdsAsked.length,0);
 assert.equal(l.audit().pathsDeniedByPeople.includes(q.id),true);
 assert.equal(l.agreementPreview().legallyDischargedCents,0);
});
test('the landlord answering no prunes the entire noncash chain with no further questions',()=>{
 const l=gates(createNetworkInvestigator());
 assert.equal(questionAndAnswer(l,'no'),'ask-landlord-about-noncash');
 const result=l.priority();
 assert.equal(result.status,'stop-no-further-useful-question');
 assert.equal(result.suggestedQuestion,null);
 assert.equal(result.baselineAction,'angel-funded-alternative');
 assert.equal(l.audit().questionsActuallyAnsweredInFixture,1);
 assert.equal(l.agreementPreview().status,'HOLD-no-all-participant-interest');
 assert.equal(l.audit().actualCreditorReliefCents,0);
});
test('a hypothetical yes from landlord opens electrician question two introductions away',()=>{
 const l=gates(createNetworkInvestigator());
 questionAndAnswer(l,'yes');
 const next=l.priority().suggestedQuestion;
 assert.equal(next.id,'ask-electrician-about-repairs');
 assert.equal(next.introductionHops,2);
 assert.equal(next.firstKnownContactOnly,'F');
 assert.equal(l.audit().realContactsMessaged,0);
});
test('an electrician no ends the chain instead of bothering filmmaker',()=>{
 const l=gates(createNetworkInvestigator());
 questionAndAnswer(l,'yes');
 assert.equal(questionAndAnswer(l,'no'),'ask-electrician-about-repairs');
 assert.equal(l.priority().suggestedQuestion,null);
 assert.equal(l.audit().questionsActuallyAnsweredInFixture,2);
 assert.equal(l.agreementPreview().legallyDischargedCents,0);
});
test('three independent potential interests unlock negotiation, NEVER a debt discharge',()=>{
 const l=gates(createNetworkInvestigator());
 assert.equal(questionAndAnswer(l,'yes'),'ask-landlord-about-noncash');
 assert.equal(questionAndAnswer(l,'yes'),'ask-electrician-about-repairs');
 assert.equal(questionAndAnswer(l,'yes'),'ask-filmmaker-about-license');
 assert.equal(l.priority().suggestedQuestion,null);
 const s=l.agreementPreview();
 assert.equal(s.source009Consulted,true);
 assert.equal(s.status,'eligible-to-discuss-specific-terms-HOLD');
 assert.equal(s.completedServices,0);
 assert.equal(s.legallyDischargedCents,0);
 assert.equal(s.moneyActuallyMovedCents,0);
 assert.equal(s.physicalGoldMoved,false);
 assert.equal(s.creditorPreagreementActuallyVerified,false);
 assert.equal(l.audit().questionsActuallyAnsweredInFixture,3);
});
test('answer cannot be inferred from another actor, absent question opt-in or invalid response',()=>{
 const l=gates(createNetworkInvestigator()),q=completeRoute(l);
 assert.throws(()=>l.askQuestion({eventId:'false',questionId:q.id,actorId:'L',
    personIndividuallyAgreesToQuestionInFixture:false}),/Only target/);
 assert.equal(l.audit().questionIdsAsked.length,0);
 l.askQuestion({eventId:'ask',questionId:q.id,actorId:'L',
    personIndividuallyAgreesToQuestionInFixture:true});
 assert.throws(()=>l.answer({eventId:'pretend',actorId:'G',answer:'yes',
    firstPersonResponseInFixture:true}),/Only questioned person/);
 assert.throws(()=>l.answer({eventId:'pretend',actorId:'L',answer:'yes',
    firstPersonResponseInFixture:false}),/Only questioned person/);
 assert.throws(()=>l.answer({eventId:'pretend',actorId:'L',answer:'maybe',
    firstPersonResponseInFixture:true}),/Unexpected/);
 assert.equal(l.audit().questionsActuallyAnsweredInFixture,0);
});
test('an invited creditor may decline to answer without a presumed decision',()=>{
 const l=gates(createNetworkInvestigator()),q=completeRoute(l);
 l.askQuestion({eventId:'ask',questionId:q.id,actorId:'L',
    personIndividuallyAgreesToQuestionInFixture:true});
 const r=l.declineQuestion({eventId:'decline',actorId:'L'});
 assert.equal(r.answerInferred,false);
 assert.equal(l.audit().toyPosteriorWorldCount,8);
 assert.equal(l.audit().questionsActuallyAnsweredInFixture,0);
 assert.equal(l.agreementPreview().status,'HOLD-no-all-participant-interest');
});
test('tenant revocation discards even previously answered modeling state',()=>{
 const l=gates(createNetworkInvestigator());
 questionAndAnswer(l,'yes');
 assert.equal(l.audit().questionsActuallyAnsweredInFixture,1);
 const r=l.revoke({eventId:'revoke',actorId:'A'});
 assert.equal(r.retainedPersonalAnswers,0);
 assert.equal(l.audit().toyPosteriorWorldCount,8);
 assert.deepEqual(l.audit().questionIdsAsked,[]);
 assert.equal(l.priority().suggestedQuestion,null);
 assert.equal(l.agreementPreview().legallyDischargedCents,0);
 assert.throws(()=>l.startIntroduction({eventId:'other',initiatorId:'G',
    questionId:'ask-electrician-about-repairs'}),/Tenant and owner/);
});
test('finite question budget stops without fabricating unasked participants consent',()=>{
 const l=gates(createNetworkInvestigator({maxQuestions:1}));
 questionAndAnswer(l,'yes');
 assert.equal(l.priority().status,'HOLD-question-budget-exhausted');
 assert.equal(l.agreementPreview().source009Consulted,false);
 assert.equal(l.audit().actualWorkCompleted,0);
});
test('stale relationship edges remove discovery paths; social reach cannot be assumed',()=>{
 const n=makeRelayFixture();n.day=100;
 const f=makeNetworkQuestionFixture(n);
 assert.equal(f.questions.every(q=>!q.routeFound),true);
 const l=gates(createNetworkInvestigator({network:n}));
 assert.equal(l.priority().suggestedQuestion,null);
 assert.equal(l.priority().status,'stop-no-further-useful-question');
 assert.equal(l.audit().realContactsMessaged,0);
});
test('replay of consent and introduction IDs cannot mutate a settled answer twice',()=>{
 const l=gates(createNetworkInvestigator());
 const q=completeRoute(l);
 l.askQuestion({eventId:'ask-unique',questionId:q.id,actorId:'L',
    personIndividuallyAgreesToQuestionInFixture:true});
 l.answer({eventId:'answer-unique',actorId:'L',answer:'yes',
    firstPersonResponseInFixture:true});
 assert.throws(()=>l.tenantChooses({eventId:'tenant-yes',actorId:'A',approve:true}),/already/);
 assert.throws(()=>l.answer({eventId:'answer-unique',actorId:'L',answer:'no',
    firstPersonResponseInFixture:true}),/No consented question/);
 assert.equal(l.audit().questionsActuallyAnsweredInFixture,1);
});
