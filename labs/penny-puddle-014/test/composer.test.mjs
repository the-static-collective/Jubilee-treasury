import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRelayFixture} from '../../penny-puddle-010/relay.mjs';
import {
 makeAgreementFixture,validateAgreementFixture,
 synthesizeAgreements,applyFirstPersonOfferAnswer,fixedRepairOnlyControl
} from '../composer.mjs';
import {
 makeDiscoveryModel,compareDiscoveryControls,createAgreementInvestigator
} from '../planner.mjs';

const before=()=>makeAgreementFixture();
function gates(lab){
 lab.tenantChooses({eventId:'tenant',actorId:'A',approve:true});
 lab.ownerChooses({eventId:'owner',actorId:'G',approve:true});
 return lab;
}
function questionAnswered(lab,answer){
 const q=lab.priority().recommendedQuestion;
 assert.ok(q,'Expected finite decision policy to propose one question');
 const opened=lab.initiate({eventId:'open-'+q.offerCardId,initiatorId:'G',
  offerCardId:q.offerCardId});
 assert.equal(opened.realMessagesSent,0);
 let hop=0;
 while(lab.nextInboxFor('F').length||lab.nextInboxFor('E').length||
    lab.nextInboxFor('L').length||lab.nextInboxFor('B').length){
  const next=['F','E','L','B'].find(x=>lab.nextInboxFor(x).length);
  assert.ok(next);
  lab.replyIntroduction({eventId:'hop-'+q.offerCardId+'-'+next,
   actorId:next,approve:true});
  if(++hop>7)throw new Error('Unbounded introductions');
 }
 const posed=lab.pose({eventId:'pose-'+q.offerCardId,actorId:q.askerId,
  offerCardId:q.offerCardId,personConsentsToExactQuestionInFixture:true});
 assert.equal(posed.actualMessageSent,false);
 const r=lab.reply({eventId:'answer-'+q.offerCardId,
  actorId:q.askerId,answer,firstPersonAnswerInFixture:true});
 assert.equal(r.realRentDischargedCents,0);
 return q.offerCardId;
}
test('a fixed repair chain is ONLY one of THREE independently composed structures',()=>{
 const f=before(),all=synthesizeAgreements(f),control=fixedRepairOnlyControl(f);
 assert.equal(control.numberOfDistinctConditionalStructures,1);
 assert.equal(all.numberOfDistinctConditionalStructures,3);
 assert.equal(all.readyToDiscussInFixture,0);
 assert.equal(all.plans.filter(x=>x.novelComparedToFixedRepairChain).length,2);
 assert.ok(all.plans.some(p=>p.generatedOperatorIds.includes('F-offers-listing-film')));
 assert.ok(all.plans.some(p=>p.generatedOperatorIds.includes('B-offers-skill-workshop')));
 assert.equal(all.userAuthoredCompleteChainsRequired,false);
 assert.equal(all.realDebtDischargedCents,0);
});
test('adding a new combination of independent offer cards yields a FOURTH chain without writing a new planner',()=>{
 const f=before();
 f.offers.push({
  id:'F-makes-audio-story',actor:'F',
  requires:['fictional-image-permission:F'],produces:'audio-story-for:H',
  question:'Would you consider creating a documentary narration?',
  status:'yes',priorYesBps:5000,declaredByActorInFixture:true,
  purpose:f.purpose,expiresDay:45,risks:[],exclusiveClaims:[],
  directQuestionBurden:.1
 },{
  id:'H-offers-community-event',actor:'H',
  requires:['audio-story-for:H'],produces:'community-event-for:L',
  question:'Would you consider hosting a community event in exchange for narration?',
  status:'yes',priorYesBps:5000,declaredByActorInFixture:true,
  purpose:f.purpose,expiresDay:45,risks:[],exclusiveClaims:[],
  directQuestionBurden:.1
 },{
  id:'L-considers-community-event',actor:'L',
  requires:['community-event-for:L'],produces:f.goal,
  question:'Would you consider a community event as specific substitute performance?',
  status:'unknown',priorYesBps:5000,declaredByActorInFixture:true,
  purpose:f.purpose,expiresDay:45,risks:[],exclusiveClaims:[],
  directQuestionBurden:.1
 });
 const s=synthesizeAgreements(f);
 assert.equal(s.numberOfDistinctConditionalStructures,4);
 assert.ok(s.plans.some(p=>p.generatedOperatorIds.includes('F-makes-audio-story')&&
   p.generatedOperatorIds.includes('L-considers-community-event')));
 assert.equal(s.readyToDiscussInFixture,0);
});
test('if the landlord rejects repairs, classical fixed chain fails but NEW paths remain',()=>{
 let f=applyFirstPersonOfferAnswer(before(),'L-considers-repair','L','no');
 assert.equal(fixedRepairOnlyControl(f).numberOfDistinctConditionalStructures,0);
 const alternate=synthesizeAgreements(f);
 assert.equal(alternate.numberOfDistinctConditionalStructures,2);
 assert.ok(alternate.plans.every(x=>x.novelComparedToFixedRepairChain));
 f=applyFirstPersonOfferAnswer(f,'F-offers-listing-film','F','yes');
 f=applyFirstPersonOfferAnswer(f,'L-considers-listing-film','L','yes');
 const s=synthesizeAgreements(f);
 assert.equal(s.readyToDiscussInFixture,1);
 const listing=s.plans.find(x=>x.status==='ready-to-discuss-specific-terms-HOLD');
 assert.deepEqual(listing.generatedOperatorIds,
   ['G-image-permission','F-offers-listing-film','L-considers-listing-film']);
 assert.equal(listing.actualCreditorReleaseCents,0);
 assert.equal(listing.actualAssetUseRightsGranted,false);
});
test('three-person community workshop path can become eligible without any real payment',()=>{
 let f=applyFirstPersonOfferAnswer(before(),'L-considers-repair','L','no');
 for(const [id,actor] of [['F-offers-event-poster','F'],
   ['B-offers-skill-workshop','B'],['L-considers-skill-workshop','L']]){
  f=applyFirstPersonOfferAnswer(f,id,actor,'yes');
 }
 const p=synthesizeAgreements(f).plans.find(x=>
   x.generatedOperatorIds.includes('B-offers-skill-workshop'));
 assert.equal(p.status,'ready-to-discuss-specific-terms-HOLD');
 assert.equal(p.numberOfDependencies,4);
 assert.equal(p.recipientOwesMiddlemenCents,0);
 assert.equal(p.actualMoneyMovedCents,0);
});
test('new pathway still cannot overrule a person saying no to their own role',()=>{
 let f=before();
 f=applyFirstPersonOfferAnswer(f,'L-considers-repair','L','no');
 f=applyFirstPersonOfferAnswer(f,'L-considers-listing-film','L','no');
 f=applyFirstPersonOfferAnswer(f,'L-considers-skill-workshop','L','no');
 const s=synthesizeAgreements(f);
 assert.equal(s.numberOfDistinctConditionalStructures,0);
 assert.equal(s.readyToDiscussInFixture,0);
});
test('cycle pruning refuses circular promises with no independent grounding',()=>{
 const f=before();
 f.goal='imaginary-loop:A';
 f.offers.push({
  id:'bad-loop',actor:'G',requires:['imaginary-loop:A'],
  produces:'imaginary-loop:A',question:'Would you consider looping?',
  status:'yes',priorYesBps:5000,declaredByActorInFixture:true,
  purpose:f.purpose,expiresDay:45,risks:[],exclusiveClaims:[],
  directQuestionBurden:.1
 });
 const s=synthesizeAgreements(f);
 assert.equal(s.numberOfDistinctConditionalStructures,0);
 assert.ok(s.search.cyclesPruned>0);
});
test('two independent source cards cannot use same exclusive right twice',()=>{
 const f=before();
 f.goal='compound-target:A';
 f.offers.push(
  {id:'first-license',actor:'G',requires:['asset-story-may-be-offered:G'],
   produces:'first-exclusive:F',question:'First bounded photography permission?',
   status:'yes',priorYesBps:5000,declaredByActorInFixture:true,
   purpose:f.purpose,expiresDay:45,risks:[],exclusiveClaims:['exclusive-day-slot'],
   directQuestionBurden:.1},
  {id:'second-license',actor:'G',requires:['asset-story-may-be-offered:G'],
   produces:'second-exclusive:B',question:'Second bounded photography permission?',
   status:'yes',priorYesBps:5000,declaredByActorInFixture:true,
   purpose:f.purpose,expiresDay:45,risks:[],exclusiveClaims:['exclusive-day-slot'],
   directQuestionBurden:.1},
  {id:'requires-both',actor:'L',requires:['first-exclusive:F','second-exclusive:B'],
   produces:'compound-target:A',question:'Would you require both exclusive events?',
   status:'yes',priorYesBps:5000,declaredByActorInFixture:true,
   purpose:f.purpose,expiresDay:45,risks:[],exclusiveClaims:[],
   directQuestionBurden:.1}
 );
 assert.equal(synthesizeAgreements(f).numberOfDistinctConditionalStructures,0);
});
test('one first-person answer cannot be supplied by a friend, repeated, or treated as a contract',()=>{
 const f=before();
 assert.throws(()=>applyFirstPersonOfferAnswer(f,'L-considers-repair','F','yes'),/Only original offer author/);
 assert.throws(()=>applyFirstPersonOfferAnswer(f,'L-considers-repair','L','maybe'),/No inferred/);
 const changed=applyFirstPersonOfferAnswer(f,'L-considers-repair','L','yes');
 assert.equal(f.offers.find(x=>x.id==='L-considers-repair').status,'unknown');
 assert.equal(changed.offers.find(x=>x.id==='L-considers-repair').status,'yes');
 assert.throws(()=>applyFirstPersonOfferAnswer(changed,'L-considers-repair','L','no'),/already recorded/);
 assert.equal(synthesizeAgreements(changed).readyToDiscussInFixture,1);
 assert.equal(synthesizeAgreements(changed).realDebtDischargedCents,0);
});
test('unknown outside scope or expired promises never generate false capabilities',()=>{
 const f=before();
 f.day=50;
 assert.equal(synthesizeAgreements(f).numberOfDistinctConditionalStructures,0);
 const s=before();s.offers[0].declaredByActorInFixture=false;
 assert.throws(()=>synthesizeAgreements(s),/First-person/);
 const d=before();d.offers[1].purpose='coercive-sales';
 assert.throws(()=>validateAgreementFixture(d),/First-person/);
});
test('source-owned 010 validates intro paths, 012 evaluates 64 possible response worlds',()=>{
 const m=makeDiscoveryModel();
 assert.equal(m.compositions.numberOfDistinctConditionalStructures,3);
 assert.equal(m.questions.length,6);
 assert.equal(m.worlds.length,64);
 assert.equal(m.viable.length,3);
 assert.equal(m.actions.length,4);
 assert.equal(m.questions.find(q=>q.id==='L-considers-repair').introductionHops,3);
 assert.equal(m.questions.find(q=>q.id==='F-offers-listing-film').introductionHops,1);
 assert.equal(m.questions.find(q=>q.id==='B-offers-skill-workshop').introductionHops,2);
 assert.equal(m.evidence.includes('invented'),true);
});
test('full generated search considers more deal options than fixed original control',()=>{
 const c=compareDiscoveryControls();
 assert.equal(c.baselineSingleHardcodedChainCount,1);
 assert.equal(c.generatedDistinctChainCount,3);
 assert.equal(c.independentlyComposedNewStructures,2);
 assert.equal(c.unverifiedSyntheticPrior,true);
 assert.equal(c.realDebtDischargedCents,0);
 assert.ok(c.exactBoundedFirstQuestion);
});
test('tenant and owner must separately choose whether a search may even begin',()=>{
 const l=createAgreementInvestigator();
 assert.equal(l.priority().status,'HOLD-tenant-owner-consent-missing');
 assert.throws(()=>l.initiate({
  eventId:'bad',initiatorId:'G',offerCardId:'L-considers-repair'}),/Need consent/);
 l.tenantChooses({eventId:'tenant',actorId:'A',approve:true});
 assert.equal(l.priority().recommendedQuestion,null);
 l.ownerChooses({eventId:'owner',actorId:'G',approve:true});
 assert.ok(l.priority().recommendedQuestion);
 assert.equal(l.audit().realIdentityAuthImplemented,false);
});
test('tenant or owner may refuse and no automatic social outreach occurs',()=>{
 const l=createAgreementInvestigator();
 assert.equal(l.tenantChooses({eventId:'no',actorId:'A',approve:false}).status,'HOLD-declined');
 assert.equal(l.priority().recommendedQuestion,null);
 assert.equal(l.audit().events.length,1);
 assert.equal(l.audit().actualTransactions,0);
});
test('no uninvolved actor can agree to an introduction or answer for a participant',()=>{
 const l=gates(createAgreementInvestigator());
 const next=l.priority().recommendedQuestion;
 l.initiate({eventId:'begin',initiatorId:'G',offerCardId:next.offerCardId});
 const pending=['F','E','L','B'].find(x=>l.nextInboxFor(x).length>0);
 assert.ok(pending);
 assert.throws(()=>l.replyIntroduction({eventId:'bad',actorId:'A',approve:true}),/Only the next/);
 assert.throws(()=>l.pose({eventId:'bad2',actorId:next.askerId,
  offerCardId:next.offerCardId,personConsentsToExactQuestionInFixture:true}),/complete/);
 assert.equal(l.audit().questionResponsesModeled,0);
});
test('refused introduction blocks that path but never infers a psychological no',()=>{
 const l=gates(createAgreementInvestigator());
 const q=l.priority().recommendedQuestion;
 l.initiate({eventId:'begin',initiatorId:'G',offerCardId:q.offerCardId});
 const pending=['F','E','L','B'].find(x=>l.nextInboxFor(x).length>0);
 l.replyIntroduction({eventId:'declined',actorId:pending,approve:false});
 assert.equal(l.audit().questionResponsesModeled,0);
 assert.ok(l.audit().questionIdsDeniedOrDeclined.includes(q.offerCardId));
 assert.equal(l.audit().realIdentityAuthImplemented,false);
});
test('a subject who declines a question cannot be assigned a YES or NO',()=>{
 const l=gates(createAgreementInvestigator());
 const q=l.priority().recommendedQuestion;
 l.initiate({eventId:'begin',initiatorId:'G',offerCardId:q.offerCardId});
 for(let n=0;n<6;n++){
  const pending=['F','E','L','B'].find(x=>l.nextInboxFor(x).length>0);
  if(!pending)break;
  l.replyIntroduction({eventId:'hop-'+n,actorId:pending,approve:true});
 }
 l.pose({eventId:'pose',actorId:q.askerId,offerCardId:q.offerCardId,
  personConsentsToExactQuestionInFixture:true});
 assert.throws(()=>l.reply({eventId:'fake',actorId:'G',answer:'yes',
  firstPersonAnswerInFixture:true}),/Only questioned person/);
 const s=l.decline({eventId:'declined',actorId:q.askerId});
 assert.equal(s.unknownNotConvertedIntoNo,true);
 assert.equal(l.audit().questionResponsesModeled,0);
});
test('after a landlord declines repairs, optimizer may investigate new arrangements',()=>{
 const l=gates(createAgreementInvestigator());
 const first=questionAnswered(l,'no');
 assert.equal(first,'L-considers-repair');
 const p=l.priority();
 assert.ok(p.structuresGenerated>=2);
 assert.ok(p.recommendedQuestion);
 assert.notEqual(p.recommendedQuestion.offerCardId,'L-considers-repair');
 assert.equal(p.reliefLegallyCompletedCents,0);
});
test('a sequence of new first-person interests can open unlisted deal, never fulfill it',()=>{
 const l=gates(createAgreementInvestigator());
 const first=questionAnswered(l,'no');
 assert.equal(first,'L-considers-repair');
 let steps=0;
 while(l.priority().recommendedQuestion && steps<5){
  questionAnswered(l,'yes');
  steps++;
 }
 const p=l.priority();
 assert.ok(p.discussOnlyCandidates.length>=1);
 assert.ok(p.discussOnlyCandidates.some(x=>!x.proofSignature.includes('L-considers-repair')));
 const boundary=l.legalBoundary();
 assert.equal(boundary.source009StillHOLD,true);
 assert.equal(boundary.legallyDischargedCents,0);
 assert.equal(boundary.realMoneyMovedCents,0);
 assert.equal(boundary.noAutomaticDebtAgainstBeneficiary,true);
});
test('revoking owner permission clears modeled answers and stops investigation',()=>{
 const l=gates(createAgreementInvestigator());
 questionAnswered(l,'yes');
 assert.equal(l.audit().questionResponsesModeled,1);
 const r=l.revoke({eventId:'withdraw',actorId:'G'});
 assert.equal(r.modeledAnswersRetained,0);
 assert.equal(l.priority().recommendedQuestion,null);
 assert.equal(l.audit().questionResponsesModeled,0);
 assert.throws(()=>l.initiate({eventId:'again',initiatorId:'G',
  offerCardId:'L-considers-repair'}),/Need consent/);
});
test('bounded question budget cannot be bypassed to fabricate consensus',()=>{
 const l=gates(createAgreementInvestigator({maxQuestions:1}));
 questionAnswered(l,'no');
 assert.equal(l.priority().status,'HOLD-inquiry-budget-exhausted');
 assert.equal(l.legalBoundary().legallyDischargedCents,0);
});
test('missing social paths cannot imply introductions or leaked remote identities',()=>{
 const n=makeRelayFixture();n.day=200;
 const f=makeDiscoveryModel({network:n});
 assert.equal(f.questions.length,0);
 assert.equal(f.viable.length,0);
 const l=gates(createAgreementInvestigator({network:n}));
 assert.equal(l.priority().recommendedQuestion,null);
 assert.equal(l.audit().events.length,2);
});
