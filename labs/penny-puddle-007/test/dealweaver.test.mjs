import test from 'node:test';
import assert from 'node:assert/strict';
import {createDealFixture,composeMutualDeals,admissibleDeal} from '../dealweaver.mjs';
import {suggestAssetDoors,oversizedFixture} from '../asset-doors.mjs';
import {createPrincipalOnlyBridge} from '../principal-only.mjs';

test('mutual exchange rejects coercion and owner losing productive asset',()=>{
 const f=createDealFixture();const s=composeMutualDeals(f);
 const sale=s.declinedOrHeld.find(x=>x.id==='kiln-whole-sale');
 assert.ok(sale);
 assert.ok(sale.reasons.includes('permission-refused'));
 assert.ok(sale.reasons.includes('not-win-win-for-every-party'));
 assert.ok(sale.reasons.includes('owner-title-transfer-not-permitted'));
 assert.equal(s.paretoFrontier.some(x=>x.dealIds.includes('kiln-whole-sale')),false);
});
test('a high-value asset yields two nonoverlapping use rights while owner retains title',()=>{
 const f=createDealFixture();const s=composeMutualDeals(f,{maxAgreements:3});
 assert.ok(s.paretoFrontier.length>0);
 const optimal=s.paretoFrontier.find(x=>x.dealIds.includes('kiln-saturday')&&
   x.dealIds.includes('kiln-later')&&x.dealIds.includes('hall-story'));
 assert.ok(optimal,'Two kiln time windows and a hall event may coexist');
 assert.equal(optimal.realAssetUseGranted,false);
 assert.equal(optimal.terms.every(x=>x.safeguards.includes('owner-retains-title')),true);
 assert.ok(optimal.score.minParticipantGain>0);
 assert.equal(s.realRightsGranted,0);
 assert.equal(s.actualCashTransferredCents,0);
});
test('the same hall and time window cannot be assigned twice',()=>{
 const s=composeMutualDeals(createDealFixture(),{maxAgreements:3});
 for(const combo of s.paretoFrontier){
  assert.equal(combo.dealIds.includes('hall-story')&&combo.dealIds.includes('hall-conflict'),false);
 }
});
test('planet impact stays a labeled scenario, not an environmental guarantee or market price',()=>{
 const s=composeMutualDeals(createDealFixture());
 assert.equal(s.profitPeoplePlanetAreSeparateSignals,true);
 assert.equal(s.noGlobalPriceDiscovery,true);
 assert.equal(s.winnerChosenForHumans,false);
 for(const x of s.paretoFrontier){
  assert.equal(x.independentImpactVerified,false);
  assert.equal(x.score.notMonetized,true);
  assert.ok(x.score.evidenceQuality.every(y=>['participant-assertion','unverified-scenario','independent-test-fixture'].includes(y)));
 }
});
test('a negative participant gain cannot be outweighed by positive community points',()=>{
 const f=createDealFixture();
 const d=f.opportunities.find(x=>x.id==='hall-story');
 d.declaredNetBenefits.artist=-1;
 d.impact.people=10; d.impact.planet=10;
 const s=composeMutualDeals(f);
 assert.ok(s.declinedOrHeld.some(x=>x.id==='hall-story'&&
  x.reasons.includes('not-win-win-for-every-party')));
 assert.equal(s.paretoFrontier.some(x=>x.dealIds.includes('hall-story')),false);
});
test('lack of real owner/participant permission blocks otherwise useful shared use',()=>{
 const f=createDealFixture();
 f.opportunities[0].permissions.ownerWillingToNegotiate=false;
 const s=composeMutualDeals(f);
 assert.equal(s.paretoFrontier.some(x=>x.dealIds.includes('kiln-saturday')),false);
});
test('gold-sized, unverifiable object is not priced, pawned, subdivided or tokenized',()=>{
 const result=suggestAssetDoors(oversizedFixture());
 assert.equal(result.suggestedDoors.length,6);
 assert.equal(result.assetMarketValueVerified,false);
 assert.equal(result.inventedQuoteCents,null);
 assert.equal(result.unitsFractionalized,0);
 assert.equal(result.actualMoneyMovedCents,0);
 const finance=result.suggestedDoors.find(x=>x.category==='secured-finance');
 assert.match(finance.feasibility,/BLOCKED/);
 const sale=result.suggestedDoors.find(x=>x.id==='authorized-whole-item-sale');
 assert.match(sale.feasibility,/HOLD/);
 const use=result.suggestedDoors.find(x=>x.category==='use-right');
 assert.equal(use.feasibility,'conditional-review');
 assert.equal(use.actualLiquidityCreatedCents,0);
});
test('an already pledged large asset cannot be used as duplicate collateral',()=>{
 const x=suggestAssetDoors({...oversizedFixture(),currentlyPledged:true});
 assert.ok(x.suggestedDoors.filter(y=>['sale','coordinated-purchase','physical-division','secured-finance'].includes(y.category))
  .every(y=>y.feasibility==='BLOCKED-EXISTING-PLEDGE'));
});
test('0% principal-only bridge cannot issue more than fictional pool',()=>{
 const bank=createPrincipalOnlyBridge({fictionalAvailableCents:5000,fictionalLossCoverCents:1000,
  fictionalAdminSponsorCents:300});
 assert.throws(()=>bank.propose({loanId:'too-much',borrowerId:'a',principalCents:5500,
  borrowerConsentForModel:true,documentedNeed:'essential-repair',
  capacityReviewedByIndependentPartner:true}),/Insufficient/);
 const s=bank.propose({loanId:'small',borrowerId:'a',principalCents:3000,
  borrowerConsentForModel:true,documentedNeed:'essential-repair',
  capacityReviewedByIndependentPartner:true});
 assert.equal(s.fictionalCashAvailableCents,2000);
 assert.equal(s.fictionalOutstandingPrincipalCents,3000);
 assert.equal(s.APR,0);assert.equal(s.borrowerFeeCents,0);
 assert.equal(s.realCashDisbursedCents,0);
 assert.equal(s.createdRealLoan,false);
});
test('community microloan requires voluntary consent and separate ability-to-repay review',()=>{
 const b=createPrincipalOnlyBridge({fictionalAvailableCents:4000});
 assert.throws(()=>b.propose({loanId:'1',borrowerId:'a',principalCents:1000,
  borrowerConsentForModel:false,documentedNeed:'repair',capacityReviewedByIndependentPartner:true}),/consent/);
 assert.throws(()=>b.propose({loanId:'1',borrowerId:'a',principalCents:1000,
  borrowerConsentForModel:true,documentedNeed:'repair',capacityReviewedByIndependentPartner:false}),/capacity/);
 assert.equal(b.snapshot().fictionalOutstandingPrincipalCents,0);
});
test('partial repayment replenishes only repaid principal, never imaginary interest',()=>{
 const b=createPrincipalOnlyBridge({fictionalAvailableCents:4000});
 b.propose({loanId:'a',borrowerId:'a',principalCents:3000,
  borrowerConsentForModel:true,documentedNeed:'tools',capacityReviewedByIndependentPartner:true});
 const s=b.repay({loanId:'a',centsRepaid:700});
 assert.equal(s.fictionalCashAvailableCents,1700);
 assert.equal(s.fictionalOutstandingPrincipalCents,2300);
 assert.throws(()=>b.repay({loanId:'a',centsRepaid:2301}),/No excess/);
 assert.equal(s.loans[0].interestCents,0);
});
test('default destroys loan principal and consumes explicit sponsor loss buffer, not borrower asset',()=>{
 const b=createPrincipalOnlyBridge({fictionalAvailableCents:4000,fictionalLossCoverCents:600});
 b.propose({loanId:'a',borrowerId:'a',principalCents:1000,borrowerConsentForModel:true,
  documentedNeed:'transport',capacityReviewedByIndependentPartner:true});
 const s=b.recordWriteOff({loanId:'a',stewardApprovedForModel:true,
  lossReviewEvidence:'hypothetical-approval',sponsorMayCoverLoss:true});
 assert.equal(s.fictionalCashAvailableCents,3600);
 assert.equal(s.fictionalSponsorLossCoverCents,0);
 assert.equal(s.fictionalUnrecoveredWriteOffCents,400);
 assert.equal(s.loans[0].status,'written-off');
 assert.equal(s.realCollateralPledged,false);
 assert.equal(s.collectionEnforcementEnabled,false);
});
test('no disguised fees or sponsor pay from borrower principal',()=>{
 const b=createPrincipalOnlyBridge({fictionalAvailableCents:1000,fictionalAdminSponsorCents:50});
 b.sponsorPayAdmin({eventId:'review-1',costCents:30});
 const s=b.snapshot();
 assert.equal(s.fictionalCashAvailableCents,1000);
 assert.equal(s.fictionalAdminSponsorCents,20);
 assert.equal(s.fictionalAdminCostPaidCents,30);
 assert.equal(s.borrowerFeeCents,0);
 assert.throws(()=>b.sponsorPayAdmin({eventId:'review-1',costCents:1}),/Duplicate/);
 assert.throws(()=>b.sponsorPayAdmin({eventId:'review-2',costCents:21}),/insufficient/);
});
test('no invented repayment after write-off',()=>{
 const b=createPrincipalOnlyBridge({fictionalAvailableCents:1000});
 b.propose({loanId:'a',borrowerId:'a',principalCents:300,
  borrowerConsentForModel:true,documentedNeed:'transport',capacityReviewedByIndependentPartner:true});
 b.recordWriteOff({loanId:'a',stewardApprovedForModel:true,lossReviewEvidence:'reviewed',
  sponsorMayCoverLoss:false});
 assert.throws(()=>b.repay({loanId:'a',centsRepaid:300}),/No active/);
 assert.equal(b.snapshot().fictionalCashAvailableCents,700);
 assert.equal(b.snapshot().fictionalUnrecoveredWriteOffCents,300);
});
