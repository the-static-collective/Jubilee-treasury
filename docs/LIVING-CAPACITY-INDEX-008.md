# JUBILEE ECONOMICS 008 — Living Capacity Index

Research experiment. **Not indexed universal life insurance (IUL), an investment, a credit account, an asset valuation, a currency, an income entitlement, or a live aid service.**

## Founding inversion

A source-owned, signed inventory can show **which real capacities might compose into a useful action**, even when no money changes hands. The index is a read-only cut of those opportunities, not an account balance or an obligation. An indexed cut may gain or lose options as actual resource assertions and restrictions change. It cannot promise ongoing positive growth.

An insurance policy's indexed floor is *not* used to manufacture a guarantee here. A human life, a need, and a contribution are not assets being priced.

```
actual signed Treasury events
    |
    v
Jubilee verifies journal / replays authoritative local state
    |
    +--- exact noncash available, purpose, units
    +--- distinct unmet needs
    +--- matching opportunities (proposal only)
    +--- explicit declared recipes (proposal only)
    |
    v
LivingIndexV0 {sourceHistoryHead,cutHash,read-only vectors}
    |
    +--- Full Measure quest suggestion? ONLY later owner-reviewed adapter
    +--- reLATTE opaque proposal? ONLY later explicit crossing / HOLD
    |
    v
source-local human acceptance, reservation and separately witnessed action
    |
    v
new signed source event -> fresh index cut
```

## Execute

Stacked on [FALL SHARE ASSET TREASURY 007](https://github.com/the-static-collective/Jubilee-treasury/pull/5), so this branch includes its Node.js 20+ no-dependency runtime.

```sh
npm test
npm run economics:demo
```

The demo makes two synthetic received assets (four repair hours and two repair kits), a synthetic one-kit need, and a declared recipe requiring two hours plus one kit for a proposed repair session. It emits three deterministic cuts: before reservation, after reservation, and after a steward's synthetic fulfillment assertion. No new repair session is created by deriving the recipe.

## Read-only contract

`livingIndex(ledger, {expectedHead?, recipes?})` from `src/living-capacity-index-008.mjs`:

- Calls Treasury's actual `inspect` to validate all signed events and source-owned state transitions.
- Publishes a **per-asset vector**, preserving quantity, exact unit, kind, permitted purposes, local state, reservations, consumed amount, and terms-reference IDs.
- Returns open needs and noncash route proposals. A route's maximum is explicitly **if separately reserved**, never a reservation.
- Counts external-cash attestations separately, without publishing or treating them as local spendable amounts.
- Rejects a mismatched `expectedHead`. A SHA-256 `cutHash` enables reproducibility; it is **not a signature or authoritative receipt**.
- Omits free-form descriptions and human identity/medical/contact fields. Even IDs/terms references must be chosen to avoid personally identifying encodings.
- Sorts inputs and outputs for deterministic cold replay.
- Requires each recipe to specify `id`, `purposeId`, `termsRef`, two or more typed nonmonetary inputs, and one typed nonmonetary hypothetical output. No implied automatic conversion.
- Repeated identical input types must share the same available stock. Per-recipe maximum batches are **exclusive what-if bounds**, not globally additive. Two recipes may both be possible against the same limited tool: neither may spend it, and their maximums cannot be summed.
- A recipe is a candidate transformation, not a claim that its proposed output already exists, that a helper is obligated, or that any terms grant rights.

### Example recipe

```json
{
  "id": "recipe-repair-008",
  "purposeId": "purpose-repairs-008",
  "termsRef": "terms-recipe-008",
  "inputs": [
    {"kind": "goods", "unit": "kit", "quantity": 1},
    {"kind": "time", "unit": "hour", "quantity": 2}
  ],
  "output": {"kind": "service", "unit": "repair_session", "quantity": 1}
}
```

The recipe only proposes a **possible** repair-session composition. Implementing it requires the actual asset owners, the beneficiary and a native human-reviewed execution/witness flow.

## What is indexed, not priced

- `available`: the steward's received/non-reserved noncash source claim, in that asset's own unit.
- `open`: the declared need still uncovered by that source's reservations and fulfillment reports, in the need's own unit.
- `routes`: nonbinding compatible offers.
- `compositions`: nonbinding recipe opportunities if all required input categories, quantities, and purposes are currently available.
- `blockedRecipes`: declared possible transformations that cannot currently be supported.
- `cutHash`: identity of this deterministic projection cut.

No universal score, price, credit limit, yield percentage, guaranteed return, fiat exchange rate, collateral pool, entitlement, auto-match, or person-level ranking is derived.

## Governance and implementation barriers

Jubilee Treasury owns its own signed steward claims and allocation rules. Full Measure/Campfire/Garden own local action and human confirmation. reLATTE carries and receives typed crossings; its receiver decides HOLD/REFUSE/ADMIT. Sources remain sovereign.

All quantities in this specimen are only locally attested. No external goods, human availability, rights, legal ownership, station permission, or fulfillment truth is independently verified. A real coordination deployment needs source authentication, freshness/withdrawal, private consent/contact handling, audit/revocation, and native claim verification. Money or regulated life insurance/lending would require entirely separate legally reviewed implementations.

## Hostile tests

Tests cover signed-history tampering, stale-head denial, cold-replay identity, OFFER/ACCEPT not producing received capacity, external cash exclusion, identical-input aggregate demand, conflicting simultaneous recipe candidates, purpose mismatch, missing complements, invalid schema and recipes, and reservation/fulfillment changing the index cut.

**Laws:** `INDEX != CREDIT`; `POTENTIAL != INVENTORY`; `RECIPE != FULFILLMENT`; `MATCH != RESERVATION`; `PRICE != HUMAN WORTH`; `SOURCE HEAD != AUTHORITY EXPANSION`.
