/**
 * Independent Jubilee 018 GRAFT receipt + frozen-method verification.
 *
 * A method must survive the originally missing semantic requirement AND a
 * final-only Unicode suite, not simply claim to have found a new primitive.
 * Native MOTIF-003 changes order only, and does not certify soundness.
 */
import {createHash} from 'node:crypto';
import {makePrimitiveChallenge,validatePrimitiveChallenge,
 fingerprint} from './contract.mjs';
import {independentCountAndRender,assessPrimitive,
  legacyExpressivityProof,validMethod} from './independent.mjs';
import {firstDeveloperCounterexample} from './development.mjs';
import {assessFrozenHeldout} from './heldout.mjs';
import {makeBlockedNeedFixture} from '../penny-puddle-015/capability.mjs';
import {synthesizeAgreements} from '../penny-puddle-014/composer.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
const expectedStrategies=['motif-affordance-priority','classical-exhaustive'];
function reject(reason){
 return {status:'HOLD-unverified-primitive',reason,
  realMoneyMovedCents:0,realPeopleContacted:0,
  actualRightsGranted:false,productionAdmitted:false};
}
function validateRun(run,spec){
 if(!run||!expectedStrategies.includes(run.strategy)||
    !Array.isArray(run.attempts)||run.attempts.length<1||
    run.attempts.length>spec.bounds.maxDevelopmentRounds+1||
    !Number.isInteger(run.searchEvaluations)||run.searchEvaluations<1||
    run.searchEvaluations>spec.bounds.maxPrograms*(spec.bounds.maxDevelopmentRounds+1)||
    !Number.isInteger(run.counterexampleRounds)||
    run.counterexampleRounds!==run.attempts.length-1||
    run.counterexampleRounds>spec.bounds.maxDevelopmentRounds)
  throw new Error('Unbounded, invalid or incomplete counterexample record');
 validMethod(run.selectedMethod);
 const seen=new Set();
 for(let i=0;i<run.attempts.length;i++){
  const entry=run.attempts[i];
  validMethod(entry.method);
  const key=entry.method.mode;
  if(seen.has(key))throw new Error('Repeated candidate has no new evidence');
  seen.add(key);
  const publicPassed=spec.publicExamples.every(c=>assessPrimitive(entry.method,c,spec).pass);
  if(publicPassed!==entry.publicPass||!publicPassed)
   throw new Error('GRAFT reported public pass disagrees with independent Jubilee tests');
  const actualCounterexample=firstDeveloperCounterexample(entry.method);
  const last=i===run.attempts.length-1;
  if(last){
   if(actualCounterexample!==null||entry.developmentPass!==true||
      JSON.stringify(entry.method)!==JSON.stringify(run.selectedMethod))
    throw new Error('Final method did not survive all known development cases');
  }else if(actualCounterexample===null||
   entry.developmentPass!==false||
   entry.counterexampleId!==actualCounterexample.id)
    throw new Error('Failed method evidence or specific counterexample was altered');
 }
 const expectedHash=spec.publicExamples.map(c=>
  sha(independentCountAndRender(run.selectedMethod,c.story,spec)));
 if(JSON.stringify(expectedHash)!==JSON.stringify(run.publicOutputHashes))
  throw new Error('Submitted output digest does not match separately executed source bytes');
 const heldout=assessFrozenHeldout(run.selectedMethod);
 return {
  strategy:run.strategy,
  selectedPrimitive:run.selectedMethod.mode,
  independentPublicChecksPassed:true,
  independentDevelopmentChecksPassed:true,
  heldout,
  counterexamplesRevealed:run.attempts.slice(0,-1).map(x=>x.counterexampleId),
  reportedSearchEvaluations:run.searchEvaluations,
  independentTestsNotBasedOnReportedPASS:true,
  realWorldBehaviorUnverified:true
 };
}
function addOnlyConditionalOperator(){
 const before=makeBlockedNeedFixture();
 before.offers.push({
  id:'L-considers-unicode-storyboard',actor:'L',
  requires:['unicode-indexed-storyboard-for:L'],
  produces:before.goal,
  question:'Would you consider a safely produced, specifically licensed Unicode-labeled story display under individually negotiated terms?',
  status:'unknown',priorYesBps:3500,declaredByActorInFixture:true,
  purpose:before.purpose,expiresDay:45,
  risks:['landlord-has-not-consented','tenant-rights-protected',
   'no-licensed-real-image-or-payment'],
  exclusiveClaims:[],directQuestionBurden:.1
 });
 const original=synthesizeAgreements(before).numberOfDistinctConditionalStructures;
 before.offers.push({
  id:'GRAFT-018-human-curator-may-use-verified-unicode-operator',
  actor:'H',
  requires:['fictional-image-permission:F'],
  produces:'unicode-indexed-storyboard-for:L',
  question:'Would you personally consider operating the tested local compiler with separately verified rights?',
  status:'unknown',priorYesBps:5000,declaredByActorInFixture:true,
  purpose:before.purpose,expiresDay:45,
  risks:['no-human-work-verified','no-property-rights-verified',
   'only-a-local-software-primitive-proven'],
  exclusiveClaims:[],directQuestionBurden:.1
 });
 const after=synthesizeAgreements(before);
 return {before:original,after:after.numberOfDistinctConditionalStructures,
  unknownParticipants:after.plans.flatMap(x=>x.unknownFirstPersonQuestions)};
}
export function verifyPrimitiveLaboratory(spec,report){
 try{validatePrimitiveChallenge(spec);}
 catch(e){return reject(e.message);}
 if(!report||report.schema!=='graft.missing-primitive-laboratory/v1'||
   report.authority!=='PROPOSE_ONLY'||
   report.specDigestSha256!==fingerprint(spec)||
   report.source!=='the-static-collective/GRAFT'||
   report.nativeMotifOriginalCommit!=='66d27cfbd077b2c91d0d86d66e320206d88d8f95'||
   report.nativeSourceVerified!==true||
   report.realPeopleContacted!==0||
   report.realMoneyMovedCents!==0||
   report.authorizedProductionDeployment!==false||
   !Array.isArray(report.runs)||report.runs.length!==2||
   report.runs.some((r,i)=>r.strategy!==expectedStrategies[i])||
   Buffer.byteLength(JSON.stringify(report),'utf8')>20000)
  return reject('Source/provenance, bounded report or external authority invalid');
 try{
  const gap=legacyExpressivityProof(spec);
  if(gap.combinationsActuallyExecuted!==72||
     gap.oldProgramsSatisfyingRequestedFeature!==0)
    throw new Error('The supposed missing feature is already in the finite old grammar');
  const runs=report.runs.map(r=>validateRun(r,spec));
  if(!runs.every(x=>x.heldout.allPassed))
    return {...reject('Independent final-only Unicode cases failed'),
      priorGrammarGap:gap,verifiedRuns:runs};
  const options=addOnlyConditionalOperator();
  return {
   status:'TESTED-NEW-TO-DSL-PRIMITIVE-PROPOSE-ONLY',
   gapProof:gap,
   verifiedRuns:runs,
   distinctFullProgramsGenerated:2,
   availablePrimitiveNewRelativeTo017:true,
   sourcePrimitiveIsExistingIntlAPI:true,
   proofDoesNotDemonstrateHistoricalAlgorithmicInvention:true,
   initialConditionalOptions:options.before,
   newConditionalOptions:options.after,
   unsatisfiedHumanPermissions:options.unknownParticipants,
   allHeldoutPassed:true,
   noGeneralHTMLSecurityGuarantee:true,
   nativeMotifOrderingNotGeneralIntelligence:true,
   realPeopleContacted:0,realMoneyMovedCents:0,
   actualCreditorReleaseCents:0,actualWorkDone:0,
   actualRightsGranted:false,productionAdmitted:false
  };
 }catch(e){return reject(e.message);}
}
