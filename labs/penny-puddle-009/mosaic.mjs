import {createAnchorFixture,planAnchor} from './anchor.mjs';
/**
 * ANCHOR MOSAIC — a hypothetical giant object's independent non-title channels:
 * - consensual licensed image/story (a distinct sponsor's money);
 * - an angel's already-held liquid dollars;
 * - a third-party standby cash facility with owner loss risk;
 * - later donors' separately contributed cash.
 *
 * Rights, liquidity, and risk are separate ledgers; fictional calculations
 * demonstrate feasibility, not an enforceable financial arrangement.
 */
const money=(x,label)=>{
  if(!Number.isSafeInteger(x)||x<0||x>1_000_000_000)
    throw new TypeError(label+' must be nonnegative bounded cents');return x;
};
export function composeAnchorMosaic(f=createAnchorFixture(),{
  selectedLicenseId='photo-license',
  ownerWillinglyRedirectsNetLicenseProceedsToNeed=true,
  postPaymentDonorsToAngelCents=12000
}={}){
  const p=planAnchor(f);
  const rights=p.preferredNoncreditAlternatives;
  const right=rights.find(x=>x.id===selectedLicenseId);
  if(!right)throw new Error('Unmodeled licensed-right proposal');
  money(postPaymentDonorsToAngelCents,'donor cents');
  const licensed=right.economicallyPositiveInFixture &&
    ownerWillinglyRedirectsNetLicenseProceedsToNeed===true;
  const license= f.licensedRights.find(x=>x.id===selectedLicenseId);
  const licenseGross=licensed?license.sponsoredGrossCents:0;
  const licenseCosts=licensed?license.productionAndRightsCostCents:0;
  const licenseDirectPayeeCents=licensed?right.modeledNetCents:0;
  const originalNeed=f.urgentNeed.amountCents;
  const remainingBill=Math.max(0,originalNeed-licenseDirectPayeeCents);
  const angelCash=Math.min(f.angel.cashAvailableCents,remainingBill);
  const angelTolerance=f.angel.maxVoluntaryUncoveredLossCents;
  // 007 / 008 recipient-free-debt: only donor and owner-backed standbys
  // can replenish the angel. No compulsory personal repayment.
  const neededGuarantee=Math.max(0,remainingBill-angelTolerance);
  const capacity=p.riskCapacityAssertedCents;
  const permitted=remainingBill<=f.angel.cashAvailableCents &&
    neededGuarantee<=capacity &&
    f.urgentNeed.beneficiaryOwesSponsor===false;
  if(!permitted)return {
    status:'HOLD-real-independent-funding-or-risk-capacity-missing',
    originalNeedCents:originalNeed,
    licenseDirectPayeeCents,
    remainingBillCents:remainingBill,
    requiredRiskCoverageCents:neededGuarantee,
    hypotheticalOwnerRiskCapCents:capacity,
    actualMoneyMovedCents:0,actualGoldValueCents:null,
    recipientDebtCents:0,sourcesSeparate:true
  };
  const donor=Math.min(postPaymentDonorsToAngelCents,remainingBill);
  const waterfallDraw=Math.max(0,remainingBill-donor-angelTolerance);
  if(waterfallDraw>capacity || waterfallDraw>f.standby.committedCashCents)
    throw new Error('No funded contingent cash source at waterfall draw');
  const angelGrossRecovery=donor+waterfallDraw;
  const angelUnrecovered=remainingBill-angelGrossRecovery;
  const outsideSources=licenseGross+angelCash+donor+waterfallDraw;
  const uses=licenseCosts+originalNeed+angelGrossRecovery;
  if(outsideSources!==uses)throw new Error('No money without independently modeled sources');
  return {
    status:'synthetic-source-conserved-plan-no-actual-money',
    ownerKeepsPhysicalObject:true,
    originalNeedCents:originalNeed,
    licensedRightsUsed:[{right:license.right,
      source:'invented consented licensee budget',grossCents:licenseGross,
      productionCostCents:licenseCosts,
      netWillinglyDonatedToPayeeCents:licenseDirectPayeeCents}],
    angelPaymentToPayeeCents:angelCash,
    donorDesignatedAngelReplenishmentCents:donor,
    thirdPartyFacilityPayoutToAngelCents:waterfallDraw,
    angelResidualVoluntaryLossCents:angelUnrecovered,
    assetOwnerPotentialCapitalLossCents:waterfallDraw,
    beneficiaryDebtCents:0,
    sources:{
      licensedSponsorGrossCents:licenseGross,angelSeparateCashCents:angelCash,
      donorSeparateCashCents:donor,
      standbyPartnerSeparateCashCents:waterfallDraw,
      totalCents:outsideSources
    },
    destinations:{
      licenseProductionCents:licenseCosts,rentPayeeCents:originalNeed,
      angelReimbursementCents:angelGrossRecovery,
      totalCents:uses
    },
    conservationChecked:true,
    otherIndependentUseRightsNotAllocatedAutomatically:true,
    noDoubleCountOfGoldAsCash:true,
    actualSponsorConsentVerified:false,actualBorrowerDebtCents:0,
    actualMoneyMovedCents:0,actualGoldAppraisalCents:null,
    externalGuaranteeLegallyApproved:false,
    trueNoveltyClaimVerified:false,
    interpretation:'Orchestrating use-rights and limited risk capacity may unlock a deal without liquidating an asset; the sources still come from other parties and the owner can incur real loss.'
  };
}
