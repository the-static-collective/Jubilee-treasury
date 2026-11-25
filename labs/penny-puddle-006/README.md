# PENNY × PUDDLE-006 — WORTH TO WHOM?

**An owner-directed, directly negotiated, grade-optional small-object exchange.**

Status: an executable **fictional, local-only candidate matching and two-sided consent laboratory**. No real participants, object custody, personal data collection, authenticity testing, buyer identity, financial account access, barter performance, real gift, sale, PUDDLE credit, PENNY issuance, payment or legal agreement.

## The conceptual inversion

PUDDLE-004 asked, "What premium will a numismatic institution authenticate?"

PUDDLE-006 instead asks: **"Who has a reason to want this particular thing, what would they voluntarily offer, and what terms would its rightful owner voluntarily accept?"**

A physically ordinary penny can be personally valuable because its year is meaningful, its appearance fits artwork, it records a local event, or it is part of a one-of-a-kind story. That subjective *relationship-specific* value is not a universal spot price, mint variety, grade, investment return or transferable fiat reserve. It is **evidenced only as the actual voluntary preference and exchange between these parties**, and the evidence strengthens only when a promised exchange is fulfilled.

We can operate a voluntary raw-coin exchange **without requiring PCGS or NGC**. Their authentication and grading services may be useful when parties voluntarily need them, particularly for expensive or disputed pieces. But third-party graders are not the source of everyone's personal meaning.

### Three distinct proofs that cannot be substituted

| Question | Appropriate evidence | What it does not establish |
|---|---|---|
| **What is it?** | Photos, original observation, clear unknowns, optional independent assessment | Doesn't prove extraordinary mint error, title or collectible value |
| **Whose choice is it?** | Legally effective title, owner's consent, honest terms, ability to withdraw | Finding/custody alone doesn't transfer ownership |
| **What is it worth to this person?** | Buyer-volunteered reason and acceptable consideration; eventually confirmed fulfillment | A self-reported desire isn't settled cash or an objective market price |

**Consent is not expertise. A completed exchange is not universal valuation. A grade is optional; truthful description and legal ownership are not.**

## The direct exchange's new verbs

1. **OFFER / I HAVE** — owner shows an observed, ungraded object, descriptions and uncertainty. Explicit ownership and collateral questions precede transfer. Owner selects whether cash asks, specific work/goods trades, or voluntary gifts are possible.
2. **SEEK / I WANT** — someone expresses optional interest tags (e.g. year 1978, family memory, local history, state-quarter art); their maximum cash limit and budget never become a public auction target.
3. **WEAVE / A CONNECTION** — match the two parties based on *explicitly offered interests and allowed transaction modes*, without presuming a coin is rare or requiring numerical institutional certification.
4. **CONSIDER / A SPECIFIC OFFER** — possible transaction includes seller-listed ask, a named class of offered goods/work, or a free gift, plus honesty/disclosure, time and delivery implications. A simulator result is not assent.
5. **OWNER ACCEPTS OR REFUSES**; **SEEKER REAFFIRMS OR REFUSES**. Two asserted choices generate a **HOLD receipt**, not a legal signature or payment.
6. **FULFILL / VERIFY OUTSIDE THE LAB (FUTURE)** — independently evidenced in-person delivery/condition, receipt of actual consideration, disputes, and voluntary final acknowledgment. Only **genuine settled dollars** may become a USD-CENT PUDDLE input; no graded-appraisal premium or buyer's unexecuted offer may be admitted.
7. **LEAVE IT WITH THE OWNER** — preserving, lending for an exhibit, or storytelling with permission may be preferable to sale. A separate sponsor can pay a creator for licensed work without buying the physical object.

### Economic experiment

The fixture contains **three ordinary-looking raw coins** and **four imaginary participants**.

- A 1978 cent, listed by its fictional owner at $8, meets a fictional collector who voluntarily wants that year for family reasons.
- A local-history 1912 cent matches a fictional photographer offering work rather than cash.
- A state quarter matches a fictional musician offering music to support an art project.
- A fourth candidate explicitly refuses ungraded coins and therefore does *not* participate. That preference is respected.

The matcher uses integer cents, visible seller asks and private *thresholds* of buyer willingness to pay. It does not infer someone's internal finances, expose the buyer's maximum offer, or automatically increase the price because someone seems emotionally attached. The preference/affinity score rewards **mutual declared tags** and permitted transaction modes; it is a heuristic for demonstrating choice, not a measured utility, a public profile, a recommended legal price or a valuation prediction.

We compare three selection policies on exactly the same inputs:

| Policy | Behavior |
|---|---|
| **Meaning-first** | Raw-coin opt-in for both, then mutually plausible cash / service barter / gifts |
| **Cash-only** | Same raw consent and interests, but removes barter/gifts |
| **Grade-gated** | A deliberately restrictive comparison that excludes all *raw* specimens in the sample |

The grader-required comparison doesn't mean grading is always undesirable. It demonstrates that insisting on institutional authentication **as a universal threshold** blocks personally useful exchanges that people might knowingly and lawfully choose without it.

The solver uses a bounded exact *one item / one seeker* assignment maximizing explicit shared-interest affinity, not sale price or speculation. Matched candidates are not automatically binding. There is no automatic buyer bidding, winner lock, price escalation or background financial action.

### Safety, dignity and agency

- **Every coin and value is a particular.** Keep grading claims separate from personal preference and actual settled consideration.
- **No unknown ownership or double pledge.** A coin already backing PENNY or another obligation cannot simultaneously be available to barter, gift or sell. The current match engine refuses encumbered specimens in its synthetic input.
- **No pressure from a "sentimental score."** Buyers choose what they share, sellers choose terms, and both can decline; private budget caps never become public information. No psychological profiling or automatic extraction of maximum willingness to pay.
- **No misleading rarity claims.** "Looks copper-colored" is an observation; "genuine 1943 copper penny" requires extraordinary evidence. Raw-coin trade can be legitimate but unresolved authenticity must be clear to both people.
- **No third-party hostage custody.** The laboratory never collects coins for escrow, takes possession for appraisal or urges shipping to strangers. In any real pilot, plan safe viewing, shipping risk, buyer/seller protection, returns, ownership disputes, fraud review, and required local business/financial compliance.
- **No one-step graduation to fiat.** Every match and mutual assent remains `HOLD`. A completed barter isn't the same as bank-settled money. Nothing creates a redeemable PENNY balance by itself.
- **No presumption of legal equivalence.** Noncash exchange may create tax, accounting, labor, insurance or contractual obligations in real implementations. This fictional state machine does not create or validate such obligations.

## Source-owned executable slice

Node.js 20+; no dependencies:

```sh
npm test --prefix labs/penny-puddle-006
npm run demo --prefix labs/penny-puddle-006
npm run serve --prefix labs/penny-puddle-006
# Visit http://127.0.0.1:8802/ on the same computer
```

The locally hosted, mobile-friendly interface is a static preview. Its "agreement" action simulates two separate self-asserted choices without real users, signatures, items or payments.

- `meaning-exchange.mjs` — source-owned, explicit consent, private budget threshold, cash/barter/gift candidate matching, bounded exact assignment, misleading-title hold, option previews.
- `consent-receipts.mjs` — `BUYER_INTEREST` → `OWNER_AFFIRM` or `DECLINE` → `BUYER_REAFFIRM` or `DECLINE` → `HOLD_NOT_SETTLED`. Demonstrates a receipt of proposed preference, **not** proof of real title or irrevocable agreement.
- `demo.mjs` — full comparison and modeled consent receipt.
- `test/` — conservation, raw opt-in, trade/gift, private max price, collateral refusal, dual consent, no actual money.
- `index.html`, `ui.mjs`, `server.mjs` — no cookies, analytics, remote calls, banking inputs or provider APIs.

## Crossings

- **PENNY:** retain existing coin-backed face-value rules; personal sentiment cannot issue reserve-backed cent claims.
- **PUDDLE:** a *completed, lawful, independently verified* actual cash settlement could enter a separately permitted dollar-funded route; an offer is not a balance.
- **MOTIF:** ask "Which voluntary connection preserves the most participant choice?" instead of assuming "maximize displayed price." The current matcher uses basic explicit-tag assignment, not the MOTIF runtime.
- **reLATTE:** typed source-owned `OFFER → HOLD → REVIEW → ADMIT/REFUSE` model could carry privacy-respecting bilateral transaction receipts to independent receivers; no actual cross-project signature, admission or network dispatch has occurred.
- **reLATTE / useful work:** photo sessions, stories, repairs, music and labor barter need *separately articulated deliverables* and actual reciprocal performance—not fabricated equivalent dollar values.

## External context

- [American Numismatic Association FAQ](https://www.money.org/faq/) — market demand and condition contribute to collector prices; much circulation is ordinary.
- [PCGS price-guide disclosures](https://www.pcgs.com/prices/priceguidede) — price guides, dealer asking and market realizations differ; for low-value coins, costs can exceed grading value.
- [Pacific Northwest Numismatic Association: Direct Sale to Coin Collectors](https://pnna.org/reference/pdf/Numismatic%20Buying%20and%20Selling.pdf) — direct collector relationships can avoid commissions, but thin demand, payment, theft and disputes remain.
- [Minnesota Attorney General: Fraudulent Coin Dealers](https://www.ag.state.mn.us/consumer/publications/CoinDealers.asp) — deceptive representations and misleading "grading" can cause material loss.
- [FBI IC3 collectible coin scam warning](https://www.ic3.gov/PSA/2024/PSA240625) — avoid promises of unusually high profits and unsafe transfer of coins to untrusted appraisers.

**Pilot success metric:** count self-chosen, independently fulfilled meaningful exchanges, participant satisfaction and recourse, no unwanted sale, net service value actually received and costs or harm prevented. Don't track invented "market cap," sum of private max bids, or numismatic prices as realized wealth.

**The thesis:** *The value of an item can be verified in a relationship without first being standardized as a commodity; the item itself and the exchange still require truthful description, genuine ownership and completed mutual performance.*
