import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnchorFixture,planAnchor,createAnchorCircle} from '../anchor.mjs';
import {createAnchorCapacityLab} from '../commitment-registry.mjs';
import {composeAnchorMosaic} from '../mosaic.mjs';

const capacity=()=>createAnchorCapacityLab({
  assetId:'gold-story',ownerId:'owner-G',
  scenarioRiskCeilingCents:22500,partnerHypotheticalAvailableCents:22500,
  ownerExplicitlyConsentsInFixture:true,
  partnerHypotheticallyAcceptsAssayTitleAndGuarantee:true
});
test('asset retains title and no gold valuation/real bank cash is invented',()=>{
 const p=planAnchor(createAnchorFixture());
 assert.equal(p.status,'ready-to-simulate-conditional-relief');
 assert.equal(p.requiredMaxLossCoverCents,22500);
 assert.equal(p.angelCashToPayeeCents,30000);
 assert.equal(p.actualGoldValuationCents,null);
 assert.equal(p.realMoneyPaidCents,0);
 assert.equal(p.actualCollateralLienCreated,false);
 assert.equal(p.titleAndAssayActuallyVerified,false);
});
test('an unverified or unapproved partner cannot magically make an illiquid gold object into cash',()=>{
 const p=planAnchor(createAnchorFixture({standby:{independentlyAvailableCashInFixture:false}}));
 assert.equal(p.status,'HOLD-no-supported-financing');
 assert.equal(p.riskCapacityAssertedCents,0);
 assert.equal(p.angelCashToPayeeCents,0);
 assert.throws(()=>createAnchorCircle(createAnchorFixture({asset:{partnerAcceptedTitleInFixture:false}})),/HOLD/);
});
test('even an enormous reported asset does not cover arbitrary risk exceeding separate standby cash',()=>{
 const p=planAnchor(createAnchorFixture({
   angel:{maxVoluntaryUncoveredLossCents:5000},
   standby:{committedCashCents:10000,ownerOfferedRiskCapCents:30000}
 }));
 assert.equal(p.requiredMaxLossCoverCents,25000);
 assert.equal(p.riskCapacityAssertedCents,10000);
 assert.equal(p.status,'HOLD-no-supported-financing');
});
test('angel covers landlord; no debt arises for recipient',()=>{
 const p=createAnchorCircle(createAnchorFixture());
 const s=p.angelPays({eventId:'paid',angelId:'angel-B',modeledPayeeReceipt:true});
 assert.equal(s.rentPayeeModeledPaidCents,30000);
 assert.equal(s.personAHasDebtToAngelCents,0);
 assert.equal(s.realCashMovedCents,0);
 assert.equal(s.conservation.balanced,true);
 assert.throws(()=>p.angelPays({eventId:'paid2',angelId:'angel-B',modeledPayeeReceipt:true}),/already covered/);
});
test('after independent donors, third-party facility pays only the remaining bounded risk slice',()=>{
 const p=createAnchorCircle(createAnchorFixture());
 p.angelPays({eventId:'paid',angelId:'angel-B',modeledPayeeReceipt:true});
 p.donorReimburses({eventId:'donor',donorId:'D',centsAmount:12000});
 const s=p.finishWaterfall({eventId:'loss-check',partnerAvailableInFixture:true,
    independentShortfallReview:true});
 assert.equal(s.donorReplenishmentToAngelCents,12000);
 assert.equal(s.standbyCashReleasedToAngelCents,10500);
 assert.equal(s.angelNetUnrecoveredCents,7500);
 assert.equal(s.anchorOwnerCapitalAtRiskCents,10500);
 assert.equal(s.personAHasDebtToAngelCents,0);
 assert.equal(s.conservation.fictionalExternalInflowCents,52500);
 assert.equal(s.conservation.balanced,true);
});
test('future donation restoring a facility reduces asset-owner exposure rather than double paying the angel',()=>{
 const p=createAnchorCircle(createAnchorFixture());
 p.angelPays({eventId:'paid',angelId:'angel-B',modeledPayeeReceipt:true});
 p.donorReimburses({eventId:'donor',donorId:'D',centsAmount:12000});
 p.finishWaterfall({eventId:'loss-check',partnerAvailableInFixture:true,independentShortfallReview:true});
 const s=p.donorRestoresOwner({eventId:'later',donorId:'E',centsAmount:6000});
 assert.equal(s.anchorOwnerCapitalAtRiskCents,4500);
 assert.equal(s.donorReplenishmentToFacilityCents,6000);
 assert.equal(s.donorReplenishmentToAngelCents,12000);
 assert.equal(s.standbyCashReleasedToAngelCents,10500);
 assert.equal(s.angelNetUnrecoveredCents,7500);
 assert.equal(s.conservation.balanced,true);
 assert.throws(()=>p.donorRestoresOwner({eventId:'later2',donorId:'E',centsAmount:5000}),/same capital twice/);
});
test('undesignated donor and unsupported guarantee must not create synthetic payment',()=>{
 const p=createAnchorCircle(createAnchorFixture());
 assert.throws(()=>p.angelPays({eventId:'m',angelId:'other',modeledPayeeReceipt:true}),/Sponsor/);
 assert.throws(()=>p.donorReimburses({eventId:'d',donorId:'D',centsAmount:100}),/before/);
 p.angelPays({eventId:'paid',angelId:'angel-B',modeledPayeeReceipt:true});
 assert.throws(()=>p.finishWaterfall({eventId:'short',partnerAvailableInFixture:true,
   independentShortfallReview:false}),/review/);
 assert.equal(p.snapshot().standbyCashReleasedToAngelCents,0);
});
test('risk capacity cannot be double committed to two different households',()=>{
 const r=capacity();
 r.reserve({eventId:'reserveA',campaignId:'A',maximumCents:20000});
 assert.throws(()=>r.reserve({eventId:'reserveB',campaignId:'B',maximumCents:5000}),/Insufficient/);
 const s=r.reserve({eventId:'reserveC',campaignId:'C',maximumCents:2500});
 assert.equal(s.remainingAvailableForNewAssuranceCents,0);
 assert.equal(s.stillReservedCents,22500);
 assert.equal(s.backingConserved,true);
});
test('standby calls consume reserved capital and do not create a renewable lending multiplier',()=>{
 const r=capacity();
 r.reserve({eventId:'reserveA',campaignId:'A',maximumCents:20000});
 r.call({eventId:'callA',campaignId:'A',amountCents:10000,
   independentPartnerCallApproved:true});
 const s=r.snapshot();
 assert.equal(s.calledOutstandingCents,10000);
 assert.equal(s.stillReservedCents,10000);
 assert.equal(s.hypotheticalPartnerCashCents,12500);
 assert.equal(s.remainingAvailableForNewAssuranceCents,2500);
 assert.equal(s.realBankCashMovedCents,0);
 assert.equal(s.backingConserved,true);
 assert.throws(()=>r.call({eventId:'overdraw',campaignId:'A',amountCents:10001,
   independentPartnerCallApproved:true}),/exceeds/);
});
test('released uncalled commitment can be reused, outstanding called amount remains at risk',()=>{
 const r=capacity();
 r.reserve({eventId:'reserveA',campaignId:'A',maximumCents:20000});
 r.call({eventId:'callA',campaignId:'A',amountCents:5000,
   independentPartnerCallApproved:true});
 const s=r.releaseUncalled({eventId:'releaseA',campaignId:'A'});
 assert.equal(s.calledOutstandingCents,5000);
 assert.equal(s.stillReservedCents,0);
 assert.equal(s.remainingAvailableForNewAssuranceCents,17500);
 assert.throws(()=>r.reserve({eventId:'reserveBig',campaignId:'B',maximumCents:18000}),/Insufficient/);
});
test('donor earmarked restoration releases modeled risk capacity only up to called loss',()=>{
 const r=capacity();
 r.reserve({eventId:'reserveA',campaignId:'A',maximumCents:22500});
 r.call({eventId:'callA',campaignId:'A',amountCents:10000,
   independentPartnerCallApproved:true});
 r.releaseUncalled({eventId:'releaseA',campaignId:'A'});
 assert.throws(()=>r.restore({eventId:'restoreNoConsent',campaignId:'A',
   donorId:'donor',amountCents:7000,donorChoseFacility:false}),/explicitly/);
 const s=r.restore({eventId:'restoreYes',campaignId:'A',donorId:'donor',
   amountCents:7000,donorChoseFacility:true});
 assert.equal(s.calledOutstandingCents,3000);
 assert.equal(s.hypotheticalPartnerCashCents,19500);
 assert.equal(s.remainingAvailableForNewAssuranceCents,19500);
 assert.equal(s.realGuaranteesIssued,0);
 assert.throws(()=>r.restore({eventId:'over',campaignId:'A',donorId:'donor',
    amountCents:4000,donorChoseFacility:true}),/more than/);
});
test('non-title licensed image rights can create distinct sponsor cash, but no verified income',()=>{
 const p=planAnchor(createAnchorFixture());
 const photo=p.preferredNoncreditAlternatives.find(x=>x.id==='photo-license');
 const exhibit=p.preferredNoncreditAlternatives.find(x=>x.id==='museum-exhibit');
 assert.equal(photo.modeledNetCents,8000);
 assert.equal(photo.actualCashAvailableCents,0);
 assert.equal(exhibit.modeledNetCents,-10000);
 assert.equal(exhibit.economicallyPositiveInFixture,false);
 assert.equal(p.actualGoldValuationCents,null);
});
test('mosaic composes donor-funded image right, angel liquidity and contingent partial backstop without moving gold',()=>{
 const m=composeAnchorMosaic();
 assert.equal(m.status,'synthetic-source-conserved-plan-no-actual-money');
 assert.equal(m.licensedRightsUsed[0].netWillinglyDonatedToPayeeCents,8000);
 assert.equal(m.angelPaymentToPayeeCents,22000);
 assert.equal(m.donorDesignatedAngelReplenishmentCents,12000);
 assert.equal(m.thirdPartyFacilityPayoutToAngelCents,2500);
 assert.equal(m.angelResidualVoluntaryLossCents,7500);
 assert.equal(m.assetOwnerPotentialCapitalLossCents,2500);
 assert.equal(m.destinations.rentPayeeCents,30000);
 assert.equal(m.sources.totalCents,47500);
 assert.equal(m.destinations.totalCents,47500);
 assert.equal(m.actualGoldAppraisalCents,null);
 assert.equal(m.actualMoneyMovedCents,0);
 assert.equal(m.beneficiaryDebtCents,0);
});
test('license funding requires another person and actual owner-consented redirection even in the mock',()=>{
 const m=composeAnchorMosaic(createAnchorFixture({licensedRights:[
  {id:'photo-license',right:'non-exclusive-image',sponsoredGrossCents:11000,
   productionAndRightsCostCents:3000,counterpartyWillingInFixture:false,
   ownerConsentedInFixture:true,independentSponsorMoneyInFixture:true}
 ]}));
 assert.equal(m.licensedRightsUsed[0].grossCents,0);
 assert.equal(m.angelPaymentToPayeeCents,30000);
 assert.equal(m.thirdPartyFacilityPayoutToAngelCents,10500);
});
test('surplus licensed sponsor income remains with owner rather than being credited twice to need',()=>{
 const m=composeAnchorMosaic(createAnchorFixture({licensedRights:[
  {id:'photo-license',right:'non-exclusive-image',sponsoredGrossCents:40000,
   productionAndRightsCostCents:1000,counterpartyWillingInFixture:true,
   ownerConsentedInFixture:true,independentSponsorMoneyInFixture:true}
 ]}));
 assert.equal(m.licensedRightsUsed[0].netWillinglyDonatedToPayeeCents,30000);
 assert.equal(m.destinations.licenseOwnerRetainedCents,9000);
 assert.equal(m.angelPaymentToPayeeCents,0);
 assert.equal(m.thirdPartyFacilityPayoutToAngelCents,0);
 assert.equal(m.sources.totalCents,m.destinations.totalCents);
});
