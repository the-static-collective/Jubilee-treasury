import test from 'node:test';
import assert from 'node:assert/strict';
import {makeContextFixture,createContextLab,validateContext} from '../context.mjs';
import {makeContextRelayFixture,createContextWeave} from '../weave.mjs';

function approvedIntroductions(w){
  const p=w.preview();
  assert.equal(p.firstKnownContact,'hub');
  w.startIntroductions({eventId:'start',requesterId:'learner'});
  const hub=w.respondToIntroduction({eventId:'hub-yes',actorId:'hub',approve:true});
  assert.equal(hub.approvedHopCount,1);
  const subject=w.respondToIntroduction({eventId:'mechanic-yes',actorId:'mechanic',approve:true});
  assert.equal(subject.allRelaysInFixtureAccepted,true);
  return w;
}
function shared(w,{formats=['teach-together','remote-guidance'],motivation=false,days=5}={}){
  w.askOwnPreferences({eventId:'ask-context',requesterId:'learner'});
  w.answerOwnPreferences({eventId:'mechanic-discloses',actorId:'mechanic',
    approve:true,shareFormats:formats,shareAvailability:true,
    shareMotivation:motivation,ttlDays:days});
  return w;
}
const ready=()=>shared(approvedIntroductions(createContextWeave()));

test('weak skill-only keyword control confidently offers the wrong kind of job',()=>{
 const context=createContextLab(makeContextFixture());
 const baseline=context.skillOnlyBaseline();
 assert.equal(baseline.naiveSkillMatchCount,1);
 assert.equal(baseline.naiveSuggestion,'repair-done-for-you');
 assert.equal(baseline.falsePositiveAboutWillingness,true);
 assert.equal(baseline.actOnSuggestion,false);
 assert.equal(context.proposeFor('learner','repair-learning').candidates.length,0);
});
test('there is no automatic friend profile or hidden preference reveal before consent',()=>{
 const w=createContextWeave();
 assert.equal(w.preview().potentialIntroductions,2);
 assert.equal(w.preview().firstKnownContact,'hub');
 assert.equal(w.preview().hypotheticalSubjectPreferencesDisclosed,false);
 assert.equal(w.proposals().candidates.length,0);
 assert.throws(()=>w.askOwnPreferences({eventId:'illegal',requesterId:'learner'}),/Each relationship/);
 assert.equal(w.context.sharedFor('learner','repair-learning').available,false);
 assert.equal(w.carrier().privatePreferencesNotExported,true);
});
test('first contact cannot consent for the mechanic or skip hop',()=>{
 const w=createContextWeave();
 w.startIntroductions({eventId:'start',requesterId:'learner'});
 assert.equal(w.pendingInboxFor('hub').length,1);
 assert.equal(w.pendingInboxFor('mechanic').length,0);
 assert.throws(()=>w.respondToIntroduction({eventId:'jump',actorId:'mechanic',approve:true}),/next named/);
 w.respondToIntroduction({eventId:'hub-yes',actorId:'hub',approve:true});
 assert.equal(w.pendingInboxFor('mechanic').length,1);
 assert.throws(()=>w.askOwnPreferences({eventId:'skip',requesterId:'learner'}),/Each relationship/);
});
test('an opt-in introducer may suggest a neutral question but no private personal fact',()=>{
 const w=approvedIntroductions(createContextWeave());
 const q=w.suggestQuestion({eventId:'intro-suggests',introducerId:'hub'});
 assert.equal(q.claimedFactAboutSubject,null);
 assert.equal(q.privatePreferenceWasDisclosed,false);
 assert.match(q.nextQuestion.neutralQuestion,/Would you like/);
 assert.equal(q.nextQuestion.contactOrMessageActuallySent,false);
 assert.ok(!JSON.stringify(q).includes('I enjoy showing'));
});
test('the subject controls what is disclosed, to whom, and for how long',()=>{
 const w=shared(approvedIntroductions(createContextWeave()),{
  formats:['teach-together'],motivation:false,days:3
 });
 const own=w.context.sharedFor('learner','repair-learning');
 assert.equal(own.available,true);
 assert.deepEqual(own.disclosedFormats,['teach-together']);
 assert.equal(own.disclosedMotivation,null);
 assert.equal(own.expiresDay,33);
 assert.equal(w.context.sharedFor('hub','repair-learning').available,false);
 assert.equal(w.context.sharedFor('learner','garden-news').available,false);
 assert.equal(w.context.audit().grant.motivationPubliclyVisible,false);
});
test('neutral request and subject refusal do not punish the person or reveal profile',()=>{
 const w=approvedIntroductions(createContextWeave());
 w.askOwnPreferences({eventId:'ask-context',requesterId:'learner'});
 const no=w.answerOwnPreferences({eventId:'no',actorId:'mechanic',approve:false});
 assert.equal(no.noPenaltyForDeclining,true);
 assert.equal(w.proposals().candidates.length,0);
 assert.equal(w.context.sharedFor('learner','repair-learning').available,false);
});
test('invalid disclosure cannot consume a YES receipt or turn hidden preferences into verified data',()=>{
 const w=approvedIntroductions(createContextWeave());
 w.askOwnPreferences({eventId:'ask-context',requesterId:'learner'});
 assert.throws(()=>w.answerOwnPreferences({eventId:'yes',actorId:'mechanic',
  approve:true,shareFormats:['repair-for-hire'],shareAvailability:true}),/permitted formats/);
 assert.equal(w.context.audit().invitation.status,'pending');
 const correct=w.answerOwnPreferences({eventId:'yes',actorId:'mechanic',
  approve:true,shareFormats:['teach-together'],shareAvailability:true});
 assert.equal(correct.status,'approved');
});
test('context-first searches for the arrangement someone actually wants, not a repair job',()=>{
 const w=ready();
 const p=w.proposals();
 assert.equal(p.status,'invitation-to-negotiate-only');
 assert.deepEqual(p.candidates.map(x=>x.id),['learn-by-repairing','short-video-call']);
 assert.equal(p.candidates.find(x=>x.id==='learn-by-repairing').subjectBenefitSelfRated,6);
 assert.equal(p.candidates.find(x=>x.id==='learn-by-repairing').requesterBenefitSelfRated,8);
 assert.equal(p.candidates.some(x=>x.format==='repair-for-hire'),false);
 assert.equal(p.paretoSuggestions.length,1);
 assert.equal(p.paretoSuggestions[0].id,'learn-by-repairing');
 assert.equal(p.actualSubjectAuthenticated,false);
 assert.equal(p.socialAndEnvironmentalImpactsMeasured,false);
});
test('the same explicit context safely crosses into original DEALWEAVER-007 controls',()=>{
 const w=ready();
 const d=w.dealweaverComparison();
 assert.equal(d.collaborationWithOriginalModule,true);
 assert.equal(d.sourceOptions,2);
 assert.ok(d.paretoBundles.some(x=>x.ids.includes('learn-by-repairing')));
 assert.ok(d.paretoBundles.every(x=>x.ids.length===1));
 assert.equal(d.amountActuallyPaidCents,0);
 assert.equal(d.realContracts,0);
});
test('a subject can share formats while withholding all personal motivational language',()=>{
 const w=shared(approvedIntroductions(createContextWeave()),{formats:['teach-together'],motivation:false});
 const serialized=JSON.stringify({
  share:w.context.sharedFor('learner','repair-learning'),
  options:w.proposals(),
  carrier:w.carrier()
 });
 assert.equal(serialized.includes('I enjoy showing'),false);
 assert.equal(serialized.includes('selfDeclaredBenefits'),false);
 assert.equal(w.carrier().recipientAdmitted,false);
});
test('if subject explicitly chooses to share a motivation, recipient alone may see it',()=>{
 const w=shared(approvedIntroductions(createContextWeave()),{
  formats:['teach-together'],motivation:true
 });
 assert.match(w.context.sharedFor('learner','repair-learning').disclosedMotivation,/enjoy showing/);
 assert.equal(w.context.sharedFor('hub','repair-learning').available,false);
 assert.equal(w.carrier().privatePreferencesNotExported,true);
});
test('proposal cannot be sent before RELAY and subject consent, or by impostor',()=>{
 const w=createContextWeave();
 assert.throws(()=>w.offer({eventId:'bad',actorId:'learner',
  proposalId:'learn-by-repairing'}),/No active/);
 const s=ready();
 assert.throws(()=>s.offer({eventId:'wrong',actorId:'hub',
  proposalId:'learn-by-repairing'}),/Only requester/);
 const o=s.offer({eventId:'propose',actorId:'learner',proposalId:'learn-by-repairing'});
 assert.equal(o.status,'awaiting-subject');
 assert.equal(o.actualServiceCompleted,false);
 assert.equal(o.realMoneyMovedCents,0);
});
test('two people separately accept a specific safe format, but the result remains HOLD',()=>{
 const w=ready();
 w.offer({eventId:'propose',actorId:'learner',proposalId:'learn-by-repairing'});
 assert.throws(()=>w.respondToOffer({eventId:'fake',actorId:'hub',approve:true}),/Only subject/);
 const one=w.respondToOffer({eventId:'mentor-accept',actorId:'mechanic',approve:true});
 assert.equal(one.status,'awaiting-requester');
 const two=w.requesterReaffirms({eventId:'learner-yes',actorId:'learner',approve:true});
 assert.equal(two.status,'mutual-interest-HOLD');
 assert.equal(two.subjectAcceptedInFixture,true);
 assert.equal(two.requesterReaffirmedInFixture,true);
 assert.equal(two.legalAgreementVerified,false);
 assert.equal(two.participantSatisfactionIndependentlyMeasured,false);
 assert.equal(two.realRightsGranted,false);
});
test('either person may refuse, and the platform cannot treat an offer as fulfilled',()=>{
 const w=ready();
 w.offer({eventId:'propose',actorId:'learner',proposalId:'learn-by-repairing'});
 const declined=w.respondToOffer({eventId:'subject-no',actorId:'mechanic',approve:false});
 assert.equal(declined.status,'declined');
 assert.throws(()=>w.requesterReaffirms({eventId:'fake',actorId:'learner',approve:true}),/No offer/);
 assert.equal(declined.actualServiceCompleted,false);
});
test('withdrawal and loss of sharing consent invalidate pending agreement',()=>{
 const w=ready();
 w.offer({eventId:'propose',actorId:'learner',proposalId:'learn-by-repairing'});
 const v=w.revokeSubjectContext({eventId:'revoke',actorId:'mechanic'});
 assert.equal(v.futureMatchingPermitted,false);
 assert.equal(w.agreementSnapshot().status,'context-revoked-HOLD');
 assert.equal(w.proposals().candidates.length,0);
 assert.throws(()=>w.respondToOffer({eventId:'late',actorId:'mechanic',approve:true}),/No pending/);
});
test('a subject can retract even after two yeses in a nonbinding fixture',()=>{
 const w=ready();
 w.offer({eventId:'propose',actorId:'learner',proposalId:'learn-by-repairing'});
 w.respondToOffer({eventId:'mentor-yes',actorId:'mechanic',approve:true});
 w.requesterReaffirms({eventId:'learner-yes',actorId:'learner',approve:true});
 const s=w.withdraw({eventId:'withdraw',actorId:'mechanic'});
 assert.equal(s.status,'withdrawn');
 assert.equal(s.realRightsGranted,false);
 assert.equal(s.legalAgreementVerified,false);
});
test('time change beyond grant expiration fails closed before an offer is affirmed',()=>{
 const w=shared(approvedIntroductions(createContextWeave()),{days:1});
 w.offer({eventId:'propose',actorId:'learner',proposalId:'learn-by-repairing'});
 w.advanceDay(32);
 assert.equal(w.agreementSnapshot().status,'context-expired-HOLD');
 assert.equal(w.proposals().candidates.length,0);
});
test('stale RELAY edges block the request before any personality questions',()=>{
 const network=makeContextRelayFixture();
 network.day=90;
 const w=createContextWeave({network});
 assert.equal(w.preview().openIntakeCandidate,false);
 assert.throws(()=>w.startIntroductions({eventId:'ask',requesterId:'learner'}),/No public/);
 assert.equal(w.context.audit().events.length,0);
});
test('no open hub means isolated people are not assigned fabricated friendships',()=>{
 const network=makeContextRelayFixture();
 network.links[0].recipientMayBeAskedInFixture=false;
 const w=createContextWeave({network});
 assert.equal(w.preview().openIntakeCandidate,false);
 assert.equal(w.proposals().candidates.length,0);
});
test('an outsider cannot append personal preference claims to someone else',()=>{
 const w=approvedIntroductions(createContextWeave());
 w.askOwnPreferences({eventId:'ask-context',requesterId:'learner'});
 assert.throws(()=>w.answerOwnPreferences({eventId:'impostor',actorId:'hub',
  approve:true,shareAvailability:true,shareFormats:['teach-together']}),/Only subject/);
 assert.equal(w.context.audit().grant,null);
});
test('invalid or unbounded schema does not silently infer identity, skills or private traits',()=>{
 const f=makeContextFixture();
 f.subject.selfAuthoredInFixture=false;
 assert.throws(()=>validateContext(f),/self-authorship/);
 const g=makeContextFixture();
 g.menu[0].format='mind-reading';
 assert.throws(()=>validateContext(g),/Format and time window/);
 const h=makeContextFixture();
 h.subject.unacceptableFormats=['teach-together'];
 const w=createContextLab(h);
 assert.equal(w.skillOnlyBaseline().actOnSuggestion,false);
});
test('the readable carrier describes options, not disclosed motivation or effective authority',()=>{
 const w=ready();
 const c=w.carrier();
 assert.equal(c.contract,'jubilee-relay-011/context-proposal-only-v0');
 assert.equal(c.authority,'OFFER_ONLY_HOLD');
 assert.equal(c.options.length,2);
 assert.equal(c.options.every(x=>!x.actualActionAuthorized),true);
 assert.equal(c.moneyMovementCents,0);
 assert.equal(c.realHumanConsentVerified,false);
});
