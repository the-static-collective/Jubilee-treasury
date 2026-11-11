/**
 * Jubilee Treasury / DEALWEAVER-007 — voluntary mutual-surplus plans.
 *
 * An agreement is proposed, never imposed. Preferences and impact evidence
 * are self-declared synthetic fixtures, not inferred market valuations.
 * This module cannot move money, create legal rights, or contact participants.
 */
const required = (x,n)=>{if(typeof x!=='string'||!x.trim()||x.length>100)throw new TypeError(n+' requires a short string');return x};
const integer = (n,label,zero=true)=>{
  if(!Number.isSafeInteger(n)||n<(zero?0:1)||n>1000000000)
    throw new TypeError(label+' must be an integer in allowed range');return n;
};
const goodEvidence = new Set(['independent-test-fixture','participant-assertion','unverified-scenario']);
const methods = new Set(['use-access','direct-sale','barter','gift','service-contract','grant']);

export function createDealFixture(){
  return {
    actors:[
      {id:'kiln-owner',selfGoal:'Keep my kiln and cover upkeep without giving it away'},
      {id:'ceramicist',selfGoal:'Fire a batch of pottery for an affordable amount'},
      {id:'community-kitchen',selfGoal:'Provide a gathering space to neighbors'},
      {id:'artist',selfGoal:'Offer ceramic workshops'}
    ],
    assets:[
      {id:'kiln',ownerId:'kiln-owner',kind:'productive-equipment',
       titleVerified:false,collateralFreeAssumed:true,
       useSlots:['saturday-am','saturday-pm'],maxConcurrentUses:1,transferTitleAllowed:false},
      {id:'hall',ownerId:'community-kitchen',kind:'venue',
       titleVerified:false,collateralFreeAssumed:true,
       useSlots:['friday-evening'],maxConcurrentUses:1,transferTitleAllowed:false}
    ],
    opportunities:[
      {
        id:'kiln-saturday',
        method:'use-access',assetId:'kiln',slot:'saturday-am',
        actors:['kiln-owner','ceramicist'],
        declaredNetBenefits:{'kiln-owner':3,'ceramicist':6},
        proposedCashCents:600,
        cashPayer:'ceramicist',
        optionalityProtected:true,
        impact:{people:2,planet:1,evidence:'unverified-scenario',
          basis:'Illustrative shared production and avoiding acquisition of a second kiln'},
        permissions:{ownerWillingToNegotiate:true,otherPartiesWillingToNegotiate:true},
        safeguards:['written-use-window','responsibility-for-breakage','owner-retains-title'],
        note:'Owner retains kiln; ceramicist requests one named firing slot, not ownership or a financial share'
      },
      {
        id:'kiln-whole-sale',
        method:'direct-sale',assetId:'kiln',slot:null,
        actors:['kiln-owner','ceramicist'],
        declaredNetBenefits:{'kiln-owner':-7,'ceramicist':8},
        proposedCashCents:50000,
        cashPayer:'ceramicist',
        optionalityProtected:false,
        impact:{people:1,planet:0,evidence:'unverified-scenario',
          basis:'No verified environmental gain'},
        permissions:{ownerWillingToNegotiate:false,otherPartiesWillingToNegotiate:true},
        safeguards:['verified-title-before-sale'],note:'Excluded: would force the owner to surrender irreplaceable productive asset'
      },
      {
        id:'kiln-later',
        method:'use-access',assetId:'kiln',slot:'saturday-pm',
        actors:['kiln-owner','artist'],
        declaredNetBenefits:{'kiln-owner':4,'artist':5},
        proposedCashCents:450,
        cashPayer:'artist',
        optionalityProtected:true,
        impact:{people:4,planet:1,evidence:'participant-assertion',
          basis:'A workshop could be shared with other people'},
        permissions:{ownerWillingToNegotiate:true,otherPartiesWillingToNegotiate:true},
        safeguards:['time-window','care-terms','owner-retains-title'],
        note:'A second independent use window can coexist without double allocating time'
      },
      {
        id:'hall-story',
        method:'use-access',assetId:'hall',slot:'friday-evening',
        actors:['community-kitchen','artist'],
        declaredNetBenefits:{'community-kitchen':4,'artist':3},
        proposedCashCents:0,
        cashPayer:null,
        optionalityProtected:true,
        impact:{people:6,planet:1,evidence:'participant-assertion',
          basis:'Existing room used rather than assuming new construction'},
        permissions:{ownerWillingToNegotiate:true,otherPartiesWillingToNegotiate:true},
        safeguards:['space-permission','cleanup-plan','owner-retains-title'],
        note:'Use rights are conditional on owner approval, not a claim to possession'
      },
      {
        id:'hall-conflict',
        method:'use-access',assetId:'hall',slot:'friday-evening',
        actors:['community-kitchen','ceramicist'],
        declaredNetBenefits:{'community-kitchen':2,'ceramicist':2},
        proposedCashCents:0,
        cashPayer:null,
        optionalityProtected:true,
        impact:{people:1,planet:1,evidence:'unverified-scenario',
          basis:'Competing use of same slot'},
        permissions:{ownerWillingToNegotiate:true,otherPartiesWillingToNegotiate:true},
        safeguards:['space-permission'],note:'Must not be selected alongside hall-story'
      }
    ]
  };
}

function normalized(fixture){
  if(!fixture||!Array.isArray(fixture.actors)||!Array.isArray(fixture.assets)||
     !Array.isArray(fixture.opportunities)||
     fixture.actors.length>12||fixture.assets.length>12||fixture.opportunities.length>16)
     throw new TypeError('Bounded arrays of actors, assets and opportunities required');
  const actors=new Set(), assets=new Map(), offers=new Set();
  for(const actor of fixture.actors){required(actor?.id,'actor');if(actors.has(actor.id))throw new Error('Duplicate actor');actors.add(actor.id);}
  for(const asset of fixture.assets){
    required(asset?.id,'asset');required(asset.ownerId,'owner');
    if(!actors.has(asset.ownerId)||assets.has(asset.id))throw new Error('Invalid asset owner or duplicate asset');
    if(asset.titleVerified!==false||asset.collateralFreeAssumed!==true||
       asset.transferTitleAllowed!==false||asset.maxConcurrentUses!==1||
       !Array.isArray(asset.useSlots)||asset.useSlots.length>30||
       !asset.useSlots.every(s=>typeof s==='string'&&s.trim()))
      throw new Error('Assets must be explicit non-transferrable assumed-title test fixtures');
    assets.set(asset.id,asset);
  }
  for(const o of fixture.opportunities){
    required(o?.id,'opportunity');
    if(offers.has(o.id))throw new Error('Duplicate opportunity');
    offers.add(o.id);
    if(!methods.has(o.method))throw new Error('Unknown method');
    if(!Array.isArray(o.actors)||o.actors.length<2||o.actors.length>6||
       new Set(o.actors).size!==o.actors.length||
       !o.actors.every(id=>actors.has(id)))
      throw new Error('All affected people must be explicitly listed');
    if(!o.declaredNetBenefits||Object.keys(o.declaredNetBenefits).sort().join('|')!==[...o.actors].sort().join('|')||
       !Object.values(o.declaredNetBenefits).every(v=>Number.isSafeInteger(v)&&v>=-10&&v<=10))
      throw new Error('Need each affected party\'s own declared bounded benefit');
    integer(o.proposedCashCents,'cash cents');
    if(o.proposedCashCents>0 && !o.actors.includes(o.cashPayer))throw new Error('Cash payer must be an affected actor');
    if(!o.permissions||typeof o.permissions.ownerWillingToNegotiate!=='boolean'||
       typeof o.permissions.otherPartiesWillingToNegotiate!=='boolean')
      throw new Error('No assumed permission without explicit two-sided willingness');
    if(!o.impact||![-2,-1,0,1,2,3,4,5,6,7,8,9,10].includes(o.impact.people)||
       ![-2,-1,0,1,2,3,4,5,6,7,8,9,10].includes(o.impact.planet)||
       !goodEvidence.has(o.impact.evidence)||
       typeof o.impact.basis!=='string'||!o.impact.basis.trim())
      throw new Error('Social and environmental scenarios need labeled evidence and declared units');
    if(typeof o.optionalityProtected!=='boolean'||!Array.isArray(o.safeguards)||!o.safeguards.length)
      throw new Error('Every proposal needs specific safeguards and an owner-optionality assertion');
    if(o.assetId){
      const asset=assets.get(o.assetId);
      if(!asset||!o.actors.includes(asset.ownerId))throw new Error('Asset owner must be a party to each option');
      if(o.method==='use-access' && (!asset.useSlots.includes(o.slot)||!o.optionalityProtected))
        throw new Error('Use-access requires a permitted slot, retaining title and owner optionality');
      if(o.method==='direct-sale' && asset.transferTitleAllowed!==true){/* deliberately allow a proposal for rejection */}
    }
  }
  return fixture;
}
export function admissibleDeal(fixture,opportunity){
  const item=opportunity;
  const ownerAsset=fixture.assets.find(x=>x.id===item.assetId);
  const reasons=[];
  if(!item.permissions.ownerWillingToNegotiate||!item.permissions.otherPartiesWillingToNegotiate)reasons.push('permission-refused');
  if(item.actors.some(id=>item.declaredNetBenefits[id]<=0))reasons.push('not-win-win-for-every-party');
  if(!item.optionalityProtected)reasons.push('owner-optionality-not-protected');
  if(ownerAsset && item.method==='direct-sale' && !ownerAsset.transferTitleAllowed)reasons.push('owner-title-transfer-not-permitted');
  if(item.method==='use-access' && !item.safeguards.includes('owner-retains-title'))reasons.push('no-asset-protection-terms');
  return {allowed:reasons.length===0,reasons};
}
function slotCollision(a,b){
  return a.assetId && b.assetId && a.assetId===b.assetId && a.slot && b.slot && a.slot===b.slot;
}
function impactScore(items){
  const participants=new Map();
  let people=0,planet=0;
  for(const item of items){
    for(const [person,gain] of Object.entries(item.declaredNetBenefits))
      participants.set(person,(participants.get(person)||0)+gain);
    people+=item.impact.people;planet+=item.impact.planet;
  }
  const values=[...participants.values()];
  return {
    individualGains:Object.fromEntries(participants),
    minParticipantGain:values.length?Math.min(...values):0,
    sumParticipantGains:values.reduce((a,b)=>a+b,0),
    peopleSignal:people,planetSignal:planet,
    evidenceQuality:items.map(x=>x.impact.evidence),
    notMonetized:true
  };
}
function dominates(a,b){
  const axes=['minParticipantGain','sumParticipantGains','peopleSignal','planetSignal'];
  return axes.every(k=>a.score[k]>=b.score[k])&&axes.some(k=>a.score[k]>b.score[k]);
}
export function composeMutualDeals(fixture,{maxAgreements=3}={}){
  normalized(fixture);
  integer(maxAgreements,'maximum agreements');
  if(maxAgreements>5)throw new RangeError('Small finite simulation only');
  const accepted=[],held=[];
  for(const item of fixture.opportunities){
    const a=admissibleDeal(fixture,item);
    if(a.allowed)accepted.push(item);
    else held.push({id:item.id,status:'declined-or-held',reasons:a.reasons});
  }
  const combos=[];
  function enumerate(i,chosen){
    if(i===accepted.length){
      if(chosen.length)combos.push({items:[...chosen],score:impactScore(chosen)});return;
    }
    enumerate(i+1,chosen);
    const next=accepted[i];
    if(chosen.length<maxAgreements && chosen.every(x=>!slotCollision(x,next))) {
      chosen.push(next);enumerate(i+1,chosen);chosen.pop();
    }
  }
  enumerate(0,[]);
  const frontier=combos.filter((row,index)=>!combos.some((other,j)=>index!==j&&dominates(other,row)));
  frontier.sort((a,b)=>b.score.minParticipantGain-a.score.minParticipantGain||
    b.score.sumParticipantGains-a.score.sumParticipantGains||
    b.score.peopleSignal-a.score.peopleSignal||
    b.score.planetSignal-a.score.planetSignal||
    a.items.map(x=>x.id).join(',').localeCompare(b.items.map(x=>x.id).join(',')));
  return {
    kind:'mutual-deal-proposals-only',
    candidatesConsidered:fixture.opportunities.length,
    declinedOrHeld:held,
    paretoFrontier:frontier.map(row=>({
      dealIds:row.items.map(x=>x.id),
      modes:row.items.map(x=>x.method),
      terms:row.items.map(x=>({
        id:x.id,assetId:x.assetId||null,slot:x.slot||null,
        proposedCashCents:x.proposedCashCents,reason:x.note,
        safeguards:[...x.safeguards],consentNeeded:true
      })),
      score:row.score,participantsActuallyConsented:false,
      independentImpactVerified:false,realAssetUseGranted:false
    })),
    winnerChosenForHumans:false,
    noSingleMonetaryExchangeRate:true,
    noGlobalPriceDiscovery:true,
    actualCashTransferredCents:0,
    realRightsGranted:0,
    profitPeoplePlanetAreSeparateSignals:true,
    syntheticOnly:true
  };
}
