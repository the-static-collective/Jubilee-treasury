import {prepare,CASE} from './exodus.mjs';
import {optimalQuestionPolicy,questionValue} from './vendor/question-value.mjs';
import {watchPosture} from './vendor/watch-policy.mjs';

const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
function requireFixture(mode){if(mode!=='SYNTHETIC_ONLY')throw Error('HOLD: synthetic-only review');}

/** Explicit equal-weight fictional scenarios, never probabilities about people.
 * Each question concerns a possible capability, not a personal preference.
 * A structurally present route is NOT a verified or authorized route.
 */
export function examineQuestions(snapshot,kinds,{mode,now=Date.now()}={}){
 requireFixture(mode);
 const base=prepare(snapshot,{mode,now});
 const missing=new Set(base.capabilityProposal.quests.map(q=>q.kind));
 if(!Array.isArray(kinds)||kinds.length<1||kinds.length>3||new Set(kinds).size!==kinds.length||kinds.some(k=>!missing.has(k)))throw Error('HOLD: choose one to three distinct missing capability categories');
 if(snapshot.cards.length+kinds.length>18)throw Error('HOLD: counterfactual card budget');
 const reserved=new Set(snapshot.cards.flatMap(c=>[c.id,c.sourceRef,c.consentRef]));
 const candidates=kinds.map(kind=>({id:'hyp-'+kind,actor:'operator',kind,purpose:'verification-preparation',state:'offered',sourceRef:'hyp-src-'+kind,consentRef:'hyp-consent-'+kind,expiresAt:new Date(now+60000).toISOString()}));
 if(candidates.some(c=>[c.id,c.sourceRef,c.consentRef].some(id=>reserved.has(id))))throw Error('HOLD: hypothetical identity collision');
 const questions=kinds.map(kind=>({id:'ask-'+kind,asker:'fictional-operator',prompt:'For review only: is a qualified, willing '+kind+' capability available through an approved channel?',answers:['available','unavailable'],costPoints:0.02}));
 const states=[];
 for(let mask=0;mask<2**kinds.length;mask++){
  const additions=candidates.filter((_,i)=>Boolean(mask&(1<<i)));
  const r=prepare({...snapshot,cards:[...snapshot.cards,...additions]},{mode,now});
  states.push({id:'fiction-'+mask,weight:1,answers:Object.fromEntries(questions.map((q,i)=>[q.id,mask&(1<<i)?'available':'unavailable'])),routes:r.capabilityProposal.paths.map(p=>p.id)});
 }
 const actions=['hold',...new Set(states.flatMap(w=>w.routes))];
 const worlds=states.map(w=>({id:w.id,weight:w.weight,answers:w.answers,outcomes:Object.fromEntries(actions.map(a=>[a,a==='hold'?0:w.routes.includes(a)?1:-1]))}));
 const policy=optimalQuestionPolicy(worlds,questions,actions,Math.min(2,questions.length));
 const ranking=questions.map(q=>questionValue(worlds,q,actions)).sort((a,b)=>b.netDecisionValuePoints-a.netDecisionValuePoints||a.id.localeCompare(b.id));
 return {schema:'jubilee.exodus.question-rehearsal/v1',caseKey:CASE,status:'HOLD',scenarioCount:worlds.length,baselinePaths:base.capabilityProposal.paths.length,maximumHypotheticalPaths:Math.max(...states.map(s=>s.routes.length)),ranking:ranking.map(r=>({id:r.id,modeledDecisionValue:r.netDecisionValuePoints})),recommendedQuestion:questions.find(q=>q.id===policy.firstQuestionId)?.prompt??null,assumptions:'Equal-weight invented worlds; present route=1, absent=-1, hold=0; question cost=.02. Not calibrated, not field evidence.',authority:'none',contactAllowed:false,publicationAllowed:false,executionAllowed:false,actualQuestionsSent:0};
}
export const READINESS_CHECKS=Object.freeze(['local_owner_authorized','independent_reviewer_confirmed','source_document_integrity','operator_scope_and_revocation','nonmember_access_refused','anonymous_signal_contact_refused','private_data_not_public','helper_report_not_recipient_confirmation','separate_action_approval']);

/** Oversight data is aggregate synthetic counts, not access keys or allegations. */
export function oversightRehearsal(counts,checks,{mode}={}){
 requireFixture(mode);
 if(!exact(counts,['auditOk','signals','attestations','twoKeySignals'])||!exact(checks,READINESS_CHECKS))throw Error('HOLD: exact synthetic checklist required');
 if(Object.values(checks).some(v=>!['observed','failed','not-run'].includes(v)))throw Error('HOLD: invalid observation state');
 const posture=watchPosture(counts);
 const failed=READINESS_CHECKS.filter(k=>checks[k]==='failed'),missing=READINESS_CHECKS.filter(k=>checks[k]==='not-run');
 return {schema:'jubilee.exodus.oversight-rehearsal/v1',status:'HOLD',standing:!counts.auditOk||failed.length?'BLOCKED':missing.length?'INCOMPLETE':'SYNTHETIC_READY_FOR_INDEPENDENT_REVIEW',posture,failed,missing,independentFieldProof:false,authority:'none',contactAllowed:false,publicationAllowed:false,executionAllowed:false};
}
