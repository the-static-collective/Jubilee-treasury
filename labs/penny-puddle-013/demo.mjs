import {createNetworkInvestigator,compareNetworkQuestionStrategies} from './network.mjs';

function approveAllRouteHops(lab){
  const suggested=lab.priority().suggestedQuestion;
  if(!suggested) return null;
  let result=lab.startIntroduction({
    eventId:'begin-'+suggested.id,initiatorId:'G',questionId:suggested.id});
  let n=0;
  while(result.status==='awaiting-individual-choice'){
    const recipient=['F','E','L','B','A','H']
      .find(actor=>lab.nextInboxFor(actor).length===1);
    if(!recipient)throw new Error('No fictional permitted next recipient');
    result=lab.respondIntroduction({
      eventId:'hop-'+suggested.id+'-'+recipient,
      actorId:recipient,approve:true
    });
    if(++n>7)throw new Error('Unbounded introduction chain');
  }
  lab.askQuestion({eventId:'ask-'+suggested.id,
    actorId:suggested.id.includes('landlord')?'L':
      suggested.id.includes('electrician')?'E':'F',
    questionId:suggested.id,
    personIndividuallyAgreesToQuestionInFixture:true
  });
  return suggested;
}
function scenario(answers){
  const lab=createNetworkInvestigator();
  lab.tenantChooses({eventId:'tenant-consents',actorId:'A',approve:true});
  lab.ownerChooses({eventId:'owner-consents',actorId:'G',approve:true});
  const trace=[];
  for(const response of answers){
    const step=approveAllRouteHops(lab);
    if(!step)break;
    const target=step.id.includes('landlord')?'L':
      step.id.includes('electrician')?'E':'F';
    lab.answer({eventId:'respond-'+step.id,
      actorId:target,answer:response,firstPersonResponseInFixture:true});
    trace.push({role:step.role,questionId:step.id,
      response,routeIntroductions:step.introductionHops,
      remainingQuestion:lab.priority().suggestedQuestion?.id??null});
    if(!lab.priority().suggestedQuestion)break;
  }
  return {
    questionTrace:trace,terminal:lab.priority().status,
    opportunity:lab.agreementPreview(),
    realMoneyOrReliefCents:lab.audit().actualCreditorReliefCents,
    realMessagesSent:lab.audit().realContactsMessaged
  };
}
export function runNetworkQuestionDemo(){
  const b=compareNetworkQuestionStrategies();
  return {
    experiment:'Jubilee QUESTION-013 / who to ask first across a community',
    hypothesis:'The highest-value first question may lie three introductions away.',
    purpose:'Investigate a fictional gold-owner to filmmaker to electrician to landlord rent-satisfaction chain.',
    benchmark:{
      noQuestionModeledAction:b.noQuestionAction,
      noQuestionModelPoints:b.noQuestionPoints,
      nearestPersonToAsk:b.nearestContactQuestion,
      nearestFirstWithOptimalContinuationPoints:b.nearestFirstOptimallyContinuedPoints,
      oneQuestionFirst:b.myopicFirstQuestion,
      threeQuestionFirst:b.exactThreeQuestionFirst,
      threeQuestionModeledExpectedPoints:b.exactThreeQuestionExpectedPointsNet,
      expectedQuestionCount:b.expectedQuestionsUnderOptimal,
      priorsAreFictional:true,notARealPersonPrediction:true
    },
    landlordSaysNo:scenario(['no']),
    allThreePeopleInterested:scenario(['yes','yes','yes']),
    originalRealMOTIFSource:'penny-puddle-012/native_motif_question_probe.py (read-only source-pinned structural control)',
    sourceModules:[
      'penny-puddle-010/relay.mjs',
      'penny-puddle-012/question-value.mjs',
      'penny-puddle-009/satisfaction.mjs'
    ],
    actualPeopleContacted:0,actualPaymentsCents:0,
    actualGoldMoved:false,actualRentDischargedCents:0
  };
}
if(process.argv?.[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
  process.stdout.write(JSON.stringify(runNetworkQuestionDemo(),null,2)+'\n');
