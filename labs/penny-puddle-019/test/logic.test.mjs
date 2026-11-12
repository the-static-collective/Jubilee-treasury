import test from 'node:test';
import assert from 'node:assert/strict';
import {makeGateChallenge,validateCircuit} from '../contract.mjs';
import {exactFirstPassing,firstJointDependencyPairs,firstLexicalPairs,
 minimalCircuitProof,evaluateCircuit,applyTwiceForThreeInputs}
 from '../independent.mjs';
import {firstFailedDevelopmentCase} from '../development.mjs';
import {scoreFrozenTransfer} from '../heldout.mjs';
import {verifyGateLaboratory} from '../verify.mjs';
import {digest} from '../contract.mjs';

function trace(strategy,firstPairs){
 const spec=makeGateChallenge(),known=structuredClone(spec.publicExamples);
 const attempts=[];let count=0;
 for(let n=0;n<4;n++){
  const found=exactFirstPassing(known,{firstPairs});
  assert.ok(found.circuit,'Expected source-derived bounded program');
  const counterexample=firstFailedDevelopmentCase(found.circuit);
  attempts.push({
   circuit:found.circuit,
   depth:found.depth,
   checkedInRound:found.checked,
   developmentPass:counterexample===null,
   ...(counterexample?{counterexample}:{})
  });
  count+=found.checked;
  if(!counterexample)break;
  known.push({inputs:counterexample.inputs,expected:counterexample.expected});
 }
 return {strategy,firstGatePriority:firstPairs,attempts,
  selectedCircuit:attempts.at(-1).circuit,
  counterexampleRounds:attempts.length-1,
  candidateEvaluations:count};
}
function report(){
 const spec=makeGateChallenge();
 return {
  schema:'graft.nand-bootstrap-lab/v1',
  authority:'PROPOSE_ONLY',
  source:'the-static-collective/GRAFT',
  specDigestSha256:digest(spec),
  nativeSourceCommit:'66d27cfbd077b2c91d0d86d66e320206d88d8f95',
  nativeOriginalBlobSHA1:'db25da0d50a9c8e2cd87aa576a22f969405737cf',
  originalNativeMotif003ActuallyCalled:true,
  nativeWorldGraphHandAuthored:true,
  nativeFirstGatePreference:'NAND(a,b)',
  runs:[
   trace('motif-003-reachable-affordances',firstJointDependencyPairs()),
   trace('classical-exhaustive',firstLexicalPairs())
  ],
  actualContacts:0,realFinancialTransactionsCents:0,productionApproved:false
 };
}
test('original primitive library contains NAND only, not a ready two-input disagreement detector',()=>{
 const spec=makeGateChallenge();
 assert.equal(spec.task.onlySourceGate,'NAND');
 assert.equal(spec.task.depthLimit,4);
 assert.deepEqual(spec.publicExamples.map(x=>x.inputs),[[0,0],[0,1]]);
 assert.equal(spec.authorship.productionAdmission,false);
 assert.equal(spec.task.composeDerivedPrimitiveAgainForThreeInputOddParity,true);
});
test('exhaustive old budget: all 201 NAND-only circuits with <=3 gates fail the required truth table',()=>{
 const p=minimalCircuitProof();
 assert.deepEqual(p.byDepth.map(x=>x.completeCircuitCount),[3,18,180]);
 assert.equal(p.checkedCircuitCount,201);
 assert.equal(p.matchesFound,0);
 assert.equal(p.gateBudgetBelowFourInsufficient,true);
 assert.equal(p.notAnImpossibilityClaimForAllCircuits,true);
});
test('CEGIS obtains two independently falsifying counterexamples then a 4 NAND gate circuit',()=>{
 const classical=trace('classical-exhaustive',firstLexicalPairs());
 assert.equal(classical.attempts.length,3);
 assert.equal(classical.candidateEvaluations,1571);
 assert.deepEqual(classical.attempts.map(x=>x.depth),[2,3,4]);
 assert.deepEqual(classical.attempts.slice(0,-1).map(x=>x.counterexample.id),
   ['previously-unseen-10','previously-unseen-11']);
 assert.deepEqual(classical.selectedCircuit.gates,
   [[0,1],[0,2],[1,2],[3,4]]);
 assert.equal(classical.attempts.at(-1).developmentPass,true);
});
test('native-inspired first-gate priority improves this narrow enumeration but same solution',()=>{
 const native=trace('motif-003-reachable-affordances',firstJointDependencyPairs());
 const plain=trace('classical-exhaustive',firstLexicalPairs());
 assert.equal(native.candidateEvaluations,731);
 assert.equal(plain.candidateEvaluations,1571);
 assert.deepEqual(native.selectedCircuit,plain.selectedCircuit);
 assert.deepEqual(native.attempts.map(x=>x.checkedInRound),[21,120,590]);
});
test('newly composed NAND-only macro transfers to eight unseen 3-bit parity inputs',()=>{
 const original=trace('classical-exhaustive',firstLexicalPairs()).selectedCircuit;
 const verified=scoreFrozenTransfer(original);
 assert.equal(verified.finalThreeInputChecks,8);
 assert.equal(verified.transferChecksPassed,8);
 assert.equal(verified.twoInputChecksPassed,4);
 assert.equal(verified.commutativeUnderInputSwap,true);
 assert.equal(verified.allPassed,true);
 assert.equal(applyTwiceForThreeInputs(original,[1,1,1]),1);
 assert.equal(applyTwiceForThreeInputs(original,[1,1,0]),0);
 assert.equal(verified.threeInputExamplesProvidedDuringSynthesis,false);
});
test('independent reported-success verifier reconstructs exact trials and does not invent rent relief',()=>{
 const answer=verifyGateLaboratory(makeGateChallenge(),report());
 assert.equal(answer.status,'TESTED-NAND-ONLY-DERIVED-MACRO-PROPOSE-ONLY');
 assert.equal(answer.finiteOldBudgetImpossibility.checkedCircuitCount,201);
 assert.equal(answer.bothPathsConvergeOnSameGateCircuit,true);
 assert.equal(answer.verifiedRuns[0].candidateEvaluationsIndependentlyReproduced,731);
 assert.equal(answer.verifiedRuns[1].candidateEvaluationsIndependentlyReproduced,1571);
 assert.equal(answer.composedThreeInputParityGateCount,8);
 assert.equal(answer.threeInputTransferVerified,true);
 assert.equal(answer.newConditionalGoldOrRentAgreements,0);
 assert.equal(answer.realMoneyMovedCents,0);
 assert.equal(answer.actualCreditorReleaseCents,0);
 assert.equal(answer.methodIsHistoricallyKnownXorCircuit,true);
 assert.equal(answer.productionAdmitted,false);
});
test('fake counters, altered candidate, forged native source and claimed payments fail closed',()=>{
 const spec=makeGateChallenge(),t=report();
 t.runs[0].candidateEvaluations=1;
 assert.equal(verifyGateLaboratory(spec,t).status,'HOLD-INDEPENDENT-VERIFICATION-FAILED');
 const x=report();x.runs[1].attempts[1].checkedInRound=12;
 assert.equal(verifyGateLaboratory(spec,x).status,'HOLD-INDEPENDENT-VERIFICATION-FAILED');
 const y=report();y.nativeSourceCommit='fake';
 assert.equal(verifyGateLaboratory(spec,y).status,'HOLD-INDEPENDENT-VERIFICATION-FAILED');
 const z=report();z.realFinancialTransactionsCents=30000;
 assert.equal(verifyGateLaboratory(spec,z).status,'HOLD-INDEPENDENT-VERIFICATION-FAILED');
});
test('reject arbitrary code, forward wire references and extra economic actions in a circuit',()=>{
 const valid=trace('classical-exhaustive',firstLexicalPairs()).selectedCircuit;
 assert.equal(evaluateCircuit(valid,[0,1]),1);
 assert.throws(()=>validateCircuit({...valid,code:'require("fs")'}),/bounded NAND-only AST/);
 assert.throws(()=>validateCircuit({...valid,gates:[[0,2]]}),/canonical pair/);
 assert.throws(()=>validateCircuit({...valid,gates:[[1,0]]}),/canonical pair/);
 assert.throws(()=>validateCircuit({...valid,gates:[[0,1],[0,2],[1,2],[3,4],[4,5]]}),/bounded NAND-only AST/);
 const bad=report();
 bad.runs[0].selectedCircuit.gates=[[0,0]];
 assert.equal(verifyGateLaboratory(makeGateChallenge(),bad).status,
   'HOLD-INDEPENDENT-VERIFICATION-FAILED');
});
