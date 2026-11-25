(function(){
 const panel=$('wb-panel'), gates=$('wb-gates'), offers=$('wb-offers'), results=$('wb-results');
 let previousBook=null,previousCase=null,report=null;
 const invalidate=()=>{report=null;results.replaceChildren();};
 const option=(parent,value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;parent.append(o);};
 function refresh(){
  panel.hidden=!book||!active;
  if(book===previousBook&&active===previousCase)return;
  previousBook=book;previousCase=active;invalidate();gates.replaceChildren();offers.replaceChildren();$('wb-target').value='';$('wb-status').textContent='';
  if(!book||!active)return;
  const c=Casework.projection(book).get(active);if(!c)return;
  const supported=[...c.claims.values()].filter(x=>x.status==='SUPPORTED');
  for(const [g,q] of Object.entries(Workbench.GATES)){
   const l=text(gates,'label',q);const s=document.createElement('select');s.dataset.gate=g;option(s,'','Unknown / not reviewed');
   for(const x of supported){const id=x.event.id,desc=x.event.data.text.slice(0,120);
    option(s,'reviewed:'+id,'Reviewed — '+desc+' ['+id.slice(0,8)+']');
    option(s,'blocked:'+id,'Explicitly blocks route — '+desc+' ['+id.slice(0,8)+']');
   }
   l.append(s);
  }
  for(const o of c.offers.values()){
   if(!['CONDITIONAL','COMMITTED_REPORTED'].includes(o.status))continue;
   const l=document.createElement('label'),box=document.createElement('input');
   box.type='checkbox';box.value=o.event.id;l.append(box,document.createTextNode(' '+fmt(o.event.data.amountMinor)+' · '+o.status+' · '+o.event.data.text));offers.append(l);
  }
  if(!offers.children.length)text(offers,'p','No eligible reported offer records. Noncash or extension routes can still be reviewed.');
 }
 const old=render;render=function(){old();refresh();};refresh();
 panel.addEventListener('input',invalidate);
 $('wb-run').onclick=()=>{
  try{
   if(busy||!book||!active)throw Error('Open a case first');
   const raw=$('wb-target').value.trim();if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(raw))throw Error('Enter a positive USD amount with at most two decimals');
   const [d,c='']=raw.split('.'),targetMinor=Number(d)*100+Number(c.padEnd(2,'0'));
   const gateClaims=Object.fromEntries([...gates.querySelectorAll('select')].map(s=>{const [state,claimId]=s.value.split(':');return [s.dataset.gate,{state:state||'unknown',claimId:claimId||''}]}));
   const offerIds=[...offers.querySelectorAll('input:checked')].map(x=>x.value);
   report=Workbench.plan(Casework,NativeComposer.synthesizeAgreements,book,active,{targetMinor,gateClaims,offerIds});
   const snapshot=book,caseId=active,p=report;
   results.replaceChildren();$('wb-status').textContent='Review only — every route remains HOLD. No verified funds or action authority.';
   text(results,'p','Reported amount to address: '+fmt(p.targetMinor)+' · Selected offer amounts: '+fmt(p.funds.reportedTotalMinor)+' · Independently verified by this tool: $0.');
   text(results,'p',p.funds.candidate?'Arithmetic-only candidate: '+fmt(p.funds.candidate.reportedMinor)+' across '+p.funds.candidate.offerIds.length+' selected records. Check overlap, availability and terms independently.':'No selected combination reaches the reported target. This does not rule out other resources.');
   if(!p.paths.length)text(results,'p','No path survives the current explicit blocks. Review your annotations and alternatives.');
   for(const path of p.paths){const row=text(results,'div',path.route.toUpperCase()+' · HOLD','entry');text(row,'p',path.missing.length?'Outstanding review: '+path.missing.join(', '):'All selected gates annotated reviewed; independent authorization still required.');}
   const known=p.gateState;
   for(const q of p.questions){
    const row=text(results,'div',q.text+' ('+q.affectedRoutes+' candidate routes affected)','entry');
    const b=document.createElement('button');b.textContent='Add review task';b.onclick=()=>{
     try{
      if(book!==snapshot||active!==caseId||report!==p)throw Error('Case or selections changed; regenerate');
      const suffix=known[q.gate].claimId?' Related claim: '+known[q.gate].claimId: '';
      const task='[Workbench review / '+q.gate+'] '+q.text+suffix;
      if([...Casework.projection(book).get(active).tasks.values()].some(t=>t.event.data.text===task&&['OPEN','WAITING'].includes(t.status)))throw Error('Review task already open');
      if(!confirm('Append this review question as a local task? No message will be sent.'))return;
      change(Casework.append(book,active,'task',{text:task,due:''}));msg('Review task added. Save encrypted casebook.');
     }catch(e){$('wb-status').textContent=e.message;}
    };row.append(b);
   }
  }catch(e){invalidate();$('wb-status').textContent=e.message;}
 };
})();