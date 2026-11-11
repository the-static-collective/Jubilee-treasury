import {createRareCoinLab} from './collector.mjs';
import {screenCoinCandidate} from './triage.mjs';
import {runSyntheticEconomy} from '../penny-puddle-003/demo.mjs';

/** Fictional, independently consented value exchange scenario. */
export function runRareCoinFrontier(){
  const signals=screenCoinCandidate({
    denominationCents:1,observedYear:1943,reportedFeatures:['copper-like'],
  });
  const quarterSignals=screenCoinCandidate({denominationCents:25,observedYear:1964});
  const lab=createRareCoinLab({specimens:[
    {id:'fictional-copperlike-cent',denominationCents:1,declaredOwnerId:'owner',
      declaredFinderId:'finder',observedYear:1943,observedSignals:['copper-like'],
      collateralized:false},
    {id:'fictional-quarter',denominationCents:25,declaredOwnerId:'owner',
      declaredFinderId:'finder',observedYear:1964,observedSignals:['silver-era-date'],
      collateralized:false},
  ]});
  lab.review({specimenId:'fictional-copperlike-cent',reviewerId:'independent-reviewer',
    disposition:'needs-expert',evidenceReference:'fictional-photo'});
  lab.authenticate({specimenId:'fictional-copperlike-cent',expertId:'fictional-expert',
    outcome:'authentic-collectible',reference:'unverified-test-fixture'});
  lab.proposeOwnerChoice({specimenId:'fictional-copperlike-cent',ownerId:'owner',
    choice:'collector-offer',reference:'fictional-owner-approved-premium-agreement',
    sharesBasisPoints:{owner:8000,finder:1000,steward:500,community:500}});
  lab.simulateSale({specimenId:'fictional-copperlike-cent',externalSalePriceCents:10001,
    externalCostsCents:1000,buyerReference:'not-real-buyer',
    ownerReference:'not-real-owner-confirmation'});
  const existing=runSyntheticEconomy();
  return {
    label:'ALL COINS, HUMAN ATTESTATIONS, COLLECTOR PRICE, BANK ROUTES AND PAYMENTS ARE INVENTED FOR THIS TEST',
    screening:{cent:signals,quarter:quarterSignals},
    numismaticLab:lab.inspect(),
    priorEconomyContext:{
      strandedCents:existing.comparison.immediate.totalReportedCents,
      currentPurchaseAmountCents:existing.comparison.immediate.goalCents,
      campaignGoalReachedButNotPaid:existing.sponsoredCampaign.campaigns[0].phase,
      pennyBankOrdinaryCoins:existing.localCoinSteward.banks[0].recordedCoins,
    },
    proposedCrossing:{
      collectorPremiumIsNotCurrentSpendableBalance:true,
      ownerAuthorizedPotentialCommunityPremiumCents:lab.inspect().coins[0].settlement.allocationsCents.community,
      transferToCommunityPool:'BLOCKED — no real sale / settlement, owner legal title or money movement established',
      reLATTE:'proposal receipts only; HOLD, not financial admission',
      MOTIF:'counterfactual candidate actions only; no autonomous real-world execution',
    }
  };
}
if(process.argv?.[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
  process.stdout.write(JSON.stringify(runRareCoinFrontier(),null,2)+'\n');
