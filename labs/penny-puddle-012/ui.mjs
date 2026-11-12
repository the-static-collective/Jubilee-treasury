import {benchmarkQuestionPolicies} from './question-value.mjs';
import {createQuestionWeave} from './weave.mjs';

const $=x=>document.querySelector(x);
const say=(where,value)=>{$(where).textContent=value;};
const w=createQuestionWeave();
let intro=false,subject=false;
function next(){
  const p=w.planNext();
  const recommended=p.recommendedQuestion;
  if(!intro){
    say('#next-text','First create the two fictional, separately consented introductions.');
  }else if(!subject){
    say('#next-text','Mechanic has not opted into personal questions. The learner may choose a question about their own preferences.');
  }else if(recommended){
    say('#next-text','NEXT CONSENTED QUESTION ('+recommended.actorId+'): '+
      recommended.neutralPrompt+'\n\nModel expected net decision value, under invented priors: '+
      recommended.modeledDecisionValuePoints.toFixed(2)+' scenario points.'+
      '\nNever dispatch automatically; only the individual chooses an answer.');
  }else{
    say('#next-text','STOP: '+p.status+'. No more personal questions are justified by the current scenario.');
  }
  const person=intro&&recommended?.actorId;
  $('#learner-yes').disabled=person!=='learner';
  $('#learner-no').disabled=person!=='learner';
  $('#mechanic-yes').disabled=person!=='mechanic'||!subject;
  $('#mechanic-no').disabled=person!=='mechanic'||!subject;
}
$('#compare').addEventListener('click',()=>{
  try{
    const b=benchmarkQuestionPolicies();
    say('#compare-out',
      'Baseline: '+b.noQuestion.action+
      ' ('+b.noQuestion.expectedScenarioPoints.toFixed(2)+' fictional points).\n'+
      'Highest answer entropy: '+b.naiveEntropyQuestion+
      ' → improvement '+b.naiveEntropyGrossDecisionValuePoints.toFixed(2)+'.\n'+
      'Best ONE-step decision value: '+b.decisionQuestion+
      ' → net improvement '+b.decisionExpectedNetValuePoints.toFixed(2)+'.\n'+
      'Exact TWO-question policy: '+b.exactTwoQuestionPolicy.firstQuestionId+
      ' → net expected outcome '+b.exactTwoQuestionPolicy.expectedScenarioPointsNet.toFixed(2)+'.\n'+
      'The multi-step policy avoids burdening the mechanic if the learner does not want to learn.\n'+
      'All weights/benefits are invented, not people\'s actual preferences.'
    );
  }catch(e){say('#compare-out','HOLD: '+e.message);}
});
$('#intro').addEventListener('click',()=>{
  try{
    if(intro)throw new Error('Introductions already simulated');
    const p=w.openIntroductions();
    intro=true;
    $('#intro').disabled=true;
    say('#intro-out','Two separate introductions self-asserted in the fixture.\n'+
      'RELAY-011 route ready: '+p.introReady+
      '.\nNo mechanic preferences disclosed.\nReal people contacted: ZERO.');
    next();
  }catch(e){say('#intro-out','HOLD: '+e.message);}
});
$('#subject').addEventListener('click',()=>{
  try{
    if(!intro||subject)throw new Error('Need fresh, unused RELAY introduction first');
    const p=w.subjectChoosesQuestionConsent({approve:true});
    subject=!!p.permission;
    $('#subject').disabled=true;
    say('#intro-out','Mechanic consented (FICTIONALLY) to being asked a neutral scoped question.\n'+
      'Their answers and personal motivation are still hidden. No genuine contact or verification.');
    next();
  }catch(e){say('#intro-out','HOLD: '+e.message);}
});
function answer(actorId,response){
  try{
    if(!intro||!subject)throw new Error('Finish mock introductions and ask permission');
    const a=w.askAndAnswer({actorId,answer:response});
    say('#question-out',actorId+' answered '+response.toUpperCase()+
      ' in the fake experiment.\nQuestion: '+a.questionId+
      '\nToy updated best action: '+a.suggestedNextWorldAction+
      '\nActual person consulted: NO.');
    say('#deal-out',a.contextProposals.length?
      'First-person authorized hypothetical choices: '+a.contextProposals.join(' / ')+
      '\nOriginal DEALWEAVER-007 Pareto bundles: '+
      a.sourcedDealweaverPareto.map(ids=>ids.join('+')).join(' | ')+
      '\nReal work or agreement: NONE. Money: $0.00.':
      'No first-person-approved work proposal exists.\nNo consent is ever inferred from the question response.');
    next();
  }catch(e){say('#question-out','HOLD: '+e.message);}
}
$('#learner-yes').addEventListener('click',()=>answer('learner','yes'));
$('#learner-no').addEventListener('click',()=>answer('learner','no'));
$('#mechanic-yes').addEventListener('click',()=>answer('mechanic','yes'));
$('#mechanic-no').addEventListener('click',()=>answer('mechanic','no'));
next();
