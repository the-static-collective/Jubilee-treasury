import {makeRelayFixture,createRelayLab} from './relay.mjs';
import {evaluateSocialReach} from './weave.mjs';
const network=makeRelayFixture();
const $=id=>document.querySelector(id);
const write=(id,value)=>{$(id).textContent=value;};
let lab=null,routeId=null,requestNumber=0,answerNumber=0;
function create(o){
  lab=createRelayLab(network,o);
  routeId=lab.publicPreview().candidates[0]?.routeId??null;
  $('#request').disabled=!routeId;
  $('#accept').disabled=true;$('#decline').disabled=true;
  const p=lab.publicPreview();
  if(!routeId)write('#path','No purpose-permitted, sufficiently fresh contact chain. An open volunteer hub or a new willing intermediary may be needed.');
  else write('#path','Found '+p.pathsAvailable+' possible introductions.\nFirst person YOU can ask: '+p.candidates[0].firstKnownContact+
    '\nHow you know this person: '+p.candidates[0].firstRelationshipContext+
    '\nPossible hops: '+p.candidates[0].introductionCount+
    '\nPeople beyond your first contact are not disclosed yet.\nNo contact has been made.');
  write('#consent','No invitations or agreements yet.');
}
$('#search').addEventListener('click',()=>create({from:'G',to:'L',purpose:'settle-a-need'}));
$('#strong').addEventListener('click',()=>create({from:'G',to:'L',purpose:'settle-a-need',strongOnly:true}));
$('#open').addEventListener('click',()=>create({from:'A',to:'F',purpose:'settle-a-need'}));
$('#request').addEventListener('click',()=>{
  if(!lab||!routeId)return;
  try{
    const from=lab.publicPreview().searchPurpose==='settle-a-need' &&
      lab.publicPreview().candidates[0]?.firstKnownContact==='H'?'A':'G';
    lab.request({eventId:'start-'+(++requestNumber),routeId,initiatorId:from});
    $('#request').disabled=true;$('#accept').disabled=false;$('#decline').disabled=false;
    write('#consent','Fictional request prepared. Each recipient may independently say YES or NO. No message sent.');
  }catch(e){write('#consent','HOLD: '+e.message);}
});
function respond(approve){
  if(!lab||!routeId)return;
  try{
    const r=lab.readiness(routeId);
    if(r.status!=='awaiting-individual-choice')throw new Error('No invitation pending');
    // On a real service, the authenticated participant must claim their own
    // inbox; the local-only fixture enumerates invented pseudonyms for demo.
    const next=network.actors.find(actor=>lab.inboxFor(actor.id).some(row=>row.routeId===routeId));
    if(!next)throw new Error('No invited pseudonym found');
    const state=lab.respond({eventId:'reply-'+(++answerNumber),
      routeId,actorId:next.id,approve});
    write('#consent',next.id+' '+(approve?'chose YES':'chose NO')+' in the invented fixture.\n'+
      'Accepted so far: '+state.approvedHopCount+'/'+state.totalHopCount+
      '\nStatus: '+state.status+
      '\nActual messages sent: ZERO. Economic agreement completed: NO.');
    if(state.status!=='awaiting-individual-choice'){
      $('#accept').disabled=true;$('#decline').disabled=true;
    }
  }catch(e){write('#consent','HOLD: '+e.message);}
}
$('#accept').addEventListener('click',()=>respond(true));
$('#decline').addEventListener('click',()=>respond(false));
$('#evaluate').addEventListener('click',()=>{
  const r=evaluateSocialReach({network,beneficiaryConsentAsserted:false});
  write('#deal','Connection coverage: '+r.pairs.filter(x=>x.candidateIntroductionRoutes>0).length+
    '/'+r.pairs.length+' separate participant relationships are potentially reachable.'+
    '\nBeneficiary has approved the proposed deal: NO.'+
    '\nCreditor legally agreed in reality: NO.'+
    '\nActual introduction approvals from real people: ZERO.'+
    '\nPotential status: '+r.status+
    '\nServices actually delivered: 0. Rent legally discharged: $0.00.'+
    '\nThe next human step would be permission for confidential, role-appropriate negotiation.');
});
