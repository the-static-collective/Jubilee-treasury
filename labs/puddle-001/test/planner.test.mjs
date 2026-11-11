import test from 'node:test';
import assert from 'node:assert/strict';
import { planPurchase, dollars } from '../planner.mjs';
const sources = [
  { id: 'bank', label: 'Bank card', balanceCents: 120, canTenderHere: true },
  { id: 'app-a', label: 'Wallet A card', balanceCents: 230, canTenderHere: true },
  { id: 'app-b', label: 'Wallet B card', balanceCents: 70, canTenderHere: true },
];
const plan = (amountCents, allowsSplitTender, modified = sources) =>
  planPurchase({ amountCents, merchant: { allowsSplitTender }, sources: modified });

test('exact integer cents and no fabricated settlement', () => {
  const result = plan(380, true);
  assert.equal(result.totalCents, 420);
  assert.equal(result.tenderableCents, 420);
  assert.equal(result.status, 'split');
  assert.deepEqual(result.allocations.map(x => x.cents), [230, 120, 30]);
  assert.equal(result.allocations.reduce((sum, x) => sum + x.cents, 0), 380);
  assert.equal(result.actualPaymentMade, false);
  assert.equal(result.providerBalancesVerified, false);
  assert.equal(result.hypothetical, true);
});
test('prefer a single tender where one source covers purchase', () => {
  const result = plan(200, false);
  assert.equal(result.status, 'single');
  assert.deepEqual(result.allocations, [{ id: 'app-a', label: 'Wallet A card', cents: 200 }]);
});
test('without split support a fragmented purchase is blocked', () => {
  const result = plan(380, false);
  assert.equal(result.status, 'needs-split-support');
  assert.deepEqual(result.allocations, []);
  assert.deepEqual(result.conditionalAllocations.map(x => x.cents), [230, 120, 30]);
});
test('inaccessible funds remain separate from total wealth', () => {
  const modified = sources.map(x => x.id === 'app-a' ? { ...x, canTenderHere: false } : x);
  const result = plan(300, true, modified);
  assert.equal(result.status, 'inaccessible');
  assert.equal(result.totalCents, 420);
  assert.equal(result.tenderableCents, 190);
  assert.equal(result.shortfallCents, 110);
});
test('total insufficient gives exact shortfall', () => {
  const result = plan(425, true);
  assert.equal(result.status, 'insufficient');
  assert.equal(result.shortfallCents, 5);
});
test('zero balance sources never used', () => {
  const result = plan(120, true, [
    { id: 'empty', balanceCents: 0, canTenderHere: true },
    { id: 'funded', balanceCents: 120, canTenderHere: true },
  ]);
  assert.equal(result.status, 'single');
  assert.equal(result.allocations[0].id, 'funded');
});
test('reject malformed input and unknown merchant/provider capabilities', () => {
  assert.throws(() => planPurchase({amountCents: 100, sources, merchant: {}}), /explicitly/);
  assert.throws(() => plan(100, false, [{ id: 'x', balanceCents: 100 }]), /explicitly/);
  assert.throws(() => plan(100, false, [{ id: 'x', balanceCents: -1, canTenderHere: true }]), /nonnegative/);
  assert.throws(() => plan(100, false, [{ id: 'x', balanceCents: 1.2, canTenderHere: true }]), /integer/);
  assert.throws(() => plan(100, false, [{ id: 'x', balanceCents: 100, canTenderHere: true }, { id: 'x', balanceCents: 10, canTenderHere: true }]), /duplicate/);
  assert.throws(() => plan(0, false), /above zero/);
  assert.throws(() => plan(Number.MAX_SAFE_INTEGER, false, sources.concat({id:'huge',balanceCents:Number.MAX_SAFE_INTEGER,canTenderHere:true})), /precision/);
});
test('format cents without fractional rounding', () => {
  assert.equal(dollars(58), '$0.58');
  assert.equal(dollars(3), '$0.03');
  assert.throws(() => dollars(1.5), /integer/);
});
