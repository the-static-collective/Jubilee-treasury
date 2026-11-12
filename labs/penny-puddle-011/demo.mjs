import {createContextLab,makeContextFixture} from './context.mjs';
import {createContextWeave} from './weave.mjs';

export function runContextualDiscovery(){
  const isolated=createContextLab(makeContextFixture());
  const blind=isolated.skillOnlyBaseline();
  const w=createContextWeave();
  const before=w.proposals();
  const opening=w.preview();
  w.startIntroductions({eventId:'open-learner-request',requesterId:'learner'});
  w.respondToIntroduction({eventId:'hub-opt-in',actorId:'hub',approve:true});
  w.respondToIntroduction({eventId:'mechanic-opt-in',actorId:'mechanic',approve:true});
  const question=w.suggestQuestion({eventId:'hub-suggests-neutral-question',
    introducerId:'hub'});
  w.askOwnPreferences({eventId:'learner-asks-permission',requesterId:'learner'});
  w.answerOwnPreferences({
    eventId:'mechanic-first-person-yes',actorId:'mechanic',approve:true,
    shareFormats:['teach-together','remote-guidance'],
    shareAvailability:true,shareMotivation:false,ttlDays:5
  });
  const known=w.proposals(),comparisons=w.dealweaverComparison();
  w.offer({eventId:'learner-proposes-learning',actorId:'learner',
    proposalId:'learn-by-repairing'});
  w.respondToOffer({eventId:'mechanic-chooses-yes',actorId:'mechanic',approve:true});
  const held=w.requesterReaffirms({eventId:'learner-reaffirms',actorId:'learner',approve:true});
  const carrier=w.carrier();
  return {
    experiment:'Jubilee RELAY-011 / CONTEXTUAL CONSENT WEAVE',
    disclaimer:'Every actor, skill, desire, connection, consent and benefit is fictional. No actual relationship or work is verified.',
    baselineSkillOnly:{
      predictedDirectRepairMatch:blind.naiveSkillMatchCount,
      naiveFormat:blind.naiveSuggestion,
      violatesSubjectDeclaredNo:blind.falsePositiveAboutWillingness,
      actionAuthorized:blind.actOnSuggestion
    },
    beforeConsent:{
      candidateAgreements:before.candidates.length,
      firstIntroducerOnly:opening.firstKnownContact,
      invisibleSubjectMotivation:true
    },
    neutralQuestion:{
      question:question.nextQuestion.neutralQuestion,
      privateFactsClaimed:question.claimedFactAboutSubject
    },
    afterFirstPersonConsent:{
      contextCandidates:known.candidates.map(x=>({
        format:x.format,subjectSelfRatedBenefit:x.subjectBenefitSelfRated,
        learnerSelfRatedBenefit:x.requesterBenefitSelfRated,
        planetHypothesis:x.environmentalScenarioSignal,
        peopleHypothesis:x.socialScenarioSignal
      })),
      paretoProposals:known.paretoSuggestions.map(x=>x.id),
      privateMotivationShared:false
    },
    originalDealweaverCross:{
      originalModule:'../penny-puddle-007/dealweaver.mjs',
      paretoBundles:comparisons.paretoBundles.map(x=>x.ids),
      modeledTimeSlotCollisionAvoided:comparisons.paretoBundles.every(x=>x.ids.length===1),
      actualAgreements:comparisons.realContracts
    },
    bilateralIntent:{
      status:held.status,
      format:held.namedMockTerms.format,
      safetyTerms:held.namedMockTerms.safeguardingConditions,
      actualServiceDelivered:held.actualServiceCompleted,
      actualMoneyMovedCents:held.realMoneyMovedCents,
      independentParticipantSatisfactionMeasured:held.participantSatisfactionIndependentlyMeasured
    },
    proposalCarrier:{
      contract:carrier.contract,authority:carrier.authority,
      effectOnOtherProjects:'NONE / READ-ONLY PROPOSED ADAPTER'
    },
    actualContactMessagesSent:0,
    realWorldIdentityVerified:false,realAgreementsExecuted:0,
    countActualHumanBenefitsMeasured:0
  };
}
if(process.argv?.[1] && import.meta.url===new URL('file://'+process.argv[1]).href)
  process.stdout.write(JSON.stringify(runContextualDiscovery(),null,2)+'\n');
