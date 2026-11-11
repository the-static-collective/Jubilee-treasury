/**
 * PENNY x PUDDLE 006 / WORTH TO WHOM
 *
 * A consent-first, read-only matching graph for ordinary physical coins and
 * other small historic objects, without requiring external grading.
 *
 * Every participant, listing, price, preference, and promise is fictional.
 * Matching DOES NOT verify authenticity, physical title, ability to pay,
 * satisfaction, or completion; no coin, money or title moves.
 */

const boundedInt = (x, what, zero = true) => {
  if (!Number.isSafeInteger(x) || x < (zero ? 0 : 1) || x > 1_000_000_000)
    throw new TypeError(what + ' must be a bounded integer (not fractional cents)');
  return x;
};
const key = (x, what) => {
  if (typeof x !== 'string' || !x.trim() || x.length > 100)
    throw new TypeError(what + ' requires a nonempty short ID');
  return x;
};
const allowedTrade = new Set(['artwork', 'photography', 'music', 'repair', 'garden-work', 'other-goods']);
const validateTags = (tags, what) => {
  if (!Array.isArray(tags) || tags.length > 12 ||
      !tags.every(t => typeof t === 'string' && t.trim().length > 0 && t.length <= 100))
    throw new TypeError(what + ' must be at most 12 explicit, short tags');
  return [...new Set(tags.map(x => x.trim().toLowerCase()))];
};
const relevantTags = (listing, seeker) => {
  const interest = new Set(seeker.interests);
  return listing.tags.filter(tag => interest.has(tag));
};
const clone = x => JSON.parse(JSON.stringify(x));

export function makeMeaningFixture() {
  return {
    name: 'fictional-direct-coin-bazaar',
    listings: [
      {
        id: 'cent-1978', ownerId: 'family-collection',
        label: '1978 cent with a family-story label',
        denominationCents: 1, observedDescription: 'Photographed as found; no variety, grade, error, or metal claim',
        tags: ['1978', 'family-memory', 'lincoln-cent'],
        askCents: 800, cashAllowed: true, giftPossible: false,
        acceptedTradeCategories: ['artwork'], ungradedOffersAccepted: true,
        encumbered: false, ownerTitleProof: 'self-asserted-not-verified'
      },
      {
        id: 'cent-1912', ownerId: 'neighborhood-archive',
        label: 'Worn 1912 cent',
        denominationCents: 1, observedDescription: 'Worn early cent; date self-reported and unverified',
        tags: ['1912', 'local-history', 'worn-coin'],
        askCents: 300, cashAllowed: true, giftPossible: true,
        acceptedTradeCategories: ['photography'], ungradedOffersAccepted: true,
        encumbered: false, ownerTitleProof: 'self-asserted-not-verified'
      },
      {
        id: 'quarter-2000', ownerId: 'street-gallery',
        label: 'Ordinary-looking state quarter',
        denominationCents: 25, observedDescription: 'State-quarter design noted from appearance only',
        tags: ['state-quarter', 'art-project', 'everyday-coin'],
        askCents: 100, cashAllowed: true, giftPossible: false,
        acceptedTradeCategories: ['music'], ungradedOffersAccepted: true,
        encumbered: false, ownerTitleProof: 'self-asserted-not-verified'
      }
    ],
    seekers: [
      {
        id: 'birthday-collector', description: 'Wants a cent from a meaningful birth year',
        interests: ['1978', 'family-memory'], cashBudgetCents: 1200, maxPersonalCashCents: 1500,
        offeredTradeCategory: null, acceptsUngraded: true,
        modes: ['cash']
      },
      {
        id: 'town-storyteller', description: 'Would photograph a local-history object',
        interests: ['1912', 'local-history'], cashBudgetCents: 0, maxPersonalCashCents: 0,
        offeredTradeCategory: 'photography', acceptsUngraded: true,
        modes: ['trade', 'gift']
      },
      {
        id: 'musician-collector', description: 'Would exchange music for a coin used in an art piece',
        interests: ['art-project', 'state-quarter'], cashBudgetCents: 0, maxPersonalCashCents: 0,
        offeredTradeCategory: 'music', acceptsUngraded: true,
        modes: ['trade']
      },
      {
        id: 'grading-required', description: 'Insists on third-party grading',
        interests: ['1978', 'local-history'], cashBudgetCents: 5000, maxPersonalCashCents: 5000,
        offeredTradeCategory: null, acceptsUngraded: false,
        modes: ['cash']
      }
    ]
  };
}

export function validateExchange({ listings, seekers }) {
  if (!Array.isArray(listings) || !Array.isArray(seekers) ||
      listings.length > 8 || seekers.length > 8)
    throw new TypeError('At most eight listings and eight seekers');
  const ids = new Set(), people = new Set();
  const ls = listings.map(item => {
    key(item?.id, 'listing id'); key(item.ownerId, 'listing owner');
    if (ids.has(item.id)) throw new Error('Duplicate listing id');
    ids.add(item.id);
    boundedInt(item.denominationCents, 'face denomination', false);
    boundedInt(item.askCents, 'owner listed cash ask');
    if (typeof item.label !== 'string' || !item.label.trim() ||
        typeof item.observedDescription !== 'string' || !item.observedDescription.trim())
      throw new Error('Listing needs clear observations and label, not unsupported authenticity');
    if (item.ownerTitleProof !== 'self-asserted-not-verified')
      throw new Error('Fixture cannot assert verified title or identity');
    if (typeof item.encumbered !== 'boolean' ||
        typeof item.ungradedOffersAccepted !== 'boolean' ||
        typeof item.cashAllowed !== 'boolean' ||
        typeof item.giftPossible !== 'boolean')
      throw new TypeError('Listing permissions and encumbrance must be explicit');
    if (!Array.isArray(item.acceptedTradeCategories) ||
        !item.acceptedTradeCategories.every(t => allowedTrade.has(t)))
      throw new TypeError('Unsupported trade category');
    return {...item, tags:validateTags(item.tags, 'listing tags'),
      acceptedTradeCategories:[...new Set(item.acceptedTradeCategories)]};
  });
  const ss = seekers.map(seeker => {
    key(seeker?.id, 'seeker id');
    if (people.has(seeker.id)) throw new Error('Duplicate seeker id');
    people.add(seeker.id);
    boundedInt(seeker.cashBudgetCents, 'cash budget');
    boundedInt(seeker.maxPersonalCashCents, 'private personal maximum');
    if (typeof seeker.acceptsUngraded !== 'boolean' || !Array.isArray(seeker.modes) ||
        seeker.modes.length > 3 || !seeker.modes.every(x => ['cash', 'trade', 'gift'].includes(x)))
      throw new TypeError('Explicit buyer raw-coin and exchange-mode consent required');
    if (seeker.offeredTradeCategory !== null &&
        !allowedTrade.has(seeker.offeredTradeCategory))
      throw new TypeError('Unsupported offered trade category');
    return {...seeker, interests:validateTags(seeker.interests, 'seeker interest tags'),
      modes:[...new Set(seeker.modes)]};
  });
  return {listings:ls, seekers:ss};
}

function matchTypes(listing, seeker, policy) {
  // A raw coin with no independent grading requires both sides to opt in.
  // A raw coin is not a fake coin; disclosure prevents invented assurances.
  if(listing.encumbered || !listing.ungradedOffersAccepted || !seeker.acceptsUngraded)return [];
  if(seeker.id === listing.ownerId)return [];
  if(policy === 'grade-gate') return []; // all fixture items are explicitly raw.
  const overlaps=relevantTags(listing,seeker);
  if(!overlaps.length) return []; // no unsolicited / opaque psychographic matching
  const base=20*overlaps.length;
  const result=[];
  if(listing.cashAllowed && seeker.modes.includes('cash') &&
      listing.askCents <= seeker.cashBudgetCents &&
      listing.askCents <= seeker.maxPersonalCashCents){
    result.push({
      mode:'cash', proposedAskCents:listing.askCents,
      fitScore:100+base, matchedTags:overlaps,
      note:'Seller ask within explicitly declared buyer budget. Budget and maximum remain private, unverified and nonbinding.'
    });
  }
  if(policy!=='cash-only' && seeker.modes.includes('trade') &&
      seeker.offeredTradeCategory &&
      listing.acceptedTradeCategories.includes(seeker.offeredTradeCategory)){
    result.push({
      mode:'trade', proposedAskCents:null,
      tradeCategory:seeker.offeredTradeCategory, fitScore:90+base,
      matchedTags:overlaps,
      note:'Noncash good/service offered; its quality, completion and acceptance must be independently confirmed by both people.'
    });
  }
  if(policy!=='cash-only' && listing.giftPossible && seeker.modes.includes('gift')){
    result.push({
      mode:'gift', proposedAskCents:null,
      fitScore:80+base, matchedTags:overlaps,
      note:'A possible owner-authorized gift, not a debt, reward or completed delivery.'
    });
  }
  return result;
}

/**
 * Deliberately bounded exact assignment: one unique coin and one seeker per
 * proposal. Maximizes declared affinity, NOT dollars or extractable surplus.
 * No exchange becomes binding by being selected.
 */
export function proposeDirectExchange(inputs, {policy='meaning-first'}={}) {
  if(!['meaning-first','cash-only','grade-gate'].includes(policy))
    throw new Error('Unknown experimental comparison policy');
  const {listings, seekers}=validateExchange(inputs);
  const proposals=[];
  for(let li=0;li<listings.length;li++){
    for(let si=0;si<seekers.length;si++){
      for(const candidate of matchTypes(listings[li],seekers[si],policy)){
        proposals.push({
          listingId:listings[li].id, ownerId:listings[li].ownerId,
          seekerId:seekers[si].id, mode:candidate.mode,
          proposedAskCents:candidate.proposedAskCents,
          ...(candidate.tradeCategory?{tradeCategory:candidate.tradeCategory}:{}),
          matchedTags:candidate.matchedTags, fitScore:candidate.fitScore,
          note:candidate.note,li,si
        });
      }
    }
  }
  const memo=new Map();
  function search(i,used){
    if(i>=listings.length)return {score:0,picks:[]};
    const token=i+':'+used;
    if(memo.has(token))return memo.get(token);
    let best=search(i+1,used);
    for(const p of proposals.filter(x=>x.li===i && !(used&(1<<x.si)))){
      const rest=search(i+1,used|(1<<p.si));
      const score=rest.score+p.fitScore;
      const picks=[p,...rest.picks];
      // Deterministic stable tie resolution by proposal ID / mode, not highest price.
      const tieName=picks.map(x=>x.listingId+'/'+x.seekerId+'/'+x.mode).join('|');
      const oldName=best.picks.map(x=>x.listingId+'/'+x.seekerId+'/'+x.mode).join('|');
      if(score>best.score||(score===best.score && tieName<oldName)){
        best={score,picks};
      }
    }
    memo.set(token,best);return best;
  }
  const chosen=search(0,0);
  const clean=p=>Object.fromEntries(Object.entries(p).filter(([k])=>!['li','si'].includes(k)));
  const selections=chosen.picks.map(p=>({
    ...clean(p),
    status:'candidate-needs-two-explicit-acceptances',
    sellerHasAccepted:false,buyerHasAccepted:false,
    buyerLiquidityVerified:false,titleVerified:false,
    authenticityVerified:false,objectDelivered:false,moneyMovedCents:0
  }));
  return {
    experiment:'PUDDLE-006 subjective meaning / direct peer exchange',
    method:'Exact finite bipartite matching over openly declared interests and private budget thresholds, not collector price discovery or appraisal',
    policy, selected:selections,
    optionsConsidered:proposals.length, totalAffinityScore:chosen.score,
    proposedTotalCashAsksCents:selections.reduce((sum,p)=>sum+(p.proposedAskCents||0),0),
    realMoneyMovedCents:0,realObjectsTransferred:0,
    ownershipVerified:false,participantIdentitiesVerified:false,
    externalAuthenticatorsRequired:false,
    titleStillRequiresVerification:true,realWorldTradeAuthority:false,
    syntheticOnly:true
  };
}

/** Inspect option availability without revealing someone's maximum willingness to pay. */
export function previewForOwner(inputs, ownerId) {
  key(ownerId,'ownerId');
  const valid=validateExchange(inputs);
  const found=valid.listings.filter(x=>x.ownerId===ownerId);
  const filtered=proposeDirectExchange({listings:found,seekers:valid.seekers});
  return {
    ownerId, matches:filtered.selected.map(p=>({
      listingId:p.listingId,seekerId:p.seekerId,mode:p.mode,
      listedAskCents:p.proposedAskCents,sharedMeaningTags:p.matchedTags,
      candidateOnly:true
    })),
    otherPartyPrivateBudgetWithheld:true,
    ownerTitleNotVerified:true
  };
}
