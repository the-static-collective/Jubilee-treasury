import {
  createAgreementInvestigator,compareDiscoveryControls
} from './planner.mjs';

const $=s=>document.querySelector(s);
const show=(s,value)=>{$(s).textContent=value;};
const lab=createAgreementInvestigator();
const baseline=compareDiscoveryControls();
$('#fixed-count').textContent=baseline.baselineSingleHardcodedChainCount;
$('#generated-count').textContent=baseline.generatedDistinctChainCount;
let eventNumber=0,tenant=false,owner=false,activeQuestion=null,
  routeOpen=false,questionOpen=false;
const newEvent=prefix=>prefix+'-'+(++eventNumber);
function nextRecipient(){
  return ['F','E','L','B','A','H'].find(x=>lab.nextInboxFor(x).length>0)??null;
}
function update(){
  const p=lab.priority();
  const q=p.recommendedQuestion;
  if(!routeOpen&&!questionOpen){
    activeQuestion=q;
    show('#question-out',q?
      'The next tentative QUESTION is addressed to '+q.askerId+':\n'+
      q.neutralQuestion+'\nFirst visible contact: '+q.firstKnownContactOnly+
      ' ('+q.introductionHops+' hops).\nNo actual message sent.':
      'No next question under this toy policy.\n'+p.status+
      '\nConditional structures: '+p.structuresGenerated+
      '\nDiscuss-only candidates: '+p.discussOnlyCandidates.length);
  }
  const ready=tenant&&owner;
  $('#tenant').disabled=tenant;
  $('#owner').disabled=owner;
  $('#start').disabled=!ready||routeOpen||questionOpen||!q;
  $('#hop-yes').disabled=!routeOpen||!nextRecipient();
  $('#hop-no').disabled=$('#hop-yes').disabled;
  $('#pose').disabled=!routeOpen||!!nextRecipient()||!activeQuestion;
  $('#answer-yes').disabled=!questionOpen;
  $('#answer-no').disabled=!questionOpen;
  $('#decline').disabled=!questionOpen;
}
function run(button,where,fn){
 $(button).addEventListener('click',()=>{
  try{show(where,fn());}
  catch(e){show(where,'HOLD: '+(e instanceof Error?e.message:'Action not permitted'));}
  update();
 });
}
run('#see-plans','#plans-out',()=>{
 return 'PREWRITTEN CONTROL: '+baseline.baselineSingleHardcodedChainCount+
  '\nGENERATED CONDITIONAL STRUCTURES: '+baseline.generatedDistinctChainCount+
  '\nNewly composed alternatives: '+baseline.independentlyComposedNewStructures+
  '\n\n'+baseline.newStructureProofs.map((p,i)=>
   (i+1)+'. '+p.dependencyOperators.join(' → ')+
   '\nUnanswered first-person questions: '+p.unresolvedQuestions.join(', ')).join('\n\n')+
  '\n\nAll pathways are proposals in a fictional world, not implemented agreements.';
});
run('#tenant','#gates-out',()=>{
 lab.tenantChooses({eventId:newEvent('resident'),actorId:'A',approve:true});
 tenant=true;
 return 'Resident A has fictional inquiry consent. Gold owner: '+(owner?'YES':'NOT YET')+
  '.\nNo actual housing information used.';
});
run('#owner','#gates-out',()=>{
 lab.ownerChooses({eventId:newEvent('owner'),actorId:'G',approve:true});
 owner=true;
 return 'Gold owner G has fictional inquiry consent. Resident: '+(tenant?'YES':'NOT YET')+
  '.\nNo gold rights or title have been verified or pledged.';
});
run('#start','#route-out',()=>{
 const q=lab.priority().recommendedQuestion;
 if(!q)throw new Error('No useful question selected');
 const s=lab.initiate({eventId:newEvent('start'),initiatorId:'G',offerCardId:q.offerCardId});
 activeQuestion=q;routeOpen=true;
 return 'Question category: '+q.offerCardId+
  '\nFirst known contact ONLY: '+s.firstKnownContactOnly+
  '\nExpected introduction hops: '+s.hopsNeeded+
  '\nNo messages sent. Every person may decline.';
});
function respond(approve){
 const person=nextRecipient();
 if(!person)throw new Error('No new contact currently invited');
 const s=lab.replyIntroduction({eventId:newEvent('contact'),actorId:person,approve});
 if(!approve){routeOpen=false;activeQuestion=null;}
 return person+(approve?' agreed to introduce':' declined and stopped the introduction')+
  ' in the fictional scenario.\nApprovals: '+s.completedHopCount+'/'+s.totalHopCount+
  '\nThe actual first-person willingness to discuss an offer is still UNKNOWN.';
}
run('#hop-yes','#route-out',()=>respond(true));
run('#hop-no','#route-out',()=>respond(false));
run('#pose','#answer-out',()=>{
 if(!activeQuestion)throw new Error('No selected question');
 const result=lab.pose({eventId:newEvent('question'),
  actorId:activeQuestion.askerId,offerCardId:activeQuestion.offerCardId,
  personConsentsToExactQuestionInFixture:true});
 routeOpen=false;questionOpen=true;
 return 'FICTIONAL SUBJECT '+result.target+' agreed to be asked:\n'+result.question+
  '\nAn introduction is not an answer, and an answer is not a commitment.';
});
function answer(value){
 if(!activeQuestion||!questionOpen)throw new Error('No consented subject question');
 const q=activeQuestion;
 const result=lab.reply({eventId:newEvent('subject-answer'),
  actorId:q.askerId,answer:value,firstPersonAnswerInFixture:true});
 activeQuestion=null;questionOpen=false;
 return q.askerId+' replied '+value.toUpperCase()+' in the fictional case.'+
  '\nNEW SYNTHESIS: '+result.possibleNewConditionalStructures+' conditional structures.'+
  '\nReady for specific discussion (NOT signed): '+result.currentlyWillingToDiscuss+
  '\nNext investigation candidate: '+(result.nextQuestion??'none')+
  '\nActual help delivered: $0.00.';
}
run('#answer-yes','#answer-out',()=>answer('yes'));
run('#answer-no','#answer-out',()=>answer('no'));
run('#decline','#answer-out',()=>{
 if(!activeQuestion||!questionOpen)throw new Error('No person currently asked');
 const r=lab.decline({eventId:newEvent('decline'),actorId:activeQuestion.askerId});
 activeQuestion=null;questionOpen=false;
 return r.status+
  '\nThe system did NOT infer any answer or lower anyone\'s reputation.';
});
run('#outcome','#outcome-out',()=>{
 const p=lab.priority(),boundary=lab.legalBoundary();
 return 'Generated possible structures: '+p.structuresGenerated+
  '\nParticipants willing to DISCUSS all parts in fixture: '+p.discussOnlyCandidates.length+
  '\nOriginal SATISFACTION-009 remains HOLD: '+boundary.source009StillHOLD+
  '\nLegally discharged rent: $'+(boundary.legallyDischargedCents/100).toFixed(2)+
  '\nActual money moved: $'+(boundary.realMoneyMovedCents/100).toFixed(2)+
  '\nGold ownership and license verified: NO.'+
  '\nReal signed terms, safe work, creditor discharge: NOT VERIFIED.'+
  '\nAll generated agreement structures are nonbinding.';
});
run('#revoke','#outcome-out',()=>{
 const r=lab.revoke({eventId:newEvent('revocation'),actorId:'A'});
 tenant=false;owner=false;activeQuestion=null;routeOpen=false;questionOpen=false;
 return r.status+'\nModeled first-person answers retained: '+r.modeledAnswersRetained+
  '\nNo further questioning permitted. No funds or titles created.';
});
update();
