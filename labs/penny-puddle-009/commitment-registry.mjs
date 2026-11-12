/**
 * Small fictional commitment registry. An illiquid asset is not "cash";
 * the separate identified standby source has to precommit available funds.
 * Reservations and called losses occupy the same finite owner risk ceiling.
 * Every auth flag below is a MOCK assertion, not a verified human, gold assay,
 * asset lien, licensed insurer, enforceable guarantee or actual payment.
 */
const cent=(x,n,zero=false)=>{
  if(!Number.isSafeInteger(x)||x<(zero?0:1)||x>1_000_000_000)
    throw new TypeError(n+' must be integer cents');return x;
};
const key=(x,n)=>{
  if(typeof x!=='string'||!x.trim()||x.length>120)throw new TypeError(n+' must be a short ID');
  return x;
};
export function createAnchorCapacityLab({
 assetId,ownerId,scenarioRiskCeilingCents,
 partnerHypotheticalAvailableCents,
 ownerExplicitlyConsentsInFixture,
 partnerHypotheticallyAcceptsAssayTitleAndGuarantee
}){
 key(assetId,'assetId');key(ownerId,'ownerId');
 cent(scenarioRiskCeilingCents,'scenario risk ceiling',true);
 cent(partnerHypotheticalAvailableCents,'partner available cash',true);
 if(ownerExplicitlyConsentsInFixture!==true||
    partnerHypotheticallyAcceptsAssayTitleAndGuarantee!==true)
   throw new Error('HOLD: modeled owner and financing partner must both independently approve');
 const ceiling=Math.min(scenarioRiskCeilingCents,partnerHypotheticalAvailableCents);
 let availablePartnerCash=partnerHypotheticalAvailableCents;
 const entries=new Map(),used=new Set(),events=[];
 const checked=(eventId)=>{
   key(eventId,'eventId');
   if(used.has(eventId))throw new Error('Duplicate ledger event');
   used.add(eventId);
 };
 const state=()=>{
  const reserved=[...entries.values()].reduce((n,e)=>n+e.uncalledReservedCents,0);
  const called=[...entries.values()].reduce((n,e)=>n+e.calledOutstandingCents,0);
  const available=Math.max(0,Math.min(ceiling-reserved-called,availablePartnerCash-reserved));
  return {
   syntheticOnly:true,assetId,ownerId,
   scenarioRiskCeilingCents:ceiling,remainingAvailableForNewAssuranceCents:available,
   stillReservedCents:reserved,calledOutstandingCents:called,
   hypotheticalPartnerCashCents:availablePartnerCash,
   hypotheticalGoldAssayAndTitleAccepted:true,
   assetNeverMovedOrSold:true,actualGoldValuationCents:null,
   realBankCashMovedCents:0,realGuaranteesIssued:0,realLienCreated:false,
   entries:[...entries.values()].map(e=>({...e})),events:events.map(e=>({...e})),
   backingConserved:reserved+called+available<=ceiling &&
     reserved<=availablePartnerCash,
   note:'The guarantee source is a separate imaginary capital provider; the object may be at risk, and an unsupported pledged asset generates no dollars.'
  };
 };
 function reserve({eventId,campaignId,maximumCents}){
  key(campaignId,'campaignId');cent(maximumCents,'maximum');
  if(entries.has(campaignId))throw new Error('Already reserved for that campaign');
  if(maximumCents>state().remainingAvailableForNewAssuranceCents)
    throw new Error('Insufficient unencumbered permitted risk capacity');
  checked(eventId);
  entries.set(campaignId,{campaignId,uncalledReservedCents:maximumCents,
   calledOutstandingCents:0,closed:false,ownerAtRisk:true,
   realMoneyAvailableToPublicCents:0});
  events.push({eventId,kind:'SIMULATED_CAPACITY_RESERVED',campaignId,cents:maximumCents});
  return state();
 }
 function call({eventId,campaignId,amountCents,independentPartnerCallApproved}){
  key(campaignId,'campaignId');cent(amountCents,'amount');
  const e=entries.get(campaignId);
  if(!e||e.closed)throw new Error('Unknown or closed commitment');
  if(independentPartnerCallApproved!==true)throw new Error('Independent partner call review absent');
  if(amountCents>e.uncalledReservedCents||amountCents>availablePartnerCash)
    throw new Error('Called commitment exceeds available reserve or verified source');
  checked(eventId);
  e.uncalledReservedCents-=amountCents;
  e.calledOutstandingCents+=amountCents;
  availablePartnerCash-=amountCents;
  events.push({eventId,kind:'FICTIONAL_FACILITY_PAYS_BENEFICIARY',campaignId,cents:amountCents,
   bankReceiptIndependentlyVerified:false,ownerExposedToLoss:true});
  return state();
 }
 function releaseUncalled({eventId,campaignId}){
  key(campaignId,'campaignId');
  const e=entries.get(campaignId);
  if(!e||e.closed)throw new Error('Unknown or closed commitment');
  checked(eventId);
  const amount=e.uncalledReservedCents;
  e.uncalledReservedCents=0;
  e.closed=true;
  events.push({eventId,kind:'UNUSED_MOCK_CAPACITY_RELEASED',campaignId,cents:amount});
  return state();
 }
 function restore({eventId,campaignId,donorId,amountCents,donorChoseFacility}){
  key(campaignId,'campaignId');key(donorId,'donorId');
  cent(amountCents,'donation');
  const e=entries.get(campaignId);
  if(!e)throw new Error('Unknown facility draw');
  if(donorChoseFacility!==true)throw new Error('Donor must explicitly designate facility restoration');
  if(amountCents>e.calledOutstandingCents)
    throw new Error('Cannot restore more than modeled credit facility loss');
  checked(eventId);
  e.calledOutstandingCents-=amountCents;
  availablePartnerCash+=amountCents;
  events.push({eventId,kind:'FICTIONAL_DONOR_COVERS_ANCHOR_OWNER_LOSS',
   campaignId,donorId,cents:amountCents,actualDollarsReceived:false});
  return state();
 }
 return {snapshot:state,reserve,call,releaseUncalled,restore};
}
