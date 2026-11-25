# ANCHOR-009 — THE UNSPENT ASSET / SATISFACTION WEAVE

**Hypothesis under test:** A very large, valuable, noncash object may enable more mutually acceptable economic action **without selling, fractionalizing, transporting, tokenizing, or lending the object itself**. The useful thing may not be the object's market price at all: it may be **a distinct permission, an independently financed limited loss guarantee, or a sequence of voluntary deliveries that satisfies the creditor directly**.

**Status:** executable, **completely fictional and local-only** research. No real gold, borrower, loan, payment, lien, guarantee, contract, labor, donor, title, assay, insurance, license, bank facility, coin-backed PENNY, or debt relief. No claim of a historically novel instrument. The synthesis uses known components; actual novelty and practicability are unresolved.

## Falsifying the easy version of the hypothesis

Gold is not cash. An immense, valuable object cannot *by itself* pay a $300 landlord who insists on $300 cleared dollars. There must be at least one:
- real source of already liquid money (buyer, donor, sponsor, funder, institution);
- lawfully enforceable credit from an independently funded counterparty;
- **creditor-approved substitute performance** (goods, repairs or services) instead of cash;
- creditor's free and informed forgiveness of the obligation.

An appraised price, proposed sale, unsold license, unverified pledge, paper certificate or hypothetical recovery scenario is none of these.

This means **no magical liquidity from a rock**, however enormous. The interesting frontier is finding combinations of actual counterparties that a simple single-asset marketplace would not discover.

## Route 1: the asset as a *capacity to absorb a narrowly specified failure*

Suppose B has $300 to pay A's landlord, but is willing to personally lose at most $75. Another person owns the remarkable object and voluntarily offers to bear up to $225 of risk if donations fall short, *only through a competent, separate financing partner that actually commits available cash and accepts the asset's verified collateral/rights*.

A bank/qualified funder's standby commitment can, in the **fictional** case, make B's offer more acceptable. B's $300 pays the landlord now. A owes B nothing. Later unrelated donors reimburse B $120; the separate facility draws $105, leaving B with a $75 loss (their predeclared limit) and the object owner potentially exposed to $105 of loss. If still later donors explicitly restore $60 to that facility, the object's modeled outstanding exposure falls to $45.

All those numbers are separate, independently sourced transfers in the hypothetical world. **The gold is never "worth $225" merely because a test typed $225 into a facility scenario.** The lender's risk review, ownership/title, assay, security interest, collection, insurance, ability to liquidate collateral, custody and legal authority would have to be independently real. If the required bank funding is absent, the model says **HOLD** regardless of apparent metal value.

This is a version of *guarantee/credit enhancement* rather than a novel financial primitive. The Federal Reserve regulates standby letters of credit and the FDIC identifies credit and funding risk with them. A capped guarantee is **not** a harmless donation: it can result in loss of the gold or other collateral. The owner must knowingly accept this. No one should finance someone else's rent by casually placing an irreplaceable asset at risk.

## Route 2: divide *opportunities*, not the object

The object may attract a genuine paying counterparty for separately negotiated uses: photographic depiction (subject to actual intellectual-property/privacy rights), an authorized story/exhibition, temporary access, specialized examination, or a service around safekeeping and presentation.

The miniature in `mosaic.mjs` considers one **invented** licensed photo right:
- hypothetical sponsor pays $110;
- separately identified production/rights costs are $30;
- hypothetical owner voluntarily directs $80 net to the landlord;
- the landlord still needs $220, paid from B's distinct cash;
- hypothetical later donors direct $120 to B;
- a properly supported contingent facility covers another $25;
- B's residual voluntary loss is $75; the owner risks $25 in the call.

Check the accounting: modeled sources of $475 are the **license sponsor ($110), B's cash ($220), third-party donors ($120), and capital provider ($25)**. The modeled uses are **production ($30), landlord payment ($300), and B reimbursement ($145)**. No cash was created from the object's estimated price. No actual permission, license payment, bank capital or donor consent exists.

An object can have simultaneous nonexclusive creative uses, but **never presume that lending, exhibition, photography, physical access or collateral are compatible**. Each counterparty and contract must independently approve compatible rights, safety, insurance and title. Avoid duplicate exclusive promises.

## Route 3: move the *creditor's satisfaction*, not the asset or money

This is the most unusual candidate, and it does not require borrowing or pretending the gold is liquid.

Suppose A needs $300 of rent relief.

Landlord L **voluntarily pre-agrees** to accept specific lawful electrical repair work as satisfaction of the $300 obligation. Electrician E agrees to provide it if filmmaker F delivers a genuinely valuable promotional video. Filmmaker F wants a documented photographic license to the remarkable object. Owner G agrees to license the image/story as a voluntary contribution.

```text
G --consented image/story rights--> F
F --completed promotional video----> E
E --safe, lawful electrical repair-> L
L --signed rent satisfaction ------> A
```

Notice that:
- no one moved or divided G's object;
- no one quoted a gold spot price;
- no digital metal-backed certificate was minted;
- no cash was required *from A*—indeed, the fictional example can clear with **zero cash transfers at all**;
- the actual proof, if ever attempted, would be **the creditor's agreed and legally effective discharge after the specified performances**, not a numerical market value.

This is a coordinated **multilateral barter/conditional obligation-satisfaction chain**, not a proven new form of currency. It must be arranged with careful **advance creditor agreement** and protections for the electrician and filmmaker before anybody performs. If L doesn't explicitly agree, **A still owes rent**. A's tenancy and legal rights are never waived by an AI calculation.

`satisfaction.mjs` models the source-defined rights/performances as a dependency graph and prevents fake shortcuts, actor impersonation within the fixture, duplicate fulfillment claims, a second exclusive license, absent creditor assent, circular dependencies, or software-authorized release of actual debt. Its maximal end state is `fully-simulated-noncash-creditor-satisfaction` while `legallyWaivedDebtCents` remains **0** until a future verified real-world implementation.

### Key novelty test

The **specific orchestration** may be a new product capability for Jubilee Treasury: turn a difficult asset into **a relationship anchor** and discover the *least risky*, consented path to satisfying a particular need, sometimes via noncash services, sometimes by licensed uses, sometimes via a legitimate institution. It is **not** scientifically established as a historically novel financial contract, and it's definitely not a perpetual-money loophole.

The distinction matters: trying to invent a new right against gold may just reproduce risky securitization or lending; **finding a willing, creditor-accepted chain of useful acts may make the financial instrument unnecessary.**

## Falsifiable controls

- **No independent source = no money.** Gold's mere presence cannot cause an actual landlord cash receipt.
- **No true owner/title or no lender = HOLD.** Asset-pledge simulations require independently asserted legal/assay/partner review; all test assertions are fictional.
- **No unbounded guarantee reuse.** `commitment-registry.mjs` locks the same risk capacity against multiple fictional campaigns and blocks overallocation. A called amount stays exposed until genuinely restored.
- **No beneficiary debt.** A's rent payment isn't an interest-bearing loan to A; if a guarantor can be exposed, that owner is a different consenting person with a real risk.
- **No made-up licensed value.** A sponsor's independently funded money is separate from object ownership. If the license has no buyer, no proceeds exist.
- **No creditor agreement = no relief.** Self-selected barter partners alone cannot force a landlord to accept service instead of money.
- **Never count social or environmental satisfaction as settled dollars.** Full triple-bottom-line improvements require actual post-fulfillment evidence from each affected participant.

## Code

Pure Node.js 22+, no dependencies:

```sh
npm test --prefix labs/penny-puddle-009
npm run demo --prefix labs/penny-puddle-009
npm run serve --prefix labs/penny-puddle-009
# Open http://127.0.0.1:8805/ locally on that same computer
```

- `anchor.mjs`: strict fictional angel/credit-partner/owner bounded-risk planning and conservative cash accounting.
- `commitment-registry.mjs`: capacity reservation and called-loss accounting, without reuse of the same pledged risk.
- `mosaic.mjs`: combines separately bought image license, rights costs, landlord payment, a donor, angel principal and standby; checks sources equal uses.
- `satisfaction.mjs`: dependency graph for explicit owner → filmmaker → contractor → creditor → beneficiary noncash satisfaction.
- `demo.mjs`: all three candidates, plus the no-independent-capital failure.
- `index.html`, `ui.mjs`, `server.mjs`: mobile-readable, loopback-only, no external browser requests.
- `test/`, `.github/workflows/penny-puddle-009.yml`: conservation, lack of magically generated cash, owner exposure, rights protection, consent, fraud/error holds, local-only smoke tests.

## What should happen next (not done)

Before any **real money or property**, use independent legal/financial review for ownership, gifts vs lending, secured interests, property/contract discharge, guaranteed financing, consumer protection, charity solicitation, labor licensing, tax and barter, creditor/tenant rights, KYC/AML where applicable, material safety, intellectual-property rights and insurance.

Don't upload a photo or location of a genuinely valuable object to a public discovery graph. Actual paid settlements must be separately witnessed through authorized payment partners; simulated performance receipts never become automatic financial or legal permission.

## References on known components

- [World Gold Council — gold deposit/lease and swap arrangements](https://www.gold.org/goldhub/research/gold-deposit-rates-guidance-paper).
- [LBMA — lending and borrowing gold, ownership/credit-risk distinctions](https://www.lbma.org.uk/publications/the-otc-guide/lending-and-borrowing-metal).
- [Federal Reserve Regulation 208.24 — standby letters of credit](https://www.federalreserve.gov/frrs/regulations/section-20824-letters-of-credit-and-acceptances.htm).
- [FDIC — standby guarantee credit/funding risks](https://www.fdic.gov/resources/supervision-and-examinations/examination-policies-manual/risk-management-manual-complete.pdf).
- [IRS — Tax Topic 420, bartering income](https://www.irs.gov/taxtopics/tc420).

**Bottom line:** A rare gold block is not, by itself, a new community currency. Its *rights, attention, separately backed downside capacity, and relationships with people who actually want something* could be connected into more valuable agreements without the block circulating. The unmet need—especially a creditor's satisfaction—is the thing to solve.
