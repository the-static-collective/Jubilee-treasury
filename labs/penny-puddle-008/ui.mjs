import {createAngelPuddle} from './angel-puddle.mjs';
const app=createAngelPuddle({
  campaignId:'demo-rent',beneficiaryId:'person-A',payeeId:'fictional-landlord',
  sponsorId:'angel-B',goalCents:30000,
  separatelyPrefundedLikeReserveCents:3,
  publicCause:'One month of rent, already covered after angel sponsorship'
});
const $=s=>document.querySelector(s);
const show=(s,text)=>{$(s).textContent=text;};
const usd=c=>'$'+(c/100).toFixed(2);
let donorCount=0,reimbursed=false,community=false,recycled=false;
let endorsementCount=0,likeCount=0;
function update(){
  const s=app.snapshot();
  show('#rent',usd(s.syntheticPayeePaidCents));
  show('#angel',usd(s.sponsorNetRecoveryCents));
  show('#pool',usd(s.communityFundCents));
  show('#ledger-status','All synthetic support: '+usd(s.conservation.allSyntheticExternalSupportCents)+
    ' = original payee allocation '+usd(s.syntheticPayeePaidCents)+
    ' + sponsor net recovery '+usd(s.sponsorNetRecoveryCents)+
    ' + community balance '+usd(s.communityFundCents)+
    '\nConservation: '+(s.conservation.balanced?'BALANCED':'BROKEN')+
    '\nActual money moved: $0.00. Borrower debt: $0.00.');
  if(s.certificate){
    show('#certificate',s.certificate.certificateId+
      '\nHistory: fictional direct rent coverage '+usd(s.certificate.originallyAddressedNeedCents)+
      '\nUntransferable impact record, not an instrument or guaranteed return.');
  }
  if(s.syntheticPayeePaidCents){
    for(const name of ['#replenish','#community','#endorse','#funded'])$(name).disabled=false;
    if(!reimbursed)$('#recycle').disabled=true;
    if(likeCount>=3)$('#funded').disabled=true;
  }
}
function run(button,display,callback){
  $(button).addEventListener('click',()=>{
    try{show(display,callback());update();}
    catch(e){show(display,e instanceof Error?e.message:'Simulation refused');}
  });
}
run('#review','#need-status',()=>{
  app.verifyNeed({eventId:'need-reviewed',reviewerId:'fictional-independent-reviewer',
    evidenceReference:'invented-private-bill-data'});
  $('#review').disabled=true;$('#pay').disabled=false;
  return 'Independent review ASSERTED IN FIXTURE; no real landlord or rent bill verified. Angel can now simulate a direct payment.';
});
run('#pay','#need-status',()=>{
  app.sponsorPaysPayee({eventId:'mock-payee-payment',actorId:'angel-B',
    amountCents:30000,paymentReference:'invented-landlord-payment-evidence',
    sponsorAffirmed:true,independentPayeeReceiptAsserted:true});
  $('#pay').disabled=true;
  return 'FICTIONAL: Angel B covered $300 with a payee receipt assertion. Person A owes $0. Subsequent support MUST disclose a new designation.';
});
run('#replenish','#donor-status',()=>{
  donorCount++;
  app.donate({eventId:'sponsor-replenishment-'+donorCount,
    donorId:'fictional-donor-'+donorCount,amountCents:3000,
    designation:'replenish-sponsor'});
  reimbursed=true;
  $('#recycle').disabled=false;
  return 'Fictional donor knowingly directed $30 toward reimbursing Angel B—not paying the landlord again. No real payment.';
});
run('#community','#donor-status',()=>{
  donorCount++;
  app.donate({eventId:'community-donation-'+donorCount,
    donorId:'fictional-donor-'+donorCount,amountCents:2000,
    designation:'next-community-need'});
  community=true;
  return 'Fictional donor knowingly directed $20 to the general next-need pool. The original landlord already received full modeled payment.';
});
run('#recycle','#donor-status',()=>{
  if(recycled)throw new Error('This UI demonstrates the $15 recycle event only once.');
  app.sponsorRecycles({eventId:'sponsor-recycled-15',actorId:'angel-B',amountCents:1500});
  recycled=true;$('#recycle').disabled=true;
  return 'Angel B voluntarily redirected $15 of *simulated* reimbursements to future community help. No second payment from Person A.';
});
run('#endorse','#like-status',()=>{
  endorsementCount++;
  app.endorse({eventId:'unfunded-like-'+endorsementCount,actorId:'unfunded-actor-'+endorsementCount});
  return 'Unfunded endorsements: '+endorsementCount+'. Monetary effect: $0. Social clout may help visibility but is NOT a cash reserve.';
});
run('#funded','#like-status',()=>{
  likeCount++;
  app.fundedLike({eventId:'funded-like-'+likeCount,actorId:'sponsored-actor-'+likeCount});
  const s=app.snapshot();
  return 'Pre-funded mock sponsor-pool pennies allocated to future community help: '+s.fundedLikeCents+
    '¢. Remaining independent sponsor budget: '+s.likeReserveRemainingCents+'¢. No actual funds.';
});
update();
