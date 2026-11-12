import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {makePrimitiveChallenge,fingerprint,
  validatePrimitiveChallenge,baseMethod} from '../contract.mjs';
import {legacyExpressivityProof,assessPrimitive,
 independentCountAndRender,makeDescriptor,validMethod} from '../independent.mjs';
import {firstDeveloperCounterexample} from '../development.mjs';
import {assessFrozenHeldout} from '../heldout.mjs';
import {verifyPrimitiveLaboratory} from '../verify.mjs';

const hash=x=>createHash('sha256').update(x).digest('hex');
const spec=()=>makePrimitiveChallenge();
const desc=mode=>makeDescriptor(mode);
function run(strategy,sequence,evalCount){
 const selected=desc('intl-graphemes');
 const attempts=sequence.map(mode=>{
  const method=desc(mode),feedback=firstDeveloperCounterexample(method);
  return {method,publicPass:true,
   developmentPass:feedback===null,
   ...(feedback?{counterexampleId:feedback.id}:{})};
 });
 return {
  strategy,attempts,selectedMethod:selected,
  counterexampleRounds:attempts.length-1,searchEvaluations:evalCount,
  publicOutputHashes:spec().publicExamples.map(c=>
   hash(independentCountAndRender(selected,c.story)))
 };
}
function witness(){
 return {
  schema:'graft.missing-primitive-laboratory/v1',
  authority:'PROPOSE_ONLY',
  specDigestSha256:fingerprint(spec()),
  source:'the-static-collective/GRAFT',
  nativeMotifOriginalCommit:'66d27cfbd077b2c91d0d86d66e320206d88d8f95',
  nativeSourceVerified:true,
  runs:[
   run('motif-affordance-priority',['intl-graphemes'],1),
   run('classical-exhaustive',['constant-one','utf16-units','intl-graphemes'],13)
  ],
  realPeopleContacted:0,realMoneyMovedCents:0,
  authorizedProductionDeployment:false
 };
}
test('old EXACT 017 grammar has 72 executable programs; NONE can generate computed per-card count',()=>{
 const p=legacyExpressivityProof();
 assert.equal(p.combinationsActuallyExecuted,72);
 assert.equal(p.oldProgramsSatisfyingRequestedFeature,0);
 assert.equal(p.absentWithinFiniteLanguage,true);
 assert.equal(p.missingNotImpossibleInGeneralComputing,true);
 assert.equal(spec().publicExamples.length,2);
 assert.equal(spec().privacy.realMoneyMovedCents,0);
});
test('constant-one passes innocent public data but fails a second-length counterexample',()=>{
 const p=desc('constant-one');
 assert.ok(spec().publicExamples.every(c=>assessPrimitive(p,c).pass));
 const counter=firstDeveloperCounterexample(p);
 assert.equal(counter.id,'two-visible-letters');
 assert.deepEqual(counter.observedCounts,[1]);
 assert.deepEqual(counter.expectedCounts,[2]);
 assert.equal(counter.offeredAfterProposal,true);
});
test('UTF16 and codepoint counting fail combining accents; grapheme counting survives all development cases',()=>{
 assert.equal(firstDeveloperCounterexample(desc('utf16-units')).id,'combining-accent');
 assert.equal(firstDeveloperCounterexample(desc('unicode-codepoints')).id,'combining-accent');
 assert.equal(firstDeveloperCounterexample(desc('whitespace-tokens')).id,'two-visible-letters');
 assert.equal(firstDeveloperCounterexample(desc('intl-graphemes')),null);
});
test('final-only Unicode examples distinguish code units, codepoints and user-perceived graphemes',()=>{
 const final=assessFrozenHeldout(desc('intl-graphemes'));
 assert.equal(final.allPassed,true);
 assert.equal(final.heldoutCasesTotal,5);
 assert.equal(final.heldoutCasesPassed,5);
 assert.deepEqual(final.cases.find(x=>x.id==='family-zwj').computedCounts,[1]);
 assert.deepEqual(final.cases.find(x=>x.id==='regional-flag').computedCounts,[1,1]);
 assert.deepEqual(final.cases.find(x=>x.id==='five-card-boundary').computedCounts,[1,1,1,3,1]);
 assert.equal(assessFrozenHeldout(desc('unicode-codepoints')).allPassed,false);
 assert.equal(assessFrozenHeldout(desc('constant-one')).allPassed,false);
});
test('generated primitive is an ALLOWED derived attribute, not arbitrary code or financial authority',()=>{
 assert.throws(()=>validMethod({...desc('intl-graphemes'),script:'eval("1")'}),/allowlisted/);
 assert.throws(()=>validMethod({...desc('intl-graphemes'),mode:'send-bank-transfer'}),/allowlisted/);
 const result=independentCountAndRender(desc('intl-graphemes'),
  {title:'Invented',subtitle:'Invented',captions:['👩‍💻','a\u0301b']});
 assert.ok(result.includes('data-index="1" data-graphemes="1"'));
 assert.ok(result.includes('data-index="2" data-graphemes="2"'));
 assert.doesNotMatch(result,/<script\b|<iframe\b|<img\b/);
 assert.equal(baseMethod().stages.length,5);
});
test('verified two-program record preserves failed attempts and returns ONE CONDITIONAL route',()=>{
 const r=verifyPrimitiveLaboratory(spec(),witness());
 assert.equal(r.status,'TESTED-NEW-TO-DSL-PRIMITIVE-PROPOSE-ONLY');
 assert.equal(r.gapProof.oldProgramsSatisfyingRequestedFeature,0);
 assert.equal(r.verifiedRuns.length,2);
 assert.deepEqual(r.verifiedRuns[1].counterexamplesRevealed,
  ['two-visible-letters','combining-accent']);
 assert.equal(r.verifiedRuns.every(x=>x.heldout.heldoutCasesPassed===5),true);
 assert.equal(r.initialConditionalOptions,0);
 assert.equal(r.newConditionalOptions,1);
 assert.equal(r.realMoneyMovedCents,0);
 assert.equal(r.actualCreditorReleaseCents,0);
 assert.equal(r.productionAdmitted,false);
 assert.equal(r.sourcePrimitiveIsExistingIntlAPI,true);
});
test('a forged digest, false money or altered source-owned specification fails closed',()=>{
 const a=witness();a.runs[0].publicOutputHashes[0]='0'.repeat(64);
 assert.equal(verifyPrimitiveLaboratory(spec(),a).status,'HOLD-unverified-primitive');
 const b=witness();b.realMoneyMovedCents=30000;
 assert.equal(verifyPrimitiveLaboratory(spec(),b).status,'HOLD-unverified-primitive');
 const c=spec();c.privacy.actualRealWorldWork=true;
 assert.throws(()=>validatePrimitiveChallenge(c),/differs/);
 assert.equal(verifyPrimitiveLaboratory(c,witness()).status,'HOLD-unverified-primitive');
 const d=witness();d.runs[1].attempts[0].counterexampleId='invented-yes';
 assert.equal(verifyPrimitiveLaboratory(spec(),d).status,'HOLD-unverified-primitive');
});
test('can't predeclare success without first passing the developmental feedback',()=>{
 const r=witness();
 r.runs[1].attempts[0].developmentPass=true;
 assert.equal(verifyPrimitiveLaboratory(spec(),r).status,'HOLD-unverified-primitive');
 const t=witness();t.runs[0].selectedMethod=desc('unicode-codepoints');
 assert.equal(verifyPrimitiveLaboratory(spec(),t).status,'HOLD-unverified-primitive');
 const u=witness();u.runs[1].searchEvaluations=1000;
 assert.equal(verifyPrimitiveLaboratory(spec(),u).status,'HOLD-unverified-primitive');
});
