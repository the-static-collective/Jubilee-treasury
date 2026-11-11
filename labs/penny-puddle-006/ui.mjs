import {makeMeaningFixture,proposeDirectExchange} from './meaning-exchange.mjs';
import {createDirectOfferLab} from './consent-receipts.mjs';
const $=s=>document.querySelector(s);
const add=(parent,tag,text)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
const money=v=>'$'+(v/100).toFixed(2);
function render(policy){
  try{
    const model=proposeDirectExchange(makeMeaningFixture(),{policy});
    $('#match-total').textContent=String(model.selected.length);
    const container=$('#match-results');
    container.replaceChildren();
    if(!model.selected.length){
      const p=add(container,'p','No one can be matched under this particular rule. The coins and preferences have not changed.');
      p.className='notice';
    }
    for(const m of model.selected){
      const wrap=add(container,'section','');
      wrap.className='match';
      add(wrap,'strong',m.listingId+' → '+m.seekerId);
      const description=m.mode==='cash' ? ('Owner-listed price '+money(m.proposedAskCents)):
        m.mode==='trade' ? ('Proposed trade: '+m.tradeCategory):'Potential voluntary gift';
      add(wrap,'div',description);
      add(wrap,'p','Mutual meaning: '+m.matchedTags.join(' · '));
      const note=add(wrap,'small','Ungrаded / no ownership verification / awaiting two choices / no transaction');
      note.className='small';
    }
    for(const button of document.querySelectorAll('[data-policy]'))
      button.setAttribute('aria-pressed',String(button.dataset.policy===policy));
  }catch(err){$('#match-results').textContent=err instanceof Error?err.message:'Model failed';}
}
for(const button of document.querySelectorAll('[data-policy]'))
  button.addEventListener('click',()=>render(button.dataset.policy));
$('#mock-receipt').addEventListener('click',()=>{
  try{
    const lab=createDirectOfferLab(makeMeaningFixture());
    lab.propose({offerId:'fictional-1',listingId:'cent-1978',
      seekerId:'birthday-collector',mode:'cash',
      expressedMeaning:'I want a penny from this year because it matters to my family.'});
    lab.ownerRespond({offerId:'fictional-1',ownerId:'family-collection',accept:true});
    const output=lab.buyerRespond({offerId:'fictional-1',seekerId:'birthday-collector',accept:true});
    const offer=output.offers[0];
    $('#receipt-status').textContent=
      'PROPOSED: '+money(offer.terms.proposedPaymentCents)+' for '+offer.listingId+
      ' because of a self-declared personal meaning.\n'+
      'Mock owner consent: '+offer.ownerAffirmed+'. Mock buyer reaffirmation: '+offer.buyerReaffirmed+'.\n'+
      'STATUS: '+offer.status+'\nMONEY MOVED: '+money(output.realMoneyMovedCents)+
      '. COINS DELIVERED: '+output.realCoinsDelivered+
      '. TITLE OR AUTHENTICITY VERIFIED: NO.';
  }catch(err){$('#receipt-status').textContent=err instanceof Error?err.message:'Offer refused';}
});
render('meaning-first');
