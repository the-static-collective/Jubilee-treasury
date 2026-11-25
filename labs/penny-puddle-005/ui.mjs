import {makeFixture,planOpportunity,benchmark} from './opportunity.mjs';
import {createOpportunityGraph} from './bridge.mjs';

const $=sel=>document.querySelector(sel);
const text=(sel,value)=>{$(sel).textContent=value;};
const money=cents => (cents<0?'−':'')+'$'+(Math.abs(cents)/100).toFixed(2);
function scenario(name){
  const example=makeFixture();
  switch(name){
    case 'discovery':return example;
    case 'urgent':return makeFixture({
      name:'fictional five-day emergency',
      limits:{...example.limits,maxDays:5}
    });
    case 'poor':return makeFixture({
      name:'no sponsor or personal money for expert services',
      limits:{...example.limits,serviceSpendBudgetCents:0}
    });
    case 'no-buyers':return makeFixture({
      name:'no buyer access',demand:[]
    });
    case 'no-sponsor':return makeFixture({
      name:'no sponsor-funded creative opportunity',creativeSponsor:null
    });
    default:throw new Error('Unknown scenario');
  }
}
const explain={
  discovery:'Fictional selection: 14% weighted rare world and two market categories. Those weights do NOT describe any real coin.',
  urgent:'The deadline blocks long grading routes, even if an unusual coin might one day interest a collector.',
  poor:'No available budget to pay even the $1 fictional preliminary screen. The model must not spend someone’s last dollars.',
  'no-buyers':'Remove every invented buyer route. Attention and nonmonetary options remain, but sale proceeds cannot be assumed.',
  'no-sponsor':'No sponsor-funded story work. A like or story by itself cannot issue a cent.'
};
const names={
  'inspect':'Request observation',
  'authenticate':'Request expert review',
  'keep-owner-property':'Keep with owner',
  'publish-sponsored-story':'Create licensed story (sponsor-funded)'
};
function title(id){
  return names[id] || (id?.startsWith('sell:') ? 'Consider fictional buyer: '+id.slice(5) : id || 'No action');
}
function detailKey(sel,action,description){
  text(sel,title(action));
  text(description,action?.startsWith('sell:')?
    'Illustrative buyer only. No person has agreed to pay and no funds are available.':
    action==='inspect'?'A small inquiry could enable an expensive expert review; that is an opportunity, not a guarantee.':
    action==='publish-sponsored-story'?'Hypothetical licensed work uses a separately funded budget.':
    action==='keep-owner-property'?'No fees, no sale, no transfer of title.':
    'Proposed decision only; no external action executed.');
}
function render(key){
  try{
    const f=scenario(key), b=benchmark(f), p=b.planner,g=createOpportunityGraph(f);
    for(const button of document.querySelectorAll('[data-scenario]')){
      button.setAttribute('aria-pressed',button.dataset.scenario===key?'true':'false');
    }
    text('#scenario-note',explain[key]);
    detailKey('#quick-pick',p.greedyImmediateFirst,'#quick-detail');
    detailKey('#frontier-pick',p.affordanceFirst,'#frontier-detail');
    detailKey('#classical-pick',p.optimalClassicalExpected.action,'#classical-detail');
    detailKey('#robust-pick',p.robustWorstCase.action,'#robust-detail');
    const table=document.createElement('table');
    const head=document.createElement('thead');
    const row=document.createElement('tr');
    for(const label of ['Strategy','Weighted fictional net','Worst fictional world']){
      const cell=document.createElement('th');cell.textContent=label;row.append(cell);
    }head.append(row);table.append(head);
    const body=document.createElement('tbody');
    for(const [id,label] of [['greedy','Greedy immediate'],['affordance','New options first'],['expected','Classical optimal'],['robust','Robust worst-case']]){
      const vals=b.comparisons[id];
      const tr=document.createElement('tr');
      for(const val of [label,money(vals.expectedNetCents),money(vals.worstCaseNetCents)]){
        const td=document.createElement('td');td.textContent=val;tr.append(td);
      }
      body.append(tr);
    }table.append(body);
    $('#results').replaceChildren(table);
    const danger=b.comparisons.expected.worstCaseNetCents;
    text('#risk',danger<0?
      'The expected-value policy loses '+money(Math.abs(danger))+' in its worst invented world. The robust policy protects a different minimum. People cannot assume collector upside or safely front grading fees.':
      'Even a favorable scenario is only mathematical. No actual buyer, verified market offer, or granted authority exists.');
    text('#specimen',f.specimen.id);
    text('#buyers',String(g.nodes.filter(x=>x.type.includes('buyer')).length));
    text('#services',String(g.nodes.filter(x=>x.type==='inspection-service'||x.type==='appraisal-service'||x.type==='sponsor-budget').length));
    text('#campaign','Fictional goal: '+money(f.goal.targetCents)+
      '\nModeled preexisting fixture amount: '+money(f.goal.currentlyFundedCents)+
      '\nActual new contributions: $0.00');
  } catch(error){
    $('#results').textContent='Simulation refused: '+(error instanceof Error?error.message:'Invalid scenario');
  }
}
for(const b of document.querySelectorAll('[data-scenario]'))
  b.addEventListener('click',()=>render(b.dataset.scenario));
render('discovery');
