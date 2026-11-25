import {
  createAgreementInvestigator,compareDiscoveryControls
} from './planner.mjs';
import {
  makeAgreementFixture,synthesizeAgreements,
  applyFirstPersonOfferAnswer,fixedRepairOnlyControl
} from './composer.mjs';

function fictionalInquiry(responses=['no','yes','yes','yes','yes','yes']){
  const lab=createAgreementInvestigator();
  lab.tenantChooses({eventId:'resident-permits-question-study',actorId:'A',approve:true});
  lab.ownerChooses({eventId:'owner-permits-question-study',actorId:'G',approve:true});
  const trace=[];
  for(const response of responses){
    const recommended=lab.priority().recommendedQuestion;
    if(!recommended)break;
    const id=recommended.offerCardId;
    lab.initiate({eventId:'begin-'+id,initiatorId:'G',offerCardId:id});
    for(let hop=0;hop<7;hop++){
      const target=['F','E','L','B','A','H'].find(x=>lab.nextInboxFor(x).length);
      if(!target)break;
      lab.replyIntroduction({eventId:'consent-hop-'+id+'-'+target,
        actorId:target,approve:true});
    }
    lab.pose({eventId:'independent-question-'+id,actorId:recommended.askerId,
      offerCardId:id,personConsentsToExactQuestionInFixture:true});
    const outcome=lab.reply({eventId:'subject-answer-'+id,
      actorId:recommended.askerId,answer:response,
      firstPersonAnswerInFixture:true});
    trace.push({
      queriedRole:recommended.askerId,offerId:id,
      hypotheticalResponse:response,
      permittedIntroductionHops:recommended.introductionHops,
      conditionalStructuresAfterAnswer:outcome.possibleNewConditionalStructures,
      proposalsReadyForDiscussion:outcome.currentlyWillingToDiscuss,
      nextQuestion:outcome.nextQuestion
    });
  }
  const finale=lab.priority();
  return {
    trace,
    currentStatus:finale.status,
    generatedStructures:finale.structuresGenerated,
    readyToDiscussNonbinding:finale.discussOnlyCandidates,
    realContactsAsked:lab.audit().events.filter(x=>x.realMessageSent).length,
    realMoneyMovedCents:lab.legalBoundary().realMoneyMovedCents,
    realRentLegallyDischargedCents:lab.legalBoundary().legallyDischargedCents
  };
}
export function runAgreementInvention(){
  const f=makeAgreementFixture();
  const baseline=fixedRepairOnlyControl(f);
  const generated=synthesizeAgreements(f);
  const afterRepairNo=applyFirstPersonOfferAnswer(f,'L-considers-repair','L','no');
  const alternative=synthesizeAgreements(afterRepairNo);
  return {
    experiment:'Jubilee CONCORD-014 — invent agreement structures from new answers',
    researchQuestion:'Can typed local willingness cards synthesize previously unlisted multilateral pathways and adapt which participant is asked next?',
    completelySynthetic:true,
    originalFixedChainCount:baseline.numberOfDistinctConditionalStructures,
    generatedPossibleChains:generated.numberOfDistinctConditionalStructures,
    synthesizedChains:generated.plans.map(p=>({
      operatorProof:p.generatedOperatorIds,
      needFirstPersonQuestions:p.unknownFirstPersonQuestions,
      alreadyConsentedToActualContract:false
    })),
    afterLandlordRejectsElectricalRepairs:{
      originalFixedChainCount:fixedRepairOnlyControl(afterRepairNo).numberOfDistinctConditionalStructures,
      remainingAlternativeStructures:alternative.numberOfDistinctConditionalStructures,
      stillPossibleByComposition:alternative.plans.map(x=>x.generatedOperatorIds)
    },
    decisionModel:compareDiscoveryControls(),
    simulatedParticipantInteractions:fictionalInquiry(),
    sourceOwnedEngines:[
      'penny-puddle-010/relay.mjs',
      'penny-puddle-012/question-value.mjs',
      'penny-puddle-009/satisfaction.mjs'
    ],
    actualLegalDischargeCents:0,
    actualMoneyMovedCents:0,
    actualContractsExecuted:0,
    noveltyCaveat:'Novel relative to the original single template; not a claim of historically novel barter, formal planning mathematics or verified human benefit.'
  };
}
if(process.argv?.[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
  process.stdout.write(JSON.stringify(runAgreementInvention(),null,2)+'\n');
