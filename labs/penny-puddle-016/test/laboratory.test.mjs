import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {
 makeCapabilityExperiment,materializeCases,requestFingerprint,
 verifyCapabilityLaboratory,recomposeAfterLaboratory
} from '../laboratory.mjs';
import {makeBlockedNeedFixture} from '../../penny-puddle-015/capability.mjs';
import {synthesizeAgreements} from '../../penny-puddle-014/composer.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
const escape=x=>x.replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const render=(r,quality=false)=>{
 const s=r.syntheticStory;
 return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
  '<title>'+escape(s.title)+'</title>'+
  '<style>@media print{body{color:black}}</style></head><body>'+
  (quality?'<main>':'')+'<h1>'+escape(s.title)+'</h1>'+
  '<p>'+escape(s.subtitle)+'</p>'+
  s.captions.map((c,i)=>quality?
    '<section class="card">CARD '+(i+1)+': '+escape(c)+'</section>':
    '<p>'+escape(c)+'</p>').join('')+
  (quality?'</main>':'')+'</body></html>';
};
function report(spec=makeCapabilityExperiment()){
 const cases=materializeCases(spec);
 const outputs=quality=>Object.fromEntries(Object.entries(cases).map(([name,r])=>{
  const html=render(r,quality);
  return [name,{html,replayHtml:html,sha256:sha(html),replaySha256:sha(html)}];
 }));
 const bad=outputs(false);
 bad['hostile-markup'].html+='<script>bad()</script>';
 bad['hostile-markup'].replayHtml=bad['hostile-markup'].html;
 bad['hostile-markup'].sha256=sha(bad['hostile-markup'].html);
 bad['hostile-markup'].replaySha256=sha(bad['hostile-markup'].html);
 const claims={realActionsAuthorized:false,moneyMovedCents:0,productionAdmitted:false};
 return {
  schema:'graft.capability-method-lab/v1',
  authority:'PROPOSE_ONLY',
  contractFingerprintSha256:requestFingerprint(spec),
  sourceMethodScope:'hand-authored-local-methods-not-new-mathematics',
  candidates:[
   {methodId:'unsafe-interpolation',outputs:bad,claims:{...claims}},
   {methodId:'escaped-compact',outputs:outputs(false),claims:{...claims}},
   {methodId:'accessible-print',outputs:outputs(true),claims:{...claims}}
  ],
  realHumanContactCount:0,actualFundsMovedCents:0,
  externalActionAuthorization:false,productionAdmitted:false
 };
}
test('original CONCORD 014 has no route without demonstrated missing technique',()=>{
 assert.equal(synthesizeAgreements(makeBlockedNeedFixture()).numberOfDistinctConditionalStructures,0);
 const spec=makeCapabilityExperiment();
 assert.equal(spec.methods.length,3);
 assert.equal(spec.authority,'PROPOSE_ONLY');
 assert.equal(spec.actualHumanData,false);
 assert.equal(spec.moneyMovedCents,0);
 assert.equal(Object.keys(materializeCases(spec)).length,3);
});
test('Jubilee recomputes tests and rejects the appealing but unsafe toy compiler',()=>{
 const spec=makeCapabilityExperiment();
 const x=verifyCapabilityLaboratory(spec,report(spec));
 assert.equal(x.status,'PROPOSE_TESTED_TECHNIQUE_ONLY');
 assert.equal(x.candidates.length,3);
 assert.equal(x.candidates[0].valid,false);
 assert.ok(x.candidates[0].issues.some(x=>x.includes('hostile-markup:offline')));
 assert.equal(x.acceptedCandidateCount,2);
 assert.equal(x.selectedMethodId,'accessible-print');
 assert.equal(x.candidates[2].qualityPoints,4);
 assert.equal(x.hashesAuthenticateAuthors,false);
});
test('resource budget can favor the smaller safe technique, not a fabricated energy metric',()=>{
 const spec=makeCapabilityExperiment(),p=report(spec);
 const compact=p.candidates[1].outputs.ordinary.html;
 const rich=p.candidates[2].outputs.ordinary.html;
 assert.ok(Buffer.byteLength(compact)<Buffer.byteLength(rich));
 const x=verifyCapabilityLaboratory(spec,p,{
  budgetBytes:Buffer.byteLength(compact),policy:'accessibility'});
 assert.equal(x.selectedMethodId,'escaped-compact');
 const tiny=verifyCapabilityLaboratory(spec,p,{budgetBytes:3});
 assert.equal(tiny.status,'HOLD-NO-METHOD-PASSED');
});
test('successful synthetic method proof adds exactly one QUESTION, not a completed exchange',()=>{
 const spec=makeCapabilityExperiment();
 const result=recomposeAfterLaboratory(spec,report(spec));
 assert.equal(result.priorConditionalRoutes,0);
 assert.equal(result.newConditionalRoutes,1);
 assert.equal(result.realDebtDischargedCents,0);
 assert.equal(result.actualLegalDebtDischargeCents,0);
 assert.equal(result.actualThirdPartyWorkCompleted,0);
 assert.equal(result.authorization,'PLANNING_ONLY_HOLD');
 assert.equal(result.admittedToProduction,false);
 assert.ok(result.remainingUnansweredPeople.includes('L-considers-storyboard'));
});
test('even a self-reported passing label cannot overrule missing bytes or tampered hash',()=>{
 const spec=makeCapabilityExperiment(),r=report(spec);
 r.candidates[2].outputs.ordinary.sha256='0'.repeat(64);
 const p=verifyCapabilityLaboratory(spec,r);
 assert.equal(p.candidates[2].valid,false);
 assert.equal(p.selectedMethodId,'escaped-compact');
 const q=report(spec);
 q.candidates[1].outputs.ordinary.html='<script>executed()</script>';
 q.candidates[2].outputs.ordinary.html='<script>executed()</script>';
 assert.equal(verifyCapabilityLaboratory(spec,q).selectedMethodId,null);
});
test('false claims of money, production admission or altered source contract cause HOLD',()=>{
 const spec=makeCapabilityExperiment(),r=report(spec);
 r.productionAdmitted=true;
 assert.equal(verifyCapabilityLaboratory(spec,r).status,'HOLD-invalid-capability-experiment');
 const s=makeCapabilityExperiment();s.baseRequest.realActionsAuthorized=true;
 assert.equal(verifyCapabilityLaboratory(s,report(spec)).selectedMethodId,undefined);
 const u=report(spec);
 u.candidates[2].claims.moneyMovedCents=30000;
 const judged=verifyCapabilityLaboratory(spec,u);
 assert.equal(judged.candidates[2].valid,false);
 assert.equal(judged.selectedMethodId,'escaped-compact');
});
test('method order, unsupported policy and mismatched fingerprints fail closed',()=>{
 const spec=makeCapabilityExperiment();
 const x=report(spec);
 x.candidates.reverse();
 assert.equal(verifyCapabilityLaboratory(spec,x).status,'HOLD-invalid-capability-experiment');
 assert.equal(verifyCapabilityLaboratory(spec,report(spec),{policy:'guess-personality'}).status,
  'HOLD-invalid-capability-experiment');
 const y=report(spec);y.contractFingerprintSha256='f'.repeat(64);
 assert.equal(verifyCapabilityLaboratory(spec,y).status,'HOLD-invalid-capability-experiment');
});
