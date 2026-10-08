import { assert } from './envelopes.mjs';

// The provider must be a trusted private service, deliver immediately to the two
// authenticated parties, and retain no approval token for later reuse. This gate
// does not implement encrypted messaging, store contacts, or publish a receipt.
export async function nativePrivateIntroduction({ sourceRpc, circleId, offerId, deliverPrivateContact }) {
  const allowed = await sourceRpc('rpc_capacity_contact_allowed', { _circle_id: circleId, _offer_id: offerId });
  assert(allowed === true, 'HOLD: current native two-party consent required');
  return deliverPrivateContact();
}
