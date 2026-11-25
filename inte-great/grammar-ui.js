(function(){
 const $g=id=>document.getElementById('lg-'+id), val=id=>$g(id).value.trim();
 const tokens=s=>s.trim()?s.trim().split(/[,\s]+/).filter(Boolean):[];
 const output=(el,s)=>{el.textContent=s;};
 const opt=(s,v,l)=>{const o=document.createElement('option');o.value=v;o.textContent=l;s.append(o);};
 let facts=[],bindings=[],last=null,previousBook=null,previousCase=null;
 function clear(){last=null;$g('results').replaceChildren();output($g('status'),'');}
 function refresh(){
  $g('panel').hidden=!book||!active;
  if(book===previousBook&&active===previousCase)return;
  previousBook=book;previousCase=active;facts=[];bindings=[];clear();
  for(const name of ['scope','actor','requires','produces','exclusive','note','expiry','draft','goal','fact-token','import'])$g(name).value='';
  $g('sources').replaceChildren();$g('claims').replaceChildren();$g('staged').replaceChildren();
  if(!book||!active)return;
  $g('scope').value=active;
  const c=Casework.projection(book).get(active);output($g('case-id'),'Case ID: '+active+' — share only by explicit permission.');
  for(const e of c.sources.values())opt($g('sources'),e.id,e.data.text.slice(0,100)+' ['+e.id.slice(0,8)+']');
  for(const q of c.claims.values())if(q.status==='SUPPORTED')opt($g('claims'),q.event.id,q.event.data.text.slice(0,100)+' ['+q.event.id.slice(0,8)+']');
 }
 function safe(fn){try{fn();}catch(e){output($g('status'),e.message);}}
 const old=render;render=function(){old();refresh();};refresh();
 const fresh=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
 $g('make').onclick=()=>safe(()=>{
  const expires=new Date(val('expiry'));if(!Number.isFinite(expires.getTime())||expires.getTime()<=Date.now())throw Error('Choose a future expiration.');
  const d={schema:LivingGrammar.SCHEMA,id:fresh(),caseId:val('scope'),actor:val('actor'),requires:tokens(val('requires')),produces:val('produces'),exclusiveClaims:tokens(val('exclusive')),expiresAt:expires.toISOString(),responsePath:['offer',val('kind')],note:val('note')};
  LivingGrammar.declaration(ResponseGrammar,d);
  $g('draft').value=JSON.stringify(d,null,2);output($g('author-status'),'Unsigned local draft. No agreement, identity proof or delivery. Copy only with permission.');
 });
 $g('save-draft').onclick=()=>safe(()=>{
  const d=JSON.parse(val('draft'));LivingGrammar.declaration(ResponseGrammar,d);
  const u=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='capability-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
 });
 function show(){
  clear();const area=$g('staged');area.replaceChildren();
  for(const f of facts){const r=text(area,'div','Assumption: '+f.token+' · claim '+f.claimId.slice(0,8),'entry');const b=document.createElement('button');b.textContent='Remove assumption';b.onclick=()=>{facts=facts.filter(x=>x!==f);show();};r.append(b);}
  for(const x of bindings){const d=x.draft;const r=text(area,'div',d.actor+' · '+(d.requires.join(' + ')||'no declared prerequisite')+' → '+d.produces+' · '+x.state+'\n'+d.note,'entry');
   const s=document.createElement('select');for(const v of ['review','declined','withdrawn'])opt(s,v,v);s.value=x.state;s.onchange=()=>{x.state=s.value;show();};r.append(s);
  }
 }
 $g('bind').onclick=()=>safe(()=>{
  if(!book||!active||busy)throw Error('Open a case.');
  const d=JSON.parse(val('import'));LivingGrammar.declaration(ResponseGrammar,d);
  if(d.caseId!==active||!val('sources')||bindings.some(x=>x.draft.id===d.id)||bindings.length>=24)throw Error('Case mismatch, missing source, duplicate draft or limit.');
  if(!confirm('Stage this unsigned draft as a reported possibility, not consent or a promise?'))return;
  bindings.push({draft:d,sourceId:val('sources'),state:'review'});$g('import').value='';show();
 });
 $g('add-fact').onclick=()=>safe(()=>{
  if(!val('claims')||!val('fact-token')||facts.some(x=>x.token===val('fact-token'))||facts.length>=20)throw Error('Select a reviewed claim and a unique token.');
  facts.push({token:val('fact-token'),claimId:val('claims')});$g('fact-token').value='';show();
 });
 $g('goal').oninput=clear;
 $g('run').onclick=()=>safe(()=>{
  clear();const report=LivingGrammar.compose(Casework,ResponseGrammar,NativeComposer.synthesizeAgreements,book,active,{goal:val('goal'),facts,bindings});
  last=report;const original=book,caseId=active;const area=$g('results');
  output($g('status'),report.result+' · HOLD · no authorization or verification of funds. '+(report.searchWasTruncated?'Search truncated.':''));
  for(const [i,p] of report.plans.entries()){
   const row=text(area,'div','Candidate '+(i+1)+' — HOLD','entry');
   for(const id of p.capabilityIds){const d=report.bindings.find(x=>x.id===id);text(row,'p',d.actor+': '+d.produces+' — '+d.note+' [source '+d.sourceId.slice(0,8)+']');}
  }
  for(const e of report.excluded)text(area,'p','Excluded draft '+e.id.slice(0,8)+': '+e.reason);
  for(const g of report.gaps){
   const row=text(area,'div',g.token+' — '+g.kind,'entry');
   if(g.kind!=='NO_ADMITTED_PRODUCER')continue;
   const b=document.createElement('button');b.textContent='Add missing-capability question';b.onclick=()=>safe(()=>{
    if(book!==original||active!==caseId||last!==report)throw Error('Review is stale; regenerate.');
    if(!confirm('Add local investigation task only?'))return;
    const task='[Living Grammar] Can someone independently offer or substantiate '+g.token+' for this case?';
    change(Casework.append(book,active,'task',{text:task,due:''}));msg('Question added. Save encrypted casebook.');
   });row.append(b);
  }
 });
})();