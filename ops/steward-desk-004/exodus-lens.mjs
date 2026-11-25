// Pure projection of the already-authorized desk RPC result. No new query,
// no contact records, no inferred gate satisfaction or action authority.
export function reviewLens(routes, questions) {
  const hold = () => ({schema:'jubilee.exodus.desk-lens/v1',status:'HOLD',available:false,shared:[],next:[],readyCount:0,authority:'none',executionAllowed:false});
  const token = x => typeof x==='string' && /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,99}$/.test(x);
  const bounded = x => typeof x==='string' && x.trim().length>0 && x.length<=500;
  if(!Array.isArray(routes)||routes.length>100||!Array.isArray(questions)||questions.length>6)return hold();
  const paths=new Set(), gates=new Set(), counts=new Map();
  let readyCount=0;
  for(const r of routes){
    if(!r||!token(r.path)||paths.has(r.path)||!['HOLD','BLOCKED','REVIEW_READY'].includes(r.disposition)||r.execution_allowed!==false||!Array.isArray(r.missing_gates)||r.missing_gates.length>100||!r.missing_gates.every(token))return hold();
    paths.add(r.path);
    if(r.disposition==='REVIEW_READY')readyCount++;
    for(const g of new Set(r.missing_gates)){gates.add(g);counts.set(g,(counts.get(g)??0)+1);}
  }
  const seen=new Set(),next=[];
  for(const q of questions){
    if(!q||!token(q.gate)||seen.has(q.gate)||!bounded(q.question)||!Number.isSafeInteger(q.paths_unlocked_by_answer)||q.paths_unlocked_by_answer<0||q.paths_unlocked_by_answer>routes.length)return hold();
    seen.add(q.gate);
    // The source database determines review priority. Its count is affected
    // routes, not a prediction that answering will unlock them.
    next.push({question:q.question,affectedRoutes:q.paths_unlocked_by_answer});
  }
  const shared=[...counts.entries()].filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([gate,affectedRoutes])=>({gate,affectedRoutes}));
  return {schema:'jubilee.exodus.desk-lens/v1',status:'HOLD',available:true,shared,next,readyCount,authority:'none',executionAllowed:false};
}
