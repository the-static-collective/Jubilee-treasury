import {createContextWeave} from './weave.mjs';
const w=createContextWeave();
const $=x=>document.querySelector(x);
const out=(selector,value)=>{$(selector).textContent=value;};
let eventCounter=0;
const eventId=prefix=>prefix+'-'+(++eventCounter);
const perform=(button,where,fn)=>{
  $(button).addEventListener('click',()=>{
    try{out(where,fn());}
    catch(e){out(where,'HOLD: '+(e instanceof Error?e.message:'Unsupported action'));}
  });
};
perform('#start-intro','#intro-out',()=>{
  const s=w.startIntroductions({eventId:eventId('request'),requesterId:'learner'});
  return 'First fictional introduction requested.\n'+
    'Awaiting independent HUB response.\nApproved: '+s.approvedHopCount+'/'+s.totalHopCount+
    '\nReal messages sent: 0.';
});
perform('#hub-yes','#intro-out',()=>{
  const s=w.respondToIntroduction({eventId:eventId('hub-yes'),actorId:'hub',approve:true});
  return 'Hub agreed to ask the next person.\n'+
    'The mechanic has not consented yet.\nApproved: '+s.approvedHopCount+'/'+s.totalHopCount;
});
perform('#hub-no','#intro-out',()=>{
  const s=w.respondToIntroduction({eventId:eventId('hub-no'),actorId:'hub',approve:false});
  return 'Hub declined. No further introductions.\n'+s.status+'\nNo penalty for saying no.';
});
perform('#mechanic-yes','#intro-out',()=>{
  const s=w.respondToIntroduction({eventId:eventId('mechanic-intro-yes'),actorId:'mechanic',approve:true});
  return 'Mechanic agreed to receive an invitation to discuss the purpose.\n'+
    'Introduction path: '+s.status+'\nNot a commitment to do repairs or teach.';
});
perform('#mechanic-no','#intro-out',()=>{
  const s=w.respondToIntroduction({eventId:eventId('mechanic-intro-no'),actorId:'mechanic',approve:false});
  return 'Mechanic declined. Nothing is forwarded.\n'+s.status;
});
perform('#ask-question','#context-out',()=>{
  const q=w.askOwnPreferences({eventId:eventId('ask-preference'),requesterId:'learner'});
  return q.question.neutralQuestion+'\nNo personal fact was inferred.\n'+q.status;
});
function share(motive){
  const s=w.answerOwnPreferences({
    eventId:eventId('mechanic-self-report'),actorId:'mechanic',
    approve:true,shareAvailability:true,
    shareFormats:['teach-together','remote-guidance'],
    shareMotivation:motive,ttlDays:5
  });
  const disclosed=w.context.sharedFor('learner','repair-learning');
  return 'MECHANIC SELF-REPORTED: '+s.revealedFormats.join(' / ')+
    '\nShared available time: '+disclosed.slots.join(', ')+
    '\nPrivate motivation: '+(motive?disclosed.disclosedMotivation:'WITHHELD')+
    '\nOnly learner may see these fields for this purpose.\nNo work committed.';
}
perform('#share-teaching','#context-out',()=>share(false));
perform('#share-motive','#context-out',()=>share(true));
perform('#refuse-share','#context-out',()=>{
  const s=w.answerOwnPreferences({eventId:eventId('mechanic-refusal'),
    actorId:'mechanic',approve:false});
  return 'Mechanic declined.\n'+s.status+
    '\nNo personal context disclosed or used in matching.';
});
perform('#compare','#baseline',()=>{
  const b=w.context.skillOnlyBaseline();
  return 'Naive suggestion: '+b.naiveSuggestion+
    '\nAssumes this person will perform a paid service.'+
    '\nSubject actually wants it (fictional): '+(b.subjectWouldWillinglyChooseThisFormatInFixture?'yes':'NO')+
    '\nActual authority to assign work: NONE.';
});
$('#compare').addEventListener('click',()=>{
  try{
    const p=w.proposals();
    if(!p.candidates?.length){out('#contextual','No consented context to recommend a format. Ask the person first.');return;}
    const d=w.dealweaverComparison();
    out('#contextual',p.candidates.map(v=>
      v.title+'\n  Subject self-rated benefit: '+v.subjectBenefitSelfRated+
      '\n  Learner self-rated benefit: '+v.requesterBenefitSelfRated+
      '\n  Hypothetical people/planet: '+v.socialScenarioSignal+'/'+v.environmentalScenarioSignal
    ).join('\n\n')+'\n\nPareto suggested by RELAY-011: '+
      p.paretoSuggestions.map(x=>x.id).join(', ')+
      '\nDEALWEAVER-007 compatible option bundles: '+
      d.paretoBundles.map(x=>x.ids.join('+')).join(' | ')+
      '\nNo one is assigned or committed.');
  }catch(e){out('#contextual','HOLD: '+e.message);}
});
perform('#offer','#deal-out',()=>{
  const s=w.offer({eventId:eventId('learner-offer'),actorId:'learner',
    proposalId:'learn-by-repairing'});
  return 'Learner offers: '+s.namedMockTerms.format+
    '\nTerms: '+s.namedMockTerms.safeguardingConditions.join(', ')+
    '\nAwaiting mechanic\'s independent choice.\n'+s.status;
});
perform('#mentor-accept','#deal-out',()=>{
  const s=w.respondToOffer({eventId:eventId('mechanic-accept'),actorId:'mechanic',approve:true});
  return 'Mechanic says yes to these specific hypothetical terms.\n'+
    'Learner must separately reaffirm.\n'+s.status;
});
perform('#mentor-decline','#deal-out',()=>{
  const s=w.respondToOffer({eventId:eventId('mechanic-decline'),actorId:'mechanic',approve:false});
  return 'Mechanic declined without penalty.\n'+s.status;
});
perform('#learner-confirm','#deal-out',()=>{
  const s=w.requesterReaffirms({eventId:eventId('learner-reaffirm'),actorId:'learner',approve:true});
  return 'Both fictional people expressed interest.\n'+
    'STATUS: '+s.status+'\nActual lesson delivered: NO.'+
    '\nMoney moved: $0.00.\nLegally enforceable agreement verified: NO.'+
    '\nParticipant satisfaction measured: NO.';
});
perform('#revoke','#deal-out',()=>{
  w.revokeSubjectContext({eventId:eventId('mechanic-revokes'),actorId:'mechanic'});
  return 'Mechanic revoked the first-person sharing grant.'+
    '\nExisting candidate status: '+w.agreementSnapshot().status+
    '\nNo future matching can reuse the disclosed preference.';
});
