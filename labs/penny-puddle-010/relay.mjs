/**
 * Jubilee Treasury / RELAY-010 — explicit, bounded relationship introductions.
 *
 * All identities, contact relations, capacities and consents are synthetic.
 * A directed "I know this person" declaration is NOT reciprocated, verified,
 * transferable as a trust rating, or authority to initiate a payment/contract.
 * Public previews disclose only the first contact already known by the asker.
 * The underlying demo fixture is PUBLIC SOURCE: never insert real contacts.
 */
const key=(v,label)=>{
  if(typeof v!=='string'||!v.trim()||v.length>90)
    throw new TypeError(label+' must be a short nonempty identifier');
  return v;
};
const bounded=(x,label,lo,hi)=>{
  if(!Number.isSafeInteger(x)||x<lo||x>hi)
    throw new TypeError(label+' must be a bounded integer');
  return x;
};
const relationshipTypes=new Set([
  'worked-together','creative-collaborators','neighbor',
  'community-introduction','public-opt-in-intake','online-acquaintance',
  'existing-contractual-counterparty'
]);
const clone=x=>JSON.parse(JSON.stringify(x));
export function makeRelayFixture(){
  return {
    scenario:'Entirely invented contacts: physical asset to landlord satisfaction',
    day:30,
    actors:[
      {id:'G',role:'object owner'},{id:'F',role:'filmmaker'},
      {id:'E',role:'electrician'},{id:'L',role:'landlord'},
      {id:'B',role:'community bridge'},{id:'A',role:'resident'},
      {id:'H',role:'opt-in community hub'}
    ],
    links:[
      {id:'G-F',from:'G',to:'F',how:'creative-collaborators',
        context:'Have collaborated on a community photo exhibit',
        kind:'personal',declaredBy:'G',allowedPurposes:['settle-a-need','creative-work'],
        senderPermitsRequestInFixture:true,recipientMayBeAskedInFixture:true,
        observedDay:24,ttlDays:20,introductionBurden:1},
      {id:'F-E',from:'F',to:'E',how:'online-acquaintance',
        context:'Know each other through a maker discussion',
        kind:'personal',declaredBy:'F',allowedPurposes:['settle-a-need'],
        senderPermitsRequestInFixture:true,recipientMayBeAskedInFixture:true,
        observedDay:20,ttlDays:15,introductionBurden:1},
      {id:'E-L',from:'E',to:'L',how:'worked-together',
        context:'Previously agreed on repair-scope questions',
        kind:'personal',declaredBy:'E',allowedPurposes:['settle-a-need'],
        senderPermitsRequestInFixture:true,recipientMayBeAskedInFixture:true,
        observedDay:27,ttlDays:20,introductionBurden:1},
      {id:'F-B',from:'F',to:'B',how:'community-introduction',
        context:'Met through a volunteer project',
        kind:'personal',declaredBy:'F',allowedPurposes:['settle-a-need'],
        senderPermitsRequestInFixture:true,recipientMayBeAskedInFixture:true,
        observedDay:26,ttlDays:25,introductionBurden:2},
      {id:'B-E',from:'B',to:'E',how:'worked-together',
        context:'Have worked on a workshop',
        kind:'personal',declaredBy:'B',allowedPurposes:['settle-a-need'],
        senderPermitsRequestInFixture:true,recipientMayBeAskedInFixture:true,
        observedDay:29,ttlDays:30,introductionBurden:2},
      {id:'L-A',from:'L',to:'A',how:'existing-contractual-counterparty',
        context:'Landlord and beneficiary directly know the proposed rent obligation',
        kind:'personal',declaredBy:'L',allowedPurposes:['settle-a-need'],
        senderPermitsRequestInFixture:true,recipientMayBeAskedInFixture:true,
        observedDay:27,ttlDays:25,introductionBurden:1},
      {id:'A-H',from:'A',to:'H',how:'public-opt-in-intake',
        context:'Hub allows publicly invited community help requests',
        kind:'open-intake',declaredBy:'H',allowedPurposes:['settle-a-need'],
        senderPermitsRequestInFixture:true,recipientMayBeAskedInFixture:true,
        observedDay:29,ttlDays:3,introductionBurden:1},
      {id:'H-F',from:'H',to:'F',how:'community-introduction',
        context:'Filmmaker opted to hear project requests via hub',
        kind:'personal',declaredBy:'H',allowedPurposes:['settle-a-need'],
        senderPermitsRequestInFixture:true,recipientMayBeAskedInFixture:true,
        observedDay:25,ttlDays:12,introductionBurden:2},
      {id:'G-L-stale',from:'G',to:'L',how:'online-acquaintance',
        context:'An old unconfirmed public comment',
        kind:'personal',declaredBy:'G',allowedPurposes:['settle-a-need'],
        senderPermitsRequestInFixture:true,recipientMayBeAskedInFixture:true,
        observedDay:1,ttlDays:7,introductionBurden:1},
      {id:'G-E-scope-denied',from:'G',to:'E',how:'neighbor',
        context:'Only exchanges garden news',
        kind:'personal',declaredBy:'G',allowedPurposes:['garden-news'],
        senderPermitsRequestInFixture:true,recipientMayBeAskedInFixture:false,
        observedDay:29,ttlDays:10,introductionBurden:1}
    ]
  };
}
export function validateRelayNetwork(f){
  bounded(f?.day,'fictional current day',0,36500);
  if(!Array.isArray(f.actors)||!Array.isArray(f.links)||
      f.actors.length<2||f.actors.length>30||f.links.length>70)
    throw new Error('Small bounded actor and consent graph required');
  const actors=new Set();
  for(const a of f.actors){
    key(a?.id,'actor ID');
    if(actors.has(a.id))throw new Error('Duplicate actor');
    actors.add(a.id);
    if(typeof a.role!=='string'||!a.role.trim())throw new Error('Fictional role required');
  }
  const links=new Set();
  for(const e of f.links){
    key(e?.id,'link ID');key(e.from,'from');key(e.to,'to');
    if(links.has(e.id))throw new Error('Duplicate contact link');
    links.add(e.id);
    if(e.from===e.to||!actors.has(e.from)||!actors.has(e.to))
      throw new Error('No self referral or unknown contact');
    if(!relationshipTypes.has(e.how) ||
       !['personal','open-intake'].includes(e.kind) ||
       (e.kind==='open-intake'&&e.how!=='public-opt-in-intake') ||
       e.declaredBy!==(e.kind==='open-intake'?e.to:e.from))
      throw new Error('Invalid source of relationship assertion');
    if(typeof e.context!=='string'||!e.context.trim()||e.context.length>150)
      throw new Error('Bounded relationship context required');
    if(!Array.isArray(e.allowedPurposes)||e.allowedPurposes.length>8 ||
       !e.allowedPurposes.every(p=>typeof p==='string'&&p.length>0&&p.length<=50))
      throw new Error('Explicit scope required');
    if(typeof e.senderPermitsRequestInFixture!=='boolean' ||
       typeof e.recipientMayBeAskedInFixture!=='boolean')
      throw new Error('Both introduction permissions are explicit assertions');
    bounded(e.observedDay,'relation observed day',0,36500);
    bounded(e.ttlDays,'relationship freshness',1,365);
    bounded(e.introductionBurden,'introduction burden',1,10);
  }
  return f;
}
const live=(f,e,purpose,strongOnly)=>{
  if(!e.senderPermitsRequestInFixture||!e.recipientMayBeAskedInFixture)return false;
  if(!e.allowedPurposes.includes(purpose))return false;
  if(f.day<e.observedDay||f.day>e.observedDay+e.ttlDays)return false;
  if(strongOnly && !['worked-together','creative-collaborators','neighbor'].includes(e.how))
    return false;
  return true;
};
function privateRoutes(f,{from,to,purpose,maxHops,maxBurden,strongOnly}){
  const choices=[],seen=new Set();
  function dfs(actor,pathEdges,visited,burden){
    if(actor===to && pathEdges.length){
      const token=pathEdges.map(e=>e.id).join('|');
      if(!seen.has(token)){
        choices.push({edges:[...pathEdges],burden,
          hops:pathEdges.length,weakLinks:pathEdges.filter(e=>
            !['worked-together','creative-collaborators','neighbor'].includes(e.how)).length});
        seen.add(token);
      }
      return;
    }
    if(pathEdges.length>=maxHops)return;
    for(const e of f.links){
      if(e.from!==actor||visited.has(e.to)||!live(f,e,purpose,strongOnly))continue;
      if(burden+e.introductionBurden>maxBurden)continue;
      visited.add(e.to);
      pathEdges.push(e);
      dfs(e.to,pathEdges,visited,burden+e.introductionBurden);
      pathEdges.pop();visited.delete(e.to);
    }
  }
  dfs(from,[],new Set([from]),0);
  choices.sort((a,b)=>a.hops-b.hops||a.burden-b.burden||
    a.edges.map(x=>x.id).join('|').localeCompare(b.edges.map(x=>x.id).join('|')));
  return choices;
}
export function createRelayLab(f,{
  from='G',to='L',purpose='settle-a-need',maxHops=5,maxBurden=12,strongOnly=false
}={}){
  validateRelayNetwork(f);
  key(from,'origin');key(to,'destination');key(purpose,'purpose');
  if(from===to||!f.actors.some(x=>x.id===from)||!f.actors.some(x=>x.id===to))
    throw new Error('Distinct declared participants required');
  bounded(maxHops,'maximum introduction hops',1,7);
  bounded(maxBurden,'maximum introduction burden',1,50);
  const routes=privateRoutes(f,{from,to,purpose,maxHops,maxBurden,strongOnly}).slice(0,20);
  const state=routes.map((r,i)=>({
    id:'route-'+(i+1),edges:r.edges,burden:r.burden,hops:r.hops,
    current:0,requested:false,status:'unrequested',accepted:[],
    rejectionReason:null
  }));
  const publicPreview=()=>({
    sourceOwnsContactsOnlyInFixture:true,realIdentityVerified:false,
    networkLoadedFromActualContacts:false,
    searchPurpose:purpose,
    pathsAvailable:state.length,
    candidates:state.map(r=>({
      routeId:r.id,
      firstKnownContact:r.edges[0].to,
      firstRelationshipContext:r.edges[0].context,
      introductionCount:r.hops,
      needsIndividualConsent:true,
      ownerCanInspectPrivateRemoteContacts:false,
      readyForAnyEconomicAction:false,
      status:r.status,
      // An unknown friend-of-friend is never revealed by the public preview.
      remoteNamesWithheld:true
    })),
    trueRealWorldPeopleContacted:0,personnelAuthorizedToAct:false
  });
  const item=routeId=>{
    key(routeId,'route ID');
    const r=state.find(x=>x.id===routeId);
    if(!r)throw new Error('Unknown proposal');
    return r;
  };
  const usedEvents=new Set(),events=[];
  const mark=(eventId,kind,routeId)=>{
    key(eventId,'event ID');
    if(usedEvents.has(eventId))throw new Error('Duplicate introduction event');
    usedEvents.add(eventId);
    events.push({eventId,kind,routeId,deliveryExternallyVerified:false});
  };
  const routeSummary=(r)=>({
    routeId:r.id,status:r.status,
    approvedHopCount:r.accepted.length,
    totalHopCount:r.hops,
    allRelaysInFixtureAccepted:r.status==='all-introductions-accepted-in-fixture',
    legalDealMade:false,relationshipEvidenceVerified:false,
    privatelyWithheldParticipantsRemainHidden:true
  });
  function request({eventId,routeId,initiatorId}){
    const r=item(routeId);
    if(initiatorId!==from)throw new Error('Only actual origin fixture actor can request');
    if(r.requested)throw new Error('Route already requested');
    mark(eventId,'ASK_FIRST_INTRODUCER',routeId);
    r.requested=true;
    r.status='awaiting-individual-choice';
    return routeSummary(r);
  }
  function inboxFor(actorId){
    key(actorId,'actorId');
    return state.filter(r=>r.requested && r.status==='awaiting-individual-choice' &&
      r.edges[r.current]?.to===actorId).map(r=>({
      routeId:r.id,initiatedByImmediateContact:r.edges[r.current].from,
      declaredHowTheyKnowYou:r.edges[r.current].how,
      introductionPurpose:purpose,
      contactId:actorId,
      mayDeclineWithoutPenalty:true,
      previousPrivatePathHidden:true,
      recipientCannotConsentForAnyOtherPerson:true
    }));
  }
  function respond({eventId,routeId,actorId,approve}){
    const r=item(routeId);
    if(r.status!=='awaiting-individual-choice')throw new Error('No live invitation');
    const e=r.edges[r.current];
    if(actorId!==e.to)throw new Error('Only the next named recipient may assert consent');
    if(typeof approve!=='boolean')throw new TypeError('Explicit acceptance or refusal required');
    mark(eventId,approve?'FICTIONAL_CONTACT_ACCEPTED':'FICTIONAL_CONTACT_DECLINED',routeId);
    if(!approve){r.status='refused';r.rejectionReason='receiver-declined';}
    else{
      r.accepted.push(e.to);
      r.current++;
      r.status=r.current===r.edges.length?'all-introductions-accepted-in-fixture':
        'awaiting-individual-choice';
    }
    return routeSummary(r);
  }
  function withdraw({eventId,routeId,actorId}){
    const r=item(routeId);
    if(actorId!==from&&!r.accepted.includes(actorId))
      throw new Error('Only initiator or previously agreeing person may withdraw');
    if(!r.requested||r.status==='withdrawn')throw new Error('No active proposal');
    mark(eventId,'FICTIONAL_INTRODUCTION_WITHDRAWN',routeId);
    r.status='withdrawn';
    return routeSummary(r);
  }
  function readiness(routeId){
    const r=item(routeId);
    return {
      ...routeSummary(r),
      onlyCandidateToOpenNegotiation:r.status==='all-introductions-accepted-in-fixture',
      actualIntroductionsSent:0,
      allNonconsentedPeopleProtected:true,
      noFinancialTrustOrPaymentInferred:true
    };
  }
  return {
    publicPreview,request,inboxFor,respond,withdraw,readiness,
    audit:()=>({events:clone(events),realContactRequestsSent:0,
      noRealPersonIdentified:true,authNotImplemented:true})
  };
}
