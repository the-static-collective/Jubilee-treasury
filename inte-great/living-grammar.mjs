// Generic, bounded cooperation composition; not a real-world authorization system.
// Native CONCORD and webZ response grammar are injected from their pinned sources.
export const SCHEMA='jubilee.capability-draft/v1';
const fail=m=>{throw Error('LIVING GRAMMAR HOLD: '+m)};
const exact=(x,ks)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===[...ks].sort().join('|');
const id=x=>typeof x==='string'&&/^[a-f0-9]{32}$/.test(x);
const token=x=>typeof x==='string'&&/^[a-z][a-z0-9:_-]{0,63}$/.test(x);
const alias=x=>typeof x==='string'&&/^[a-z][a-z0-9_-]{0,39}$/.test(x);
const unique=a=>new Set(a).size===a.length;
const list=(a,max)=>Array.isArray(a)&&a.length<=max&&unique(a)&&a.every(token);
const date=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const fields=['schema','id','caseId','actor','requires','produces','exclusiveClaims','expiresAt','responsePath','note'];
export function declaration(response,input){
 if(!exact(input,fields)||input.schema!==SCHEMA||!id(input.id)||!id(input.caseId)||!alias(input.actor)||
 !list(input.requires,5)||!token(input.produces)||!list(input.exclusiveClaims,5)||!date(input.expiresAt)||
 !Array.isArray(input.responsePath)||input.responsePath[0]!=='offer'||typeof input.note!=='string'||input.note.length>180||!input.note.trim())fail('Invalid scoped capability draft');
 if(input.requires.includes(input.produces))fail('Self-dependent declaration');
 const card=response.makeCard({context:input.caseId,path:input.responsePath,note:input.note});
 if(card.status!=='LOCAL_DRAFT'||card.response.kind!=='offer_draft'||card.permission!=='NONE'||card.obligation!=='NONE')fail('Draft only');
 return {draft:input,response:card};
}
function validateProof(native,cards,initial,goal){
 const byId=new Map(cards.map(c=>[c.id,c])),ids=native.generatedOperatorIds;
 if(!Array.isArray(ids)||!ids.length||!unique(ids)||ids.length>28)fail('Malformed proof');
 const used=new Set(),available=new Set(initial),claimed=new Set(),ordered=[];
 for(let i=0;i<ids.length;i++)for(const key of ids){
  if(used.has(key))continue;const c=byId.get(key);
  if(!c)fail('Unknown or excluded operator');
  if(!c.requires.every(t=>available.has(t)))continue;
  if(c.exclusiveClaims.some(t=>claimed.has(t)))fail('Exclusive claim collision');
  c.exclusiveClaims.forEach(t=>claimed.add(t));available.add(c.produces);used.add(key);ordered.push(key);
 }
 if(used.size!==ids.length||!available.has(goal))fail('Proof does not establish goal under declared grammar');
 const needed=new Set([goal]);
 for(let i=0;i<ids.length;i++)for(const key of ids){const c=byId.get(key);if(needed.has(c.produces))c.requires.forEach(t=>needed.add(t));}
 if(ids.some(k=>!needed.has(byId.get(k).produces)))fail('Irrelevant operator');
 return ordered;
}
export function compose(C,response,synthesize,book,caseId,input,{now=Date.now()}={}){
 const c=C.projection(book).get(caseId);
 if(!c||c.status==='CLOSED'||!id(caseId)||!Number.isFinite(now)||!exact(input,['goal','facts','bindings'])||!token(input.goal)||
 !Array.isArray(input.facts)||input.facts.length>20||!Array.isArray(input.bindings)||input.bindings.length>24)fail('Invalid case, goal or bounded input');
 const initial=[],facts=[];
 for(const f of input.facts){
  if(!exact(f,['token','claimId'])||!token(f.token)||!id(f.claimId)||initial.includes(f.token)||f.token===input.goal)fail('Invalid initial assumption');
  const claim=c.claims.get(f.claimId);
  if(!claim||claim.status!=='SUPPORTED'||!c.sources.has(claim.event.data.ref))fail('Assumptions require currently supported source-linked claims');
  initial.push(f.token);facts.push({token:f.token,claimId:f.claimId,sourceId:claim.event.data.ref});
 }
 const seen=new Set(),bindings=[],excluded=[],cards=[];
 for(const b of input.bindings){
  if(!exact(b,['draft','sourceId','state'])||!id(b.sourceId)||!c.sources.has(b.sourceId)||!['review','declined','withdrawn'].includes(b.state))fail('Every capability requires a local source reference and explicit disposition');
  const {draft:d}=declaration(response,b.draft);
  if(d.caseId!==caseId||seen.has(d.id))fail('Foreign or duplicate capability draft');
  seen.add(d.id);
  const row={id:d.id,actor:d.actor,sourceId:b.sourceId,requires:[...d.requires],produces:d.produces,expiresAt:d.expiresAt,exclusiveClaims:[...d.exclusiveClaims],state:b.state,note:d.note};
  bindings.push(row);
  if(b.state!=='review'||Date.parse(d.expiresAt)<=now){excluded.push({id:d.id,reason:b.state==='review'?'expired':b.state});continue;}
  // Never infer yes. These are abstract grammar operators and author aliases are not authenticated.
  cards.push({id:'cap:'+d.id,actor:'grammar',requires:d.requires,produces:d.produces,question:'Would the originating participant independently confirm this exact scoped possibility?',status:'unknown',declaredByActorInFixture:true,purpose:'abstract-review-only',expiresDay:1,priorYesBps:5000,directQuestionBurden:0,risks:[],exclusiveClaims:d.exclusiveClaims});
 }
 const native=synthesize({day:0,purpose:'abstract-review-only',originActor:'grammar',beneficiaryActor:'placeholder-beneficiary',creditorActor:'placeholder-reviewer',actors:['grammar','placeholder-beneficiary','placeholder-reviewer'],rentNeedCents:1,initialFacts:initial,goal:input.goal,offers:cards});
 const available=new Set(initial);
 // Independent forward closure deliberately ignores exclusivity; failure to
 // reach is an exact absence within the admitted token grammar, not reality.
 for(let i=0;i<=cards.length;i++)for(const card of cards)if(card.requires.every(t=>available.has(t)))available.add(card.produces);
 const plans=native.plans.map(p=>{
  const ordered=validateProof(p,cards,initial,input.goal).map(k=>k.slice(4));
  return {capabilityIds:ordered,sourceIds:[...new Set(ordered.map(k=>bindings.find(b=>b.id===k).sourceId))],status:'HOLD',executionAllowed:false};
 });
 if(plans.length&&!available.has(input.goal))fail('Independent closure disagrees');
 const needed=new Set([input.goal]);for(let i=0;i<=cards.length;i++)for(const card of cards)if(needed.has(card.produces))card.requires.forEach(t=>needed.add(t));
 const gaps=[...needed].filter(t=>!available.has(t)).map(t=>({token:t,kind:cards.some(c=>c.produces===t)?'UNMET_DEPENDENCY':'NO_ADMITTED_PRODUCER',affectedConsumers:cards.filter(c=>needed.has(c.produces)&&c.requires.includes(t)).length})).sort((a,b)=>(a.kind===b.kind?b.affectedConsumers-a.affectedConsumers||a.token.localeCompare(b.token):a.kind==='NO_ADMITTED_PRODUCER'?-1:1));
 const result=plans.length?'CANDIDATES_HELD':!available.has(input.goal)?'GRAMMAR_GAP':native.search.searchWasTruncated?'SEARCH_TRUNCATED':'CONSTRAINT_OR_DEPTH_HOLD';
 return {schema:'jubilee.living-grammar.review/v1',caseId,goal:input.goal,result,status:'HOLD',authority:'none',facts,bindings,excluded,plans,gaps,searchWasTruncated:native.search.searchWasTruncated,actualPaymentsMinor:0,executionAllowed:false,contactAllowed:false,publicationAllowed:false};
}
