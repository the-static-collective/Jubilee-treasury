# PUDDLE-005 — The Collector Market × MOTIF Discovery Field

**Status:** executable, entirely synthetic, source-aware **counterfactual planning**. No numismatic appraisal, market offer, account connection, coin transfer, license, fundraising, trust or settlement exists. Nothing in this experiment may issue PENNY, credit actual PUDDLE balances, move a coin, send an offer, contact a person or disburse a campaign.

## Research question

Can a PENNY steward safely discover *additional useful possibilities* by connecting a coin owner's legitimate rights, small-cost observations, actual categories of collector demand, expert authentication services, voluntary cultural sponsorship, and community needs—rather than indiscriminately cashing a coin out at face value or claiming a speculative rare value?

**The user-centered objective** is new real-world usefulness net of costs, subject to consent, security, provenance and the recipient's deadline. The financial-network proposal is separate from permission to use real provider rails.

## The small executable environment

The lab models a **fictional candidate coin**, a fictional owner, two hypothetical raw buyers, one hypothetical post-certification buyer, a volunteer story sponsor, and one community need. The current market graph has **zero verified quotes, zero approved account routes and zero actual paid contributions**.

A classical finite-horizon decision solver enumerates weighted *invented* hidden worlds. The simulated first information request is a low-cost observation that can be positive or negative. A positive result permits a more expensive mock expert review; subsequent actions include an as-is buyer route, post-authentication buyer, sponsor-paid creative exhibit, or keeping the owner's property.

Another strategy uses the **new-affordance comparison** in [MOTIF-003](https://github.com/the-static-collective/MOTIF/blob/main/experiments/003/affordance.py): ask whether an action makes *new further actions* possible. Here it is a separate, source-inspired **JavaScript implementation**, **not an actual import of the native MOTIF Python runtime**. We maintain matched controls:
- **Greedy immediate**: the largest modeled immediate monetary return.
- **MOTIF-inspired affordance first**: first move creating most new action kinds, then the same classical contingent solver.
- **Classical expected planner**: strong bounded optimal control over explicitly weighted synthetic outcomes.
- **Robust planner**: maximize the minimum *scenario* result rather than trust a speculative expected collector payout.

This is not evidence that MOTIF beats classical planning. In the default synthetic fixture, the affordance-first and expected-optimal planners **tie**. The robust planner avoids the substantial downside of paying an authentication fee for a false-positive find.

### Hypothetical fixture numbers — explicitly not numismatic estimates

| Assumption | Fictional number | Reality boundary |
|---|---:|---|
| "Rare" world share | **14%** | Arbitrary synthetic weight; **not** a frequency, posterior, or estimate for *any* 1943 penny or real specimen |
| Positive screen if rare | 90% | Invented; not a validation of the triage tool |
| Positive screen if ordinary | 10% | Invented; screen could be wrong |
| Non-destructive preliminary screen | $1 / 1 day | Fictional, not an offer |
| Expert authentication | $25 / 14 days | Illustrative service tier, not a full quote or guaranteed turnaround |
| Fictional raw buyer offers | $4.00–$5.00 gross | Invented; no buyer has offered to buy |
| Fictional certified-rare buyer offer | $140 gross | Invented; could be zero; **no collector price prediction** |
| Sponsor-funded licensed story | $3 gross / $1.50 production | Fictional sponsor, explicitly separate from any coin premium |
| Real settled cents | **$0.00** | None—no real money movement or authenticated quote |

The `makeFixture` example is **not conditioned on a particular date/mintmark/coin**, even though the separate **004 conservative triage** demonstrates unusual visual observations on a fictional copper-like 1943 penny. **Never apply the 14% hypothetical weight or the $140 fictional bid to that real-world category.** An actual off-metal 1943 cent is extraordinarily uncommon; only an independent expert can assess a physical object.

The $25 fee is not a certified current total. As of the Nov. 11, 2026 source check, PCGS lists an economy grading fee of **$23 per coin** for eligible coins and NGC lists an economy tier of **$25 per coin**, with shipping, handling, applicable add-ons, taxes, access/eligibility conditions and changing turnaround to consider. See [PCGS grading services](https://www.pcgs.com/services/pricing) and [NGC services and fees](https://www.ngccoin.com/submit/services-fees/ngc/). A $25 quote in the fixture is only a deliberately simplified cost for a **test**.

For buyer demand, never equate a website's asking-price guide with an executable bid. [PCGS explicitly explains](https://www.pcgs.com/prices/detail) that its Price Guide reflects average **dealer asking prices** for PCGS-graded coins and can diverge from actual transactions; [PCGS also points](https://www.pcgs.com/faq) to *Auction Prices Realized* as another separate research resource. Even a documented past realized sale of a similar coin cannot guarantee that another specimen will sell, much less in a particular timeframe.

## Native MOTIF-003: actual source-pinned read-only crossing

In addition to the standalone JavaScript policies, `native_motif_probe.py` now loads the **original Python MOTIF-003 implementation** from a separate checkout of [MOTIF at commit `66d27cfbd077b2c91d0d86d66e320206d88d8f95`](https://github.com/the-static-collective/MOTIF/blob/66d27cfbd077b2c91d0d86d66e320206d88d8f95/experiments/003/affordance.py). It verifies the exact Git blob SHA `db25da0d50a9c8e2cd87aa576a22f969405737cf` before import, refusing changed implementations instead of silently adapting.

The native MOTIF experiment receives an invented relational world whose first moves are `inspect-positive`, `inspect-negative`, `raw-buyer-proposal`, `licensed-story-proposal`, or `preserve-owner-property`. Inspection branches unlock later independent-authentication possibilities; cashing out is immediately rewarding only within the fictional graph. The native `analyze_first_moves` and `select_first_move` directly compare immediate and new-affordance priorities. All source relations remain fictional; no real coin is handled or buyer contacted.

This **is a real invocation of native MOTIF source**, but **not** a live integration into MOTIF's active planning runtime and not a matched numerical comparison to PUDDLE-005's stochastic/weighted JS solver. The native world tests structural branching alone; the JS solver tests costs, weighted outcomes and robust losses. They share a *question*, not interchangeable metrics.

CI checks out the read-only public MOTIF commit and runs a Python standard-library unit test and witness script. To run locally, after obtaining that exact repository revision:

```sh
MOTIF_SOURCE_ROOT=/path/to/pinned/MOTIF python3 -m unittest discover \
  -s labs/penny-puddle-005/test -p 'test_native_motif.py' -v
MOTIF_SOURCE_ROOT=/path/to/pinned/MOTIF python3 labs/penny-puddle-005/native_motif_probe.py
```

This creates an inspectable source-owned MOTIF crossing without pushing into MOTIF's other active research branches, modifying its code or implying any operational rights.

## The actual experiment

```sh
npm test --prefix labs/penny-puddle-005
npm run demo --prefix labs/penny-puddle-005
npm run serve --prefix labs/penny-puddle-005
# On that computer, visit http://127.0.0.1:8801/
```

Node.js 20 or newer, no npm dependencies. The 005 module reads only the previous 004 *synthetic* one-coin quarantine model; there are no external calls.

`opportunity.mjs` exports:

- `makeFixture`: fictional needs, buyer offers, service costs, owner-consent assertions, market and search budgets;
- `planOpportunity`: exhaustive small-state **classical DP** for expected hypothetical net return, MOTIF-style added affordances, immediate greedy and robust maximin controls;
- `replayPolicy`: one hidden synthetic world exposed gradually only after each simulated observation; never exposes outcomes before the action;
- `benchmark`: identical world, budget and action grammar for all four policies.

`bridge.mjs` offers a **typed, read-only graph** of specimen, consent assertion, inspection services, buyer categories, sponsor, and community campaign, together with two observation tickets. It is **only an OFFER/HOLD carrier**. It is not a native MOTIF-009 cartridge, authorized reLATTE crossing, signed source, reconciled bank result, financial permission, or verified appraisal. A separate receiving project's **own** adaptation, validation, admission, and consent rules must apply.

`index.html`, `ui.mjs`, `server.mjs` run a **mobile-first, loopback-only decision board**: select one of five fictional cases by button, inspect the four policies and their worst-world results, and keep every external financial edge held. Browser inputs remain local; no tracking, credentials or provider fetches.

`demo.mjs` wraps the existing 004 quarantine and provenance rules and the 005 bounded planner, then emits an inspectable synthetic decision report in JSON.

### Native pinned MOTIF witness / reproducible ledger-safe result

The 2026-11-11 CI run executed **the original pinned MOTIF-003** with five hypothetical first moves. Its immediate policy chose `raw-buyer-proposal`; its affordance policy chose `inspect-positive`, opening two independent *imagined* next authentication branches and thirteen reachable simulated states under the declared horizon. The native source blob was verified before import and its Python regression tests passed. This native observation is **not** a verified financial outcome; it is a structural decision comparison.

The separate JavaScript model now writes a checked-in [example-benchmark.json](example-benchmark.json), generated from the actual `benchmark(makeFixture())` result, with every hypothetical hidden-world outcome and the SHA of the exact model source blob. A CI regression test re-executes all policies and compares the complete per-world outcome rows to the saved receipt; failures block promotion. Tests exercise the mobile read-only server, too.

## Result and tradeoff

The default reproducible fixture produces the following (all amounts are **weighted fictional net outcomes**, not dollars earned):

| Planner | First move | Weighted synthetic net | Worst synthetic world |
|---|---|---:|---:|
| Greedy immediate | sell to fictional raw buyer | $3.80 | $3.80 |
| Affordance-first | inspect | $13.8932 | −$20.70 |
| Classical expected | inspect | $13.8932 | −$20.70 |
| Robust maximin | publish sponsor-funded story | $5.30 | $5.30 |

It isn't a claim of rare-coin profitability. The **−$20.70** case reveals exactly why scarce households cannot responsibly be told to pay $25 for grading based on a visual resemblance. If independent sponsor funding for grading is unavailable, the real system must refuse or HOLD that step until a separate legitimate source of funds exists.

The robust policy is more relevant when loss would be devastating than the largest hypothetical average upside. It also demonstrates that a genuine **sponsor-funded cultural contribution** can be safer than speculative coin resale.

### The discovery-dividend budget separation

A collector's **speculative** premium never enters the account graph. It may be shown as a scenario with independent assumptions, but it cannot pay anyone.

A real owner-directed split becomes eligible for the PUDDLE network only after the rightful owner and title are established, collateral is independently released if necessary, actual buyer agreement/settlement are verified, sale fees and tax-related expenses are determined, and a valid payment provider actually makes funds available.

Likewise, sponsor-backed creative work is backed by a distinct funding source, not the collectible price, newly minted PENNY tokens, votes or likes. The creator's license must be genuinely authorized. Sponsor funding cannot be inferred from an API's "like" event.

## Planned cross-project integration

- **MOTIF:** a future receiving experiment can import **read-only typed world and observation tickets** and compare native `affordance.py` planning with the local JS proxy. No authority to act or observe a real private account is implied.
- **reLATTE:** proposals/receipts could record `OFFER -> HOLD -> REVIEW -> ADMIT/REFUSE` with source-owned signatures. They cannot manufacture the owner's identity, verified human consent, a genuine third-party quote or bank settlement.
- **PUDDLE 003:** only properly **settled USD cents** could one day enter bank/processor routes subject to real provider permissions; a price-guide or theoretical premium is never a spendable balance.
- **PENNY BANK:** don't put a suspected collectible into face-value collateral while title, authenticity or encumbrance is unresolved. The 004 engine already holds it out, and 005 never writes to coin backing.

## Field gates before a live pilot

A live pilot requires **separate** review for: legal ownership and bailment, financial custody/payment licensing, seller protection, buyer fraud, coin authentication and insurance, grading/dealer fees, actual bids and sale proceeds, creator licensing, private storage of identity/photos/location, sponsor-fund validation, consent withdrawal, nonprofit/charitable allocation terms, and return/dispute/appeal procedures. A bank's FedNow availability does not unlock Venmo or Cash App balances.

**Primary measure:** independently confirmed *incremental benefit actually realized*, net all costs and risk, with no person asked to front money they cannot afford. This is what we should compare with the solver's hypothetical projections.

## Sources and limitations

- [MOTIF-003 original executable affordance analysis](https://github.com/the-static-collective/MOTIF/blob/main/experiments/003/affordance.py)
- [PCGS official grading fees](https://www.pcgs.com/services/pricing)
- [NGC official grading fees](https://www.ngccoin.com/submit/services-fees/ngc/)
- [PCGS distinction between price guides and realized market values](https://www.pcgs.com/prices/detail)
- [PCGS grading / shipping guidance](https://www.pcgs.com/faq)

**Observed:** external documentation about services, fee categories and how auction/asking prices differ. **Simulated:** coin frequency, prices, actual demand, human consent, service outcomes, return, campaign and every ledger movement. **Unresolved:** real provider integration, representative rarity, legal authority, buyer depth, economic viability and independent settlement.
