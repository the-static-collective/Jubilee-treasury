import {makeRelayFixture,createRelayLab} from './relay.mjs';
import {evaluateSocialReach,simulateFullRelay} from './weave.mjs';
import {makeSatisfactionFixture} from '../penny-puddle-009/satisfaction.mjs';
/** Entirely fictional social graph; no address books/accounts touched. */
export function runWhoKnowsWhom(){
 const network=makeRelayFixture();
 const base=createRelayLab(network).publicPreview();
 const strong=evaluateSocialReach({network,includeWeakTies:false,beneficiaryConsentAsserted:true});
 const open=evaluateSocialReach({network,includeWeakTies:true,beneficiaryConsentAsserted:true});
 const gate=evaluateSocialReach({network,beneficiaryConsentAsserted:false});
 const originWithoutClout=createRelayLab(network,{from:'A',to:'F'});
 const apparentShortest=simulateFullRelay(network);
 return {
  name:'PENNY × PUDDLE-010 / WHO YOU KNOW, HOW YOU KNOW THEM',
  syntheticIdentityWarning:'Every contact, context, yes/no, need, credential and personal claim is invented.',
  comparedPaths:{
   withAllPurposeScopedRelationships:base.pathsAvailable,
   shortestPermittedIntroductions:base.candidates[0]?.introductionCount??null,
   firstKnownContactOnly:base.candidates[0]?.firstKnownContact??null,
   directCreditorDealReachableFromWeakTies:open.allConnectionsFound,
   restrictToStrongTiesOnly:strong.allConnectionsFound,
   socialNetworkWithoutBeneficiaryConsentMayBegin:gate.status==='network-can-begin-hop-by-hop-introduction',
   publicOpenDoorFromLowConnectivityParticipant:
    originWithoutClout.publicPreview().pathsAvailable>0
  },
  firstPath:{
    approvalsRequired:apparentShortest.hopCount,
    mockApprovals:apparentShortest.approvals,
    inFixtureState:apparentShortest.status,
    paymentAuthority:false,realContactsAsked:0,realEconomicDealMade:false
  },
  satisfaction:{
   sourceOriginal:'labs/penny-puddle-009/satisfaction.mjs',
   storyline:'gold image rights G→F; video F→E; repairs E→L; landlord L offers bill satisfaction to A',
   conditionalCreditorAcceptsTermsOnlyInFixture:true,
   potentialNegotiationRoutes:open.pairs.map(x=>({
     deliverable:x.deliverableId,
     introductionPaths:x.candidateIntroductionRoutes,
     smallestPathHops:x.minimalIntroductions,
     approvedNow:false
   })),
   actualServicesDelivered:0,actualRentLegallyDischargedCents:0
  },
  rules:[
   'No scraping address books, email, social networks or contacts',
   'First introduced contact visible only to source of a request',
   'Each mediator must personally accept or refuse',
   'A trusted contact is not a trusted buyer or financial guarantor',
   'Open-intake directory routes for people lacking insiders',
   'Consent to introduction is not consent to transact',
   'Only verified terms, actual performed work and independent creditor discharge count as economic outcomes'
  ],
  realFundsMovedCents:0,actualMessagesSent:0
 };
}
if(process.argv?.[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
 console.log(JSON.stringify(runWhoKnowsWhom(),null,2));
