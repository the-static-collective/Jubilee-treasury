// Real-case planning adapter: only closed, source-linked, manually selected evidence.
// No actual payment, contact, publication, or legal authority. Native composer receives
// abstract grammar placeholders, never personal identities or actual commitments.
export const GATES=Object.freeze({
 authority:'Who is independently authorized to act for the affected party?',
 terms:'What written obligation, deadline and consequences actually apply?',
 evidence:'Which original documents and independent evidence support the need?',
 review:'Who can independently review the proposed arrangement?',
 extension:'Would the relevant counterparty consider a written standstill or extension?',
 bridge:'Is an authorized local institution willing to consider a funded bridge?',
 transfer:'What lawful and independently verified transfer channel could be used?',
 guarantee:'Would a qualified, independently funded guarantor consider specific capped terms?',
 acceptance:'Would the counterparty consider the proposed substitute performance or guarantee?',
 sponsor:'Can the reported offers be independently verified as distinct, eligible and available?'
});
const rules=[
 ['basis',['authority','terms','evidence'],'basis'],
 ['extension',['authority','terms','extension','review'],'option'],
 ['sponsor',['basis','sponsor','transfer','review'],'option'],
 ['bridge',['basis','bridge','transfer','review'],'option'],
 ['guarantee',['basis','guarantee','acceptance','review'],'option']
];
const ids=Object.keys(GATES);
const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join('|')===[...k].sort().join('|');
const safe=x=>Number.isSafeInteger(x)&&x>=0&&x<=1000000000;
const ref=x=>typeof x==='string'&&/^[a-f0-9]{32}$/.test(x);
const fail=m=>{throw Error('WORKBENCH HOLD: '+m)};
function chooseOffers(c,selected,target){
 if(!Array.isArray(selected)||selected.length>12||new Set(selected).size!==selected.length)fail('Select at most twelve distinct offer records');
 const sources=new Set(),offers=[];
 for(const id of selected){
  const o=c.offers.get(id);if(!ref(id)||!o||!['CONDITIONAL','COMMITTED_REPORTED'].includes(o.status))fail('Only current conditional or reported commitment records may be selected');
  const d=o.event.data;if(!safe(d.amountMinor)||!c.sources.has(d.ref)||sources.has(d.ref))fail('Duplicate source or invalid amount; review overlapping offers separately');
  sources.add(d.ref);offers.push({id,sourceId:d.ref,status:o.status,amountMinor:d.amountMinor});
 }
 // Exhaustive bounded subset search; ranking is arithmetic, not an assessment
 // of genuine availability, distinct donors, legal eligibility or consent.
 let best=null;
 for(let mask=1;mask<(1<<offers.length);mask++){
  const subset=offers.filter((_,i)=>mask&(1<<i)),sum=subset.reduce((n,o)=>n+o.amountMinor,0);
  if(sum<target)continue;
  const uncertain=subset.filter(o=>o.status==='CONDITIONAL').length;
  const rank=[uncertain,subset.length,sum-target,subset.map(o=>o.id).sort().join('|')];
  if(!best||rank.some((v,i)=>v<best.rank[i]&&rank.slice(0,i).every((x,j)=>x===best.rank[j])))best={subset,sum,rank};
 }
 return {selected:offers,reportedTotalMinor:offers.reduce((n,o)=>n+o.amountMinor,0),candidate:best?{offerIds:best.subset.map(o=>o.id),reportedMinor:best.sum,conditionalCount:best.rank[0]}:null,verifiedFundsMinor:0};
}
export function plan(C,synthesize,book,caseId,input){
 const c=C.projection(book).get(caseId);
 if(!c||c.status==='CLOSED')fail('Open or held case required');
 if(!exact(input,['targetMinor','gateClaims','offerIds'])||!safe(input.targetMinor)||input.targetMinor===0||!exact(input.gateClaims,ids))fail('Bounded amount and exact gate map required');
 const gateState={};
 for(const g of ids){
  const a=input.gateClaims[g];
  if(!exact(a,['claimId','state'])||!['unknown','reviewed','blocked'].includes(a.state))fail('Invalid gate annotation');
  if(a.state==='unknown'){if(a.claimId!=='')fail('Unknown gate must have no claim');gateState[g]={state:'unknown',claimId:null,sourceId:null};continue;}
  const claim=c.claims.get(a.claimId);
  if(!ref(a.claimId)||!claim||claim.status!=='SUPPORTED'||!c.sources.has(claim.event.data.ref))fail('Gate annotation requires a currently supported, source-linked claim');
  // Human classification is not independent verification; a refusal can prune
  // a route only when deliberately annotated as blocked.
  gateState[g]={state:a.state,claimId:a.claimId,sourceId:claim.event.data.ref};
 }
 const funds=chooseOffers(c,input.offerIds,input.targetMinor);
 const card=(id,requires,produces,status)=>({id,actor:'grammar',requires,produces,status,question:'Review this abstract planning dependency.',declaredByActorInFixture:true,purpose:'review-only-grammar',expiresDay:1,priorYesBps:5000,directQuestionBurden:0,risks:[],exclusiveClaims:[]});
 // No real person's willingness is mapped to yes; even reviewed facts remain
 // unknown to the native synthetic composer. Explicit blocking prunes only.
 const cards=[...ids.map(g=>card('gate:'+g,[],g,gateState[g].state==='blocked'?'no':'unknown')),...rules.map(([id,req,out])=>card('rule:'+id,req,out,'unknown'))];
 const native=synthesize({day:0,purpose:'review-only-grammar',originActor:'grammar',beneficiaryActor:'placeholder-beneficiary',creditorActor:'placeholder-counterparty',actors:['grammar','placeholder-beneficiary','placeholder-counterparty'],rentNeedCents:1,initialFacts:[],goal:'option',offers:cards});
 if(native.search.searchWasTruncated||native.plans.length>8)fail('Incomplete bounded search');
 const paths=native.plans.map(p=>{
  const selected=p.generatedOperatorIds.map(id=>cards.find(c=>c.id===id));
  if(selected.some(x=>!x||x.status==='no')||new Set(selected.map(x=>x.id)).size!==selected.length)fail('Invalid native proof');
  const available=new Set(),used=new Set();
  for(let i=0;i<selected.length;i++)for(const x of selected)if(!used.has(x.id)&&x.requires.every(t=>available.has(t))){used.add(x.id);available.add(x.produces);}
  if(!available.has('option')||used.size!==selected.length)fail('Unproven native path');
  const route=selected.find(x=>x.produces==='option').id.slice(5),gates=selected.filter(x=>x.id.startsWith('gate:')).map(x=>x.produces);
  return {route,gates,missing:gates.filter(g=>gateState[g].state!=='reviewed'||(g==='sponsor'&&!funds.candidate)),status:'HOLD',executionAllowed:false};
 });
 const questions=ids.filter(g=>gateState[g].state==='unknown'||(g==='sponsor'&&gateState[g].state!=='blocked'&&!funds.candidate)).map(g=>({gate:g,text:GATES[g],affectedRoutes:paths.filter(p=>p.missing.includes(g)).length})).filter(q=>q.affectedRoutes>0).sort((a,b)=>b.affectedRoutes-a.affectedRoutes||ids.indexOf(a.gate)-ids.indexOf(b.gate));
 return {schema:'jubilee.workbench.review/v1',caseId,targetMinor:input.targetMinor,authority:'none',status:'HOLD',paths,gateState,funds,questions,sourceEventCount:book.events.length,actualPaymentsMinor:0,contactAllowed:false,publicationAllowed:false,executionAllowed:false};
}
