/**
 * CAPABILITY-020 receiving verifier. A proposed state representation is
 * accepted ONLY after source-owned independent interpretation, exact
 * developmental counterexample replay and final-only tests.
 *
 * This does NOT automatically introduce an "economic" obligation, rent
 * substitute, or anyone's willingness to use an abstract bracket parser.
 */
import {challenge,verifyChallenge,assertProgram,digest} from './contract.mjs';
import {assess,interpret,oldLibraryTypeGap,classicalStackReference}
  from './independent.mjs';
import {revealFirstCounterexample} from './development.mjs';
import {examineAfterFreeze} from './heldout.mjs';
const strategies=['native-motif-structural-priority','classical-exhaustive'];
function hold(reason){return {status:'HOLD-invalid-structure-proof',reason,
  candidateAdmittedToProduction:false,
  addedEconomicAgreements:0,realMoneyMovedCents:0,realPeopleContacted:0,
  creditorReleaseCents:0};}
function verifyStrategy(spec,r){
 if(!r||!Array.isArray(r.attempts)||!r.attempts.length||
   r.attempts.length>spec.bounds.maxHistory||
   r.attempts.length>spec.bounds.maxDevelopmentRounds+1||
   !Number.isSafeInteger(r.totalCandidateEvaluations)||
   r.totalCandidateEvaluations<1||
   r.totalCandidateEvaluations>spec.bounds.maxPrograms*(spec.bounds.maxDevelopmentRounds+1)||
   !Number.isSafeInteger(r.counterexampleRounds)||
   r.counterexampleRounds!==r.attempts.length-1)
  throw new Error('Invalid or unbounded candidate-selection trace');
 assertProgram(r.selectedProgram);
 const seen=new Set();
 for(let i=0;i<r.attempts.length;i++){
  const t=r.attempts[i];
  assertProgram(t.program);
  const id=JSON.stringify(t.program);
  if(seen.has(id))throw new Error('Attempted a previously refuted program again');
  seen.add(id);
  const publicPassed=spec.publicCases.every(c=>assess(t.program,c).passed);
  const error=revealFirstCounterexample(t.program);
  if(publicPassed!==t.publicPass||!publicPassed)
   throw new Error('A supposedly accepted public proposal actually failed');
  const isFinal=i===r.attempts.length-1;
  if(isFinal){
   if(t.developmentPass!==true||error!==null||
      JSON.stringify(t.program)!==JSON.stringify(r.selectedProgram))
    throw new Error('Frozen program not justified by developmental evidence');
  }else if(t.developmentPass!==false||error===null||
    t.counterexampleName!==error.name)
   throw new Error('Wrong proposed program or its exact counterexample was discarded');
 }
 const computed=spec.publicCases.map(c=>digest(interpret(r.selectedProgram,c.input)));
 if(JSON.stringify(computed)!==JSON.stringify(r.publicOutputDigests))
  throw new Error('Original GRAFT output hashes disagree with independent interpreter');
 return {strategy:r.strategy,
  chosenStages:r.selectedProgram.stages,
  independentPublicPass:true,independentDeveloperPass:true,
  previouslyFailedProposals:r.attempts.length-1,
  observedCounterexamples:r.attempts.slice(0,-1).map(x=>x.counterexampleName),
  reportedCandidateEvaluations:r.totalCandidateEvaluations,
  heldout:examineAfterFreeze(r.selectedProgram)};
}
export function verifyArchitecture(spec,report){
 try{verifyChallenge(spec);}
 catch(e){return hold(e.message);}
 if(!report||report.schema!=='graft.structural-memory-laboratory/v1'||
   report.authority!=='PROPOSE_ONLY'||
   report.specDigestSha256!==digest(spec)||
   report.source!=='the-static-collective/GRAFT'||
   report.originalMotifCommit!=='66d27cfbd077b2c91d0d86d66e320206d88d8f95'||
   report.originalMotifActuallyExecuted!==true||
   report.nativeAffordanceGraphHandWritten!==true||
   report.outsideDeploymentAuthorized!==false||
   report.realMoneyMovedCents!==0||report.actualPeopleContacted!==0||
   !Array.isArray(report.runs)||report.runs.length!==2||
   report.runs.some((x,i)=>x?.strategy!==strategies[i])||
   Buffer.byteLength(JSON.stringify(report),'utf8')>spec.bounds.maxReportBytes)
  return hold('Report provenance, authority, required strategies or byte bounds inconsistent');
 try{
  const gap=oldLibraryTypeGap();
  if(gap.original019WholeProgramsExecuted!==48||
     gap.matchingNewBracketWitnessOutputType!==0)
   throw new Error('Previous 019 library already met output requirements');
  const runs=report.runs.map(r=>verifyStrategy(spec,r));
  if(!runs.every(x=>x.heldout.allPassed))return {
    ...hold('Independent final-only bracket cases falsified the selected representation'),
    earlierLibraryGap:gap,independentlyVerifiedRuns:runs
  };
  return {
   status:'TESTED-NEW-TO-LIBRARY-MEMORY-ARCHITECTURE-PROPOSE-ONLY',
   earlierLibraryGap:gap,
   independentlyVerifiedRuns:runs,
   newCapabilityRelativeTo019Library:true,
   chosenMemoryRepresentations:runs.map(r=>r.chosenStages[0].choice),
   knownClassicalStackParserIsDirectBaseline:true,
   fundamentalAlgorithmicNovelty:false,
   plannerNotGrantedProductionAdmission:true,
   testedBehavior:'typed stack matching on bounded two-bracket-type input',
   cannotInferPracticalLandlordValue:true,
   addedEconomicAgreements:0,
   newCONCORDEconomicPaths:0,
   realMoneyMovedCents:0,realPeopleContacted:0,
   realServicesPerformed:0,realCreditorReleaseCents:0,
   actualAssetRightsVerified:false,
   productionAdmitted:false
  };
 }catch(e){return hold(e.message);}
}
