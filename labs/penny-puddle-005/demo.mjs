import {makeFixture,benchmark} from './opportunity.mjs';
import {proposalCarrier} from './bridge.mjs';
import {createRareCoinLab} from '../penny-puddle-004/collector.mjs';
import {screenCoinCandidate} from '../penny-puddle-004/triage.mjs';

/** End-to-end synthetic discovery experiment with no real external effects. */
export function runDiscoveryNetwork(f=makeFixture()){
  const screen=screenCoinCandidate({
    denominationCents:1,observedYear:1943,reportedFeatures:['copper-like']
  });
  // A merely reported observation does not promote a physical object to
  // authentication, ownership, market value or token backing.
  const custody=createRareCoinLab({specimens:[{
    id:f.specimen.id,denominationCents:f.specimen.denominationCents,
    declaredOwnerId:'fictional-owner',declaredFinderId:'fictional-steward',
    observedYear:1943,observedSignals:['copper-like'],collateralized:false
  }]});
  const evaluation=benchmark(f);
  const carrier=proposalCarrier(f);
  return {
    scenario:f.name,truthfulness:'Every market quote, sponsor, coin, buyer, service and latent world is fictional.',
    candidateScreen:{
      flags:screen.flags.map(x=>x.code),authenticated:screen.isAuthenticated,
      status:custody.inspect().coins[0].status
    },
    marketGraph:{
      nodes:carrier.field.nodes.length,edges:carrier.field.edges.length,
      candidateBuyerCount:f.demand.length,authenticatedQuotes:0,
      validSettlementRoutes:0,realCashSettledCents:0
    },
    search:{
      exploredStates:evaluation.planner.exploredStates,
      firstMoves:evaluation.planner.firstMoves.map(x=>({
        action:x.actionId,immediateCents:x.immediateCents,
        expectedContingentCents:x.contingentExpectedValueCents,
        unlocked:x.newAffordances
      })),
      classicalExpectedFirst:evaluation.planner.optimalClassicalExpected.action,
      motifInspiredAffordanceFirst:evaluation.planner.affordanceFirst,
      robustWorstCaseFirst:evaluation.planner.robustWorstCase.action,
      policies:Object.fromEntries(Object.entries(evaluation.comparisons).map(([name,stat])=>[
        name,{
          weightedSyntheticNetCents:stat.expectedNetCents,
          worstSyntheticNetCents:stat.worstCaseNetCents,
          bestSyntheticNetCents:stat.bestCaseNetCents
        }
      ]))
    },
    consentAndSettlement:{
      ownerConsentOnlyAssumed:true,physicalCoinCollateral:0,
      fantasySaleIsNotAnOffer:true,collectorPremiumAlreadyRealizedCents:0,
      goalCents:f.goal.targetCents,
      actuallyFundedCampaignCents:0,
      simulatedPotentialDonationCountsAsRealFunding:false,
      openExternalActions:0
    },
    crossing:{
      contract:carrier.contract,authority:carrier.field.authority,
      observationTickets:carrier.field.observationTickets.map(x=>x.id),
      requiresSeparateMOTIFAdmission:true,requiresSeparateReLATTEAdmission:true,
      liveConnectionExecuted:carrier.liveConnectionExecuted
    }
  };
}
if(process.argv?.[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
  process.stdout.write(JSON.stringify(runDiscoveryNetwork(),null,2)+'\n');
