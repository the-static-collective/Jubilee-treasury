import {createDealFixture,composeMutualDeals} from './dealweaver.mjs';
import {suggestAssetDoors,oversizedFixture} from './asset-doors.mjs';
import {createPrincipalOnlyBridge} from './principal-only.mjs';
import {runMeaningExchange} from '../penny-puddle-006/demo.mjs';

export function runJubilee007(){
  const direct=runMeaningExchange();
  const deals=composeMutualDeals(createDealFixture(),{maxAgreements:3});
  const largest=suggestAssetDoors(oversizedFixture());
  const bridge=createPrincipalOnlyBridge({
    fictionalAvailableCents:5000,
    fictionalLossCoverCents:1500,
    fictionalAdminSponsorCents:250
  });
  bridge.propose({
    loanId:'fictional-neighbor-repair',borrowerId:'fictional-neighbor',
    principalCents:3000,borrowerConsentForModel:true,
    documentedNeed:'essential-tool-repair',
    capacityReviewedByIndependentPartner:true
  });
  const afterProposal=bridge.snapshot();
  bridge.repay({loanId:'fictional-neighbor-repair',centsRepaid:1200});
  const afterRepayment=bridge.snapshot();
  return {
    scenario:'PENNY × PUDDLE-007 / MAKE A GOOD DEAL',
    truth:'All stakeholders, assets, mutual gains, impact indicators, source dollars and decisions are fabricated. Nothing is offered or settled.',
    previousDirectExchange: {
      meaningFirstCandidates:direct.comparativeResults['meaning-first'].candidatePairings,
      gradeGatedCandidates:direct.comparativeResults['grade-gate'].candidatePairings
    },
    tripleBottomLine:deals,
    giantAssetMenu:largest.suggestedDoors.map(d=>({
      route:d.id,category:d.category,feasibility:d.feasibility,
      actualLiquidityCreatedCents:d.actualLiquidityCreatedCents
    })),
    communityBridge:{
      startingPoolCents:5000,
      modeledLoanPrincipalCents:3000,
      nominalRatePercent:0,
      borrowerFeesCents:0,
      poolAfterProposedLoanCents:afterProposal.fictionalCashAvailableCents,
      poolAfterHypotheticalPartialRepaymentCents:afterRepayment.fictionalCashAvailableCents,
      remainingPrincipalCents:afterRepayment.fictionalOutstandingPrincipalCents,
      sponsorLossReserveCents:afterRepayment.fictionalSponsorLossCoverCents,
      actualMoneyTransferredCents:afterRepayment.realCashDisbursedCents,
      actualLoansMade:0
    },
    actualUsersConsenting:0,
    actuallyVerifiedEconomicGainCents:0,
    actuallyMeasuredPeopleImprovement:0,
    actuallyMeasuredPlanetImprovement:0,
    moneyMovementEnabled:false
  };
}

if(process.argv?.[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
 process.stdout.write(JSON.stringify(runJubilee007(),null,2)+'\n');
