import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRelayFixture,createRelayLab,validateRelayNetwork} from '../relay.mjs';
import {evaluateSocialReach,simulateFullRelay} from '../weave.mjs';
import {makeSatisfactionFixture} from '../../penny-puddle-009/satisfaction.mjs';

const lab=(o={})=>createRelayLab(makeRelayFixture(),o);
test('a genuinely scoped weak relationship can shorten the discovery route',()=>{
 const preview=lab().publicPreview();
 assert.ok(preview.pathsAvailable>=2);
 assert.equal(preview.candidates[0].firstKnownContact,'F');
 assert.equal(preview.candidates[0].introductionCount,3);
 assert.equal(preview.candidates[1].introductionCount,4);
 assert.equal(preview.candidates[0].remoteNamesWithheld,true);
 assert.equal(preview.networkLoadedFromActualContacts,false);
 assert.equal(preview.trueRealWorldPeopleContacted,0);
});
test('context and purpose matter more than generic social clout',()=>{
 const preview=lab({purpose:'garden-news'}).publicPreview();
 assert.equal(preview.pathsAvailable,0);
 assert.equal(preview.candidates.length,0);
 assert.equal(lab({strongOnly:true}).publicPreview().pathsAvailable,0);
});
test('a stale apparent shortcut cannot bypass consent or freshness',()=>{
 const f=makeRelayFixture();
 const old=f.links.find(e=>e.id==='G-L-stale');
 assert.equal(f.day>old.observedDay+old.ttlDays,true);
 assert.equal(lab().publicPreview().candidates.some(c=>c.introductionCount===1),false);
 const p=createRelayLab({...f,day:100}).publicPreview();
 assert.equal(p.pathsAvailable,0);
});
test('a direct connection from an owner is not consent to disclose next people',()=>{
 const r=lab();
 const routeId=r.publicPreview().candidates[0].routeId;
 assert.equal(r.inboxFor('F').length,0);
 assert.equal(r.inboxFor('E').length,0);
 r.request({eventId:'start',routeId,initiatorId:'G'});
 assert.equal(r.inboxFor('F').length,1);
 assert.equal(r.inboxFor('E').length,0);
 const intro=r.inboxFor('F')[0];
 assert.equal(intro.initiatedByImmediateContact,'G');
 assert.equal(intro.previousPrivatePathHidden,true);
 assert.equal(intro.recipientCannotConsentForAnyOtherPerson,true);
 assert.equal(r.readiness(routeId).onlyCandidateToOpenNegotiation,false);
});
test('every hop must be individually accepted, even when contact path exists',()=>{
 const r=lab(),routeId=r.publicPreview().candidates[0].routeId;
 r.request({eventId:'start',routeId,initiatorId:'G'});
 assert.throws(()=>r.respond({eventId:'cheat',routeId,actorId:'E',approve:true}),/next named/);
 const one=r.respond({eventId:'F-accept',routeId,actorId:'F',approve:true});
 assert.equal(one.approvedHopCount,1);
 assert.equal(r.inboxFor('E').length,1);
 assert.equal(r.inboxFor('L').length,0);
 const two=r.respond({eventId:'E-accept',routeId,actorId:'E',approve:true});
 assert.equal(two.approvedHopCount,2);
 const three=r.respond({eventId:'L-accept',routeId,actorId:'L',approve:true});
 assert.equal(three.status,'all-introductions-accepted-in-fixture');
 assert.equal(r.readiness(routeId).onlyCandidateToOpenNegotiation,true);
 assert.equal(r.readiness(routeId).legalDealMade,false);
 assert.equal(r.audit().realContactRequestsSent,0);
 assert.equal(r.readiness(routeId).noFinancialTrustOrPaymentInferred,true);
});
test('no participant may be preauthorized by their friend or by the planner',()=>{
 const r=lab(),routeId=r.publicPreview().candidates[0].routeId;
 assert.throws(()=>r.request({eventId:'fake',routeId,initiatorId:'F'}),/Only actual origin/);
 r.request({eventId:'start',routeId,initiatorId:'G'});
 assert.throws(()=>r.respond({eventId:'bad',routeId,actorId:'F',approve:1}),/Explicit/);
 const refusal=r.respond({eventId:'refuse',routeId,actorId:'F',approve:false});
 assert.equal(refusal.status,'refused');
 assert.equal(refusal.allRelaysInFixtureAccepted,false);
 assert.equal(r.inboxFor('E').length,0);
 assert.throws(()=>r.respond({eventId:'advance',routeId,actorId:'E',approve:true}),/No live/);
});
test('an accepted introducer can withdraw without penalty',()=>{
 const r=lab(),routeId=r.publicPreview().candidates[0].routeId;
 r.request({eventId:'start',routeId,initiatorId:'G'});
 r.respond({eventId:'yes',routeId,actorId:'F',approve:true});
 const s=r.withdraw({eventId:'withdraw',routeId,actorId:'F'});
 assert.equal(s.status,'withdrawn');
 assert.equal(r.inboxFor('E').length,0);
 assert.throws(()=>r.respond({eventId:'new',routeId,actorId:'E',approve:true}),/No live/);
});
test('a social referral cannot be duplicated through event replay',()=>{
 const r=lab(),routeId=r.publicPreview().candidates[0].routeId;
 r.request({eventId:'start',routeId,initiatorId:'G'});
 assert.throws(()=>r.request({eventId:'start',routeId,initiatorId:'G'}),/already requested/);
 r.respond({eventId:'yes',routeId,actorId:'F',approve:true});
 assert.throws(()=>r.respond({eventId:'yes',routeId,actorId:'E',approve:true}),/Duplicate/);
});
test('a public opt-in hub is an entry point for people without insiders',()=>{
 const r=lab({from:'A',to:'F'});
 const p=r.publicPreview();
 assert.equal(p.candidates[0].firstKnownContact,'H');
 assert.equal(p.candidates[0].introductionCount,2);
 assert.equal(p.candidates[0].remoteNamesWithheld,true);
});
test('blocked scope, refused introduction and expired links all fail closed',()=>{
 const f=makeRelayFixture();
 f.links.find(e=>e.id==='F-E').recipientMayBeAskedInFixture=false;
 f.links.find(e=>e.id==='F-B').recipientMayBeAskedInFixture=false;
 assert.equal(createRelayLab(f).publicPreview().pathsAvailable,0);
 const wrong=makeRelayFixture();
 wrong.links.find(e=>e.id==='G-E-scope-denied').allowedPurposes=['settle-a-need'];
 assert.equal(createRelayLab(wrong).publicPreview().candidates.some(x=>x.introductionCount===2),false);
});
test('missing origin, duplicate IDs, bad provenance or unbounded graph are refused',()=>{
 const f=makeRelayFixture();
 assert.throws(()=>createRelayLab(f,{from:'unknown'}),/Distinct/);
 assert.throws(()=>validateRelayNetwork({...f,links:[...f.links,f.links[0]]}),/Duplicate contact/);
 const fake=makeRelayFixture();
 fake.links[0].declaredBy='E';
 assert.throws(()=>validateRelayNetwork(fake),/source of relationship/);
 const oversize=makeRelayFixture();
 oversize.links=Array(71).fill(oversize.links[0]);
 assert.throws(()=>validateRelayNetwork(oversize),/bounded/);
});
test('Satisfaction Weave requires contact paths to all parties including beneficiary',()=>{
 const p=evaluateSocialReach({beneficiaryConsentAsserted:true});
 assert.equal(p.allConnectionsFound,true);
 assert.equal(p.creditorConditionsAsserted,true);
 assert.equal(p.pairs.length,4);
 assert.equal(p.pairs.every(x=>x.candidateIntroductionRoutes>0),true);
 assert.equal(p.status,'network-can-begin-hop-by-hop-introduction');
 assert.equal(p.executionAuthorized,false);
 assert.equal(p.actualCreditorObligationDischargedCents,0);
});
test('mere network reach without independent beneficiary consent remains HOLD',()=>{
 const p=evaluateSocialReach();
 assert.equal(p.allConnectionsFound,true);
 assert.equal(p.status,'HOLD-awaiting-permission-or-connectivity');
 assert.equal(p.everyoneHasAccepted,false);
});
test('creditor veto kills agreement regardless of how many relationships exist',()=>{
 const f=makeSatisfactionFixture();
 f.liability.creditorConditionalAcceptanceTermsAssertedInFixture=false;
 const p=evaluateSocialReach({agreement:f,beneficiaryConsentAsserted:true});
 assert.equal(p.creditorConditionsAsserted,false);
 assert.equal(p.status,'HOLD-awaiting-permission-or-connectivity');
});
test('all weak ties filtered means social clout cannot substitute for missing consent routes',()=>{
 const p=evaluateSocialReach({includeWeakTies:false,beneficiaryConsentAsserted:true});
 assert.equal(p.allConnectionsFound,false);
 assert.equal(p.status,'HOLD-awaiting-permission-or-connectivity');
});
test('a successfully simulated acquaintance chain only unlocks NEGOTIATION, not rent discharge',()=>{
 const p=simulateFullRelay();
 assert.equal(p.status,'all-introductions-accepted-in-fixture');
 assert.equal(p.hopCount,3);
 assert.equal(p.approvals,3);
 assert.equal(p.actualContactMessagesSent,0);
 assert.equal(p.actualDealCompleted,false);
 assert.equal(p.actualRentDischargedCents,0);
 assert.equal(p.proofOfFriendshipOutsideFixture,false);
});
