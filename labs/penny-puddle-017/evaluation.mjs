/**
 * Independent post-freeze receipt verification. No source evaluation or
 * arbitrary runtime code. Generated programs are untrusted DATA in a tiny
 * fixed grammar, compiled here by Jubilee's separate interpreter. Held-out
 * cases never enter GRAFT's candidate-selection function.
 */
import {createHash} from 'node:crypto';
import {
  makeUnwrittenSpec,validUnwrittenSpec,
  validateTypedProgram,suiteFingerprint
} from './contract.mjs';
import {independentRun,qualitySummary} from './independent.mjs';
import {revealOneDevelopmentCounterexample} from './development.mjs';
import {evaluateFrozenHeldout} from './heldout.mjs';
import {makeBlockedNeedFixture} from '../penny-puddle-015/capability.mjs';
import {synthesizeAgreements} from '../penny-puddle-014/composer.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const strategies=['motif-structural-priority','classical-exhaustive'];
const zero=()=>({
  actualPeopleContacted:0,
  actualMoneyMovedCents:0,
  actualRentLegallyDischargedCents:0,
  actualServicesDelivered:0,
  actualPropertyRightsCreated:false,
  addedToGraftProduction:false
});
function forbidden(msg){
 return {status:'HOLD-INVALID-METHOD-EVIDENCE',reason:msg,...zero()};
}
function validateSelected(run,spec){
 if(!run||typeof run!=='object'||Array.isArray(run))
  throw new Error('Missing synthesized program');
 validateTypedProgram(run.selectedProgram,spec);
 if(!Number.isInteger(run.programsEvaluated)||run.programsEvaluated<1||
    run.programsEvaluated>spec.search.maxPrograms*spec.search.maxCounterexampleRounds)
  throw new Error('Unbounded or invalid enumeration count');
 if(!Number.isInteger(run.counterexampleRounds)||run.counterexampleRounds<0||
    run.counterexampleRounds>spec.search.maxCounterexampleRounds)
  throw new Error('Unbounded counterexample history');
 if(!Array.isArray(run.attempts)||run.attempts.length<1||
    run.attempts.length>spec.search.maxHistoryEntries||
    run.attempts.length!==run.counterexampleRounds+1)
  throw new Error('Incomplete controlled counterexample record');
 const publicResult=qualitySummary(run.selectedProgram,spec.publicCases,spec);
 const developmentResult=run.selectedProgram&&
   revealOneDevelopmentCounterexample(run.selectedProgram);
 const sampleHashes=spec.publicCases.map(x=>
   sha(independentRun(run.selectedProgram,x.story,spec)));
 if(!Array.isArray(run.publicOutputHashes)||
    JSON.stringify(run.publicOutputHashes)!==JSON.stringify(sampleHashes))
  throw new Error('Reported compiler output disagrees with independent Jubilee bytes');
 if(!publicResult.passing||developmentResult!==null)
  throw new Error('Final program fails known acceptance or developer counterexample');
 const final=run.attempts.at(-1);
 if(!final||final.publicPass!==true||final.developmentPass!==true||
    JSON.stringify(final.program)!==JSON.stringify(run.selectedProgram))
  throw new Error('Final trace cannot justify selected program');
 const prior=run.attempts.slice(0,-1);
 if(prior.some(x=>x.publicPass!==true||x.developmentPass!==false||
  !x.counterexampleName))throw new Error('Missing failed earlier attempt evidence');
 // We do not trust the reported count as a speed metric; CI tests only
 // enforce that the explicitly logged candidate programs actually fail/pass.
 for(const old of prior){
   validateTypedProgram(old.program,spec);
   if(revealOneDevelopmentCounterexample(old.program)===null)
     throw new Error('A previously rejected program actually passed developer challenge');
 }
 return {
  program:run.selectedProgram,
  publiclyVerified:true,
  developmentVerified:true,
  verificationChecks:['source-exact-program-grammar',
   'independent-public-output-byte-hashes','developer-counterexample-pass',
   'trace-of-failed-attempts','independent-final-heldout'],
  reportedSearchEvaluations:run.programsEvaluated,
  priorFailedProposals:prior.length,
  finalHeldout:evaluateFrozenHeldout(run.selectedProgram,spec)
 };
}
export function verifyUnwrittenLaboratory(spec,report){
 try{validUnwrittenSpec(spec);}
 catch(e){return forbidden(e.message);}
 if(!report||report.schema!=='graft.unwritten-method-laboratory/v1'||
    report.authority!=='PROPOSE_ONLY'||
    report.publicSpecFingerprintSha256!==suiteFingerprint(spec)||
    report.sourceProject!=='the-static-collective/GRAFT'||
    report.generationTechnique!=='finite-composition-from-primitives-not-a-prompted-arbitrary-code-author'||
    !Array.isArray(report.runs)||report.runs.length!==2||
    report.runs.some((r,i)=>r.strategy!==strategies[i])||
    report.realContacts!==0||report.realMoneyMovedCents!==0||
    report.productionDeploymentAuthorized!==false||
    Buffer.byteLength(JSON.stringify(report),'utf8')>20000)
  return forbidden('Source, report contract, bounded size or authority mismatch');
 try{
  const verified=report.runs.map(r=>({
    strategy:r.strategy,...validateSelected(r,spec)
  }));
  const allHeldoutPassed=verified.every(r=>r.finalHeldout.allPassed);
  if(!allHeldoutPassed)
    return {status:'HOLD-HELDOUT-FAILURE',
     verified,allHeldoutPassed:false,
     candidateGainedRealWorldAuthority:false,...zero()};
  const before=synthesizeAgreements(makeBlockedNeedFixture());
  const after=makeBlockedNeedFixture();
  after.offers.push({
   id:'GRAFT-017-generated-typed-method',
   actor:'H',requires:[spec.input],produces:spec.goal,
   question:'Would a real curator independently choose to use this tested local document compiler?',
   status:'unknown',priorYesBps:5000,
   declaredByActorInFixture:true,
   purpose:after.purpose,expiresDay:45,
   risks:['no-verified-artifact-rights','landlord-has-not-agreed',
    'local-software-capability-only','no-human-work-performed'],
   exclusiveClaims:[],directQuestionBurden:.1
  });
  const recomposed=synthesizeAgreements(after);
  return {
   status:'TESTED-SYNTHESIZED-METHOD-PROPOSE-ONLY',
   verified,
   allHeldoutPassed:true,
   originalFixedTemplateWasNotUsedAsNewProgram:true,
   sourceMethodAutomaticallyAdmitted:false,
   distinctNewComposedPrograms:verified.map(x=>
    x.program.stages.map(s=>s.choice).join(' → ')),
   conditionalOptionsBefore:before.numberOfDistinctConditionalStructures,
   conditionalOptionsAfter:recomposed.numberOfDistinctConditionalStructures,
   generatedOpportunityStillRequiresRealHumanConsent:true,
   securityGuaranteeForArbitraryHTML:false,
   withheldTestsWereNotCryptographicallySecret:true,
   sourceIntegrityDoesNotAuthenticateHumanAuthors:true,
   actualEconomicValueProven:false,
   ...zero()
  };
 }catch(e){return forbidden(e.message);}
}
