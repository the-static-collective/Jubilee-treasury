import test from 'node:test';
import assert from 'node:assert/strict';
import {
 makeUnwrittenSpec,allTypedPrograms,validateTypedProgram,
 validateStory,suiteFingerprint
} from '../contract.mjs';
import {assessProgram,independentRun,qualitySummary} from '../independent.mjs';
import {revealOneDevelopmentCounterexample} from '../development.mjs';
import {evaluateFrozenHeldout} from '../heldout.mjs';
import {verifyUnwrittenLaboratory} from '../evaluation.mjs';
import {createHash} from 'node:crypto';

const sha=x=>createHash('sha256').update(x).digest('hex');
const spec=()=>makeUnwrittenSpec();
const prog=escape=>({
 schema:'graft.typed-story-program/v1',
 stages:[
  {slot:'escape',choice:escape},
  {slot:'cards',choice:'labeled-sections'},
  {slot:'wrapper',choice:'document'},
  {slot:'print',choice:'print-css'},
  {slot:'indices',choice:'data-index'}
 ]
});
function witness(p,withFailures=false){
 const s=spec(),raw=prog('raw');
 const trace=withFailures?[
  {program:raw,publicPass:true,developmentPass:false,
   counterexampleName:'active-markup-and-ampersand'}
 ]:[];
 trace.push({program:p,publicPass:true,developmentPass:true});
 const hashes=s.publicCases.map(x=>sha(independentRun(p,x.story,s)));
 const run=(strategy)=>({
  strategy,selectedProgram:p,publicOutputHashes:hashes,
  programsEvaluated:withFailures?12:6,
  counterexampleRounds:withFailures?1:0,
  attempts:structuredClone(trace)
 });
 return {
  schema:'graft.unwritten-method-laboratory/v1',
  authority:'PROPOSE_ONLY',
  publicSpecFingerprintSha256:suiteFingerprint(s),
  sourceProject:'the-static-collective/GRAFT',
  generationTechnique:'finite-composition-from-primitives-not-a-prompted-arbitrary-code-author',
  runs:[run('motif-structural-priority'),run('classical-exhaustive')],
  realContacts:0,realMoneyMovedCents:0,
  productionDeploymentAuthorized:false
 };
}
test('source publishes primitive grammar and TWO benign cases, never final heldout cases',()=>{
 const s=spec();
 assert.equal(s.operators.length,5);
 assert.deepEqual(s.operators[0].options,['raw','angles','entities']);
 assert.equal(s.publicCases.length,2);
 assert.equal(allTypedPrograms(s).length,72);
 assert.ok(allTypedPrograms(s).every(x=>validateTypedProgram(x,s)));
 assert.ok(!JSON.stringify(s).includes('unicode-and-right-to-left'));
 assert.equal(s.sourceFacts.realMoneyMovedCents,0);
});
test('a generated five-stage program can pass independent public, development and final-only tests',()=>{
 const p=prog('entities');
 assert.equal(qualitySummary(p,spec().publicCases).passing,true);
 assert.equal(revealOneDevelopmentCounterexample(p),null);
 const r=evaluateFrozenHeldout(p,spec());
 assert.equal(r.heldoutCasesPassed,4);
 assert.equal(r.allPassed,true);
 assert.equal(r.heldoutDataProvidedToBuilder,false);
 assert.equal(r.publiclyReadableFixtureSource,true);
});
test('naive raw markup passes benign public input but fails discovered counterexample',()=>{
 const p=prog('raw');
 assert.equal(qualitySummary(p,spec().publicCases).passing,true);
 const counterexample=revealOneDevelopmentCounterexample(p);
 assert.equal(counterexample.kind,'SYNTHETIC_DEVELOPMENT_COUNTEREXAMPLE');
 assert.ok(counterexample.failingChecks.includes('noActiveTags'));
 assert.equal(evaluateFrozenHeldout(p,spec()).allPassed,false);
 const half=prog('angles');
 assert.equal(qualitySummary(half,spec().publicCases).passing,true);
 assert.ok(revealOneDevelopmentCounterexample(half).failingChecks.includes('textPreserved'));
});
test('program AST is a closed typed grammar, never arbitrary JS, code, eval or unauthorized functions',()=>{
 const s=spec(),p=prog('entities');
 assert.throws(()=>validateTypedProgram({...p,javascript:'process.exit(1)'},s),/invalid or extra/);
 assert.throws(()=>validateTypedProgram({...p,stages:[
  ...p.stages.slice(0,4),{slot:'indices',choice:'eval-user-html'}
 ]},s),/typed building blocks/);
 assert.throws(()=>validateStory({title:'title',subtitle:'subtitle',
  captions:['x'],privatePhone:'secret'},s),/unexpected story schema/);
});
test('full independently checked GRAFT-style report yields one POSSIBLE route, never a contract',()=>{
 const s=spec(),r=verifyUnwrittenLaboratory(s,witness(prog('entities'),true));
 assert.equal(r.status,'TESTED-SYNTHESIZED-METHOD-PROPOSE-ONLY');
 assert.equal(r.allHeldoutPassed,true);
 assert.equal(r.verified.length,2);
 assert.equal(r.verified[0].priorFailedProposals,1);
 assert.equal(r.conditionalOptionsBefore,0);
 assert.equal(r.conditionalOptionsAfter,1);
 assert.equal(r.actualMoneyMovedCents,0);
 assert.equal(r.actualRentLegallyDischargedCents,0);
 assert.equal(r.actualPropertyRightsCreated,false);
 assert.equal(r.sourceMethodAutomaticallyAdmitted,false);
});
test('tampered outputs, source changes or false real-money authority are rejected',()=>{
 const s=spec(),r=witness(prog('entities'));
 r.runs[0].publicOutputHashes[0]='0'.repeat(64);
 assert.equal(verifyUnwrittenLaboratory(s,r).status,'HOLD-INVALID-METHOD-EVIDENCE');
 const q=witness(prog('entities'));
 q.productionDeploymentAuthorized=true;
 assert.equal(verifyUnwrittenLaboratory(s,q).status,'HOLD-INVALID-METHOD-EVIDENCE');
 const t=spec();t.sourceFacts.realWorkCompleted=true;
 assert.equal(verifyUnwrittenLaboratory(t,witness(prog('entities'))).status,
  'HOLD-INVALID-METHOD-EVIDENCE');
});
test('a clever reported search cannot claim success on heldout without independently passing',()=>{
 const s=spec(),r=witness(prog('entities'));
 r.runs[1].selectedProgram=prog('raw');
 r.runs[1].attempts=[{program:prog('raw'),publicPass:true,developmentPass:true}];
 assert.equal(verifyUnwrittenLaboratory(s,r).status,'HOLD-INVALID-METHOD-EVIDENCE');
 const no=witness(prog('entities'));
 no.runs[0].attempts=[{program:prog('raw'),publicPass:true,developmentPass:true}];
 assert.equal(verifyUnwrittenLaboratory(s,no).status,'HOLD-INVALID-METHOD-EVIDENCE');
});
