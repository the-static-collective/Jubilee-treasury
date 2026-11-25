import {synthesizeAgreements} from './vendor/composer.mjs';
import {evaluatePlenty} from './vendor/plenty/index.ts';
import {createHash} from 'node:crypto';

const GATES={
 deadline_confirmed:'What written deadline and forfeiture terms apply?',
 beneficiary_authority:'Who is authorized to act for the congregation?',
 seller_title:'Can qualified local counsel verify seller title and authority?',
 closing_terms:'Can local counsel identify protected closing terms?',
 lawful_transfer:'Which approved institution and transfer channel could administer assistance?',
 extension_agreed:'Would the seller agree in writing to preserve prior payments and extend time?',
 local_bridge_agreed:'Would an authorized local institution consider a funded bridge?',
 guarantee_agreed:'Would an authorized guarantor consider a capped written guarantee?',
 creditor_consent:'Would the seller accept the proposed alternative?',
 independent_confirmation:'Can independent review confirm the proposed arrangement?',
 case_verified:'Can independent review verify the reported case?',
 church_held_capacity:'Can authorized churches document sufficient same-currency held funds?'
};
const GOAL='property-preservation-option';
// Authored grammar rules are NOT real participants or commitments. All rules
// remain unknown, even if every evidence gate is satisfied.
const RULES=[
 ['documented-basis',['case_verified','deadline_confirmed','beneficiary_authority','seller_title','closing_terms'],'basis'],
 ['church-funding',['church_held_capacity','lawful_transfer'],'funded-option'],
 ['local-bridge',['local_bridge_agreed','lawful_transfer'],'funded-option'],
 ['protected-payment',['basis','funded-option','independent_confirmation'],GOAL],
 ['guarantee-option',['guarantee_agreed','creditor_consent'],'credit-option'],
 ['protected-alternative',['basis','credit-option','independent_confirmation'],GOAL],
 ['protected-extension',['deadline_confirmed','beneficiary_authority','extension_agreed','independent_confirmation'],GOAL]
];
const keys=Object.keys(GATES);
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function validate(s,now){
 if(!s||Object.keys(s).sort().join('|')!=='asOf|caseKey|facts|schema'||s.schema!=='jubilee.concord.snapshot/v1'||s.caseKey!=='JUB-HON-001'||typeof s.asOf!=='string'||!Number.isFinite(Date.parse(s.asOf))||!Number.isFinite(now)||Date.parse(s.asOf)>now+5000||now-Date.parse(s.asOf)>900000)throw Error('HOLD: invalid or stale snapshot');
 if(!s.facts||Array.isArray(s.facts)||Object.keys(s.facts).sort().join('|')!==[...keys].sort().join('|')||keys.some(k=>!['unknown','satisfied','blocked'].includes(s.facts[k])))throw Error('HOLD: unknown or missing fact vocabulary');
}
const card=(id,requires,produces,status,question)=>({id,actor:'grammar',requires,produces,status,question,declaredByActorInFixture:true,purpose:'synthetic-grammar-only',expiresDay:1,priorYesBps:5000,directQuestionBurden:0,risks:[],exclusiveClaims:[]});
function checkProof(ids,cards,facts){
 if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.length>19)throw Error('HOLD: malformed proof');
 const byId=new Map(cards.map(c=>[c.id,c])),selected=ids.map(id=>byId.get(id));
 if(selected.some(c=>!c||c.status==='no'))throw Error('HOLD: refused or unknown operator');
 const available=new Set(),used=new Set();
 for(let i=0;i<selected.length;i++){let changed=false;for(const c of selected){if(!used.has(c.id)&&c.requires.every(t=>available.has(t))){available.add(c.produces);used.add(c.id);changed=true;}}if(!changed)break;}
 if(!available.has(GOAL)||used.size!==selected.length)throw Error('HOLD: invalid dependency proof');
 const needed=new Set([GOAL]);for(let i=0;i<selected.length;i++)for(const c of selected)if(needed.has(c.produces))c.requires.forEach(t=>needed.add(t));
 if(selected.some(c=>!needed.has(c.produces)))throw Error('HOLD: irrelevant operator');
 const gates=selected.filter(c=>c.id.startsWith('gate:')).map(c=>c.produces);
 if(gates.some(g=>facts[g]==='blocked'))throw Error('HOLD: blocked gate');
 return {selected,gates,missing:gates.filter(g=>facts[g]!=='satisfied')};
}
export function compose(snapshot,{now=Date.now()}={}){
 validate(snapshot,now);
 const facts=Object.fromEntries(keys.map(k=>[k,snapshot.facts[k]]));
 const cards=[...keys.map(k=>card('gate:'+k,[],k,({unknown:'unknown',satisfied:'yes',blocked:'no'})[facts[k]],GATES[k])),...RULES.map(([id,req,out])=>card('rule:'+id,req,out,'unknown','Review the proposed structure; no permission implied.'))];
 // Native composer accepts a fictional fixture. The placeholder actors are grammar
 // roles, not real people. Synthetic prior fields are required by its contract;
 // none of their values are used as probabilities or exposed in this adapter.
 const fixture={day:0,purpose:'synthetic-grammar-only',originActor:'grammar',beneficiaryActor:'placeholder-beneficiary',creditorActor:'placeholder-creditor',actors:['grammar','placeholder-beneficiary','placeholder-creditor'],rentNeedCents:1,initialFacts:[],goal:GOAL,offers:cards};
 const native=synthesizeAgreements(fixture);
 if(native.search.searchWasTruncated||native.plans.length>12)throw Error('HOLD: bounded search incomplete');
 const paths=native.plans.map(p=>{
   const {selected,gates,missing}=checkProof(p.generatedOperatorIds,cards,facts);
   return {id:sha([...p.generatedOperatorIds].sort()).slice(0,20),operators:selected.map(c=>c.id),gates,missing,disposition:missing.length?'HOLD':'REVIEW_READY',executionAllowed:false,externalContactAllowed:false};
 });
 const claims=cards.map(c=>({capabilityRef:c.id,particularRef:c.id,capability:c.produces,evidenceClass:'declared',provenanceKind:'model-output',currentness:'current',availability:c.status==='no'?'unavailable':c.status==='yes'?'available':'unknown',access:c.status==='yes'?'accessible':'unknown',authority:'unknown',dependencyRefs:c.id.startsWith('gate:')?[c.id]:[],requiresCapabilityRefs:[],sourceRefs:['grammar-v1:'+c.id]}));
 // Per-path capability identities prevent OR alternatives from being treated as
 // simultaneous AND prerequisites. Common gates retain common dependency refs.
 const particulars=[],capabilities=[],candidatePaths=[];
 for(const p of paths){
   const cs=p.operators.map(id=>cards.find(c=>c.id===id));
   const ref=id=>p.id+':'+id;
   for(const c of cs){
     const base=claims.find(x=>x.capabilityRef===c.id);
     particulars.push({particularRef:ref(c.id),kind:'conditional-grammar',sourceRefs:base.sourceRefs});
     const parents=c.requires.map(t=>{const producers=cs.filter(x=>x.produces===t);if(producers.length!==1)throw Error('HOLD: ambiguous proof dependency');return ref(producers[0].id);});
     capabilities.push({...base,capabilityRef:ref(c.id),particularRef:ref(c.id),requiresCapabilityRefs:parents});
   }
   candidatePaths.push({pathRef:p.id,needRef:snapshot.caseKey,capabilityRefs:cs.map(c=>ref(c.id)),dependencyRefs:p.gates.map(g=>'gate:'+g),satisfiesCapabilityRequirement:true,constraintResults:[]});
 }
 const plenty=evaluatePlenty({need:{needRef:snapshot.caseKey,capabilityRequirement:GOAL},particulars,capabilities,candidatePaths});
 if(plenty.viablePathCount!==0||plenty.structurallyCompletePathCount!==paths.length)throw Error('HOLD: independent evaluator disagreement');
 const next=keys.map(g=>({gate:g,question:GATES[g],affectedPaths:paths.filter(p=>p.missing.includes(g)).length})).filter(x=>x.affectedPaths).sort((a,b)=>b.affectedPaths-a.affectedPaths||a.gate.localeCompare(b.gate));
 return {schema:'jubilee.concord.proposal/v2',caseKey:snapshot.caseKey,asOf:snapshot.asOf,snapshotDigest:sha({caseKey:snapshot.caseKey,asOf:snapshot.asOf,facts}),paths,plenty:{disposition:plenty.disposition,structurallyComplete:plenty.structurallyCompletePathCount,viable:plenty.viablePathCount,independentViable:plenty.independentPathCount},nextQuestions:next,workPacket:{status:'PREPARE_ONLY',checklist:next.slice(0,5).map(q=>q.question),unsentDraft:'For review only: could an authorized reviewer help clarify the listed requirements? Do not send money or sensitive documents.',trackingFields:['gate','status','evidence_reference','reviewed_at','valid_until']},authority:'none',executionAllowed:false,externalContactAllowed:false};
}
