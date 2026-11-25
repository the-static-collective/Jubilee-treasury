import {createDealFixture,composeMutualDeals} from './dealweaver.mjs';
import {suggestAssetDoors,oversizedFixture} from './asset-doors.mjs';
import {createPrincipalOnlyBridge} from './principal-only.mjs';

const $=query=>document.querySelector(query);
const write=(id,msg)=>{$(id).textContent=msg;};
const usd=cents=>'$'+(cents/100).toFixed(2);
$('#compose').addEventListener('click',()=>{
  try{
    const p=composeMutualDeals(createDealFixture(),{maxAgreements:3});
    const selected=p.paretoFrontier[0];
    if(!selected)throw new Error('There are no mutually acceptable opportunities in this scenario.');
    const lines=[
      'POTENTIAL COMPOSITION: '+selected.dealIds.join(' + '),
      'People with modeled individual benefits: '+Object.keys(selected.score.individualGains).length,
      'Lowest modeled individual benefit: '+selected.score.minParticipantGain,
      'Reported community signal: '+selected.score.peopleSignal,
      'Reported environmental signal: '+selected.score.planetSignal,
      'Model never chooses or enacts the deal for them.',
      'No one has actually agreed, no right to use equipment has been granted and no real money has moved.'
    ];
    write('#deal-output',lines.join('\n'));
    const summary=$('#impact');summary.replaceChildren();
    for(const a of selected.terms){
      const panel=document.createElement('div');
      panel.className='mini';
      const title=document.createElement('strong');
      title.textContent=a.id;
      const desc=document.createElement('p');
      desc.textContent='Owner retains title. '+(a.slot?'Proposed time: '+a.slot+'. ':'')+
        'Illustrative amount: '+usd(a.proposedCashCents)+'. Human consent required.';
      panel.append(title,desc);
      summary.append(panel);
    }
  }catch(error){write('#deal-output',error.message);}
});
$('#doors').addEventListener('click',()=>{
  try{
    const p=suggestAssetDoors(oversizedFixture());
    write('#door-output',p.suggestedDoors.map(x=>
      x.id+': '+x.feasibility+'\n'+x.explanation
    ).join('\n\n')+
    '\n\nREAL CREATED LIQUIDITY: $0.00. No appraisal, owner title or lender verified.');
  }catch(error){write('#door-output',error.message);}
});
const bank=createPrincipalOnlyBridge({
  fictionalAvailableCents:5000,fictionalLossCoverCents:1500,fictionalAdminSponsorCents:250
});
let advanceModeled=false;
function describeMoney(s){
  write('#loan-output',
    'Fictional pool remaining: '+usd(s.fictionalCashAvailableCents)+'\n'+
    'Outstanding principal: '+usd(s.fictionalOutstandingPrincipalCents)+'\n'+
    'Independent sponsor loss reserve: '+usd(s.fictionalSponsorLossCoverCents)+'\n'+
    'Interest / borrower fees / late penalties: $0.00\n'+
    'REAL MONEY DISBURSED: $0.00. ALL TRANSACTIONS MODELED ONLY.');
}
$('#loan').addEventListener('click',()=>{
  try{
    if(advanceModeled)return;
    const s=bank.propose({loanId:'imaginary-30-dollar',borrowerId:'fictional-neighbor',
      principalCents:3000,borrowerConsentForModel:true,
      documentedNeed:'essential-tool-repair',
      capacityReviewedByIndependentPartner:true});
    describeMoney(s);
    advanceModeled=true;
    $('#loan').disabled=true;
    $('#repay').disabled=false;
  }catch(error){write('#loan-output',error.message);}
});
$('#repay').addEventListener('click',()=>{
  try{
    const s=bank.repay({loanId:'imaginary-30-dollar',centsRepaid:1200});
    describeMoney(s);
    $('#repay').disabled=true;
  }catch(error){write('#loan-output',error.message);}
});
