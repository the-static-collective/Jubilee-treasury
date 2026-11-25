import test from 'node:test';
import assert from 'node:assert/strict';
import {challenge,verifyChallenge,assertProgram,allPrograms,digest} from '../contract.mjs';
import {interpret,assess,classicalStackReference,
 oldLibraryTypeGap,completeReferenceProgram} from '../independent.mjs';
import {revealFirstCounterexample} from '../development.mjs';
import {examineAfterFreeze} from '../heldout.mjs';
import {verifyArchitecture} from '../verify.mjs';

const spec=()=>challenge();
const candidate=(memory='last-register',match='any-closer',
 end='allow-unclosed',invalid='ignore',emit='matched-indices')=>({
 schema:'graft.typed-bracket-program/v1',
 stages:[
  {slot:'memory',choice:memory},{slot:'match',choice:match},
  {slot:'end',choice:end},{slot:'invalid',choice:invalid},
  {slot:'emit',choice:emit}
 ]
});
function witness(){
 const right=completeReferenceProgram(),wrong=candidate();
 const run=strategy=>({
  strategy,
  selectedProgram:right,
  attempts:[
   {program:wrong,publicPass:true,developmentPass:false,
    counterexampleName:'nested-different-types'},
   {program:right,publicPass:true,developmentPass:true}
  ],
  totalCandidateEvaluations:48,counterexampleRounds:1,
  publicOutputDigests:spec().publicCases.map(c=>digest(interpret(right,c.input)))
 });
 return {schema:'graft.structural-memory-laboratory/v1',
  authority:'PROPOSE_ONLY',source:'the-static-collective/GRAFT',
  specDigestSha256:digest(spec()),
  originalMotifCommit:'66d27cfbd077b2c91d0d86d66e320206d88d8f95',
  originalMotifActuallyExecuted:true,nativeAffordanceGraphHandWritten:true,
  outsideDeploymentAuthorized:false,realMoneyMovedCents:0,actualPeopleContacted:0,
  runs:[run('native-motif-structural-priority'),run('classical-exhaustive')]};
}
test('source-owned public grammar comprises exactly 48 complete method configurations, no correct whole solution',()=>{
 const s=spec(),all=allPrograms();
 assert.equal(all.length,48);
 assert.equal(new Set(all.map(x=>JSON.stringify(x))).size,48);
 assert.equal(all.every(x=>assertProgram(x)),true);
 assert.equal(s.publicCases.length,3);
 assert.equal(s.existingLibrary.correctArchitectureProvidedAsWholeProgram,false);
 assert.ok(!JSON.stringify(s).includes('nested-different-types'));
});
test('execute actual original 019 48 programs, none returns nested-bracket witness object',()=>{
 const proof=oldLibraryTypeGap();
 assert.equal(proof.original019WholeProgramsExecuted,48);
 assert.equal(proof.matchingNewBracketWitnessOutputType,0);
 assert.equal(proof.finiteLocalCatalogDoesNotContainParser,true);
 assert.equal(proof.strongerConventionalClassicalStackParserExists,true);
});
test('last-only and two counters fail a nesting/crossing problem they cannot faithfully represent',()=>{
 const last=candidate(),typeCounts=candidate('per-type-counters','correct-type',
  'require-empty','sticky-reject');
 assert.equal(spec().publicCases.every(c=>assess(last,c).passed),true);
 assert.equal(revealFirstCounterexample(last).name,'nested-different-types');
 assert.equal(revealFirstCounterexample(typeCounts).name,'cross-nesting-is-invalid');
 assert.deepEqual(classicalStackReference('([)]'),{valid:false,pairs:[]});
 assert.deepEqual(classicalStackReference('([])'),{valid:true,
  pairs:[[0,3,'()'],[1,2,'[]']]});
});
test('the correct composed LIFO architecture passes ten independently authored heldout examples',()=>{
 const valid=completeReferenceProgram(),check=examineAfterFreeze(valid);
 assert.equal(revealFirstCounterexample(valid),null);
 assert.equal(check.total,10);
 assert.equal(check.passed,10);
 assert.equal(check.allPassed,true);
 assert.deepEqual(interpret(valid,'[()()]'),{valid:true,
  pairs:[[0,5,'[]'],[1,2,'()'],[3,4,'()']]});
 assert.deepEqual(interpret(valid,'[(])'),{valid:false,pairs:[]});
});
test('source-owned verifier accepts passing local technique, but creates ZERO imaginary financial arrangements',()=>{
 const result=verifyArchitecture(spec(),witness());
 assert.equal(result.status,'TESTED-NEW-TO-LIBRARY-MEMORY-ARCHITECTURE-PROPOSE-ONLY');
 assert.equal(result.independentlyVerifiedRuns.length,2);
 assert.equal(result.independentlyVerifiedRuns.every(x=>x.heldout.passed===10),true);
 assert.deepEqual(result.chosenMemoryRepresentations,['lifo-list','lifo-list']);
 assert.equal(result.earlierLibraryGap.original019WholeProgramsExecuted,48);
 assert.equal(result.newCONCORDEconomicPaths,0);
 assert.equal(result.addedEconomicAgreements,0);
 assert.equal(result.realCreditorReleaseCents,0);
 assert.equal(result.productionAdmitted,false);
 assert.equal(result.fundamentalAlgorithmicNovelty,false);
});
test('forged checksum, altered old failure, source contract or actual money causes rejection',()=>{
 const r=witness();r.runs[0].publicOutputDigests[0]='0'.repeat(64);
 assert.equal(verifyArchitecture(spec(),r).status,'HOLD-invalid-structure-proof');
 const s=witness();s.runs[1].attempts[0].counterexampleName='pretend-pass';
 assert.equal(verifyArchitecture(spec(),s).status,'HOLD-invalid-structure-proof');
 const t=spec();t.rights.realMoneyMovedCents=30000;
 assert.throws(()=>verifyChallenge(t),/unsupported/);
 assert.equal(verifyArchitecture(t,witness()).status,'HOLD-invalid-structure-proof');
 const m=witness();m.realMoneyMovedCents=30000;
 assert.equal(verifyArchitecture(spec(),m).status,'HOLD-invalid-structure-proof');
});
test('no arbitrary code or new memory primitive is executable through output JSON',()=>{
 const invalid={...completeReferenceProgram(),javascript:'eval(1)'};
 assert.throws(()=>assertProgram(invalid),/Typed bracket program shape/);
 const a=completeReferenceProgram();a.stages[0].choice='exfiltrate-contacts';
 assert.throws(()=>interpret(a,'()'),/unlisted memory/);
});
