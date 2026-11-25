import test from 'node:test';
import assert from 'node:assert/strict';
import {makeChallenge,listAllPrograms,validateProgram,validateChallenge,digest} from '../contract.mjs';
import {compileAndRun,checkRLEProgram,originalLibrariesGap,expectedProgram} from '../independent.mjs';
import {firstCounterexample} from '../development.mjs';
import {evaluateFrozen} from '../heldout.mjs';
import {verifyConstruction} from '../verify.mjs';

const spec=()=>makeChallenge();
const fix=(segment='utf16',identity='casefold',ifSame='append')=>({
 schema:'graft.typed-rle-program/v1',
 stages:[
  {slot:'segment',choice:segment},
  {slot:'identity',choice:identity},
  {slot:'ifSame',choice:ifSame},
  {slot:'ifDifferent',choice:'append'},
  {slot:'emit',choice:'ordered-pairs'}
 ]
});
function report(){
 const good=expectedProgram(),bad=fix();
 const publicOutputHashes=spec().publicCases.map(c=>
   digest(compileAndRun(good,c.input)));
 const native={
  strategy:'native-motif-structural-order',
  selectedProgram:good,
  attempts:[
   {program:bad,publicPass:true,developmentPass:false,
    counterexampleId:'adjacent-equal'},
   {program:good,publicPass:true,developmentPass:true}
  ],
  counterexampleRounds:1,searchEvaluations:22,
  publicOutputHashes
 };
 return {
  schema:'graft.constructive-primitive-lab/v1',
  authority:'PROPOSE_ONLY',
  specFingerprintSha256:digest(spec()),
  origin:'the-static-collective/GRAFT',
  actualNativeMotif003Used:true,
  nativeOriginalCommit:'66d27cfbd077b2c91d0d86d66e320206d88d8f95',
  methodWasWholeProgramLookup:false,
  runs:[native,{...structuredClone(native),
    strategy:'classical-exhaustive',searchEvaluations:44}],
  realPeopleContacted:0,realMoneyMovedCents:0,anyProductionDeployment:false
 };
}
test('source-owned five-stage typed grammar enumerates 48 programs; complete RLE method NOT given to builder',()=>{
 const s=spec(),all=listAllPrograms();
 assert.equal(all.length,48);
 assert.equal(new Set(all.map(x=>JSON.stringify(x))).size,48);
 assert.ok(all.every(validateProgram));
 assert.equal(s.publicCases.length,2);
 assert.equal(s.existingLibrary.knownFullSolutionProvided,false);
 assert.ok(!JSON.stringify(s).includes('run-length-encoded-sample'));
});
test('execute the actual earlier 72 formatter programs AND five 018 counting operators; no RLE typed outputs',()=>{
 const gap=originalLibrariesGap();
 assert.equal(gap.original017ProgramsExecuted,72);
 assert.equal(gap.original018OperatorsExecuted,5);
 assert.equal(gap.oldWholeProgramsProvidingRequiredTypedRLE,0);
 assert.equal(gap.missingFromOriginalCombinedFiniteCatalog,true);
 assert.equal(gap.doesNotProveComputationalImpossibility,true);
});
test('the earliest innocent examples allow wrong program, then development reveals specific reasons',()=>{
 const raw=fix(),same=fix('utf16','casefold','increment');
 const exact=fix('utf16','exact','increment');
 assert.ok(spec().publicCases.every(c=>checkRLEProgram(raw,c).passed));
 assert.equal(firstCounterexample(raw).id,'adjacent-equal');
 assert.equal(firstCounterexample(same).id,'case-must-remain-distinct');
 assert.equal(firstCounterexample(exact).id,'joined-emoji-are-one-grapheme');
 assert.equal(firstCounterexample(expectedProgram()),null);
});
test('new compound run primitive is actually lossless and maximal on eight independently authored cases',()=>{
 const result=evaluateFrozen(expectedProgram());
 assert.equal(result.allPassed,true);
 assert.equal(result.total,8);
 assert.equal(result.testsPassed,8);
 const c=compileAndRun(expectedProgram(),'👩‍💻👩‍💻a');
 assert.deepEqual(c,[['👩‍💻',2],['a',1]]);
 assert.equal(c.map(([x,n])=>x.repeat(n)).join(''),'👩‍💻👩‍💻a');
 const wrong=evaluateFrozen(fix('codepoint','exact','increment'));
 assert.equal(wrong.allPassed,false);
});
test('independent source-owned verifier returns conditional opportunity with no license or rent discharge',()=>{
 const verdict=verifyConstruction(spec(),report());
 assert.equal(verdict.status,'TESTED-COMPOSED-RLE-PRIMITIVE-PROPOSE-ONLY');
 assert.equal(verdict.verifiedResults.length,2);
 assert.equal(verdict.verifiedResults.every(x=>x.frozenHeldout.testsPassed===8),true);
 assert.equal(verdict.verifiedResults[0].numberOfPreviousFailedProposals,1);
 assert.equal(verdict.newConditionalOptionsBefore,0);
 assert.equal(verdict.newConditionalOptionsAfter,1);
 assert.equal(verdict.actualPropertyRightsCreated,false);
 assert.equal(verdict.realDebtDischargedCents,0);
 assert.equal(verdict.productionAdmitted,false);
 assert.equal(verdict.historicallyNovelAlgorithm,false);
});
test('the verifier rejects falsely claimed safe methods, fraudulent hashes, and real financial authority',()=>{
 const m=report();
 m.runs[0].publicOutputHashes[0]='f'.repeat(64);
 assert.equal(verifyConstruction(spec(),m).status,'HOLD-invalid-primitive-proof');
 const d=report();
 d.runs[1].attempts[0].counterexampleId='invented-failure';
 assert.equal(verifyConstruction(spec(),d).status,'HOLD-invalid-primitive-proof');
 const x=report();x.realMoneyMovedCents=30000;
 assert.equal(verifyConstruction(spec(),x).status,'HOLD-invalid-primitive-proof');
 const y=spec();y.rights.actualWorkPerformed=true;
 assert.throws(()=>validateChallenge(y),/unrecognized/);
 assert.equal(verifyConstruction(y,report()).status,'HOLD-invalid-primitive-proof');
});
test('untrusted arbitrary method code or unapproved primitives cannot execute',()=>{
 const bad={...expectedProgram(),source:'eval("send money")'};
 assert.throws(()=>validateProgram(bad),/fixed typed/);
 const bad2=structuredClone(expectedProgram());
 bad2.stages[1].choice='force-consent';
 assert.throws(()=>compileAndRun(bad2,'a'),/unsupported primitive/);
 const bad3=report();bad3.runs[0].attempts[0].developmentPass=true;
 assert.equal(verifyConstruction(spec(),bad3).status,'HOLD-invalid-primitive-proof');
});
