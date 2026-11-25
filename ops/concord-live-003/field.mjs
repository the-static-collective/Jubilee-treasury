import {synthesizeAgreements} from '../concord-live-002/vendor/composer.mjs';
import {evaluatePlenty} from '../concord-live-002/vendor/plenty/index.ts';
import {createHash} from 'node:crypto';

const PURPOSE='verification-preparation';
const GOAL='review-packet-option';
const TYPES=['document-access','translation','interpretation','property-counsel','bilingual-property-counsel','independent-review'];
const RULES=[
 ['translate',['document-access','translation'],'readable-packet'],
 ['interpret',['document-access','interpretation'],'readable-packet'],
 ['counsel',['readable-packet','property-counsel'],'reviewable-packet'],
 ['bilingual',['document-access','bilingual-property-counsel'],'reviewable-packet'],
 ['review',['reviewable-packet','independent-review'],GOAL]
];
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===[...keys].sort().join('|');
const id=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9_-]{2,49}$/.test(x);
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const unique=xs=>new Set(xs).size===xs.length;
const fail=m=>{throw Error('HOLD: '+m)};
const card=(id,requires,produces,exclusiveClaims=[])=>({id,actor:'grammar',requires,produces,question:'Review the scoped candidate; no authority implied.',status:'unknown',declaredByActorInFixture:true,purpose:PURPOSE,expiresDay:1,priorYesBps:5000,directQuestionBurden:0,risks:[],exclusiveClaims});
function validate(s,now,expectedCaseKey){
 if(!['JUB-HON-001','EXODUS-FIXTURE-001'].includes(expectedCaseKey))fail('unknown case scope');
 if(!exact(s,['schema','caseKey','asOf','cards','links'])||s.schema!=='jubilee.capability-field/v1'||s.caseKey!==expectedCaseKey||typeof s.asOf!=='string'||!Number.isFinite(Date.parse(s.asOf))||!Number.isFinite(now)||Date.parse(s.asOf)>now+5000||now-Date.parse(s.asOf)>900000)fail('invalid or stale snapshot');
 if(!Array.isArray(s.cards)||s.cards.length>18||!Array.isArray(s.links)||s.links.length>24||!unique(s.cards.map(c=>c?.id))||!unique(s.links.map(l=>l?.id)))fail('bounded distinct records required');
 for(const c of s.cards){
  if(!exact(c,['id','actor','kind','purpose','state','sourceRef','consentRef','expiresAt'])||!id(c.id)||!id(c.actor)||!TYPES.includes(c.kind)||c.purpose!==PURPOSE||!['offered','declined','withdrawn'].includes(c.state)||!id(c.sourceRef)||!id(c.consentRef)||typeof c.expiresAt!=='string'||!Number.isFinite(Date.parse(c.expiresAt)))fail('invalid scoped capability');
 }
 for(const l of s.links){
  if(!exact(l,['id','from','to','purpose','state','consentA','consentB','expiresAt'])||!id(l.id)||!id(l.from)||!id(l.to)||l.from===l.to||l.purpose!==PURPOSE||!['both-consented','declined','withdrawn','proposed'].includes(l.state)||typeof l.expiresAt!=='string'||!Number.isFinite(Date.parse(l.expiresAt))||(l.state==='both-consented'?(!id(l.consentA)||!id(l.consentB)||l.consentA===l.consentB):(l.consentA!==null||l.consentB!==null)))fail('invalid scoped relationship');
 }
}
function reachable(links,target,now){
 if(target==='operator')return [];
 const queue=[{actor:'operator',path:[]}],seen=new Set(['operator']);
 while(queue.length){const {actor,path}=queue.shift();if(path.length>=4)continue;
  for(const l of links){if(l.from!==actor||l.state!=='both-consented'||Date.parse(l.expiresAt)<=now||seen.has(l.to))continue;
   const p=[...path,l.id];if(l.to===target)return p;seen.add(l.to);queue.push({actor:l.to,path:p});
  }
 }return null;
}
function verify(ids,all){
 if(!Array.isArray(ids)||!unique(ids)||ids.length>23)fail('invalid proof ids');
 const selected=ids.map(i=>all.find(c=>c.id===i));if(selected.some(c=>!c))fail('unknown proof operator');
 const facts=new Set(),used=new Set(),claims=new Set();
 for(let i=0;i<selected.length;i++)for(const c of selected){if(used.has(c.id)||!c.requires.every(k=>facts.has(k)))continue;
  if(c.exclusiveClaims.some(k=>claims.has(k)))fail('exclusive collision');
  c.exclusiveClaims.forEach(k=>claims.add(k));facts.add(c.produces);used.add(c.id);}
 if(!facts.has(GOAL)||used.size!==selected.length)fail('incomplete proof');
 return selected;
}
export function field(snapshot,{now=Date.now(),expectedCaseKey='JUB-HON-001'}={}){
 validate(snapshot,now,expectedCaseKey);
 const admitted=snapshot.cards.filter(c=>c.state==='offered'&&Date.parse(c.expiresAt)>now);
 const admittedById=new Map(admitted.map(c=>['cap:'+c.id,c]));
 const all=[...admitted.map(c=>card('cap:'+c.id,[],c.kind,[c.sourceRef])),...RULES.map(([k,r,p])=>card('rule:'+k,r,p))];
 const native=synthesizeAgreements({day:0,purpose:PURPOSE,originActor:'grammar',beneficiaryActor:'placeholder-beneficiary',creditorActor:'placeholder-reviewer',actors:['grammar','placeholder-beneficiary','placeholder-reviewer'],rentNeedCents:1,initialFacts:[],goal:GOAL,offers:all});
 if(native.search.searchWasTruncated||native.plans.length>12)fail('search incomplete');
 const paths=[],particulars=[],capabilities=[],candidatePaths=[];
 for(const p of native.plans){
  const selected=verify(p.generatedOperatorIds,all),pid=digest([...p.generatedOperatorIds].sort()).slice(0,20);
  const cs=selected.filter(c=>c.id.startsWith('cap:')).map(c=>admittedById.get(c.id));
  const relationshipHolds=cs.filter(c=>reachable(snapshot.links,c.actor,now)===null).map(c=>c.id);
  // A scope-limited capability is not verified capacity or authorization.
  const ref=id=>pid+':'+id;
  const deps=[...new Set(cs.flatMap(c=>['source:'+c.sourceRef,'actor:'+c.actor,...(reachable(snapshot.links,c.actor,now)??[]).map(x=>'link:'+x)]))].sort();
  for(const c of selected){
   const original=admittedById.get(c.id),parents=c.requires.map(k=>{const x=selected.filter(v=>v.produces===k);if(x.length!==1)fail('ambiguous proof');return ref(x[0].id);});
   particulars.push({particularRef:ref(c.id),kind:'conditional-capability',sourceRefs:original?[original.sourceRef]:['grammar:'+c.id]});
   capabilities.push({capabilityRef:ref(c.id),particularRef:ref(c.id),capability:c.produces,evidenceClass:'declared',provenanceKind:original?'self-report':'model-output',currentness:'current',availability:'unknown',access:'unknown',authority:'unknown',dependencyRefs:original?['source:'+original.sourceRef,'actor:'+original.actor]:[],requiresCapabilityRefs:parents,sourceRefs:original?[original.sourceRef]:['grammar:'+c.id]});
  }
  candidatePaths.push({pathRef:pid,needRef:snapshot.caseKey,capabilityRefs:selected.map(c=>ref(c.id)),dependencyRefs:deps,satisfiesCapabilityRequirement:true,constraintResults:[]});
  paths.push({id:pid,operators:selected.map(c=>c.id),capabilityIds:cs.map(c=>c.id),relationshipHolds,dependencyRefs:deps,status:'HOLD',executionAllowed:false,contactAllowed:false});
 }
 const plenty=evaluatePlenty({need:{needRef:snapshot.caseKey,capabilityRequirement:GOAL},particulars,capabilities,candidatePaths});
 if(plenty.viablePathCount!==0||plenty.structurallyCompletePathCount!==paths.length)fail('PLENTY disagreement');
 const missing=TYPES.filter(k=>!admitted.some(c=>c.kind===k));
 const tasks=[...new Set(paths.flatMap(p=>p.relationshipHolds))].map(k=>({kind:'consent-review',capabilityId:k,question:'Is a current, purpose-specific introduction permitted by both parties?',optional:true,authority:'none'}));
 // No identity or sensitive evidence in these optional private quest proposals.
 const quests=missing.map(k=>({kind:k,title:'Explore '+k,invitation:'If appropriate, identify a willing, qualified participant via an approved channel.',optional:true,authority:'none',public:false}));
 return {schema:'jubilee.capability.proposal/v1',caseKey:snapshot.caseKey,asOf:snapshot.asOf,snapshotDigest:digest(snapshot),paths,plenty:{structurallyComplete:plenty.structurallyCompletePathCount,viable:plenty.viablePathCount,independentViable:plenty.independentPathCount},tasks,quests,workPacket:{status:'PREPARE_ONLY',checklist:[...tasks.map(x=>x.question),...quests.map(x=>x.title)],unsentDraft:'For human review only: can we discuss a bounded verification-preparation contribution through an approved channel?',trackingFields:['capability_ref','consent_status','evidence_ref','expiry','review_state']},authority:'none',executionAllowed:false,contactAllowed:false};
}
