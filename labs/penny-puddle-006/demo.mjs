import {makeMeaningFixture,proposeDirectExchange,previewForOwner} from './meaning-exchange.mjs';
import {createDirectOfferLab} from './consent-receipts.mjs';

/** Entirely fictional, no genuine buyer, collector or custodial authority. */
export function runMeaningExchange() {
  const fixture=makeMeaningFixture();
  const strategies=Object.fromEntries(['meaning-first','cash-only','grade-gate'].map(policy=>{
    const r=proposeDirectExchange(fixture,{policy});
    return [policy,{
      candidatePairings:r.selected.length,
      affinityScore:r.totalAffinityScore,
      candidateOffers:r.selected.map(x=>({
        specimen:x.listingId,interestedPerson:x.seekerId,
        mode:x.mode,ownerAskCents:x.proposedAskCents,
        matchingOptInTags:x.matchedTags,
        confidence:'subjective and self-declared — NOT a graded value'
      }))
    }];
  }));
  const lab=createDirectOfferLab(fixture);
  lab.propose({offerId:'example-meaning-receipt',listingId:'cent-1978',
    seekerId:'birthday-collector',mode:'cash',
    expressedMeaning:'I would like a coin from 1978 as a remembrance.'});
  lab.ownerRespond({offerId:'example-meaning-receipt',ownerId:'family-collection',accept:true});
  lab.buyerRespond({offerId:'example-meaning-receipt',seekerId:'birthday-collector',accept:true});
  return {
    name:'PENNY × PUDDLE-006 / WHAT IS IT WORTH TO YOU?',
    principle:'The real test of subjective value is whether two informed people willingly agree to a particular exchange and fulfill it. Model only offers, not real fulfillment.',
    environment:'Every listing, owner, buyer, observation, reason and dollar amount is invented',
    whyItMatters:'A raw ordinary-looking penny may matter personally to a particular seeker; the exchange does not require numerical grades as a prerequisite.',
    comparativeResults:strategies,
    rightsAndEvidence:{
      authenticityNotGraded:true,
      sellerOwnershipOnlyAsserted:true,
      buyerValueSelfDeclared:true,
      professionalCertificationOptional:true,
      noVerifiedTradeValue:true,
      noHiddenPriceDiscovery:true,
      notAnInvestmentProduct:true
    },
    ownerView:previewForOwner(fixture,'family-collection'),
    sampleConsentReceipt:lab.snapshot().offers[0],
    actualMoneyMovedCents:0,
    coinOrObjectActuallyDelivered:false,
    externalFinancialConnections:0,
    pennyTokensMinted:0
  };
}
if(process.argv?.[1] && import.meta.url===new URL('file://'+process.argv[1]).href)
  process.stdout.write(JSON.stringify(runMeaningExchange(),null,2)+'\n');
