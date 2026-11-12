import {createAnchorFixture,planAnchor,createAnchorCircle} from './anchor.mjs';
import {createAnchorCapacityLab} from './commitment-registry.mjs';
import {composeAnchorMosaic} from './mosaic.mjs';
import {makeSatisfactionFixture,createSatisfactionWeave} from './satisfaction.mjs';

/** Four ways to reason about a giant illiquid object without selling it. */
export function runAnchorFrontier(){
  const f=createAnchorFixture();
  const noPartner=planAnchor(createAnchorFixture({
    standby:{independentlyAvailableCashInFixture:false}
  }));
  const supported=planAnchor(f);
  const angel=createAnchorCircle(f);
  angel.angelPays({eventId:'mock-rent-payment',angelId:'angel-B',
    modeledPayeeReceipt:true});
  angel.donorReimburses({eventId:'mock-new-donor',donorId:'D',centsAmount:12000});
  const beforeRestoration=angel.finishWaterfall({eventId:'mock-draw',
    partnerAvailableInFixture:true,independentShortfallReview:true});
  const afterRestoration=angel.donorRestoresOwner({eventId:'mock-facility-replenishment',
    donorId:'E',centsAmount:6000});
  const registry=createAnchorCapacityLab({
    assetId:f.asset.id,ownerId:f.standby.assetOwnerId,
    scenarioRiskCeilingCents:22500,partnerHypotheticalAvailableCents:22500,
    ownerExplicitlyConsentsInFixture:true,
    partnerHypotheticallyAcceptsAssayTitleAndGuarantee:true
  });
  registry.reserve({eventId:'hold-asset-risk',campaignId:'rent-1',maximumCents:22500});
  const afterHold=registry.snapshot();
  registry.call({eventId:'mock-facility-draw',campaignId:'rent-1',amountCents:10500,
    independentPartnerCallApproved:true});
  const afterCall=registry.snapshot();
  const mosaic=composeAnchorMosaic(f);
  const noncash=createSatisfactionWeave(makeSatisfactionFixture());
  noncash.complete({eventId:'image',stepId:'image-right',fromActorId:'G',toActorId:'F',
    providerAndReceiverAffirmedInFixture:true,evidenceReference:'fictional-right'});
  noncash.complete({eventId:'promo',stepId:'promo-video',fromActorId:'F',toActorId:'E',
    providerAndReceiverAffirmedInFixture:true,evidenceReference:'fictional-film'});
  noncash.complete({eventId:'repair',stepId:'electrical-repair',fromActorId:'E',toActorId:'L',
    providerAndReceiverAffirmedInFixture:true,evidenceReference:'fictional-repair'});
  const mockSatisfied=noncash.acceptNoncashSettlement({eventId:'creditor-choice',
    creditorActorId:'L',explicitVoluntaryWaiverInFixture:true,
    evidenceReference:'fictional-landlord-acceptance'});
  return {
    name:'Jubilee Treasury / ANCHOR-009 — Settle the need, not the gold',
    claim:'An illiquid object can support *multiple distinct, voluntary agreements* when its rights, use, and contingent downside are represented separately, but no money is created from the object.',
    everyInputIsFictional:true,
    baselineWithoutFinancing:{
      status:noPartner.status,
      actualFundsMovedCents:0,
      proposedAssetBackedRiskCapacityCents:noPartner.riskCapacityAssertedCents
    },
    conditionalLossAbsorption:{
      status:supported.status,
      contingencyCapacityCents:supported.riskCapacityAssertedCents,
      donorPaybackToAngelCents:beforeRestoration.donorReplenishmentToAngelCents,
      standbyPartnerPayoutCents:beforeRestoration.standbyCashReleasedToAngelCents,
      angelVoluntaryLossCents:beforeRestoration.angelNetUnrecoveredCents,
      assetOwnerRiskBeforeLaterDonationCents:beforeRestoration.anchorOwnerCapitalAtRiskCents,
      assetOwnerRiskAfterLaterDonationCents:afterRestoration.anchorOwnerCapitalAtRiskCents,
      cashSourceConserved:afterRestoration.conservation.balanced,
      doubleCommitPrevention:{
        totalCapacityCents:afterHold.scenarioRiskCeilingCents,
        reservedCents:afterHold.stillReservedCents,
        capacityAfterCallCents:afterCall.remainingAvailableForNewAssuranceCents,
        backingConserved:afterCall.backingConserved
      }
    },
    licensedRepresentationPlusAngelAndStandby:{
      ownerKeepsTitle:mosaic.ownerKeepsPhysicalObject,
      licenseToRentCents:mosaic.licensedRightsUsed[0].netWillinglyDonatedToPayeeCents,
      angelCashCents:mosaic.angelPaymentToPayeeCents,
      contingentFacilityCents:mosaic.thirdPartyFacilityPayoutToAngelCents,
      hypotheticalOwnerCapitalRiskCents:mosaic.assetOwnerPotentialCapitalLossCents,
      conserved:mosaic.conservationChecked,
      actuallyPaidCents:mosaic.actualMoneyMovedCents
    },
    noncashSatisfactionChain:{
      source:'G gold image license → F video for E → E repair for L → L voluntary rent release for A',
      modeledCreditorReliefCents:mockSatisfied.modeledReliefAcceptedCents,
      legallyDischargedCents:mockSatisfied.legallyWaivedDebtCents,
      actuallyDeliveredCount:0,
      cashTransferredCents:mockSatisfied.cashActuallyChangedHandsCents,
      goldTitleChanged:false,
      realContractVerified:false
    },
    conclusion:'Cannot conjure liquid cash without somebody actually providing cash, work, goods, or an enforceable agreed waiver. The new opportunity is an intelligent match of these possible satisfactions and source-owned rights.',
    actualTransactions:0,realMoneyMovedCents:0,
    pendingReviews:['title-and-assay','payee-or-creditor-consent',
      'intellectual-property-and-usage-rights','regulated-funding-partner',
      'independent-cash-and-performance-receipts','property-risk-and-default',
      'tax-charity-securities-insurance-and-lending-law']
  };
}
if(process.argv?.[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
  console.log(JSON.stringify(runAnchorFrontier(),null,2));
