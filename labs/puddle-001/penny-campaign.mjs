/**
 * PENNY × PUDDLE 002: strictly fictional, in-memory microgiving demo.
 * Reserve numbers are provided by the fixture, NOT verified money.
 * This cannot accept, hold, send, escrow, issue or redeem anything real.
 */
const isCents = (n, name, zeroOK = false) => {
  if (!Number.isSafeInteger(n) || n < (zeroOK ? 0 : 1))
    throw new TypeError(`${name} must be a ${zeroOK ? 'nonnegative' : 'positive'} safe integer cent amount`);
  return n;
};
const textId = (id, field) => {
  if (typeof id !== 'string' || !id.trim()) throw new TypeError(`${field} requires an id`);
  return id;
};
const pairs = {
  'usd-settled': 'electronic-bill',
  'physical-pennies': 'physical-cash',
};
export function createPennyCampaignLab({ reserves, campaigns }) {
  if (!Array.isArray(reserves) || !Array.isArray(campaigns)) throw new TypeError('Provide reserve and campaign arrays');
  const reserveMap = new Map();
  const campaignMap = new Map();
  for (const r of reserves) {
    textId(r?.id, 'reserve');
    if (reserveMap.has(r.id)) throw new Error('Duplicate reserve');
    if (!Object.hasOwn(pairs, r.backingType)) throw new TypeError('Unknown backing type');
    isCents(r.availableCents, 'reserve.availableCents', true);
    reserveMap.set(r.id, { id: r.id, backingType: r.backingType, availableCents: r.availableCents });
  }
  for (const c of campaigns) {
    textId(c?.id, 'campaign');
    if (campaignMap.has(c.id)) throw new Error('Duplicate campaign');
    if (!Object.values(pairs).includes(c.requirementType)) throw new TypeError('Unknown requirement type');
    isCents(c.goalCents, 'campaign.goalCents');
    campaignMap.set(c.id, {
      id: c.id, requirementType: c.requirementType, goalCents: c.goalCents,
      allocatedCents: 0, pledgedCents: 0, phase: 'open',
    });
  }
  const transferIds = new Map();
  const sponsorLikes = new Set();
  const pledgeIds = new Set();
  function inspect() {
    return {
      reserves: [...reserveMap.values()].map(x => ({ ...x })),
      campaigns: [...campaignMap.values()].map(x => ({...x, shortfallCents:x.goalCents-x.allocatedCents,
        externalPaymentMade:false, realFundsVerified:false })),
      events: transferIds.size,
      syntheticOnly: true,
    };
  }
  function allocate({ reserveId, campaignId, eventId, cents = 1 }) {
    textId(eventId, 'eventId');
    isCents(cents, 'cents');
    textId(reserveId, 'reserveId');
    textId(campaignId, 'campaignId');
    const fingerprint = JSON.stringify([reserveId, campaignId, cents]);
    if (transferIds.has(eventId)) {
      if (transferIds.get(eventId) !== fingerprint) throw new Error('Conflicting reuse of eventId');
      return { status: 'duplicate', state: inspect() };
    }
    const reserve = reserveMap.get(reserveId);
    const campaign = campaignMap.get(campaignId);
    if (!reserve || !campaign) throw new Error('Unknown reserve or campaign');
    if (pairs[reserve.backingType] !== campaign.requirementType)
      throw new Error('Physical coins are not electronic bill funds; backing classes cannot mix');
    if (campaign.phase !== 'open') throw new Error('Campaign closed for further allocations');
    if (reserve.availableCents < cents) throw new Error('Reserve exhausted; cannot mint cents by interaction');
    if (campaign.allocatedCents > campaign.goalCents - cents)
      throw new Error('Allocation would exceed campaign goal');
    reserve.availableCents -= cents;
    campaign.allocatedCents += cents;
    transferIds.set(eventId, fingerprint);
    if (campaign.allocatedCents === campaign.goalCents) campaign.phase = 'ready-for-payee-review';
    return { status: 'allocated-in-simulation', state: inspect() };
  }
  function sponsorLike({reserveId, campaignId, actorId}) {
    textId(actorId, 'actorId');
    const key = JSON.stringify([reserveId,campaignId,actorId]);
    if (sponsorLikes.has(key)) return { status:'duplicate-like', state:inspect() };
    const result = allocate({reserveId,campaignId,eventId:`like:${key}`,cents:1});
    if (result.status === 'allocated-in-simulation') sponsorLikes.add(key);
    return result;
  }
  function pledge({ campaignId, pledgeId, cents }) {
    textId(pledgeId, 'pledgeId');
    isCents(cents, 'pledge cents');
    const campaign = campaignMap.get(campaignId);
    if (!campaign) throw new Error('Unknown campaign');
    if (pledgeIds.has(pledgeId)) throw new Error('Duplicate pledge');
    if (campaign.phase !== 'open') throw new Error('Campaign not open for new pledges');
    if (campaign.pledgedCents > Number.MAX_SAFE_INTEGER - cents) throw new RangeError('Pledge overflow');
    campaign.pledgedCents += cents;
    pledgeIds.add(pledgeId);
    return { status:'pledged-not-funded', state:inspect() };
  }
  return { inspect, allocate, sponsorLike, pledge };
}
