import {createRelayLab} from '../penny-puddle-010/relay.mjs';
import {createContextLab,makeContextFixture} from './context.mjs';
import {composeMutualDeals} from '../penny-puddle-007/dealweaver.mjs';

const clone=x=>JSON.parse(JSON.stringify(x));
const validId=(x,k)=>{if(typeof x!=='string'||!x.trim()||x.length>100)throw new TypeError(k+' requires an ID');return x;};

/** An explicit open-intake door helps someone who does not know an insider. */
export function makeContextRelayFixture(){
  return {
    day:30,
    actors:[
      {id:'learner',role:'requester who wants to learn a repair'},
      {id:'hub',role:'opt-in community intake point'},
      {id:'mechanic',role:'skilled person who retains their own choices'}
    ],
    links:[
      {id:'learner-hub',from:'learner',to:'hub',how:'public-opt-in-intake',
        context:'Hub explicitly welcomes requests for community learning opportunities',
        kind:'open-intake',declaredBy:'hub',allowedPurposes:['repair-learning'],
        senderPermitsRequestInFixture:true,recipientMayBeAskedInFixture:true,
        observedDay:29,ttlDays:8,introductionBurden:1},
      {id:'hub-mechanic',from:'hub',to:'mechanic',how:'worked-together',
        context:'The hub has worked with this person before',
        kind:'personal',declaredBy:'hub',allowedPurposes:['repair-learning'],
        senderPermitsRequestInFixture:true,recipientMayBeAskedInFixture:true,
        observedDay:27,ttlDays:10,introductionBurden:1}
    ]
  };
}

/**
 * RELAY-011 composes existing source-owned RELAY-010 introductions with
 * subject-authored, revocable contextual preference disclosure.
 * Even all simulated YES responses produce only an offer to negotiate.
 * No real identity/authentication/contract/payment/work is present.
 */
export function createContextWeave({
  network=makeContextRelayFixture(),
  contextFixture=makeContextFixture()
}={}){
  const relay=createRelayLab(network,{
    from:contextFixture.requester.id,
    to:contextFixture.subject.id,
    purpose:contextFixture.purpose
  });
  const route=relay.publicPreview().candidates[0]??null;
  const context=createContextLab(contextFixture);
  let proposedAgreement=null;
  const eventIds=new Set(),history=[];
  const event=(eventId,type)=>{
    validId(eventId,'eventId');
    if(eventIds.has(eventId))throw new Error('Duplicate negotiation event');
    eventIds.add(eventId);history.push({eventId,type,realWorldEvidence:false});
  };
  const introComplete=()=>!!route&&
    relay.readiness(route.routeId).onlyCandidateToOpenNegotiation;
  const preview=()=>({
    purpose:contextFixture.purpose,
    openIntakeCandidate:!!route,
    firstKnownContact:route?.firstKnownContact??null,
    potentialIntroductions:route?.introductionCount??0,
    nextAction:'Ask first known willing contact without exposing their other contacts',
    hypotheticalSubjectPreferencesDisclosed:false,
    contactsActuallyMessaged:0,identityAuthenticationImplemented:false
  });
  function startIntroductions({eventId,requesterId}){
    if(!route)throw new Error('No public opt-in introduction path');
    return relay.request({eventId,routeId:route.routeId,initiatorId:requesterId});
  }
  function pendingInboxFor(actorId){
    return relay.inboxFor(actorId);
  }
  function respondToIntroduction({eventId,actorId,approve}){
    if(!route)throw new Error('No route');
    return relay.respond({eventId,routeId:route.routeId,actorId,approve});
  }
  function askOwnPreferences({eventId,requesterId}){
    if(!introComplete())
      throw new Error('Each relationship introduction must first be consented');
    return context.requestContext({
      eventId,requesterId,subjectId:contextFixture.subject.id,
      purpose:contextFixture.purpose,allRelayHopsConsentedInFixture:true
    });
  }
  function answerOwnPreferences(answer){
    return context.subjectRespond(answer);
  }
  function suggestQuestion({eventId,introducerId}){
    if(!introComplete())
      throw new Error('A third-party hint cannot skip introduction permission');
    return context.suggestQuestion({
      eventId,introducerId,subjectId:contextFixture.subject.id,
      purpose:contextFixture.purpose,introductionApprovedInFixture:true
    });
  }
  function proposals(){
    if(!introComplete())return {
      status:'HOLD-introductions-incomplete',candidates:[],paretoSuggestions:[],
      economicRightsCreated:false
    };
    return context.proposeFor(contextFixture.requester.id,contextFixture.purpose);
  }
  /**
   * Bridge the CONFIRMED-SHARED, fictional options to the earlier DEALWEAVER
   * evaluator. It receives a synthetic "workshop slot", not a property claim.
   * This is a numeric signal comparison, not a real contract or measurement.
   */
  function dealweaverComparison(){
    const offered=proposals();
    if(!offered.candidates?.length)return {
      status:'HOLD-no-contextual-options',
      sourceOptions:0,paretoBundles:[],realContracts:0
    };
    const fixture={
      actors:[
        {id:contextFixture.requester.id,selfGoal:'Learn practical diagnostic skills without losing rights'},
        {id:contextFixture.subject.id,selfGoal:'Teach under terms this person freely chooses'}
      ],
      assets:[{id:'workshop-time-fixture',ownerId:contextFixture.subject.id,
        kind:'fictional-access-window',titleVerified:false,collateralFreeAssumed:true,
        useSlots:[...new Set(offered.candidates.map(x=>x.slot))],
        maxConcurrentUses:1,transferTitleAllowed:false}],
      opportunities:offered.candidates.map(p=>({
        id:p.id,method:'use-access',assetId:'workshop-time-fixture',
        slot:p.slot,actors:[contextFixture.subject.id,contextFixture.requester.id],
        declaredNetBenefits:{
          [contextFixture.subject.id]:p.subjectBenefitSelfRated,
          [contextFixture.requester.id]:p.requesterBenefitSelfRated
        },
        proposedCashCents:0,cashPayer:null,optionalityProtected:true,
        impact:{people:p.socialScenarioSignal,planet:p.environmentalScenarioSignal,
          evidence:'unverified-scenario',
          basis:'Personal/contextual preferences are test assertions, not social or environmental measurements'},
        permissions:{ownerWillingToNegotiate:true,otherPartiesWillingToNegotiate:true},
        safeguards:['owner-retains-title',...p.concreteTerms],
        note:'Fictional mutually considered session. No role assignment or performance.'
      }))
    };
    // Do not select mutually conflicting workshop bookings; 007's existing
    // shared-asset/slot constraints enforce one proposal at a given time.
    const d=composeMutualDeals(fixture,{maxAgreements:1});
    return {
      status:'read-only-DEALWEAVER-comparison',
      sourceOptions:offered.candidates.length,
      paretoBundles:d.paretoFrontier.map(x=>({
        ids:x.dealIds,score:x.score,realRightsGranted:x.realAssetUseGranted
      })),
      amountActuallyPaidCents:d.actualCashTransferredCents,
      realContracts:0,
      collaborationWithOriginalModule:true
    };
  }
  function offer({eventId,actorId,proposalId}){
    if(actorId!==contextFixture.requester.id)
      throw new Error('Only requester can propose their own terms');
    if(proposedAgreement&&['awaiting-subject','awaiting-requester','mutual-interest-HOLD'].includes(proposedAgreement.status))
      throw new Error('An open negotiation already exists');
    const p=proposals().candidates?.find(x=>x.id===proposalId);
    if(!p)throw new Error('No active subject-approved option with that ID');
    event(eventId,'REQUESTER_PROPOSES_SPECIFIC_TERMS');
    proposedAgreement={id:proposalId,terms:clone(p),
      status:'awaiting-subject',subjectAccepted:false,requesterReaffirmed:false,
      createdDuringScopedConsent:true};
    return agreementSnapshot();
  }
  function validCurrent(){
    if(!proposedAgreement)return false;
    const p=proposals().candidates?.find(x=>x.id===proposedAgreement.id);
    return !!p&&JSON.stringify(p.concreteTerms)===
      JSON.stringify(proposedAgreement.terms.concreteTerms);
  }
  function respondToOffer({eventId,actorId,approve}){
    if(!proposedAgreement||proposedAgreement.status!=='awaiting-subject')
      throw new Error('No pending subject agreement');
    if(actorId!==contextFixture.subject.id)throw new Error('Only subject can accept their own commitment');
    if(typeof approve!=='boolean')throw new TypeError('Explicit yes/no required');
    if(!validCurrent())throw new Error('Subject context revoked/expired or terms changed');
    event(eventId,approve?'SUBJECT_ACCEPTS_MOCK_OFFER':'SUBJECT_DECLINES');
    if(approve){proposedAgreement.subjectAccepted=true;proposedAgreement.status='awaiting-requester';}
    else proposedAgreement.status='declined';
    return agreementSnapshot();
  }
  function requesterReaffirms({eventId,actorId,approve}){
    if(!proposedAgreement||proposedAgreement.status!=='awaiting-requester')
      throw new Error('No offer awaits requester');
    if(actorId!==contextFixture.requester.id)throw new Error('Only requester can reaffirm');
    if(typeof approve!=='boolean')throw new TypeError('Explicit yes/no required');
    if(!validCurrent())throw new Error('Consent expired or subject has revoked context');
    event(eventId,approve?'REQUESTER_REAFFIRMS':'REQUESTER_DECLINES');
    proposedAgreement.requesterReaffirmed=approve;
    proposedAgreement.status=approve?'mutual-interest-HOLD':'declined';
    return agreementSnapshot();
  }
  function withdraw({eventId,actorId}){
    if(!proposedAgreement)throw new Error('No offer to withdraw');
    if(![contextFixture.subject.id,contextFixture.requester.id].includes(actorId))
      throw new Error('A third party cannot withdraw on behalf of participants');
    event(eventId,'PARTICIPANT_WITHDRAWS');
    proposedAgreement.status='withdrawn';
    return agreementSnapshot();
  }
  function revokeSubjectContext({eventId,actorId}){
    const result=context.revoke({eventId,actorId});
    if(proposedAgreement && !['withdrawn','declined'].includes(proposedAgreement.status))
      proposedAgreement.status='context-revoked-HOLD';
    return result;
  }
  function advanceDay(day){
    const update=context.advanceDay(day);
    if(proposedAgreement&&!validCurrent()&&
       !['withdrawn','declined'].includes(proposedAgreement.status))
      proposedAgreement.status='context-expired-HOLD';
    return update;
  }
  function agreementSnapshot(){
    return {
      status:proposedAgreement?.status??'no-offer',
      proposalId:proposedAgreement?.id??null,
      namedMockTerms:proposedAgreement?{
        format:proposedAgreement.terms.format,
        slot:proposedAgreement.terms.slot,
        safeguardingConditions:[...proposedAgreement.terms.concreteTerms]
      }:null,
      contextStillValid:validCurrent(),
      subjectAcceptedInFixture:proposedAgreement?.subjectAccepted??false,
      requesterReaffirmedInFixture:proposedAgreement?.requesterReaffirmed??false,
      actuallyAuthenticatedRealPeople:0,actualServiceCompleted:false,
      realRightsGranted:false,realMoneyMovedCents:0,
      participantSatisfactionIndependentlyMeasured:false,
      legalAgreementVerified:false
    };
  }
  function carrier(){
    const options=proposals();
    return {
      contract:'jubilee-relay-011/context-proposal-only-v0',
      intendedReaders:['MOTIF-003-style-option-reasoner','DEALWEAVER-007'],
      authority:'OFFER_ONLY_HOLD',
      firstPartyEvidence:'synthetic-self-authored-scoped-grant',
      contextVisibleOnlyAfterConsent:options.status==='invitation-to-negotiate-only',
      options:(options.candidates??[]).map(x=>({
        id:x.id,format:x.format,slot:x.slot,
        newAffordances:['consider-joint-learning','ask-safe-terms','decline-without-penalty'],
        actualActionAuthorized:false
      })),
      privatePreferencesNotExported:true,
      moneyMovementCents:0,recipientAdmitted:false,
      realHumanConsentVerified:false
    };
  }
  return {
    context,relay,preview,startIntroductions,pendingInboxFor,
    respondToIntroduction,askOwnPreferences,answerOwnPreferences,
    suggestQuestion,proposals,dealweaverComparison,offer,respondToOffer,
    requesterReaffirms,withdraw,revokeSubjectContext,advanceDay,
    agreementSnapshot,carrier,audit:()=>({
      introReady:!!introComplete(),context:context.audit(),
      negotiationEvents:clone(history),outboundMessages:0,actualDealCount:0
    })
  };
}
