import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSatisfactionFixture,createSatisfactionWeave} from '../satisfaction.mjs';
const step=(lab,eventId,stepId,fromActorId,toActorId)=>
 lab.complete({eventId,stepId,fromActorId,toActorId,
  providerAndReceiverAffirmedInFixture:true,evidenceReference:'invented-two-party-ack'});
test('multi-party chain never converts physical gold to money or tokens',()=>{
 const lab=createSatisfactionWeave(makeSatisfactionFixture());
 const s=lab.snapshot();
 assert.equal(s.requestedReliefCents,30000);
 assert.equal(s.legallyWaivedDebtCents,0);
 assert.equal(s.cashActuallyChangedHandsCents,0);
 assert.equal(s.physicalGoldMoved,false);
 assert.equal(s.fractionalGoldClaimsCreated,0);
 assert.equal(s.status,'HOLD-no-independent-real-world-creditor-discharge');
});
test('all dependencies and voluntary landlord waiver are necessary',()=>{
 const lab=createSatisfactionWeave(makeSatisfactionFixture());
 assert.throws(()=>step(lab,'repair-first','electrical-repair','E','L'),/dependent/);
 assert.throws(()=>lab.acceptNoncashSettlement({
  eventId:'waiver',creditorActorId:'L',explicitVoluntaryWaiverInFixture:true,
  evidenceReference:'private-assertion'}),/Every promised/);
 step(lab,'image','image-right','G','F');
 step(lab,'video','promo-video','F','E');
 const s=step(lab,'repair','electrical-repair','E','L');
 assert.equal(s.confirmedStepsInFixture,3);
 assert.equal(s.modeledReliefAcceptedCents,0);
 assert.equal(s.legallyWaivedDebtCents,0);
 const waiver=lab.acceptNoncashSettlement({eventId:'waiver',creditorActorId:'L',
  explicitVoluntaryWaiverInFixture:true,evidenceReference:'mock-landlord-release'});
 assert.equal(waiver.modeledReliefAcceptedCents,30000);
 assert.equal(waiver.recipientActuallyDischarged,false);
 assert.equal(waiver.legallyWaivedDebtCents,0);
 assert.equal(waiver.realPreperformanceCreditorContractVerified,false);
 assert.equal(waiver.cashActuallyChangedHandsCents,0);
 assert.equal(waiver.physicalGoldMoved,false);
});
test('no creditor waiver without creditor identity and positive consent',()=>{
 const lab=createSatisfactionWeave(makeSatisfactionFixture());
 step(lab,'image','image-right','G','F');
 step(lab,'video','promo-video','F','E');
 step(lab,'repair','electrical-repair','E','L');
 assert.throws(()=>lab.acceptNoncashSettlement({eventId:'waive1',creditorActorId:'G',
  explicitVoluntaryWaiverInFixture:true,evidenceReference:'x'}),/Only actual creditor/);
 assert.throws(()=>lab.acceptNoncashSettlement({eventId:'waive2',creditorActorId:'L',
  explicitVoluntaryWaiverInFixture:false,evidenceReference:'x'}),/Only actual creditor/);
 assert.equal(lab.snapshot().modeledReliefAcceptedCents,0);
});
test('landlord refusing noncash settlement or absent conditional terms rejects graph immediately',()=>{
 assert.throws(()=>createSatisfactionWeave({
  ...makeSatisfactionFixture(),
  liability:{...makeSatisfactionFixture().liability,creditorWouldConsiderNoncashPaymentInFixture:false}
 }),/Creditor refusal/);
 assert.throws(()=>createSatisfactionWeave({
  ...makeSatisfactionFixture(),
  liability:{...makeSatisfactionFixture().liability,creditorConditionalAcceptanceTermsAssertedInFixture:false}
 }),/Creditor refusal/);
});
test('cannot use intellectual property without the right holder or sell twice',()=>{
 assert.throws(()=>createSatisfactionWeave({
  ...makeSatisfactionFixture(),
  asset:{...makeSatisfactionFixture().asset,rightsOwnerConsentInFixture:false}
 }),/owner permission/);
 assert.throws(()=>createSatisfactionWeave({
  ...makeSatisfactionFixture(),
  asset:{...makeSatisfactionFixture().asset,alreadyLicensedExclusively:true}
 }),/double-licensed/);
});
test('all service recipients and providers must affirm independently',()=>{
 const lab=createSatisfactionWeave(makeSatisfactionFixture());
 assert.throws(()=>lab.complete({eventId:'fake',stepId:'image-right',
  fromActorId:'G',toActorId:'F',providerAndReceiverAffirmedInFixture:false,
  evidenceReference:'none'}),/both parties/);
 assert.throws(()=>lab.complete({eventId:'wrong',stepId:'image-right',
  fromActorId:'F',toActorId:'G',providerAndReceiverAffirmedInFixture:true,
  evidenceReference:'none'}),/No matching/);
 assert.equal(lab.snapshot().confirmedStepsInFixture,0);
});
test('duplicate performance and duplicate legal-release claims are held',()=>{
 const lab=createSatisfactionWeave(makeSatisfactionFixture());
 step(lab,'image','image-right','G','F');
 assert.throws(()=>step(lab,'image','image-right','G','F'),/Duplicate/);
 assert.throws(()=>step(lab,'again','image-right','G','F'),/same work twice/);
 step(lab,'video','promo-video','F','E');
 step(lab,'repair','electrical-repair','E','L');
 lab.acceptNoncashSettlement({eventId:'close',creditorActorId:'L',
  explicitVoluntaryWaiverInFixture:true,evidenceReference:'x'});
 assert.throws(()=>lab.acceptNoncashSettlement({eventId:'close2',creditorActorId:'L',
  explicitVoluntaryWaiverInFixture:true,evidenceReference:'x'}),/Already modeled/);
});
test('conditional service dependency cycle is not a fulfilled economic pathway',()=>{
 const fixture=makeSatisfactionFixture();
 fixture.promisedSteps[0].dependsOn=['electrical-repair'];
 assert.throws(()=>createSatisfactionWeave(fixture),/Circular/);
});
