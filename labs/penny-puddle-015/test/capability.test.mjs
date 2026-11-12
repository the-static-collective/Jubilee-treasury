import test from 'node:test';
import assert from 'node:assert/strict';
import {
 MISSING_OUTPUT,TOOL_OPERATOR_ID,makeBlockedNeedFixture,
 findMissingCapability,makeGraftRequest,requestDigest,
 verifyGraftLocalProof,composeWithGraftProof
} from '../capability.mjs';
import {synthesizeAgreements} from '../../penny-puddle-014/composer.mjs';

const request=()=>makeGraftRequest();

test('all pre-existing creditor routes are independently refused; missing operator is explicit',()=>{
 const f=makeBlockedNeedFixture();
 assert.equal(synthesizeAgreements(f).numberOfDistinctConditionalStructures,0);
 const research=findMissingCapability(f);
 assert.equal(research.status,'HOLD-unproven-capability');
 assert.equal(research.currentlyComposedRoutes,0);
 assert.ok(research.blockedOutputs.some(x=>x.requiredToken===MISSING_OUTPUT));
 assert.equal(research.noHumanAbilityInferred,true);
});
test('Jubilee exports a bounded, invented, source-owned propose-only request',()=>{
 const r=request();
 assert.equal(r.status,'PROPOSE_ONLY');
 assert.equal(r.intendedReceiver,'the-static-collective/GRAFT');
 assert.equal(r.inputToken,'fictional-image-permission:F');
 assert.equal(r.outputToken,MISSING_OUTPUT);
 assert.equal(r.externalActorConsentVerified,false);
 assert.equal(r.assetTitleOrMediaRightsVerified,false);
 assert.equal(r.realActionsAuthorized,false);
 assert.equal(r.syntheticStory.captions.length,3);
 assert.equal(r.acceptanceTests.length,5);
 assert.match(requestDigest(r),/^[0-9a-f]{64}$/);
 assert.equal(requestDigest(r),requestDigest(request()));
});
test('a missing GRAFT proof cannot conjure a transformation or creditor discharge',()=>{
 const r=request(),v=verifyGraftLocalProof(r,null);
 assert.equal(v.canProposeTechnique,false);
 assert.equal(v.realWorldEffectAuthorized,false);
 const plan=composeWithGraftProof(r,null);
 assert.equal(plan.originalRoutes,0);
 assert.equal(plan.conditionalRoutes,0);
 assert.equal(plan.realSettlementCents,0);
});
test('forged local proof cannot create a legal license, person or cash',()=>{
 const r=request();
 const fake={
  html:'<!doctype html><html lang="en"><body>fake</body></html>',
  receipt:{
   schema:'graft.capability-local-proof/v1',
   authority:'ADMIT',
   buildStatus:'LOCAL_SYNTHETIC_TESTED',
   requestDigestSha256:requestDigest(r),
   artifactDigestSha256:'0'.repeat(64)
  }
 };
 assert.equal(verifyGraftLocalProof(r,fake).canProposeTechnique,false);
 assert.equal(composeWithGraftProof(r,fake).conditionalRoutes,0);
});
test('a generated local technique is still a question for a human curator and landlord',()=>{
 const f=makeBlockedNeedFixture();
 const card=f.offers.find(x=>x.id==='L-considers-storyboard');
 assert.equal(card.status,'unknown');
 assert.deepEqual(card.requires,[MISSING_OUTPUT]);
 assert.equal(f.offers.some(x=>x.id===TOOL_OPERATOR_ID),false);
 assert.equal(synthesizeAgreements(f).realDebtDischargedCents,0);
});
