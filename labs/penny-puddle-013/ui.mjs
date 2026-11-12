import {
 createNetworkInvestigator,compareNetworkQuestionStrategies
} from './network.mjs';

const $=s=>document.querySelector(s);
const show=(s,t)=>{$(s).textContent=t;};
const lab=createNetworkInvestigator();
let count=0,tenant=false,owner=false,current=null,routeState=null,questionOpen=false;
const receipt=prefix=>prefix+'-'+(++count);
const who=q=>q.id.includes('landlord')?'L':
  q.id.includes('electrician')?'E':'F';
const nextRecipient=()=>['F','E','L','B','A','H']
  .find(actor=>lab.nextInboxFor(actor).length>0)??null;
function status(){
 const p=lab.priority();
 const allowed=tenant&&owner;
 const suggested=p.suggestedQuestion;
 if(!current&&!routeState&&suggested)current=suggested;
 if(!routeState&&!questionOpen&&suggested){
  show('#current-question',suggested.role+' may be worth asking: '+suggested.prompt+
   '\nEstimated introduction hops: '+suggested.introductionHops+
   '. First known contact only: '+suggested.firstKnownContactOnly+
   '. No actual message will be sent.');
 }else if(!current&&!routeState){
  show('#current-question','STOP / HOLD: '+p.status+
   '\nCurrent fictional fallback: '+(p.baselineAction||'no supported action')+
   '. An angel-funded option is never actual available money.');
 }
 $('#start').disabled=!allowed||!!routeState||!!questionOpen||!suggested;
 $('#hop-yes').disabled=!routeState||routeState.status!=='awaiting-individual-choice';
 $('#hop-no').disabled=$('#hop-yes').disabled;
 $('#allow-question').disabled=!routeState||routeState.status!=='all-introductions-accepted-in-fixture'||questionOpen;
 $('#answer-yes').disabled=!questionOpen;
 $('#answer-no').disabled=!questionOpen;
 $('#answer-decline').disabled=!questionOpen;
 $('#tenant').disabled=tenant;
 $('#owner').disabled=owner;
}
function run(button,field,action){
 $(button).addEventListener('click',()=>{
  try{show(field,action());}
  catch(e){show(field,'HOLD: '+(e instanceof Error?e.message:'Action rejected'));}
  status();
 });
}
run('#compare','#compare-out',()=>{
 const b=compareNetworkQuestionStrategies();
 return 'No question: '+b.noQuestionAction+' ('+b.noQuestionPoints.toFixed(2)+' invented points).\n'+
  'Nearest person first: '+b.nearestContactQuestion+
  '\nWith best later choices: '+b.nearestFirstOptimallyContinuedPoints.toFixed(3)+' points.\n'+
  'Single-question best: '+b.myopicFirstQuestion+'.\n'+
  'Three-question horizon first: '+b.exactThreeQuestionFirst+
  ' ('+b.exactThreeQuestionExpectedPointsNet.toFixed(3)+' points).\n'+
  'Expected questions in toy policy: '+b.expectedQuestionsUnderOptimal.toFixed(2)+
  ' / 3.\nPrior weights and every payoff are FICTIONAL.';
});
run('#tenant','#gates-out',()=>{
 lab.tenantChooses({eventId:receipt('tenant'),actorId:'A',approve:true});
 tenant=true;
 return 'Renter A consents IN FICTION. Owner decision: '+(owner?'YES':'not yet')+
 '\nNo real identity checked; no bill or recipient exposed.';
});
run('#owner','#gates-out',()=>{
 lab.ownerChooses({eventId:receipt('owner'),actorId:'G',approve:true});
 owner=true;
 return 'Owner G consents to INQUIRY only. Renter decision: '+(tenant?'YES':'not yet')+
 '\nNo asset rights, title or guarantee granted.';
});
run('#start','#route-out',()=>{
 const proposed=lab.priority().suggestedQuestion;
 if(!proposed)throw new Error('No currently justified inquiry');
 current=proposed;
 routeState=lab.startIntroduction({eventId:receipt('intro'),initiatorId:'G',
  questionId:proposed.id});
 const next=nextRecipient();
 return 'Planning to reach '+proposed.role+'.\nFirst fictional contact: '+next+
 '.\nIntroductions needed: '+routeState.totalHopCount+
 '.\nReal messages sent: 0.';
});
function reply(approve){
 if(!routeState)throw new Error('No active route');
 const recipient=nextRecipient();
 if(!recipient)throw new Error('No eligible next contact');
 const updated=lab.respondIntroduction({eventId:receipt('hop'),actorId:recipient,approve});
 routeState=updated.status==='refused'?null:updated;
 if(!approve){
  current=null;
  return recipient+' DECLINED. Route stops. No personality or financial conclusion inferred.\nNo messages sent.';
 }
 const next=nextRecipient();
 return recipient+' said YES in the made-up scenario.\n'+
   'Accepted '+updated.approvedHopCount+'/'+updated.totalHopCount+
   ' introductions.\n'+
   (next?'Next person's own choice required: '+next:
    'All fictional introductions accepted. The target must still separately agree to the QUESTION.')+
   '\nNo real people contacted.';
}
run('#hop-yes','#route-out',()=>reply(true));
run('#hop-no','#route-out',()=>reply(false));
run('#allow-question','#answer-out',()=>{
 if(!current)throw new Error('No chosen question');
 const q=lab.askQuestion({eventId:receipt('ask'),questionId:current.id,
  actorId:who(current),personIndividuallyAgreesToQuestionInFixture:true});
 questionOpen=true;routeState=null;
 show('#current-question','Question addressed to fictional '+who(current)+': '+q.neutralQuestion+
  '\nNo personal answer predicted. Participant may decline.');
 return 'Fictional subject chose to hear: '+q.neutralQuestion+
  '\nReal prompt dispatched: NO.';
});
function respond(value){
 if(!current||!questionOpen)throw new Error('No personally consented question pending');
 const q=current;
 const r=lab.answer({eventId:receipt('answer'),actorId:who(q),
  answer:value,firstPersonResponseInFixture:true});
 current=null;questionOpen=false;
 const n=lab.priority().suggestedQuestion;
 return q.role+' said '+value.toUpperCase()+' in the toy world.'+
  '\nNext useful inquiry: '+(n?n.role+' — '+n.id:'NONE / STOP')+
  '\nNo work, payment or debt discharge.';
}
run('#answer-yes','#answer-out',()=>respond('yes'));
run('#answer-no','#answer-out',()=>respond('no'));
run('#answer-decline','#answer-out',()=>{
 if(!current||!questionOpen)throw new Error('No question pending');
 const r=lab.declineQuestion({eventId:receipt('decline'),actorId:who(current)});
 current=null;questionOpen=false;
 return r.status+'\nNo answer inferred. No penalty, no contact to real person.';
});
run('#result','#result-out',()=>{
 const d=lab.agreementPreview();
 const a=lab.audit();
 return 'Status: '+d.status+
  '\nSource-owned SATISFACTION-009 consulted: '+(d.source009Consulted?'YES':'not yet')+
  '\nModeled first-person answers: '+a.questionsActuallyAnsweredInFixture+
  '\nOriginal legally discharged rent: $'+(d.legallyDischargedCents/100).toFixed(2)+
  '\nActually performed services: '+(d.completedServices||0)+
  '\nActually sent messages: 0. Actual money moved: $0.00.'+
  '\nNo verified asset rights, final landlord terms or legal discharge.';
});
status();
