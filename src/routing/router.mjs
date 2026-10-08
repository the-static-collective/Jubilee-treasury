import { canonical, hash, escapeHtml } from '../protocol.mjs';
import { assert, validateRouting, timestamp } from './envelopes.mjs';

export function routeCapacity(need, capacities, now) {
  const n = validateRouting(need);
  assert(need.type === 'need' && timestamp(now), 'Need and explicit clock required');
  if (n.status !== 'open' || now < n.validFrom || now >= n.expiresAt) return [];
  const results = new Map();
  for (const capacity of capacities) {
    const c = validateRouting(capacity);
    assert(capacity.type === 'capacity', 'Capacity required');
    if (c.status !== 'available' || now < c.validFrom || now >= c.expiresAt ||
      c.resource !== n.resource || c.kind !== n.kind || c.unit !== n.unit || c.region !== n.region ||
      !n.boundaries.every(b => c.boundaries.includes(b))) continue;
    const proposal = { needHash: hash(need), capacityHash: hash(capacity), quantity: Math.min(n.quantity, c.quantity),
      state: 'candidate_source_admission_required',
      reasons: [`same resource: ${n.resource}`, `same kind: ${n.kind}`, `same unit: ${n.unit}; no inferred conversion`,
        `same coarse region: ${n.region}`, 'declared availability window overlaps the observation clock',
        'all explicit need boundaries are supported', 'usable quantity is the smaller declared quantity'],
      uncertainty: ['Helper assertion; inventory and physical suitability are unverified',
        'Mirror freshness is unproven; source must recheck at human acceptance',
        'No introduction, consent, reservation, delivery, or confirmation is implied'] };
    results.set(hash(proposal), { id: hash(proposal), ...proposal });
  }
  return [...results.values()].sort((a, b) => a.id.localeCompare(b.id));
}
export async function publicRoutingPage(need, sourceCurrentHash, now) {
  const n = validateRouting(need);
  assert(need.type === 'need' && timestamp(now), 'Need and explicit clock required');
  let current = false;
  try { current = await sourceCurrentHash(n.source) === hash(need); } catch { /* HOLD */ }
  if (n.status !== 'open' || !current || now < n.validFrom || now >= n.expiresAt) return '<!doctype html><title>Public request held</title><p>Withdrawn or source freshness unavailable. No public request or allocation asserted.</p>';
  return `<!doctype html><title>Opted-in public need</title><p>${escapeHtml(n.resource)}: ${n.quantity} ${escapeHtml(n.unit)}; ${escapeHtml(n.region)}</p><p>Source-checked public projection. Routing remains a proposal; no delivery verified.</p>`;
}

// Consent envelopes belong to a private coordinator, never a public mirror/export.
// The caller supplies a fresh private-channel reader and the latest consent for BOTH parties.
export async function exchangePrivateContact({ proposal, need, capacity, now, readLatestConsents, challengeSources, readPrivateContact }) {
  validateRouting(need); validateRouting(capacity);
  assert(timestamp(now) && routeCapacity(need, [capacity], now).some(p => canonical(p) === canonical(proposal)), 'Stale or substituted introduction');
  assert(typeof readLatestConsents === 'function' && typeof challengeSources === 'function', 'Fresh private coordinator and source challenge required');
  const current = await challengeSources();
  assert(current?.needHash === hash(need) && current?.capacityHash === hash(capacity), 'Withdrawn or stale introduction sources');
  const consents = await readLatestConsents(proposal.id);
  assert(Array.isArray(consents) && consents.length === 2, 'Two-party consent required');
  for (const [party, key] of [['requester', need.publicKey], ['helper', capacity.publicKey]]) {
    const e = consents.find(c => c.payload?.party === party);
    const p = validateRouting(e);
    assert(e.type === 'consent' && e.publicKey === key && p.proposalId === proposal.id &&
      p.decision === 'allow' && now < p.expiresAt, 'Missing, withdrawn, or expired private consent');
  }
  return readPrivateContact();
}
