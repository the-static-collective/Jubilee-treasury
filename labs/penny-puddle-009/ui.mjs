import {createAnchorFixture,planAnchor,createAnchorCircle} from './anchor.mjs';
import {composeAnchorMosaic} from './mosaic.mjs';
import {makeSatisfactionFixture,createSatisfactionWeave} from './satisfaction.mjs';
const $=x=>document.querySelector(x);
const usd=n=>'$'+(n/100).toFixed(2);
function run(button,target,fn){
 $(button).addEventListener('click',()=>{
  try{$(target).textContent=fn();}
  catch(e){$(target).textContent='HOLD: '+(e instanceof Error?e.message:'Simulation refused');}
 });
}
run('#deadend','#dead-result',()=>{
 const p=planAnchor(createAnchorFixture({standby:{independentlyAvailableCashInFixture:false}}));
 return 'No independently available cash capacity.\nStatus: '+p.status+
 '\nModeled cash reaching landlord: '+usd(p.angelCashToPayeeCents)+
 '\nGold still has no verified price or legal title.';
});
run('#anchor','#anchor-result',()=>{
 const s=createAnchorCircle(createAnchorFixture());
 s.angelPays({eventId:'pay',angelId:'angel-B',modeledPayeeReceipt:true});
 s.donorReimburses({eventId:'donor',donorId:'D',centsAmount:12000});
 const p=s.finishWaterfall({eventId:'partner',partnerAvailableInFixture:true,
  independentShortfallReview:true});
 return 'Angel initially pays: '+usd(p.rentPayeeModeledPaidCents)+
 '\nLater donor to angel: '+usd(p.donorReplenishmentToAngelCents)+
 '\nIndependent fictional capital partner to angel: '+usd(p.standbyCashReleasedToAngelCents)+
 '\nOwner potential collateral loss: '+usd(p.anchorOwnerCapitalAtRiskCents)+
 '\nAngel voluntarily absorbs: '+usd(p.angelNetUnrecoveredCents)+
 '\nRecipient debt: $0.00. Real funds paid: $0.00.';
});
run('#mosaic','#mosaic-result',()=>{
 const m=composeAnchorMosaic();
 return 'Fictional image license redirects: '+usd(m.licensedRightsUsed[0].netWillinglyDonatedToPayeeCents)+
 '\nAngel supplies remaining rent: '+usd(m.angelPaymentToPayeeCents)+
 '\nLater donors to angel: '+usd(m.donorDesignatedAngelReplenishmentCents)+
 '\nContingent third-party capital: '+usd(m.thirdPartyFacilityPayoutToAngelCents)+
 '\nGold owner risk after those donors: '+usd(m.assetOwnerPotentialCapitalLossCents)+
 '\nSources/uses: '+usd(m.sources.totalCents)+' / '+usd(m.destinations.totalCents)+
 '\nObject remains with owner. Actual cash: $0.00.';
});
run('#satisfaction','#satisfaction-result',()=>{
 const lab=createSatisfactionWeave(makeSatisfactionFixture());
 for(const x of [
   ['image','image-right','G','F'],
   ['video','promo-video','F','E'],
   ['repair','electrical-repair','E','L']
 ]){
   lab.complete({eventId:x[0],stepId:x[1],fromActorId:x[2],toActorId:x[3],
    providerAndReceiverAffirmedInFixture:true,evidenceReference:'mock-performance'});
 }
 const s=lab.acceptNoncashSettlement({eventId:'waiver',creditorActorId:'L',
   explicitVoluntaryWaiverInFixture:true,evidenceReference:'invented-landlord-approval'});
 return 'G licenses a story/image to F.\nF supplies a promotional film to E.\nE supplies repairs to landlord L.\nL voluntarily accepts the services and waives A\'s rent — IN FICTION ONLY.\n'+
 'Modelled debt relief: '+usd(s.modeledReliefAcceptedCents)+
 '\nLegally verified debt discharge: '+usd(s.legallyWaivedDebtCents)+
 '\nCash changing hands: '+usd(s.cashActuallyChangedHandsCents)+
 '\nObject transferred: NO. Verified human performance: NO.';
});
