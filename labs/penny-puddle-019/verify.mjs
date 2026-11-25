/**
 * Jubilee-019 RECEIVING VERIFIER. Recomputes compiled behavior from typed
 * program AST and separate source-owned test data. GRAFT never authorizes
 * itself to install a new primitive or claim an actual economic agreement.
 */
import {digest,makeChallenge,validateChallenge,validateProgram} from './contract.mjs';
import {checkRLEProgram,compileAndRun,originalLibrariesGap} from './independent.mjs';
import {firstCounterexample} from './development.mjs';
import {evaluateFrozen} from './heldout.mjs';
import {makeBlockedNeedFixture} from '../penny-puddle-015/capability.mjs';
import {synthesizeAgreements} from '../penny-puddle-014/composer.mjs';
const stringify=x=>JSON.stringify(x);
const SHA=x=>digest(x);
const expectedStrategies=['native-motif-structural-order','classical-exhaustive'];
function hold(reason){return {status:'HOLD-invalid-primitive-proof',
 reason,realContacts:0,realMoneyMovedCents:0,realDebtDischargedCents:0,
 productionAdmitted:false};}
function checkRun(run,spec){
 if(!run||!Array.isArray(run.attempts)||!run.attempts.length||
   run.attempts.length>spec.constraints.maxCounterexampleRounds+1||
   !Number.isSafeInteger(run.searchEvaluations)||run.searchEvaluations<1||
   run.searchEvaluations>spec.constraints.maxPrograms*
     (spec.constraints.maxCounterexampleRounds+1)||
   !Number.isSafeInteger(run.counterexampleRounds)||
   run.counterexampleRounds!==run.attempts.length-1)
  throw new Error('Missing or unbounded candidate-search evidence');
 validateProgram(run.selectedProgram);
 const proposed=new Set();
 for(let i=0;i<run.attempts.length;i++){
  const step=run.attempts[i];
  validateProgram(step.program);
  const signature=stringify(step.program);
  if(proposed.has(signature))throw new Error('Repeated same program after previously refuted counterexample');
  proposed.add(signature);
  const publicPass=spec.publicCases.every(x=>checkRLEProgram(step.program,x).passed);
  const developer=firstCounterexample(step.program);
  if(step.publicPass!==publicPass||!publicPass)
   throw new Error('Candidate public PASS claim differs from independent results');
  const final=i===run.attempts.length-1;
  if(final){
   if(developer!==null||step.developmentPass!==true||
      stringify(step.program)!==stringify(run.selectedProgram))
    throw new Error('Frozen winning method has not survived developer tests');
  }else if(developer===null||step.developmentPass!==false||
    step.counterexampleId!==developer.id)
    throw new Error('Failed candidate or actual distinguishing evidence not preserved');
 }
 const publicHashes=spec.publicCases.map(x=>SHA(compileAndRun(run.selectedProgram,x.input)));
 if(stringify(run.publicOutputHashes)!==stringify(publicHashes))
  throw new Error('GRAFT submitted output hashes disagree with independent byte-level computation');
 return {strategy:run.strategy,selectedStages:run.selectedProgram.stages,
  numberOfPreviousFailedProposals:run.attempts.length-1,
  observedCounterexamples:run.attempts.slice(0,-1).map(x=>x.counterexampleId),
  reportedCandidateChecks:run.searchEvaluations,
  publicAndDevelopmentReplayed:true,
  frozenHeldout:evaluateFrozen(run.selectedProgram)};
}
function addConditionalHumanOption(){
 const f=makeBlockedNeedFixture();
 f.offers.push({
  id:'L-considers-reversible-encoded-ledger',
  actor:'L',requires:['reversible-run-ledger-for:L'],
  produces:f.goal,
  question:'Would you consider a separately agreed, lawful and useful story-ledger deliverable in connection with rent?',
  status:'unknown',priorYesBps:3000,declaredByActorInFixture:true,
  purpose:f.purpose,expiresDay:45,
  risks:['creditor-has-not-consented','no-valued-services-demonstrated'],
  exclusiveClaims:[],directQuestionBurden:.1
 });
 const before=synthesizeAgreements(f).numberOfDistinctConditionalStructures;
 f.offers.push({
  id:'GRAFT-019-human-curator-might-use-reversible-run-encoder',
  actor:'H',requires:['fictional-image-permission:F'],
  produces:'reversible-run-ledger-for:L',
  question:'Would you choose to operate the tested local method on properly licensed information?',
  status:'unknown',priorYesBps:5000,declaredByActorInFixture:true,
  purpose:f.purpose,expiresDay:45,
  risks:['human-curator-not-consenting',
   'synthetic-encoder-has-no-observed-economic-value',
   'gold-rights-not-verified'],
  exclusiveClaims:[],directQuestionBurden:.1
 });
 const after=synthesizeAgreements(f);
 return {before,after:after.numberOfDistinctConditionalStructures,
  unknownPeople:after.plans.flatMap(x=>x.unknownFirstPersonQuestions)};
}
export function verifyConstruction(spec,report){
 try{validateChallenge(spec);}
 catch(e){return hold(e.message);}
 if(!report||report.schema!=='graft.constructive-primitive-lab/v1'||
    report.authority!=='PROPOSE_ONLY'||
    report.specFingerprintSha256!==digest(spec)||
    report.origin!=='the-static-collective/GRAFT'||
    report.actualNativeMotif003Used!==true||
    report.nativeOriginalCommit!=='66d27cfbd077b2c91d0d86d66e320206d88d8f95'||
    report.methodWasWholeProgramLookup!==false||
    !Array.isArray(report.runs)||report.runs.length!==2||
    report.runs.some((r,i)=>r?.strategy!==expectedStrategies[i])||
    report.realPeopleContacted!==0||
    report.realMoneyMovedCents!==0||
    report.anyProductionDeployment!==false||
    Buffer.byteLength(stringify(report),'utf8')>spec.constraints.maxReportBytes)
  return hold('Source provenance, report completeness, report size or external authority mismatch');
 try{
  const old=originalLibrariesGap();
  if(old.original017ProgramsExecuted!==72||old.original018OperatorsExecuted!==5||
     old.oldWholeProgramsProvidingRequiredTypedRLE!==0)
    throw new Error('Original tool library already contains a complete typed solution');
  const results=report.runs.map(r=>checkRun(r,spec));
  if(!results.every(x=>x.frozenHeldout.allPassed))
   return {...hold('Final heldout inputs falsified the frozen candidate'),
    originalExpressivityGap:old,verifiedResults:results};
  const options=addConditionalHumanOption();
  return {status:'TESTED-COMPOSED-RLE-PRIMITIVE-PROPOSE-ONLY',
   originalExpressivityGap:old,verifiedResults:results,
   newAlgorithmRelativeToOldLibrary:true,
   historicallyNovelAlgorithm:false,
   withinRestrictedTypedStateMachineGrammar:true,
   correctUnderAllSpecifiedTests:true,
   comprehensiveUnicodeSecurityOrConformanceProven:false,
   heldoutInputPublicInRepoProcessSeparatedOnly:true,
   newConditionalOptionsBefore:options.before,
   newConditionalOptionsAfter:options.after,
   unconsentedHumanQuestions:options.unknownPeople,
   grantedProductionAuthority:false,
   realMoneyMovedCents:0,realPeopleContacted:0,
   realWorkPerformed:0,realDebtDischargedCents:0,
   actualPropertyRightsCreated:false,
   productionAdmitted:false};
 }catch(e){return hold(e.message);}
}
