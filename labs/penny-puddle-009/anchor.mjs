/**
 * ANCHOR-009: "An object need not move for a bounded, real counterparty
 * commitment to facilitate another useful agreement." Pure fake scenario.
 * Gold is never assigned dollars, created as collateral, tokenized or sold.
 *
 * This is NOT a guarantee/insurance/loan product. It is an arithmetic rehearsal
 * to distinguish: buyer-sponsored cash, authorized liquidity, potential loss,
 * title, and lender recourse.
 */
const cents=(n,k,zero=true)=>{
  if(!Number.isSafeInteger(n)||n<(zero?0:1)||n>1000000000)
    throw new TypeError(k+' must be bounded integer cents');return n;
};
const text=(v,k)=>{
  if(typeof v!=='string'||!v.trim()||v.length>180)throw new TypeError(k+' requires short text');return v;
};
export function createAnchorFixture(overrides={}){
  return {
    asset:{id:'fictional-giant-gold-like-object',
      physicalMassVerified:false,metalAssayed:false,legalTitleVerified:false,
      ownerKeepsTitle:true,currentlyPledged:false,materialValueCents:null,
      custody:'unverified',...overrides.asset},
    urgentNeed:{id:'rent-A',amountCents:30000,beneficiaryOwesSponsor:false,
      ...overrides.urgentNeed},
    angel:{id:'angel-B',cashAvailableCents:30000,
      maxVoluntaryUncoveredLossCents:7500,...overrides.angel},
    standby:{id:'possible-regulated-credit-partner',committedCashCents:22500,
      ownerOfferedRiskCapCents:22500,assetOwnerId:'gold-owner',
      identityTitleAssayLegalAndUnderwritingApprovedInFixture:true,
      independentlyAvailableCashInFixture:true,
      ...overrides.standby},
    licensedRights:[
      {id:'photo-license',right:'non-exclusive-image',
        sponsoredGrossCents:11000,productionAndRightsCostCents:3000,
        counterpartyWillingInFixture:true,ownerConsentedInFixture:true,
        independentSponsorMoneyInFixture:true},
      {id:'museum-exhibit',right:'exclusive-physical-exhibition',
        sponsoredGrossCents:20000,productionAndRightsCostCents:30000,
        counterpartyWillingInFixture:true,ownerConsentedInFixture:true,
        independentSponsorMoneyInFixture:true}
    ],
    ...Object.fromEntries(Object.entries(overrides).filter(([k])=>!['asset','urgentNeed','angel','standby'].includes(k)))
  };
}
export function planAnchor(f){
  const {asset,urgentNeed:need,angel,standby,licensedRights}=f;
  for(const x of [asset.id,need.id,angel.id,standby.id,standby.assetOwnerId])text(x,'identifier');
  for(const [k,v] of Object.entries({
    need:need.amountCents,angelCash:angel.cashAvailableCents,
    angelLossBudget:angel.maxVoluntaryUncoveredLossCents,
    standbyCash:standby.committedCashCents,ownerCap:standby.ownerOfferedRiskCapCents
  }))cents(v,k);
  if(asset.currentlyPledged!==false||asset.ownerKeepsTitle!==true)
    throw new Error('Already pledged or owner does not retain title: HOLD');
  if(!Array.isArray(licensedRights)||licensedRights.length>12)
    throw new TypeError('At most 12 licensed-right proposals');
  const requiredLossCover=Math.max(0,need.amountCents-angel.maxVoluntaryUncoveredLossCents);
  const partnerScenarioApproved=standby.identityTitleAssayLegalAndUnderwritingApprovedInFixture===true &&
    standby.independentlyAvailableCashInFixture===true;
  const capacity=partnerScenarioApproved ?
    Math.min(standby.committedCashCents,standby.ownerOfferedRiskCapCents) : 0;
  const canModelPayment=angel.cashAvailableCents>=need.amountCents &&
    requiredLossCover<=capacity && need.beneficiaryOwesSponsor===false;
  const rights=licensedRights.map(right=>{
    text(right.id,'license id');
    if(!['non-exclusive-image','exclusive-physical-exhibition','time-limited-access'].includes(right.right))
      throw new TypeError('Unknown rights');
    cents(right.sponsoredGrossCents,'gross');
    cents(right.productionAndRightsCostCents,'cost');
    const assumedWilling=right.counterpartyWillingInFixture===true &&
      right.ownerConsentedInFixture===true &&
      right.independentSponsorMoneyInFixture===true;
    const net=assumedWilling ? right.sponsoredGrossCents-right.productionAndRightsCostCents : 0;
    return {
      id:right.id,right:right.right,
      modeledNetCents:net,
      economicallyPositiveInFixture:net>0,
      externallyFundedInFixture:assumedWilling,
      actualCashAvailableCents:0,
      createsTitleTransfer:false,
      source:'independently funded fictional third-party license, not gold appreciation'
    };
  });
  return {
    status:canModelPayment?'ready-to-simulate-conditional-relief':'HOLD-no-supported-financing',
    requiredMaxLossCoverCents:requiredLossCover,
    riskCapacityAssertedCents:capacity,
    contingentAssetOwnerRiskCeilingCents:capacity,
    angelCashToPayeeCents:canModelPayment?need.amountCents:0,
    realMoneyPaidCents:0,actualGuaranteeIssued:false,
    actualCollateralLienCreated:false,actualGoldValuationCents:null,
    preferredNoncreditAlternatives:rights,
    sourceOfPotentialLiquidity:capacity>0?'separate third-party lender cash; owner bears potential loss':
      'no valid counterparty cash capacity',
    notAuthorizedFinancialInstrument:true,
    titleAndAssayActuallyVerified:false
  };
}
/**
 * A closed one-cycle miniature of charitable advance + third-party contingent
 * first-loss reimbursement. Payment to person A's landlord ≠ loan to A.
 * This model never draws cash before fake donor inflows are declared.
 */
export function createAnchorCircle(f){
  const plan=planAnchor(f);
  if(plan.status!=='ready-to-simulate-conditional-relief')
    throw new Error('HOLD: required pre-funded risk coverage or angel liquidity missing');
  const {urgentNeed:need,angel,standby}=f;
  let paid=false,donorReimbursedAngel=0,donorReplenishedFacility=0,
    creditFacilityPaidAngel=0,settledLoss=false;
  const usedIds=new Set(),events=[];
  const record=(eventId,entry)=>{
    text(eventId,'event ID');
    if(usedIds.has(eventId))throw new Error('Duplicate event ID');
    usedIds.add(eventId);events.push({eventId,...entry});
  };
  const snapshot=()=>{
    const sourceCash= (paid ? need.amountCents : 0)+
      donorReimbursedAngel+donorReplenishedFacility+creditFacilityPaidAngel;
    const uses=(paid ? need.amountCents : 0)+donorReimbursedAngel+
      donorReplenishedFacility+creditFacilityPaidAngel;
    if(sourceCash!==uses)throw new Error('Cash-source conservation failed');
    const angelGrossRecovery=donorReimbursedAngel+creditFacilityPaidAngel;
    const openRisk=Math.max(0,creditFacilityPaidAngel-donorReplenishedFacility);
    return {
      syntheticOnly:true,scenario:'capped-owner-risk / independent prefunded standby cash',
      rentPayeeModeledPaidCents:paid?need.amountCents:0,
      personAHasDebtToAngelCents:0,
      originalNeedStillUnpaidCents:paid?0:need.amountCents,
      donorReplenishmentToAngelCents:donorReimbursedAngel,
      donorReplenishmentToFacilityCents:donorReplenishedFacility,
      standbyCashReleasedToAngelCents:creditFacilityPaidAngel,
      angelNetUnrecoveredCents:paid?need.amountCents-angelGrossRecovery:0,
      anchorOwnerCapitalAtRiskCents:openRisk,
      uncalledAssetOwnerRiskCents:plan.riskCapacityAssertedCents-creditFacilityPaidAngel,
      fallbackTriggered:settledLoss,
      events:events.map(e=>({...e})),
      proofOfActualAssetOrMoney:false,
      realCashMovedCents:0,actualGuaranteeIssued:false,
      verifiedFacilityDrawCents:0,realOwnerLiens:0,
      conservation:{fictionalExternalInflowCents:sourceCash,
        fictionalExternalOutflowCents:uses,balanced:sourceCash===uses},
      note:'An owner guarantee without independent available cash cannot pay anyone. The owner can lose property if a legally effective guarantee is later called.'
    };
  };
  function angelPays({eventId,angelId,modeledPayeeReceipt}){
    if(paid)throw new Error('Bill already covered');
    if(angelId!==angel.id||modeledPayeeReceipt!==true)
      throw new Error('Sponsor and separate payee receipt assertions required');
    record(eventId,{kind:'SIMULATED_ANGEL_DIRECT_RENT',cents:need.amountCents,
      payeeReceiptActuallyVerified:false});
    paid=true;return snapshot();
  }
  function donorReimburses({eventId,donorId,centsAmount}){
    text(donorId,'donor');
    cents(centsAmount,'donation',false);
    if(!paid||settledLoss)throw new Error('Support for angel must occur before waterfall is settled');
    if(centsAmount>need.amountCents-donorReimbursedAngel)
      throw new Error('Exceeds outstanding sponsor outlay');
    record(eventId,{kind:'FICTIONAL_EXPLICIT_ANGEL_REIMBURSEMENT',
      donorId,cents:centsAmount,actualDonation:false});
    donorReimbursedAngel+=centsAmount;return snapshot();
  }
  function finishWaterfall({eventId,partnerAvailableInFixture,independentShortfallReview}){
    if(!paid||settledLoss)throw new Error('Need paid exactly once and waterfall open');
    if(partnerAvailableInFixture!==true||independentShortfallReview!==true)
      throw new Error('Independent partner availability and payout assessment required');
    const residual=need.amountCents-donorReimbursedAngel;
    const required=Math.max(0,residual-angel.maxVoluntaryUncoveredLossCents);
    if(required>plan.riskCapacityAssertedCents)
      throw new Error('Guarantee cannot meet required risk bound');
    record(eventId,{kind:'FICTIONAL_FACILITY_DRAW',
      supportedBySeparateHypotheticalPartnerCashCents:required,actualSettlement:false});
    creditFacilityPaidAngel+=required;
    settledLoss=true;
    return snapshot();
  }
  function donorRestoresOwner({eventId,donorId,centsAmount}){
    text(donorId,'donor');
    cents(centsAmount,'restoration',false);
    if(!settledLoss)throw new Error('No called standby facility to restore');
    if(centsAmount>creditFacilityPaidAngel-donorReplenishedFacility)
      throw new Error('Cannot reimburse the same capital twice');
    record(eventId,{kind:'FICTIONAL_EXPLICIT_OWNER_FACILITY_RESTORATION',
      donorId,cents:centsAmount,actualMoneyReceived:false});
    donorReplenishedFacility+=centsAmount;
    return snapshot();
  }
  return {snapshot,angelPays,donorReimburses,finishWaterfall,donorRestoresOwner};
}
