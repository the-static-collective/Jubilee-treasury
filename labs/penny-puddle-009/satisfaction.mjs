/**
 * SATISFACTION-WEAVE / "Settle the obligation, not the gold."
 * No cash, coin transfer, asset lien or financial instrument required in a
 * hypothetical MULTI-PARTY noncash agreement—only if the actual creditor
 * voluntarily accepts completed, independently verifiable performance.
 *
 * Every party/permission/receipt is synthetic. A matching computation does
 * NOT extinguish a real debt or create a legally binding bargain.
 */
const id=(v,label)=>{
 if(typeof v!=='string'||!v.trim()||v.length>120)
  throw new TypeError(label+' requires a short string');return v;
};
const cent=(v,label)=>{
 if(!Number.isSafeInteger(v)||v<=0||v>1_000_000_000)
  throw new TypeError(label+' must be positive integer cents');return v;
};
export function makeSatisfactionFixture(){
 return {
  liability:{id:'rent-obligation-A',debtorId:'A',creditorId:'L',amountCents:30000,
   creditorWouldConsiderNoncashPaymentInFixture:true,
   actualCreditorSignedWaiver:false},
  asset:{id:'large-gold-like-thing',ownerId:'G',rightsOwnerConsentInFixture:true,
   actualTitleVerified:false,physicalPropertyMoved:false,alreadyLicensedExclusively:false},
  participants:['G','F','E','L','A'],
  promisedSteps:[
   {id:'image-right',from:'G',to:'F',promise:'limited photograph or narrative license',
    category:'permission',dependsOn:[],mutualConsentAsserted:true,
    independentlyConfirmedInFixture:false},
   {id:'promo-video',from:'F',to:'E',promise:'one promotional video for an electrician',
    category:'service',dependsOn:['image-right'],mutualConsentAsserted:true,
    independentlyConfirmedInFixture:false},
   {id:'electrical-repair',from:'E',to:'L',promise:'specified, lawfully performed electrical repairs',
    category:'service',dependsOn:['promo-video'],mutualConsentAsserted:true,
    independentlyConfirmedInFixture:false}
  ]
 };
}
function validate(f){
 const l=f?.liability,a=f?.asset;
 id(l?.id,'liability');id(l.debtorId,'debtor');id(l.creditorId,'creditor');
 cent(l.amountCents,'liability');
 if(!Array.isArray(f.participants)||f.participants.length>12)
  throw new TypeError('Expected bounded participant set');
 const people=new Set(f.participants);
 if(!people.has(l.creditorId)||!people.has(l.debtorId)||!people.has(a.ownerId))
  throw new Error('Creditor, debtor and object owner must participate');
 if(a.alreadyLicensedExclusively!==false||a.rightsOwnerConsentInFixture!==true)
  throw new Error('No double-licensed owner permission');
 if(l.creditorWouldConsiderNoncashPaymentInFixture!==true)
  throw new Error('Creditor refusal: a third party cannot unilaterally extinguish their claim');
 if(!Array.isArray(f.promisedSteps)||f.promisedSteps.length>12)
  throw new TypeError('Expected bounded promised steps');
 const index=new Map();
 for(const s of f.promisedSteps){
  id(s?.id,'step');id(s.from,'provider');id(s.to,'beneficiary');
  if(!people.has(s.from)||!people.has(s.to)||s.from===s.to)
   throw new Error('Invalid consenting actors in promised step');
  if(index.has(s.id))throw new Error('Duplicate step');
  if(typeof s.promise!=='string'||!s.promise.trim()||s.promise.length>240)
   throw new Error('Explicit deliverable description required');
  if(s.mutualConsentAsserted!==true)
   throw new Error('Cannot use a third party\'s service without willing participants');
  if(!['permission','service','goods'].includes(s.category))
   throw new Error('Unsupported deliverable class');
  if(!Array.isArray(s.dependsOn))throw new Error('Dependencies required');
  index.set(s.id,s);
 }
 for(const s of f.promisedSteps){
  for(const dep of s.dependsOn){
   if(!index.has(dep)||dep===s.id)throw new Error('Invalid dependency');
  }
 }
 const visiting=new Set(),visited=new Set();
 function walk(s){
  if(visiting.has(s.id))throw new Error('Circular conditional promises without completion path');
  if(visited.has(s.id))return;
  visiting.add(s.id);
  for(const d of s.dependsOn)walk(index.get(d));
  visiting.delete(s.id);visited.add(s.id);
 }
 for(const s of f.promisedSteps)walk(s);
 if(!f.promisedSteps.some(s=>s.to===l.creditorId && s.category==='service'))
  throw new Error('No concrete offered performance for actual creditor');
 return index;
}
export function createSatisfactionWeave(f){
 const steps=validate(f),done=new Map(),events=[],used=new Set();
 let creditorWaived=false;
 const snapshot=()=>({
  syntheticOnly:true,
  liabilityId:f.liability.id,
  requestedReliefCents:f.liability.amountCents,
  modeledReliefAcceptedCents:creditorWaived?f.liability.amountCents:0,
  legallyWaivedDebtCents:0,
  recipientActuallyDischarged:false,
  cashActuallyChangedHandsCents:0,
  physicalGoldMoved:false,
  fractionalGoldClaimsCreated:0,
  ownerLicenseOnlySelfAsserted:true,
  promisorReceipts:[...done].map(([stepId,receipt])=>({stepId,...receipt})),
  confirmedStepsInFixture:done.size,requiredSteps:steps.size,
  creditorWaiverSelfAssertedInFixture:creditorWaived,
  events:events.map(e=>({...e})),
  status:creditorWaived?'fully-simulated-noncash-creditor-satisfaction':
    'HOLD-no-independent-real-world-creditor-discharge'
 });
 function complete({eventId,stepId,fromActorId,toActorId,
  providerAndReceiverAffirmedInFixture,evidenceReference}){
  id(eventId,'eventId');id(stepId,'stepId');id(evidenceReference,'evidence reference');
  if(used.has(eventId))throw new Error('Duplicate completion receipt');
  const s=steps.get(stepId);
  if(!s||s.from!==fromActorId||s.to!==toActorId)
   throw new Error('No matching source-defined deliverable');
  if(providerAndReceiverAffirmedInFixture!==true)
   throw new Error('Need both parties independently to confirm mock performance');
  if(done.has(stepId))throw new Error('Cannot claim same work twice');
  if(s.dependsOn.some(x=>!done.has(x)))
   throw new Error('Cannot skip dependent performance before claiming next step');
  used.add(eventId);
  done.set(stepId,{from:s.from,to:s.to,
   evidenceReference,externalWitnessActuallyVerified:false});
  events.push({eventId,kind:'MOCK_DELIVERABLE_AFFIRMED',stepId,
   actualDeliveryVerified:false});
  return snapshot();
 }
 function acceptNoncashSettlement({eventId,creditorActorId,
  explicitVoluntaryWaiverInFixture,evidenceReference}){
  id(eventId,'eventId');id(evidenceReference,'evidence');
  if(used.has(eventId))throw new Error('Duplicate settlement receipt');
  if(creditorActorId!==f.liability.creditorId||
     explicitVoluntaryWaiverInFixture!==true)
   throw new Error('Only actual creditor can explicitly agree to release the obligation');
  if(done.size!==steps.size)throw new Error('Every promised dependency must be satisfied first');
  if(creditorWaived)throw new Error('Already modeled as released');
  used.add(eventId);creditorWaived=true;
  events.push({eventId,kind:'MOCK_CREDITOR_VOLUNTARILY_ACCEPTS_NONCASH_SATISFACTION',
   evidenceReference,independentLegalDischargeVerified:false});
  return snapshot();
 }
 return {snapshot,complete,acceptNoncashSettlement};
}
