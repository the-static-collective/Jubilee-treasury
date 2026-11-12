/**
 * Jubilee-016 — independently assess a family of alternative GRAFT methods.
 *
 * Actual execution takes place in source-pinned GRAFT CI. This receiving
 * evaluator recomputes safety checks from ALL provided bytes rather than
 * trusting a builder's self-reported passing label. Artifact hashes prove
 * integrity, NOT authorship, rights, consent, or real-world outcomes.
 */
import {createHash} from 'node:crypto';
import {makeGraftRequest,makeBlockedNeedFixture} from '../penny-puddle-015/capability.mjs';
import {synthesizeAgreements} from '../penny-puddle-014/composer.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const copy=x=>JSON.parse(JSON.stringify(x));
const methods=['unsafe-interpolation','escaped-compact','accessible-print'];
const cases=['ordinary','hostile-markup','multilingual'];
const cap={maxBytes:15000,maxSerializedReport:85000};
export function makeCapabilityExperiment(){
 const base=makeGraftRequest();
 return {
  schema:'jubilee.capability-method-lab/v1',
  authority:'PROPOSE_ONLY',
  source:'the-static-collective/Jubilee-treasury',
  receiver:'the-static-collective/GRAFT',
  baseRequest:base,
  methods:[...methods],
  caseStories:{
   ordinary:copy(base.syntheticStory),
   'hostile-markup':{
    title:'<script>alert("x")</script>',
    subtitle:'This is TEST DATA, never executable markup.',
    captions:[
      '<img src=x onerror="alert(1)"> & a second story',
      '<iframe src="https://example.invalid/"></iframe>',
      'A human may always decline.'
    ]
   },
   multilingual:{
    title:'A field notebook — 🍃',
    subtitle:'Arabic: مرحبا  Chinese: 你好',
    captions:['A safe Unicode title, punctuation “quotes” and ñ.',
      'A second readable card: Καλημέρα.',
      'Never assume a voluntary service has been performed.']
   }
  },
  hardGates:['all-case-byte-bounds','no-active-or-remote-markup',
   'escaped-adversarial-contents','exact-replay-determinism',
   'preserve-text-and-count','no-real-financial-authority'],
  qualityChecks:['print-css','document-language','semantic-card-wrappers','single-heading'],
  measuredBudget:'utf8-output-bytes-not-CPU-time-or-environmental-impact',
  testLimit:{...cap},
  actualHumanData:false,
  realRightsCreated:false,
  moneyMovedCents:0
 };
}
export const requestFingerprint=spec=>sha(JSON.stringify(spec));
function validSpec(spec){
 const expected=makeCapabilityExperiment();
 if(JSON.stringify(spec)!==JSON.stringify(expected))
   throw new Error('Unknown / edited experiment contract');
 return expected;
}
export function materializeCases(spec=makeCapabilityExperiment()){
 validSpec(spec);
 return Object.fromEntries(cases.map(c=>[
  c,{...copy(spec.baseRequest),syntheticStory:copy(spec.caseStories[c])}
 ]));
}
const unsafe=html=>/<(?:script|iframe|img|link|object|embed|form|base)\b|<[^>]*\bon\w+\s*=|<[^>]*(?:src|href)\s*=\s*["']?(?:https?:|javascript:)|url\s*\(|@import\b/i.test(html);
function checks(spec,entry){
 const observations={},problems=[];
 if(!entry||typeof entry!=='object'||Array.isArray(entry)){
  return {valid:false,issues:['No candidate evidence'],checks:observations};
 }
 const htmls=entry.outputs;
 if(!htmls||typeof htmls!=='object'||Array.isArray(htmls) ||
    Object.keys(htmls).sort().join(',')!==[...cases].sort().join(',')){
  return {valid:false,issues:['Wrong test-case set'],checks:observations};
 }
 const lengths=[],all=[];
 for(const name of cases){
  const row=htmls[name];
  if(!row||typeof row.html!=='string'||typeof row.replayHtml!=='string'||
     typeof row.sha256!=='string'||typeof row.replaySha256!=='string'){
    return {valid:false,issues:['Absent output bytes or replay evidence'],checks:observations};
  }
  const len=Buffer.byteLength(row.html,'utf8');
  lengths.push(len);
  const hashOk=sha(row.html)===row.sha256&&
    sha(row.replayHtml)===row.replaySha256;
  const deterministic=row.html===row.replayHtml;
  const bounded=len>0&&len<=spec.testLimit.maxBytes;
  const offline=!unsafe(row.html);
  const c=spec.caseStories[name];
  const expectedTexts=[c.title,c.subtitle,...c.captions];
  const literal=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;')
   .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const present=expectedTexts.every(s=>row.html.includes(literal(s)));
  const frame={hashOk,deterministic,bounded,offline,present};
  all.push(frame);
  for(const [check,pass] of Object.entries(frame))
    if(!pass)problems.push(name+':'+check);
 }
 const attack=htmls['hostile-markup'].html;
 const escaped=attack.includes('&lt;script&gt;')&&
   attack.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;') &&
   attack.includes('&lt;iframe src=&quot;https://example.invalid/&quot;&gt;');
 if(!escaped)problems.push('hostile-markup:escaping');
 const main=htmls.ordinary.html;
 const quality={
  'print-css':/@media\s+print/.test(main),
  'document-language':/<html[^>]*lang="en"/i.test(main),
  'semantic-card-wrappers':/<section\b/.test(main)&&/CARD 1/.test(main),
  'single-heading':(main.match(/<h1\b/g)||[]).length===1
 };
 return {
  valid:problems.length===0,
  issues:problems,
  checks:{'all-case-byte-bounds':all.every(x=>x.bounded),
   'no-active-or-remote-markup':all.every(x=>x.offline),
   'escaped-adversarial-contents':escaped,
   'exact-replay-determinism':all.every(x=>x.deterministic&&x.hashOk),
   'preserve-text-and-count':all.every(x=>x.present),
   'no-real-financial-authority':entry.claims?.realActionsAuthorized===false&&
     entry.claims?.moneyMovedCents===0&&entry.claims?.productionAdmitted===false},
  quality,qualityPoints:Object.values(quality).filter(Boolean).length,
  maxObservedUtf8Bytes:Math.max(...lengths),
  cleanUtf8Bytes:lengths[0],
  independentlyRecomputed:true,
  actualRemoteAction:false
 };
}
export function verifyCapabilityLaboratory(spec,report,{budgetBytes=15000,policy='accessibility'}={}){
 const reject=reason=>({status:'HOLD-invalid-capability-experiment',
  reason,admittedToProduction:false,realDebtDischargedCents:0,
  currentConditionalRoutes:0});
 try{validSpec(spec);}
 catch(e){return reject(e.message);}
 if(!Number.isSafeInteger(budgetBytes)||budgetBytes<1||budgetBytes>15000)
   return reject('Invalid byte budget');
 if(!['accessibility','smallest-safe'].includes(policy))
   return reject('Unrecognized local method-selection rule');
 if(!report||report.schema!=='graft.capability-method-lab/v1'||
    report.authority!=='PROPOSE_ONLY'||
    report.contractFingerprintSha256!==requestFingerprint(spec)||
    report.sourceMethodScope!=='hand-authored-local-methods-not-new-mathematics'||
    report.realHumanContactCount!==0||report.actualFundsMovedCents!==0||
    report.externalActionAuthorization!==false||
    report.productionAdmitted!==false||
    !Array.isArray(report.candidates)||report.candidates.length!==methods.length ||
    report.candidates.some((x,i)=>x?.methodId!==methods[i])||
    Buffer.byteLength(JSON.stringify(report),'utf8')>cap.maxSerializedReport)
   return reject('Mismatched source, candidate list or external authority');
 const results=report.candidates.map(x=>{
  const e=checks(spec,x);
  if(e.checks['no-real-financial-authority']===false)
    e.issues.push('candidate-claims-real-financial-authority');
  e.valid=e.valid&&e.checks['no-real-financial-authority']===true;
  return {id:x.methodId,...e,eligibleUnderBudget:e.valid&&
    e.cleanUtf8Bytes<=budgetBytes};
 });
 const valid=results.filter(x=>x.eligibleUnderBudget);
 valid.sort((a,b)=>policy==='accessibility'?
  b.qualityPoints-a.qualityPoints||a.cleanUtf8Bytes-b.cleanUtf8Bytes:
  a.cleanUtf8Bytes-b.cleanUtf8Bytes||b.qualityPoints-a.qualityPoints);
 const selected=valid[0]??null;
 return {
  status:selected?'PROPOSE_TESTED_TECHNIQUE_ONLY':'HOLD-NO-METHOD-PASSED',
  policy,budgetBytes,
  candidates:results,
  selectedMethodId:selected?.id??null,
  selectedQualityPoints:selected?.qualityPoints??null,
  selectedCleanBytes:selected?.cleanUtf8Bytes??null,
  acceptedCandidateCount:results.filter(x=>x.valid).length,
  rejectedCandidateCount:results.filter(x=>!x.valid).length,
  builderSaysSuccessIsNotAcceptedAsEvidence:true,
  evaluatedGraftOutputsNotReexecutedLocally:true,
  hashesAuthenticateAuthors:false,
  allHumanRightsUnverified:true,
  admittedToProduction:false,
  realDebtDischargedCents:0,
  realMoneyMovedCents:0
 };
}
export function recomposeAfterLaboratory(spec,report,options={}){
 const evaluation=verifyCapabilityLaboratory(spec,report,options);
 const before=makeBlockedNeedFixture();
 if(!evaluation.selectedMethodId)return {
  ...evaluation,
  priorConditionalRoutes:synthesizeAgreements(before).numberOfDistinctConditionalStructures,
  newConditionalRoutes:0,
  addedTechniques:0
 };
 before.offers.push({
  id:'GRAFT-016-tested-'+evaluation.selectedMethodId,
  actor:'H',
  requires:[spec.baseRequest.inputToken],
  produces:spec.baseRequest.outputToken,
  question:'Would an independent curator consider operating this locally tested technique with the owner\'s permission?',
  status:'unknown',priorYesBps:5500,
  declaredByActorInFixture:true,
  purpose:before.purpose,expiresDay:45,
  risks:['test-only-no-human-work','no-real-image-rights',
   'landlord-not-consenting','receipt-hash-not-source-signature'],
  exclusiveClaims:[],directQuestionBurden:.1
 });
 const after=synthesizeAgreements(before);
 return {
  ...evaluation,priorConditionalRoutes:0,
  newConditionalRoutes:after.numberOfDistinctConditionalStructures,
  offeredOperatorIds:after.plans.map(p=>p.generatedOperatorIds),
  remainingUnansweredPeople:after.plans.flatMap(p=>p.unknownFirstPersonQuestions),
  authorization:'PLANNING_ONLY_HOLD',
  actualThirdPartyWorkCompleted:0,
  actualLegalDebtDischargeCents:0,
  realMoneyMovedCents:0
 };
}
