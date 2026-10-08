import { canonical, hash } from '../protocol.mjs';
import { assert, exact, sealRouting, validateRouting } from './envelopes.mjs';
import { routeCapacity } from './router.mjs';

export const GARDEN_COMMIT = '6738230a8557060dd59aabc19caf21826806d16f';

// Requires a native need.opened receipt, separate human selection and separate publication
// approval. It does not accept a held HelpSlip, its description, or its private context.
export function selectedGardenNeed({ receipt, selected, publicationApproved, publicFields, source, keys }) {
  assert(selected === true && publicationApproved === true, 'Explicit selection AND public opt-in required');
  exact(publicFields, ['resource', 'kind', 'unit', 'quantity', 'region', 'boundaries', 'validFrom', 'expiresAt']);
  const event = receipt?.event;
  assert(event?.kind === 'need.opened' && event.actor?.role === 'household' && event.aggregateId === source.object &&
    source.system === 'garden-campfire' && source.version === GARDEN_COMMIT &&
    event.payload.unitLabel === publicFields.unit && event.payload.targetUnits === publicFields.quantity,
  'Native source receipt/quantity mismatch');
  return sealRouting('need', { id: source.object, revision: 1, previousHash: null, source, status: 'open', ...publicFields }, keys);
}

// Native authority owns every reservation and transition. This adapter only submits a
// human-selected candidate through an authenticated source client. No actor header fallback.
export class GardenAdmissionAdapter {
  constructor(authenticatedRpc) { this.rpc = authenticatedRpc; }
  async propose({ need, capacity, proposal, now, expectedHead }) {
    const n = validateRouting(need), c = validateRouting(capacity);
    assert(routeCapacity(need, [capacity], now).some(p => canonical(p) === canonical(proposal)), 'Stale or substituted proposal');
    assert(n.source.system === 'garden-campfire' && c.source.system === 'garden-campfire' &&
      n.source.version === GARDEN_COMMIT && c.source.version === GARDEN_COMMIT, 'Unsupported native source');
    const receipt = await this.rpc('rpc_pledge_capacity', { _circle_id: n.source.authority, _expected_head: expectedHead,
      _idempotency_key: proposal.id, _need_id: n.source.object, _capacity_id: c.source.object,
      _need_hash: hash(need), _capacity_hash: hash(capacity), _units: proposal.quantity });
    assert(receipt?.event?.kind === 'offer.pledged' && receipt.event.payload?.needId === n.source.object,
      'HOLD: transport acknowledgment is not a native pledge receipt');
    return receipt;
  }
  async accept({ circleId, offerId, expectedHead, idempotencyKey }) {
    const receipt = await this.rpc('rpc_accept_offer', { _circle_id: circleId, _offer_id: offerId,
      _expected_head: expectedHead, _idempotency_key: idempotencyKey });
    assert(receipt?.event?.kind === 'offer.accepted' && receipt.event.aggregateId === offerId,
      'HOLD: native owner acceptance receipt required');
    return receipt;
  }
}
