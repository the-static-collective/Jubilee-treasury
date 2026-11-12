import {makeRelayFixture,createRelayLab} from './relay.mjs';
import {makeSatisfactionFixture} from '../penny-puddle-009/satisfaction.mjs';

/**
 * A proposed deal is feasible only if its participants can be *invited*.
 * An introduction path is not proof that anyone will do the work, accept
 * the terms, pay, waive a bill, or permit use of private contact details.
 */
export function evaluateSocialReach({
  network=makeRelayFixture(),
  agreement=makeSatisfactionFixture(),
  includeWeakTies=true,
  beneficiaryConsentAsserted=false,
  maxHops=5
}={}){
  const pairs=agreement.promisedSteps.map(step=>({
    deliverableId:step.id,provider:step.from,recipient:step.to,
    kind:step.category,description:step.promise
  }));
  pairs.push({deliverableId:'beneficiary-confirmation',provider:agreement.liability.creditorId,
    recipient:agreement.liability.debtorId,
    kind:'permission',description:'Beneficiary receives proposed bill-discharge terms without loss of rights'});
  const results=pairs.map(step=>{
    const relay=createRelayLab(network,{
      from:step.provider,to:step.recipient,purpose:'settle-a-need',
      maxHops,strongOnly:!includeWeakTies
    });
    const preview=relay.publicPreview();
    const shortest=preview.candidates[0];
    return {
      deliverableId:step.deliverableId,
      actorsIdentifiedOnlyInsidePublicFixture:true,
      candidateIntroductionRoutes:preview.pathsAvailable,
      firstContactKnownToProvider:shortest?.firstKnownContact??null,
      minimalIntroductions:shortest?.introductionCount??null,
      thirdPartyIdentitiesWithheld:shortest?.remoteNamesWithheld??true,
      offerAndTermsNotYetAccepted:true,
      routeHasBeenExplicitlyApprovedByAll:false,
      automaticContactSent:false,
      tentativeStatus:preview.pathsAvailable?'introductions-possible-not-yet-consented':
        'HOLD-no-valid-consented-contact-path'
    };
  });
  const allReachable=results.every(r=>r.candidateIntroductionRoutes>0);
  const hasConditionalCreditorAgreement=agreement.liability.creditorWouldConsiderNoncashPaymentInFixture===true &&
    agreement.liability.creditorConditionalAcceptanceTermsAssertedInFixture===true;
  return {
    schema:'jubilee-relay-010/proposal-only',
    status:allReachable&&hasConditionalCreditorAgreement&&beneficiaryConsentAsserted?
      'network-can-begin-hop-by-hop-introduction':'HOLD-awaiting-permission-or-connectivity',
    proposedDeal:'gold owner rights → filmmaker video → electrician repair → landlord accepts services in place of rent',
    relationshipDimensions:'Directed, purpose-scoped, time-fresh, permission-asserted introductions. No global trust score.',
    pairs:results,
    canAskAnIntroducer:results.some(r=>r.candidateIntroductionRoutes>0),
    everyoneHasAccepted:false,
    allConnectionsFound:allReachable,
    beneficiaryIndependentParticipationAsserted:beneficiaryConsentAsserted,
    creditorConditionsAsserted:hasConditionalCreditorAgreement,
    executionAuthorized:false,
    actualServicesDelivered:0,
    actualCreditorObligationDischargedCents:0,
    actualPaymentsCents:0,
    actualContactMessagesSent:0
  };
}

/**
 * Fully simulated traversal, with invitations at each hop. Even successful
 * traversal is strictly an opportunity to *begin negotiating*, not a deal.
 */
export function simulateFullRelay(network=makeRelayFixture(),from='G',to='L'){
  const r=createRelayLab(network,{from,to,purpose:'settle-a-need'});
  const route=r.publicPreview().candidates[0];
  if(!route) return {status:'HOLD-no-route',proposedIntroductions:0,realMessages:0};
  const steps=[];
  steps.push(r.request({eventId:'start-inquiry',routeId:route.routeId,initiatorId:from}));
  // The fake actors use mock local inboxes, not a contact plugin or accounts.
  let actor=from;
  while(!r.readiness(route.routeId).onlyCandidateToOpenNegotiation){
    const pending=network.links.filter(e=>e.from===actor).map(e=>e.to);
    const next=network.actors.find(x=>x.id!==actor &&
      r.inboxFor(x.id).some(row=>row.routeId===route.routeId));
    if(!next)throw new Error('No named invited receiver in fixture');
    // Proves the only invited party can advance this proposed path.
    if(!pending.includes(next.id))throw new Error('Unconnected simulated introduction');
    steps.push(r.respond({eventId:'accepted-by-'+next.id,routeId:route.routeId,
      actorId:next.id,approve:true}));
    actor=next.id;
  }
  return {
    status:r.readiness(route.routeId).status,
    hopCount:route.introductionCount,
    approvals:steps.at(-1).approvedHopCount,
    actualContactMessagesSent:0,
    actualDealCompleted:false,
    actualCreditCreatedCents:0,
    actualRentDischargedCents:0,
    proofOfFriendshipOutsideFixture:false,
    nextStep:'Begin separate bilateral rights/service/creditor negotiation; no one is obliged.'
  };
}
