import {validateExchange} from './meaning-exchange.mjs';

/**
 * Two-sided, explicitly nonbinding offer workflow. Identity and consent are
 * simulated string assertions; no real keys, legal signatures, legal title,
 * bank balances, shipment, service provision, or coin custody are checked.
 */
export function createDirectOfferLab(fixture) {
  const {listings,seekers}=validateExchange(fixture);
  const byListing=new Map(listings.map(x=>[x.id,x]));
  const bySeeker=new Map(seekers.map(x=>[x.id,x]));
  const offers=new Map(), reservedListings=new Set(), reservedSeekers=new Set();
  const events=[];
  const snapshot=()=>({
    simulated:true,offers:[...offers.values()].map(o=>({...o,disclosure:{...o.disclosure}})),
    events:events.map(x=>({...x})),
    realCoinsDelivered:0,realMoneyMovedCents:0,legalObligationsCreated:0,
    publicTitleVerification:false,cryptographicSignaturesVerified:false,
    completedTradeRights:false
  });
  const assertId=(v,n)=>{
    if(typeof v!=='string'||!v.trim()||v.length>120)throw new TypeError(n+' requires an ID');
  };
  function propose({offerId,listingId,seekerId,mode,expressedMeaning}) {
    for(const [name,value] of Object.entries({offerId,listingId,seekerId}))assertId(value,name);
    if(typeof expressedMeaning!=='string'||!expressedMeaning.trim()||expressedMeaning.length>300)
      throw new TypeError('Buyer must voluntarily state a short meaning or purpose, not a fabricated grade.');
    if(offers.has(offerId))throw new Error('Offer ID already used');
    const listing=byListing.get(listingId),seeker=bySeeker.get(seekerId);
    if(!listing||!seeker)throw new Error('Unknown listing or seeker');
    if(listing.encumbered)throw new Error('PENNY-backed or pledged specimen cannot be offered');
    if(!listing.ungradedOffersAccepted||!seeker.acceptsUngraded)throw new Error('Both people must accept ungraded status');
    if(listing.ownerId===seekerId)throw new Error('Cannot trade with self');
    if(reservedListings.has(listingId)||reservedSeekers.has(seekerId))throw new Error('A previously confirmed fixture exchange holds the item or participant');
    const overlaps=listing.tags.filter(t=>seeker.interests.includes(t));
    if(!overlaps.length)throw new Error('No declared shared interest');
    let terms;
    if(mode==='cash'){
      if(!listing.cashAllowed||!seeker.modes.includes('cash')||
         listing.askCents>seeker.cashBudgetCents||listing.askCents>seeker.maxPersonalCashCents)
        throw new Error('Cash proposal exceeds explicitly permitted ask or buyer limit');
      terms={ownerListedAskCents:listing.askCents,proposedPaymentCents:listing.askCents};
    }else if(mode==='trade'){
      if(!seeker.modes.includes('trade')||!seeker.offeredTradeCategory||
         !listing.acceptedTradeCategories.includes(seeker.offeredTradeCategory))
        throw new Error('Trade category not mutually offered');
      terms={tradeCategory:seeker.offeredTradeCategory,
        performanceRequired:'A separately described, accepted good/service with an actual completion receipt'};
    }else if(mode==='gift'){
      if(!listing.giftPossible||!seeker.modes.includes('gift'))throw new Error('Owner has not opened gift option');
      terms={giftOnly:true,noReciprocalConsiderationExpected:true};
    }else throw new Error('Unknown exchange mode');
    const entry={
      id:offerId,listingId,seekerId,declaredOwnerId:listing.ownerId,mode,
      observedDescription:listing.observedDescription,
      expressedMeaning,sharedMeaningTags:overlaps,terms,
      status:'buyer-interest-expressed',
      ownerAffirmed:false,buyerReaffirmed:false,
      disclosure:{
        thirdPartyGrade:'NONE',specimenAuthenticated:false,
        titleProof:'SELF-DECLARED-ONLY',
        warnings:'The listed observations are not independent evidence. Both parties may refuse or seek a second opinion.'
      }
    };
    offers.set(offerId,entry);
    events.push({offerId,type:'INTEREST_PROPOSED',authority:'none'});
    return snapshot();
  }
  function ownerRespond({offerId,ownerId,accept}) {
    assertId(offerId,'offerId');assertId(ownerId,'ownerId');
    if(typeof accept!=='boolean')throw new TypeError('Explicit true/false owner decision required');
    const offer=offers.get(offerId);
    if(!offer)throw new Error('Unknown offer');
    if(offer.declaredOwnerId!==ownerId)throw new Error('Only the asserted owner may respond');
    if(offer.status!=='buyer-interest-expressed')throw new Error('Offer not awaiting owner');
    if(!accept) offer.status='owner-declined';
    else {offer.ownerAffirmed=true;offer.status='owner-affirmed-awaiting-buyer';}
    events.push({offerId,type:accept?'OWNER_AFFIRMATION_ASSERTED':'OWNER_DECLINED',authority:'self-asserted-only'});
    return snapshot();
  }
  function buyerRespond({offerId,seekerId,accept}) {
    assertId(offerId,'offerId');assertId(seekerId,'seekerId');
    if(typeof accept!=='boolean')throw new TypeError('Explicit true/false buyer decision required');
    const offer=offers.get(offerId);
    if(!offer)throw new Error('Unknown offer');
    if(offer.seekerId!==seekerId)throw new Error('Only the named seeker may respond');
    if(offer.status!=='owner-affirmed-awaiting-buyer')throw new Error('Seller affirmation not available');
    if(!accept)offer.status='buyer-declined';
    else {
      if(reservedListings.has(offer.listingId)||reservedSeekers.has(offer.seekerId))
        throw new Error('Conflict: item or participant already committed within this fictional lab');
      offer.buyerReaffirmed=true;
      offer.status='mutually-affirmed-in-fixture-HOLD-not-settled';
      reservedListings.add(offer.listingId); reservedSeekers.add(offer.seekerId);
    }
    events.push({offerId,type:accept?'TWO_SIDED_FIXTURE_AFFIRMATION':'BUYER_DECLINED',authority:'not-real-agreement'});
    return snapshot();
  }
  function release({offerId,actorId}) {
    assertId(offerId,'offerId');assertId(actorId,'actorId');
    const offer=offers.get(offerId);
    if(!offer||![offer.declaredOwnerId,offer.seekerId].includes(actorId))
      throw new Error('Only involved parties may request simulation withdrawal');
    if(offer.status==='withdrawn'||offer.status.includes('declined'))return snapshot();
    reservedListings.delete(offer.listingId);
    reservedSeekers.delete(offer.seekerId);
    offer.status='withdrawn';
    events.push({offerId,type:'NONBINDING_PROPOSAL_WITHDRAWN',authority:'none'});
    return snapshot();
  }
  return {snapshot,propose,ownerRespond,buyerRespond,release};
}
