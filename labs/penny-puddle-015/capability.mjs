/**
 * JUBILEE CAPABILITY-015 — missing transformation -> GRAFT proposal-only build
 *
 * A "new ability" is a local executable transformation with proof that a
 * bounded synthetic input can be transformed into a bounded local artifact.
 * It is NOT a person promising to perform it, a gold license, a contract, a
 * creditor's consent, funding, a GRAFT admission, or historically new science.
 */
import {createHash} from 'node:crypto';
import {makeAgreementFixture,synthesizeAgreements} from '../penny-puddle-014/composer.mjs';

const copy=x=>JSON.parse(JSON.stringify(x));
const hash=x=>createHash('sha256').update(x).digest('hex');
const allowedStatus=new Set(['no','unknown','yes']);
function id(x,context){
 if(typeof x!=='string'||!x.trim()||x.length>110)
   throw new TypeError(context+' must be short nonempty text');
 return x;
}
export const MISSING_INPUT='fictional-image-permission:F';
export const MISSING_OUTPUT='portable-storyboard-for:L';
export const TOOL_OPERATOR_ID='GRAFT-local-storyboard-compiler';

const newCard={
  id:'L-considers-storyboard',
  actor:'L',
  requires:[MISSING_OUTPUT],
  produces:'rent-satisfaction-option:A',
  question:'Would you consider a specific offline story display as a substitute for rent, only under individually negotiated written terms?',
  status:'unknown',
  priorYesBps:3000,
  declaredByActorInFixture:true,
  purpose:'settle-a-need',
  expiresDay:45,
  risks:['real-landlord-may-not-want-this','no-legal-rent-waiver'],
  exclusiveClaims:[],
  directQuestionBurden:.1
};
export function makeBlockedNeedFixture(){
 const f=makeAgreementFixture();
 // Every OLD proposed form of creditor performance is refused in the toy
 // fixture. We are NOT declaring this about any actual landlord.
 f.offers=f.offers.map(x=>x.actor==='L'?{...x,status:'no'}:x);
 f.offers.push(copy(newCard));
 return f;
}
/** Backward-chaining proof trace, including a deliberately unsupported token. */
export function findMissingCapability(f=makeBlockedNeedFixture()){
 const existing=synthesizeAgreements(f);
 const outputToCards=new Map();
 for(const card of f.offers){
  if(card.status==='no'||card.expiresDay<f.day)continue;
  const a=outputToCards.get(card.produces)??[];
  a.push(card);
  outputToCards.set(card.produces,a);
 }
 const missing=[];
 const seen=new Set();
 function backtrack(token,path,depth){
   if(f.initialFacts.includes(token))return;
   if(depth>10)throw new Error('Bounded backward investigation exceeded');
   if(path.includes(token))return;
   if(seen.has(token))return;
   seen.add(token);
   const possible=outputToCards.get(token)??[];
   if(!possible.length)missing.push({
     requiredToken:token,neededBy:path.at(-1)??f.goal,
     missingOperator:true,automaticallyBuildable:false
   });
   for(const p of possible)for(const input of p.requires)
     backtrack(input,[...path,token],depth+1);
 }
 backtrack(f.goal,[],0);
 return {
   status:missing.length?'HOLD-unproven-capability':'no-missing-synthetic-tokens',
   currentlyComposedRoutes:existing.numberOfDistinctConditionalStructures,
   blockedOutputs:missing,
   noHumanAbilityInferred:true,
   noConsentOrFundingInvented:true
 };
}
/**
 * This synthetic request deliberately provides only harmless, invented
 * captions. It cannot fetch photos, prove picture rights, claim a title,
 * trigger GRAFT publication or contact anyone.
 */
export function makeGraftRequest(){
 const gap=findMissingCapability();
 if(!gap.blockedOutputs.some(x=>x.requiredToken===MISSING_OUTPUT))
   throw new Error('Required missing capability not demonstrated');
 return {
  schema:'jubilee.graft-capability-proposal/v1',
  requestId:'015-fictitious-gold-storyboard-need',
  originatingProject:'the-static-collective/Jubilee-treasury',
  sourceModule:'labs/penny-puddle-015/capability.mjs',
  intendedReceiver:'the-static-collective/GRAFT',
  status:'PROPOSE_ONLY',
  researchIntent:'test whether a new local artifact-building technique closes a missing planning token',
  inputToken:MISSING_INPUT,
  outputToken:MISSING_OUTPUT,
  proposedTechnique:'deterministic-offline-story-card-html',
  dataOrigin:'entirely-invented-public-fixture',
  syntheticStory:{
   title:'The Unspent Object',
   subtitle:'A fictional traveling exhibit about possibilities',
   captions:[
    'A large and rather improbable golden object sits on a table.',
    'An object need not change owners before it can inspire a useful idea.',
    'The display asks which voluntary arrangements could satisfy a real need.'
   ]
  },
  acceptanceTests:[
   'generate-offline-printable-html',
   'escape-user-provided-html',
   'deterministic-content-hash',
   'no-scripts-remote-media-or-network',
   'do-not-mint-a-property-right'
  ],
  bounds:{maxCards:5,maxCaptionLength:240,maxHtmlBytes:15000},
  externalActorConsentVerified:false,
  assetTitleOrMediaRightsVerified:false,
  actualFinancialValueCents:0,
  realActionsAuthorized:false
 };
}
export const requestDigest=req=>hash(JSON.stringify(req));
export function verifyGraftLocalProof(request,packet){
 const reason=msg=>({
  status:'HOLD-invalid-or-untrusted-build-proof',
  reason:msg,canProposeTechnique:false,realWorldEffectAuthorized:false
 });
 if(!request||request.schema!=='jubilee.graft-capability-proposal/v1'||
    request.status!=='PROPOSE_ONLY'||request.outputToken!==MISSING_OUTPUT)
   return reason('Unexpected synthetic request schema');
 if(!packet||typeof packet!=='object'||Array.isArray(packet))
   return reason('Missing candidate receipt and artifact');
 const {receipt,html}=packet;
 if(!receipt||typeof html!=='string'||!html.trim())
   return reason('Local artifact and receipt both required');
 if(receipt.schema!=='graft.capability-local-proof/v1'||
    receipt.authority!=='PROPOSE_ONLY'||
    receipt.buildStatus!=='LOCAL_SYNTHETIC_TESTED'||
    receipt.requestDigestSha256!==requestDigest(request)||
    receipt.artifactDigestSha256!==hash(html))
   return reason('Receipt/bytes/proposal digest mismatch');
 if(receipt.producedToken!==request.outputToken ||
    receipt.inputToken!==request.inputToken||
    receipt.provenance!=='synthetic-local-test-fixture'||
    receipt.testsPassed!==request.acceptanceTests.length ||
    receipt.realPeopleContacted!==0||receipt.realFundsMovedCents!==0||
    receipt.actualPropertyRightsGranted!==false||
    receipt.realWorldServicePerformed!==false||
    receipt.graftAdmittedToProduction!==false)
   return reason('Unapproved scope, missing tests or falsely asserted real effects');
 if(!html.includes('<!doctype html>')||html.length>request.bounds.maxHtmlBytes ||
    /<script\b|<iframe\b|<img\b|https?:\/\/|onload\s*=|javascript:/i.test(html))
   return reason('Rendered artifact is not a safe local-only text display');
 return {
  status:'LOCAL_IMPLEMENTATION_PROVEN_IN_FIXTURE',
  canProposeTechnique:true,
  admissibleOnlyAsSimulation:true,
  realWorldEffectAuthorized:false,
  dataActuallyVerified:false,
  sourceRequestSha256:requestDigest(request),
  generatedArtifactSha256:hash(html)
 };
}
export function composeWithGraftProof(request,packet){
 const proof=verifyGraftLocalProof(request,packet);
 const f=makeBlockedNeedFixture();
 const before=synthesizeAgreements(f);
 if(!proof.canProposeTechnique)return {
  status:'HOLD-NO-VERIFIED-CAPABILITY',
  originalRoutes:before.numberOfDistinctConditionalStructures,
  conditionalRoutes:before.numberOfDistinctConditionalStructures,
  realSettlementCents:0,verified:proof
 };
 // A proven LOCAL TECHNIQUE exists, but a real steward, rightsholder,
 // landlord and beneficiary remain independently responsible for consent.
 f.offers.push({
   id:TOOL_OPERATOR_ID,
   actor:'H', // a wholly fictional curator, NOT GRAFT itself as legal actor
   requires:[request.inputToken],produces:request.outputToken,
   question:'Would a qualified human curator consider generating a display using this separately tested local tool?',
   status:'unknown',priorYesBps:6000,
   declaredByActorInFixture:true,
   purpose:f.purpose,expiresDay:45,
   risks:['actual-image-and-ownership-rights-unverified',
     'GRAFT-tool-tested-not-real-service-delivered',
     'human-curator-must-agree','recipient-must-be-protected'],
   exclusiveClaims:[],directQuestionBurden:.1
 });
 const built=synthesizeAgreements(f);
 return {
  status:'new-hypothetical-path-proposed-NOT-CONTRACT',
  originalRoutes:before.numberOfDistinctConditionalStructures,
  conditionalRoutes:built.numberOfDistinctConditionalStructures,
  generatedOptions:built.plans.map(p=>({
    operatorIds:p.generatedOperatorIds,
    unknownPeopleToAsk:p.unknownFirstPersonQuestions,
    legallyDischargedCents:p.actualCreditorReleaseCents
  })),
  localBuildProof:proof,
  realSettlementCents:0,
  realMoneyMovedCents:0,
  actualPeopleContacted:0,
  actualGraftDeployment:false
 };
}
