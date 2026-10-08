# PENNY RECURSION 013 — real coin inventory, unrealized recursive options

**Experimental executable specimen; not a bank, cash balance, deposit account, interest product, loan, charity fund, appraised collectible, or investment.**

## Hypothesis

Holding a penny can support multiple independently useful *plans*: count it, organize it, turn the collection into an exhibit, tell a verified story about a community project, invite another contributor, or ask a bank whether it can accept the coins into a separate account. Each route must have permission, nonfinancial resources (e.g. actual human time) and, where needed, independently verifiable external results.

The same held penny **must not** be booked repeatedly as each possible route is imagined. A route can produce attention, proposals, community benefit, or invitations; it cannot produce a payment, interest, beneficiary gift, or title by calculating harder.

## Built on existing machinery

- **Asset Treasury 007:** only signed locally ACCEPTED+RECEIVED and **unreserved** lots of `kind=coins, unit=penny, mode=gift` enter the read-only penny source. That status is still just a steward-signed physical receipt **assertion**, not independently verified physical custody.
- **Living Capacity Index 008:** source-pinned read-only compositions, no resource multiplication. Penny 013 extends it with explicitly staged, **bounded multi-step alternatives**.
- **Door Registry 012:** may observe an offered jar with no actual receipt. Until the 007 owner independently accepts, receives and attests it, it does **not** augment the held penny source.
- **reLATTE:** source-verified asset candidates may be carried by native signed crossing into an independent receiver's `RECEIVED → R3_HOLD`. That doesn't transfer title, charity accounting or bank rights.
- **No external custody, payout or deposit provider:** this experiment never earns a cent through interest.

## Governing law

`SOURCE COUNT != VERIFIED CASH`
`OFFER != RECEIVE`
`OPTIONS != ASSETS`
`ALTERNATIVE ROUTES != ADDITIVE PORTFOLIO`
`NEW STORY != NEW DONATION`
`BANK VISIT PLAN != BANK DEPOSIT`
`ILLUSTRATED INTEREST != EARNED INTEREST`
`RECURSION != MONEY CREATION`
`SAME PENNY != TWO ALLOCATIONS`

## How the "interest" can actually grow

### 1. Source-held accumulation

A synthetic fixture has one signed steward-attested 37-penny lot and another separate 63-penny lot. Both have distinct source asset IDs and 007 signed event histories. Together they can support possible plans concerning **100 pennies**. The additional 63 pennies come **only** from a second explicit OFFER → ACCEPT → RECEIVE event sequence, never from recursion.

Other coins that are unreceived, declined, withdrawn, reserved or restricted to a different purpose are excluded. As new signed source history arrives, the projection's source head changes and a new index can be calculated. Old alternatives remain tied to their exact old history head.

### 2. Recursive *possibility*, not recursive *interest payments*

A deterministic breadth-first planner explores declared state transitions:

    HELD
      └── COUNTED (requires 1 received labor minute)
           ├── SORTED (requires 3 more minutes)
           │    ├── EXHIBIT_CANDIDATE (4 more minutes)
           │    └── DEPOSIT_CANDIDATE (requires >=100 pennies, 2 more minutes)
           │         └── INTEREST_ACCOUNT_CANDIDATE (1 more minute)
           └── STORY_READY (2 more minutes)
                └── INVITATION_CANDIDATE (2 more minutes)
                     └── EXTERNAL_GIFT_REQUEST (1 more minute)

Every transition is a **counterfactual candidate**. An independently attested labor pool limits which hypothetical actions are available; 37 pennies alone cannot physically organize themselves. In a *single route*, hypothetical minutes are consumed from one labor budget. Alternative branches **compete** for the same physical coins and human time. The engine reports alternatives individually and refuses any aggregated claim that the work or penny holdings have multiplied.

Each rule declares minimum physical coins, labor minutes, scope/purpose and terms. Only known acyclic transitions are admitted, with finite depth and output limits. The outputs are never appended to source inventory automatically.

Possible benefits include an actual independently chosen counting task, an art/community narrative, an approved fundraising invitation, or an externally agreed deposit. These would need their **own new source events** before being treated as completed. A matching invitation is not a pledged matching gift.

### 3. Separate hypothetical interest calculator

There is an intentionally isolated **what-if scenario**:
- explicit fictional APR input in integer basis points (e.g. 500 = hypothetical 5% APR);
- a month horizon and optional *imagined* contributions;
- conservative integer-cent monthly floor for visualization;
- `actuallyEarnedInterestCents = 0`, `actualFundsDepositedCents = 0`, source ledger unchanged.

This deliberately does **not** model a financial institution's actual rate/fees, minimum deposit, rounding, eligibility, payout, taxes or compounding convention. Coins stored in a physical jar accrue no contractual bank interest by remaining in the jar. Even an "interest account candidate" is not a deposit.

## Run the example

Node.js 20+:

    npm test
    npm run pennies:demo

To read an existing private **Asset Treasury 007 signed ledger**:

    npm run pennies -- inspect /path/to/ledger.json purpose-neighbor-support-001 4 500 12

Command arguments:
- `inspect`: read-only; no ledger write or transfer.
- ledger JSON: 007 signed ledger content, not the Directory path.
- purpose ID must be present in the accepted asset/terms scope.
- depth 1-7; optional illustrative APR in basis points (0-20000); horizon 1-120 months.

Output explicitly shows **source lots**, source hash, real steward-attested coin count, mutually exclusive candidate paths, labor budget and speculative interest calculation with zero actual earnings.

The fixture uses a **separate signed labor asset**. It does not posit free services. It also intentionally leaves all owner-identifying information out of the index.

## Native reLATTE proof

CI clones the actual reLATTE runtime and feeds both synthetic penny lots through the existing \`runRelatteHold\` native crossing runner. It asserts:
- 37-penny and 63-penny asset lots produce separate crossing IDs and distinct RECEIVED/HOLD receipts;
- idempotent cold replay of the first lot yields identical crossing/receipt identities;
- the independent receiver holds both as distinct candidates and does not admit them;
- recursive candidate enumeration after transport never increases the ledger's coin count or produces interest, cash or rights.

The two underlying lots are signed local steward assertions only. Even two native receipts do not mean a bank holds any cash.

## Production gates

- Real physical stewardship: owner consent, independent count witnesses, secure custody, audit reconciliation, dispute handling, theft/loss adjustments and legal review.
- Actual bank cash conversion: bank's own accepted coin deposit plus a verified settlement record, **not** \`DEPOSIT_CANDIDATE\`.
- Real interest: independent bank statement/provider-authenticated posted interest, handled in a **separate** source-owned monetary account; no fabricated synthetic “interest assets.”
- Public community/story campaigns: explicit permissions, human editorial consent, verified beneficiary, separate provider fundraising links and private donor safeguards.
- Actual coin collectors' value: separate, independently evidenced numismatic valuation; never silently treat 1 cent face value as a guaranteed collector price or precious metal recovery.
- Source and ledger key management, external checkpoints to detect historical truncation, issuer identity checks and real recipient admission.

**Success condition:** new genuinely accepted pennies and labor expand feasible actions and change the signed source head, but repeated recursive planning by itself cannot change actual held resources.
