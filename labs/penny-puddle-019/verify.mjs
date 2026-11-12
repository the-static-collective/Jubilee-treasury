/**
 * CAPABILITY-019: genuine independently replayed gate-level synthesis proof.
 *
 * GRAFT submits inert JSON NAND circuit ASTs. Jubilee independently rebuilds
 * every counterexample-guided trial, checks EXACT search counts (not a
 * builder's self-reported speed claim), proves <=3 gates cannot implement
 * required behavior, and challenges a FROZEN macro on all 8 three-input
 * cases. A logic capability is NOT automatically an economic opportunity.
 */
import {makeGateChallenge,validChallenge,digest,validateCircuit}
 from './contract.mjs';
import {exactFirstPassing,firstLexicalPairs,firstJointDependencyPairs,
  minimalCircuitProof,exactTruthTable} from './independent.mjs';
import {firstFailedDevelopmentCase} from './development.mjs';
import {scoreFrozenTransfer} from './heldout.mjs';
const strategies=['motif-003-reachable-affordances','classical-exhaustive'];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=reason=>({status:'HOLD-INDEPENDENT-VERIFICATION-FAILED',
 reason,sourceAuthority:'PROPOSE_ONLY',actualFinancialValueCents:0,
 realMoneyMovedCents:0,realPeopleContacted:0,
 goldTitleVerified:false,productionAdmitted:false});
function replayRun(run,strategy){
 const expectedFirstPairs=strategy==='motif-003-reachable-affordances'?
  firstJointDependencyPairs():firstLexicalPairs();
 if(!run||run.strategy!==strategy||
   !same(run.firstGatePriority,expectedFirstPairs)||
   !Array.isArray(run.attempts)||run.attempts.length<1||
   run.attempts.length>4||
   !Number.isInteger(run.candidateEvaluations)||
   run.candidateEvaluations<1||
   !Number.isInteger(run.counterexampleRounds)||
   run.counterexampleRounds!==run.attempts.length-1)
  throw new Error('Missing or inauthentic search trace');
 const known=makeGateChallenge().publicExamples.map(x=>structuredClone(x));
 let actuallyChecked=0,finalCircuit=null;
 const priorErrors=[];
 for(let i=0;i<run.attempts.length;i++){
  const claimed=run.attempts[i];
  validateCircuit(claimed.circuit);
  const verified=exactFirstPassing(known,{firstPairs:expectedFirstPairs});
  actuallyChecked+=verified.checked;
  if(!verified.circuit||!same(verified.circuit,claimed.circuit)||
    verified.checked!==claimed.checkedInRound||
    verified.depth!==claimed.depth)
   throw new Error('Search trace does not match independent complete enumeration');
  const counterexample=firstFailedDevelopmentCase(verified.circuit);
  if(counterexample){
   if(i===run.attempts.length-1||
      claimed.developmentPass!==false||
      !same(claimed.counterexample,counterexample))
    throw new Error('Incorrect, missing or swallowed counterexample');
   known.push({inputs:counterexample.inputs,expected:counterexample.expected});
   priorErrors.push(counterexample.id);
  }else{
   if(i!==run.attempts.length-1||claimed.developmentPass!==true||
      Object.hasOwn(claimed,'counterexample'))
    throw new Error('Claimed valid method was not the actual frozen last program');
   finalCircuit=verified.circuit;
  }
 }
 if(!finalCircuit||run.candidateEvaluations!==actuallyChecked||
    run.counterexampleRounds!==priorErrors.length||
    !same(run.selectedCircuit,finalCircuit))
  throw new Error('Reported evaluations or final circuit did not replay');
 const heldout=scoreFrozenTransfer(finalCircuit);
 return {
  strategy,circuit:finalCircuit,
  gateCount:finalCircuit.gates.length,
  developerCounterexamples:priorErrors,
  candidateEvaluationsIndependentlyReproduced:actuallyChecked,
  exactTwoInputTable:exactTruthTable(finalCircuit),
  finalFrozenThreeInputTransfer:heldout,
  positiveResultAttributableToSourceNANDOnly:true
 };
}
export function verifyGateLaboratory(spec,report){
 try{validChallenge(spec);}
 catch(e){return fail(e.message);}
 if(!report||report.schema!=='graft.nand-bootstrap-lab/v1'||
   report.authority!=='PROPOSE_ONLY'||
   report.specDigestSha256!==digest(spec)||
   report.source!=='the-static-collective/GRAFT'||
   report.nativeSourceCommit!=='66d27cfbd077b2c91d0d86d66e320206d88d8f95'||
   report.nativeOriginalBlobSHA1!=='db25da0d50a9c8e2cd87aa576a22f969405737cf'||
   report.originalNativeMotif003ActuallyCalled!==true||
   report.nativeWorldGraphHandAuthored!==true||
   report.nativeFirstGatePreference!=='NAND(a,b)'||
   report.actualContacts!==0||
   report.realFinancialTransactionsCents!==0||
   report.productionApproved!==false||
   !Array.isArray(report.runs)||report.runs.length!==2||
   report.runs.some((r,i)=>r.strategy!==strategies[i])||
   Buffer.byteLength(JSON.stringify(report),'utf8')>spec.budgets.maxArtifactBytes)
  return fail('Wrong source, missing native provenance, report order or unsupported authority');
 try{
  const minimal=minimalCircuitProof(3);
  if(!minimal.gateBudgetBelowFourInsufficient||
    minimal.checkedCircuitCount!==201)
   throw new Error('Old NAND <=3 gate language unexpectedly satisfies target');
  const verified=report.runs.map((r,i)=>replayRun(r,strategies[i]));
  if(!verified.every(x=>x.gateCount===4&&
    x.finalFrozenThreeInputTransfer.allPassed&&
    x.finalFrozenThreeInputTransfer.finalThreeInputChecks===8&&
    x.finalFrozenThreeInputTransfer.transferChecksPassed===8))
   return {...fail('Final-only three-input generalization failed'),
    verifiedRuns:verified};
  const bothSame=same(verified[0].circuit,verified[1].circuit);
  return {
   status:'TESTED-NAND-ONLY-DERIVED-MACRO-PROPOSE-ONLY',
   finiteOldBudgetImpossibility:minimal,
   verifiedRuns:verified,
   bothPathsConvergeOnSameGateCircuit:bothSame,
   newPrimitiveNotPrelistedAsCompleteProgram:true,
   sourceGateCountPerTwoInputCall:4,
   composedThreeInputParityGateCount:8,
   threeInputTransferVerified:true,
   methodIsHistoricallyKnownXorCircuit:true,
   notNovelLogicOrNewMathematics:true,
   nativeOrderNotProofOfBetterGeneralIntelligence:true,
   outputIsADemonstratedLocalLogicMacro:true,
   newConditionalGoldOrRentAgreements:0,
   actualFinancialValueCents:0,
   realMoneyMovedCents:0,actualCreditorReleaseCents:0,
   realPeopleContacted:0,actualWorkDone:0,
   goldTitleVerified:false,productionAdmitted:false
  };
 }catch(e){return fail(e.message);}
}
