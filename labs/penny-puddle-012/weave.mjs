import {createContextWeave} from '../penny-puddle-011/weave.mjs';
import {makeQuestionFixture,createQuestionLab,benchmarkQuestionPolicies} from './question-value.mjs';

/**
 * Real source-owned 011 RELAY + first-person question eligibility + 007
 * DEALWEAVER comparison. The three imports below all execute locally.
 * "Person answered yes" is STILL an intentionally fabricated fixture input.
 */
export function createQuestionWeave({
  contextWeave=createContextWeave(),
  lab=createQuestionLab(makeQuestionFixture(),{
    learnerOptedIntoQuestionsInFixture:true,
    maxQuestions:2,maxPrivacyWeight:1
  })
}={}){
  let questionAuthorizedInFixture=false;
  function openIntroductions(){
    contextWeave.startIntroductions({
      eventId:'intro-start',requesterId:'learner'
    });
    contextWeave.respondToIntroduction({eventId:'hub-intro-yes',
      actorId:'hub',approve:true});
    contextWeave.respondToIntroduction({eventId:'mechanic-intro-yes',
      actorId:'mechanic',approve:true});
    const audit=contextWeave.audit();
    if(!audit.introReady)throw new Error('RELAY-010 did not complete permissioned introduction');
    contextWeave.askOwnPreferences({eventId:'question-consent-request',
      requesterId:'learner'});
    return {introReady:true,personActuallyContacted:false,
      contextWasAlreadyShared:false};
  }
  function subjectChoosesQuestionConsent({approve}){
    if(!contextWeave.audit().introReady)
      throw new Error('Introduction not completed');
    if(approve!==true){
      contextWeave.answerOwnPreferences({
        eventId:'subject-declines-preference',actorId:'mechanic',approve:false
      });
      return {permission:false,personalContextShared:false};
    }
    const permission=lab.permitSubjectQuestions({
      eventId:'subject-opted-into-neutral-question',actorId:'mechanic',
      purpose:'repair-learning',relayIntroductionsCompleteInFixture:true,
      subjectExplicitlyOptedInToAskInFixture:true
    });
    questionAuthorizedInFixture=true;
    return {...permission,permission:true};
  }
  function askAndAnswer({answer,actorId='mechanic'}){
    if(!questionAuthorizedInFixture)throw new Error('Mechanic did not opt into this question');
    const selected=lab.planNext().recommendedQuestion;
    if(!selected||selected.actorId!==actorId)
      throw new Error('No currently justified consented question for this actor');
    lab.poseQuestion({eventId:'ask-ranked-question',questionId:selected.id,
      actorId,personAgreedToThisQuestionInFixture:true});
    const response=lab.answerQuestion({eventId:'subject-direct-answer',
      actorId,answer,firstPersonAnswerInFixture:true});
    if(answer==='yes'){
      // Subject controls the actual FORMATS. The model's yes/no result
      // cannot authorize private disclosure on its own.
      contextWeave.answerOwnPreferences({
        eventId:'mechanic-self-authorizes-011-formats',
        actorId:'mechanic',approve:true,
        shareFormats:['teach-together','remote-guidance'],
        shareAvailability:true,shareMotivation:false,ttlDays:5
      });
    }else{
      contextWeave.answerOwnPreferences({
        eventId:'mechanic-declines-011-sharing',
        actorId:'mechanic',approve:false
      });
    }
    return {
      questionId:selected.id,
      answerGivenByFakeSubject:answer,
      suggestedNextWorldAction:response.nextSuggestedAction,
      contextProposals:contextWeave.proposals().candidates.map(x=>x.id),
      sourcedDealweaverPareto:contextWeave.dealweaverComparison().paretoBundles.map(x=>x.ids),
      noRealPersonProfiled:true,realAgreementMade:false,
      realMoneyMovedCents:0
    };
  }
  function carrier(){
    return {
      contract:'jubilee-motif-012/question-proposal-only-v0',
      inputParents:['penny-puddle-011/permissioned-context',
        'penny-puddle-010/first-hop-introductions',
        'penny-puddle-007/pareto-deal-proposals'],
      authorization:'OFFER_ONLY_HOLD',
      sourceOfBeliefs:'fictional-prior-assumptions',
      nextCandidate:lab.planNext().recommendedQuestion,
      subjectPrivateMotivationNotExported:true,
      realIdentityVerified:false,
      externalSourceAdmitted:false,
      nativeMotifRuntimeInvoked:false,
      moneyOrServicesAuthorized:false
    };
  }
  return {
    openIntroductions,subjectChoosesQuestionConsent,
    askAndAnswer,carrier,
    planNext:()=>lab.planNext(),
    audit:()=>({
      contextual:contextWeave.audit(),
      questions:lab.audit(),
      realParticipantsContacted:0,
      completedContracts:0
    })
  };
}

export function runQuestion012(){
  const benchmark=benchmarkQuestionPolicies();
  const bridge=createQuestionWeave();
  const before=bridge.planNext();
  const introductions=bridge.openIntroductions();
  bridge.subjectChoosesQuestionConsent({approve:true});
  const after=bridge.planNext();
  const answer=bridge.askAndAnswer({answer:'yes'});
  return {
    experiment:'JUBILEE QUESTION-012 / ASK THE NEXT USEFUL QUESTION',
    scope:'Synthetic adaptive decision-focused VOI with independent real source-owned RELAY-011 cross',
    beforeSubjectOptIn:{
      recommendedQuestion:before.recommendedQuestion?.id??null,
      subjectQuestionHidden:true
    },
    afterConsentedIntroductions:{
      path:introductions,
      recommendedQuestion:after.recommendedQuestion?.id??null,
      modeledExpectedNetInformationPoints:after.recommendedQuestion?.modeledDecisionValuePoints??null
    },
    controlledPolicyComparison:{
      noQuestionAction:benchmark.noQuestion.action,
      informationEntropyFirst:benchmark.naiveEntropyQuestion,
      decisionValueFirst:benchmark.decisionQuestion,
      exactTwoQuestionFirst:benchmark.exactTwoQuestionPolicy.firstQuestionId,
      allPriorsFabricated:true,realEconomicEvidence:false
    },
    hypotheticalAnswerAndAgreementOptions:answer,
    subsequentQuestionCandidate:bridge.planNext().recommendedQuestion?.id??null,
    sourceAdapter:bridge.carrier().contract,
    realServicesPerformed:0,
    realMoneyMovedCents:0,
    realHumanDataUsed:false,
    nativeMotifInvocation:'separate pinned structural probe in CI'
  };
}
if(process.argv?.[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
  process.stdout.write(JSON.stringify(runQuestion012(),null,2)+'\n');
