/**
 * PRINCIPAL-ONLY BRIDGE / 007
 * Hypothetical sponsor-financed cash pool. No actual capital, lending,
 * escrow, disbursement, interest, credit authorization, wage assignment,
 * collections, or bank integration. Repayment is never assumed.
 */
const cents=(n,name,allowZero=false)=>{
 if(!Number.isSafeInteger(n)||n<(allowZero?0:1)||n>1000000000)
  throw new TypeError(name+' must be bounded integer cents');return n;
};
const ident=(x,name)=>{
 if(typeof x!=='string'||!x.trim()||x.length>100)throw new TypeError(name+' must be a short ID');
 return x;
};
export function createPrincipalOnlyBridge({fictionalAvailableCents,fictionalLossCoverCents=0,
 fictionalAdminSponsorCents=0}){
 cents(fictionalAvailableCents,'available cash',true);
 cents(fictionalLossCoverCents,'loss cover',true);
 cents(fictionalAdminSponsorCents,'administrative sponsor',true);
 let available=fictionalAvailableCents;
 let lossCover=fictionalLossCoverCents;
 let adminSponsor=fictionalAdminSponsorCents;
 let creditLost=0, recoveredPrincipal=0, adminSpent=0;
 const loans=new Map(),events=[];
 const snapshot=()=>({
  fictionalCashAvailableCents:available,fictionalOutstandingPrincipalCents:
   [...loans.values()].reduce((sum,l)=>sum+(l.status==='outstanding'?l.remainingPrincipalCents:0),0),
  fictionalSponsorLossCoverCents:lossCover,fictionalAdminSponsorCents:adminSponsor,
  fictionalPrincipalPreviouslyRepaidCents:recoveredPrincipal,
  fictionalUnrecoveredWriteOffCents:creditLost,
  fictionalAdminCostPaidCents:adminSpent,
  loans:[...loans.values()].map(l=>({...l})),
  events:events.map(e=>({...e})),
  APR:0,interestRatePercent:0,borrowerFeeCents:0,latePenaltyCents:0,
  createdRealLoan:false,realCashDisbursedCents:0,actualBankAccountsConnected:0,
  realCollateralPledged:false,collectionEnforcementEnabled:false,
  inventedCapitalOnly:true
 });
 function propose({loanId,borrowerId,principalCents,borrowerConsentForModel,
  documentedNeed,capacityReviewedByIndependentPartner}){
  ident(loanId,'loan ID');ident(borrowerId,'borrower');
  cents(principalCents,'principal');
  if(loans.has(loanId))throw new Error('Duplicate loan ID');
  if(borrowerConsentForModel!==true)throw new Error('Explicit modeled borrower consent required');
  if(typeof documentedNeed!=='string'||!documentedNeed.trim())
   throw new Error('Need cannot be inferred from wealth, property or profile');
  if(capacityReviewedByIndependentPartner!==true)
   throw new Error('No microloan proposal without separately asserted repayment-capacity review');
  if(principalCents>available)throw new Error('Insufficient actually modeled pool principal');
  const loan={
   loanId,borrowerId,needCategory:documentedNeed,originalPrincipalCents:principalCents,
   remainingPrincipalCents:principalCents,status:'outstanding',
   interestCents:0,feesCents:0,latePenaltyCents:0,autoRenewal:false,
   claimOnLargeAsset:false,noCollateralPledged:true,
   titleOrRedemptionRightsTransferred:false,
   repaymentDeadline:'not-specified-in-demo',
   realOfferAvailable:false,realExternalDisbursement:false
  };
  available-=principalCents; loans.set(loanId,loan);
  events.push({loanId,kind:'FICTIONAL_PRINCIPAL_ALLOCATED',cents:principalCents});
  return snapshot();
 }
 function repay({loanId,centsRepaid}){
  ident(loanId,'loan ID');cents(centsRepaid,'repayment');
  const loan=loans.get(loanId);
  if(!loan||loan.status!=='outstanding')throw new Error('No active fictional principal');
  if(centsRepaid>loan.remainingPrincipalCents)throw new Error('No excess or interest may be collected');
  loan.remainingPrincipalCents-=centsRepaid;
  available+=centsRepaid;recoveredPrincipal+=centsRepaid;
  if(loan.remainingPrincipalCents===0)loan.status='repaid';
  events.push({loanId,kind:'FICTIONAL_PRINCIPAL_REPAID',cents:centsRepaid});
  return snapshot();
 }
 function recordWriteOff({loanId,stewardApprovedForModel,lossReviewEvidence,
  sponsorMayCoverLoss=false}){
  ident(loanId,'loan ID');
  const loan=loans.get(loanId);
  if(!loan||loan.status!=='outstanding')throw new Error('Loan is not outstanding');
  if(stewardApprovedForModel!==true||typeof lossReviewEvidence!=='string'||!lossReviewEvidence.trim())
   throw new Error('Recorded loss requires explicit, reviewed authority assertions');
  const shortfall=loan.remainingPrincipalCents;
  loan.remainingPrincipalCents=0;loan.status='written-off';
  creditLost+=shortfall;
  const covered=sponsorMayCoverLoss?Math.min(lossCover,shortfall):0;
  if(covered){
   lossCover-=covered;available+=covered;
   creditLost-=covered;
  }
  events.push({loanId,kind:'SIMULATED_WRITE_OFF',shortfallCents:shortfall,
   sponsorCoverageCents:covered,unrecoveredCents:shortfall-covered});
  return snapshot();
 }
 function sponsorPayAdmin({eventId,costCents}){
  ident(eventId,'admin event ID');cents(costCents,'administration cost');
  if(events.some(e=>e.eventId===eventId))throw new Error('Duplicate administrative expense');
  if(costCents>adminSponsor)throw new Error('Administrative sponsor budget insufficient');
  adminSponsor-=costCents;adminSpent+=costCents;
  events.push({eventId,kind:'FICTIONAL_SPONSOR_PAID_ADMIN',cents:costCents});
  return snapshot();
 }
 return {snapshot,propose,repay,recordWriteOff,sponsorPayAdmin};
}
