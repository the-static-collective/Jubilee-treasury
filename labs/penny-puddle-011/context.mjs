/**
 * RELAY-011 — CONTEXTUAL MATCHING / "Ask the person, don't profile them"
 *
 * All identities, relationship paths, self-reported benefits and preferences
 * in this public-source experiment are fictional.
 * Only a subject can consent to sharing *their own* scoped context.
 * Unverified suggestions about third parties are never indexed as facts.
 * This engine cannot verify identity, send messages, claim a contract,
 * perform work, create money, or inspect someone's private contact list.
 */
const id=(v,k)=>{if(typeof v!=='string'||!v.trim()||v.length>100)throw new TypeError(k+' must be short nonempty text');return v;};
const int=(v,k,min=0,max=36500)=>{if(!Number.isSafeInteger(v)||v<min||v>max)throw new TypeError(k+' must be a bounded integer');return v;};
const uniq=(xs,k,max=12)=>{
  if(!Array.isArray(xs)||xs.length>max||!xs.every(x=>typeof x==='string'&&x.trim()&&x.length<=100)||
     new Set(xs).size!==xs.length)throw new TypeError(k+' requires unique short labels');
  return [...xs];
};
const clone=x=>JSON.parse(JSON.stringify(x));
const allowedFormats=new Set(['teach-together','repair-for-hire','remote-guidance','refer-another','community-workshop']);
const safeTerms=new Set(['bring-parts','workshop-safety','time-bound','optional-lunch','no-unlicensed-work','no-transfer-of-title']);
const expected=(value,label)=>{if(value!==true)throw new Error(label+' must be explicitly true in fixture');};
const dayValid=(now,expires)=>now<=expires;
export function makeContextFixture(){
  return {
    day:30,
    purpose:'repair-learning',
    requester:{
      id:'learner',selfAuthoredInFixture:true,
      skillRequested:'tractor-diagnostics',
      acceptableFormats:['repair-for-hire','teach-together','remote-guidance'],
      acceptableSlots:['saturday-afternoon'],
      preferenceBenefits:{'repair-for-hire':3,'teach-together':8,'remote-guidance':2},
      personalHardNos:['unsafe-unlicensed-repairs'],
      consentToPrivateProposalInFixture:true
    },
    subject:{
      id:'mechanic',selfAuthoredInFixture:true,
      allowedPurposes:['repair-learning'],
      skillOffered:'tractor-diagnostics',
      privatePreferenceText:'I enjoy showing someone how their own machine works.',
      preferredFormats:['teach-together','remote-guidance'],
      unacceptableFormats:['repair-for-hire'],
      availableSlots:['saturday-afternoon'],
      selfDeclaredBenefits:{'teach-together':6,'remote-guidance':3},
      terms:['bring-parts','workshop-safety','time-bound','no-unlicensed-work'],
      expiresDay:40,
      publicDirectoryOptIn:false
    },
    menu:[
      {id:'repair-done-for-you',format:'repair-for-hire',slot:'saturday-afternoon',
        title:'Someone repairs the tractor for the owner',concreteTerms:['bring-parts','time-bound'],
        selfReportedSocialSignal:0,selfReportedEnvironmentalSignal:0},
      {id:'learn-by-repairing',format:'teach-together',slot:'saturday-afternoon',
        title:'Learn together while diagnosing the tractor',concreteTerms:['bring-parts','workshop-safety','time-bound','no-unlicensed-work'],
        selfReportedSocialSignal:2,selfReportedEnvironmentalSignal:1},
      {id:'short-video-call',format:'remote-guidance',slot:'saturday-afternoon',
        title:'Short remote troubleshooting lesson',concreteTerms:['time-bound','no-unlicensed-work'],
        selfReportedSocialSignal:1,selfReportedEnvironmentalSignal:0}
    ]
  };
}
export function validateContext(f){
  int(f?.day,'scenario day');
  id(f.purpose,'purpose');
  const r=f.requester,s=f.subject;
  id(r?.id,'requester');id(s?.id,'subject');
  if(r.id===s.id)throw new Error('Cannot request your own confidential context');
  expected(r.selfAuthoredInFixture,'requester self-authorship');
  expected(s.selfAuthoredInFixture,'subject self-authorship');
  expected(r.consentToPrivateProposalInFixture,'requester opt-in');
  uniq(r.acceptableFormats,'requester formats');
  uniq(r.acceptableSlots,'requester slots');
  uniq(s.allowedPurposes,'subject purposes');
  uniq(s.preferredFormats,'subject formats');
  uniq(s.unacceptableFormats,'subject refusals');
  uniq(s.availableSlots,'subject slots');
  uniq(s.terms,'explicit terms');
  if(!r.acceptableFormats.every(v=>allowedFormats.has(v)) ||
     !s.preferredFormats.every(v=>allowedFormats.has(v)) ||
     !s.unacceptableFormats.every(v=>allowedFormats.has(v)) ||
     !s.terms.every(t=>safeTerms.has(t)))
    throw new Error('Unsupported format or safeguard type');
  id(r.skillRequested,'requested skill');id(s.skillOffered,'offered skill');
  if(typeof s.privatePreferenceText!=='string'||s.privatePreferenceText.length>350)
    throw new Error('Private preference cannot be inferred, unbounded or externally authored');
  if(s.publicDirectoryOptIn!==false)
    throw new Error('Private subject is not an unsolicited public directory listing');
  int(s.expiresDay,'subject profile expiry');
  for(const [k,m] of [['requester',r.preferenceBenefits],['subject',s.selfDeclaredBenefits]]){
    if(!m||typeof m!=='object'||Array.isArray(m))
      throw new Error(k+' must author an explicit format-benefit map');
    for(const [name,val] of Object.entries(m)){
      if(!allowedFormats.has(name))throw new Error('Unknown benefit format');
      int(val,k+' benefit',-10,10);
    }
  }
  if(!Array.isArray(f.menu)||f.menu.length>12)throw new Error('At most 12 invented deal formats');
  const ids=new Set();
  for(const m of f.menu){
    id(m?.id,'menu ID');
    if(ids.has(m.id))throw new Error('Duplicate menu proposal');
    ids.add(m.id);
    if(!allowedFormats.has(m.format)||typeof m.slot!=='string'||!m.slot.trim())
      throw new Error('Format and time window required');
    id(m.title,'proposal headline');
    uniq(m.concreteTerms,'proposal terms');
    if(!m.concreteTerms.every(t=>safeTerms.has(t)))
      throw new Error('Unknown deal term');
    int(m.selfReportedSocialSignal,'social scenario',-5,10);
    int(m.selfReportedEnvironmentalSignal,'planet scenario',-5,10);
  }
  return true;
}

/**
 * No guesses about personality, financial means, politics, medical status,
 * protected traits, or relationship status. The only admissible 'hint' can
 * generate a NEUTRAL invitation to ask the actual subject.
 */
export function createContextLab(f){
  validateContext(f);
  const fixture=clone(f);
  let today=f.day,invitation=null,grant=null;
  const usedIds=new Set(),events=[];
  const record=(eventId,kind)=>{
    id(eventId,'event ID');
    if(usedIds.has(eventId))throw new Error('Duplicate consent receipt');
    usedIds.add(eventId);
    events.push({eventId,kind,realDelivery:false});
  };
  const authorized=(requesterId,subjectId,purpose)=>{
    return requesterId===fixture.requester.id&&subjectId===fixture.subject.id&&
      purpose===fixture.purpose&&fixture.subject.allowedPurposes.includes(purpose);
  };
  const currentlyAllowed=()=>grant&&grant.status==='approved'&&
    grant.expiresDay>=today&&fixture.subject.expiresDay>=today;
  const noteToSubject=()=>({
    neutralQuestion:'Would you like to discuss a learning-focused tractor-repair arrangement?',
    personalTraitGuessed:false,
    subjectMustDecideTheirOwnFormats:true,
    contactOrMessageActuallySent:false
  });
  function suggestQuestion({eventId,introducerId,subjectId,purpose,
    introductionApprovedInFixture}){
    id(introducerId,'introducer ID');
    if(introducerId===fixture.requester.id||introducerId===subjectId)
      throw new Error('A third-party introducer must be distinct');
    if(subjectId!==fixture.subject.id||purpose!==fixture.purpose)
      throw new Error('Subject or purpose not in fixture');
    expected(introductionApprovedInFixture,'explicit simulated introductions');
    record(eventId,'QUESTION_SUGGESTED_NOT_PERSONAL_FACT');
    return {toRequester:'A willing intermediary could ask someone about an arrangement.',
      nextQuestion:noteToSubject(),claimedFactAboutSubject:null,
      privatePreferenceWasDisclosed:false};
  }
  function requestContext({eventId,requesterId,subjectId,purpose,
    allRelayHopsConsentedInFixture}){
    if(!authorized(requesterId,subjectId,purpose))throw new Error('No authorized purpose or actors');
    expected(allRelayHopsConsentedInFixture,'all simulated RELAY introductions');
    if(invitation && invitation.status==='pending')throw new Error('Invitation already pending');
    if(!dayValid(today,fixture.subject.expiresDay))throw new Error('Subject profile is stale; need new first-person update');
    record(eventId,'SUBJECT_ASKED_NEUTRALLY');
    invitation={requesterId,subjectId,purpose,status:'pending',day:today};
    grant=null;
    return {status:'waiting-for-subject',question:noteToSubject(),
      hiddenSubjectPreferencesDisclosed:false};
  }
  function subjectRespond({eventId,actorId,approve,shareFormats=[],
    shareAvailability=false,shareMotivation=false,ttlDays=5}){
    if(!invitation||invitation.status!=='pending')throw new Error('No pending question for this subject');
    if(actorId!==fixture.subject.id)throw new Error('Only subject can share their own preferences');
    if(typeof approve!=='boolean')throw new TypeError('Subject must explicitly accept or refuse');
    record(eventId,approve?'SUBJECT_SELF_DISCLOSURE':'SUBJECT_REFUSED');
    invitation.status=approve?'approved':'refused';
    if(!approve){grant=null;return {status:'refused',noPenaltyForDeclining:true};}
    expected(shareAvailability,'share availability');
    uniq(shareFormats,'chosen disclosed formats');
    if(!shareFormats.length ||
       !shareFormats.every(x=>fixture.subject.preferredFormats.includes(x) &&
         !fixture.subject.unacceptableFormats.includes(x)))
      throw new Error('Only a subject\'s explicitly authored, permitted formats may be shared');
    if(typeof shareMotivation!=='boolean')throw new TypeError('Subject must decide whether motivation is shared');
    int(ttlDays,'disclosure lifetime',1,30);
    grant={status:'approved',recipientId:invitation.requesterId,
      purpose:invitation.purpose,formats:[...shareFormats],
      expiresDay:Math.min(today+ttlDays,fixture.subject.expiresDay),
      shareMotivation,revoked:false};
    return {status:'approved',expiresDay:grant.expiresDay,
      recipientId:grant.recipientId,
      revealedFormats:[...grant.formats],
      motivationRevealed:shareMotivation,
      canStillRefuseDeal:true,actualPersonAuthenticated:false};
  }
  function revoke({eventId,actorId}){
    if(actorId!==fixture.subject.id)throw new Error('Only subject can revoke their own disclosure');
    if(!grant||grant.status!=='approved')throw new Error('No active disclosure');
    record(eventId,'SUBJECT_REVOKED_CONTEXT');
    grant.status='revoked';grant.revoked=true;
    return {status:'revoked',futureMatchingPermitted:false};
  }
  function advanceDay(day){
    int(day,'future day',today,36500);
    today=day;
    return {currentDay:today,sharingStillValid:!!currentlyAllowed()};
  }
  function sharedFor(requesterId,purpose){
    if(!currentlyAllowed()||requesterId!==grant.recipientId||purpose!==grant.purpose)
      return {available:false,reason:'no-live-subject-authored-sharing-grant',
        hasGuessedPersonalFacts:false};
    return {
      available:true,subjectId:fixture.subject.id,
      skillOffered:fixture.subject.skillOffered,
      disclosedFormats:[...grant.formats],
      slots:[...fixture.subject.availableSlots],
      disclosedMotivation:grant.shareMotivation?fixture.subject.privatePreferenceText:null,
      expiresDay:grant.expiresDay,scope:grant.purpose,
      isSubjectReportedNotIndependentlyVerified:true,
      grantedPermissionToNegotiate:false
    };
  }
  function proposeFor(requesterId,purpose){
    const shared=sharedFor(requesterId,purpose);
    if(!shared.available)return {status:'HOLD-no-subject-permission',
      candidates:[],unverifiedCandidateCount:0,
      introspectiveAssumptionsUsed:false,realDealAuthority:false};
    const r=fixture.requester,s=fixture.subject;
    const candidates=fixture.menu.flatMap(m=>{
      const viable= s.skillOffered===r.skillRequested &&
        shared.disclosedFormats.includes(m.format) &&
        r.acceptableFormats.includes(m.format) &&
        s.availableSlots.includes(m.slot) &&
        r.acceptableSlots.includes(m.slot) &&
        !s.unacceptableFormats.includes(m.format) &&
        m.concreteTerms.every(t=>s.terms.includes(t)) &&
        (s.selfDeclaredBenefits[m.format]||0)>0 &&
        (r.preferenceBenefits[m.format]||0)>0;
      if(!viable)return [];
      return [{
        id:m.id,title:m.title,format:m.format,slot:m.slot,
        concreteTerms:[...m.concreteTerms],
        subjectBenefitSelfRated:s.selfDeclaredBenefits[m.format],
        requesterBenefitSelfRated:r.preferenceBenefits[m.format],
        minimumParticipantBenefit:Math.min(s.selfDeclaredBenefits[m.format],
          r.preferenceBenefits[m.format]),
        socialScenarioSignal:m.selfReportedSocialSignal,
        environmentalScenarioSignal:m.selfReportedEnvironmentalSignal,
        evidence:'first-person-declared-preferences-in-fictional-fixture',
        impactIndependentlyMeasured:false,
        negotiationStatus:'candidate-only-no-deal',
        privateMotivationNotNeededForScoring:true,
        sourceConsentExpiresDay:grant.expiresDay,
        realMoneyMovedCents:0,servicesActuallyPerformed:0
      }];
    });
    // Not a universal, interpersonal cardinal utility or monetization formula.
    // Pareto dominance only when all four *separately declared* axes improve.
    const axes=['subjectBenefitSelfRated','requesterBenefitSelfRated',
      'socialScenarioSignal','environmentalScenarioSignal'];
    const frontier=candidates.filter(a=>!candidates.some(b=>b.id!==a.id &&
      axes.every(k=>b[k]>=a[k])&&axes.some(k=>b[k]>a[k])));
    frontier.sort((a,b)=>b.minimumParticipantBenefit-a.minimumParticipantBenefit||
      a.id.localeCompare(b.id));
    return {
      status:'invitation-to-negotiate-only',
      candidates:clone(candidates),
      paretoSuggestions:clone(frontier),
      actualSubjectAuthenticated:false,
      allPossibleFormatsExhaustivelyKnown:false,
      socialAndEnvironmentalImpactsMeasured:false,
      recipientAndSubjectHaveAcceptedDeal:false,
      noCommonMonetaryValueAssigned:true,
      realDealAuthority:false
    };
  }
  function skillOnlyBaseline(){
    // Intentionally weak control: skill keyword → usual repair job.
    // It is never actionable because it disregards the person's *choice*.
    const possible=fixture.subject.skillOffered===fixture.requester.skillRequested;
    return {
      naiveSkillMatchCount:possible?1:0,
      naiveSuggestion:possible?'repair-done-for-you':null,
      subjectWouldWillinglyChooseThisFormatInFixture:
        fixture.subject.preferredFormats.includes('repair-for-hire') &&
        !fixture.subject.unacceptableFormats.includes('repair-for-hire'),
      firstPersonPermissionAlreadyHeld:false,actOnSuggestion:false,
      falsePositiveAboutWillingness:possible &&
        fixture.subject.unacceptableFormats.includes('repair-for-hire')
    };
  }
  function audit(){
    return {day:today,events:clone(events),
      invitation:invitation?clone(invitation):null,
      grant:grant?{status:grant.status,recipientId:grant.recipientId,
        purpose:grant.purpose,expiresDay:grant.expiresDay,
        formatsShared:grant.status==='approved'?[...grant.formats]:[],
        motivationPubliclyVisible:false}:null,
      noPrivateContactScraping:true,actualMessagesSent:0,
      noInferredPsychologicalProfile:true,realEconomicValueCreatedCents:0};
  }
  return {suggestQuestion,requestContext,subjectRespond,revoke,advanceDay,
    sharedFor,proposeFor,skillOnlyBaseline,audit};
}
