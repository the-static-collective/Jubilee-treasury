/** PUDDLE-001: local tender feasibility calculator. Integer cents; no money in custody. */
function cents(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${name} must be a nonnegative safe integer number of cents`);
  return value;
}
function safeSum(values) {
  return values.reduce((sum, value) => {
    if (sum > Number.MAX_SAFE_INTEGER - value) throw new RangeError('total exceeds safe integer precision');
    return sum + value;
  }, 0);
}
export function planPurchase({ amountCents, sources, merchant }) {
  cents(amountCents, 'amountCents');
  if (amountCents === 0) throw new RangeError('purchase amount must be above zero');
  if (!Array.isArray(sources) || sources.length === 0) throw new TypeError('sources must be a nonempty array');
  if (!merchant || typeof merchant.allowsSplitTender !== 'boolean') throw new TypeError('merchant.allowsSplitTender must be explicitly true or false');
  const seen = new Set();
  const normalized = sources.map((source, index) => {
    if (!source || typeof source.id !== 'string' || !source.id.trim()) throw new TypeError(`sources[${index}].id must be a nonempty string`);
    if (seen.has(source.id)) throw new TypeError(`duplicate source: ${source.id}`);
    seen.add(source.id);
    cents(source.balanceCents, `${source.id}.balanceCents`);
    if (typeof source.canTenderHere !== 'boolean') throw new TypeError(`${source.id}.canTenderHere must be explicitly true or false`);
    return {
      id: source.id,
      label: typeof source.label === 'string' && source.label.trim() ? source.label : source.id,
      balanceCents: source.balanceCents,
      canTenderHere: source.canTenderHere,
    };
  });
  const totalCents = safeSum(normalized.map(source => source.balanceCents));
  const eligible = normalized.filter(source => source.canTenderHere && source.balanceCents > 0)
    .sort((a, b) => b.balanceCents - a.balanceCents || a.id.localeCompare(b.id));
  const tenderableCents = safeSum(eligible.map(source => source.balanceCents));
  const base = { amountCents, totalCents, tenderableCents, allocations: [], hypothetical: true, actualPaymentMade: false, providerBalancesVerified: false };
  if (totalCents < amountCents) return { ...base, status: 'insufficient', shortfallCents: amountCents - totalCents };
  if (tenderableCents < amountCents) return { ...base, status: 'inaccessible', shortfallCents: amountCents - tenderableCents };
  const single = eligible.find(source => source.balanceCents >= amountCents);
  if (single) return { ...base, status: 'single', allocations: [{ id: single.id, label: single.label, cents: amountCents }] };
  let remaining = amountCents;
  const proposal = [];
  for (const source of eligible) {
    if (remaining === 0) break;
    const used = Math.min(remaining, source.balanceCents);
    if (used > 0) proposal.push({ id: source.id, label: source.label, cents: used });
    remaining -= used;
  }
  if (remaining !== 0) throw new Error('internal allocation invariant violated');
  if (!merchant.allowsSplitTender) {
    return { ...base, status: 'needs-split-support', conditionalAllocations: proposal, shortfallCents: amountCents };
  }
  return { ...base, status: 'split', allocations: proposal };
}
export function dollars(centsValue) {
  cents(centsValue, 'centsValue');
  return `$${(centsValue / 100).toFixed(2)}`;
}
