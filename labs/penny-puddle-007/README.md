# Jubilee Treasury × PENNY × PUDDLE-007 — MAKE A GOOD DEAL

**Economic goal:** discover, compose and *help people voluntarily agree to good exchanges*, rather than maintain one globally changing exchange rate or maximize what the marketplace extracts from participants.

**Status:** executable experimental **synthetic planning** only. Nothing in this branch is an authorized transaction, loan, asset lien, collateral pledge, legal lease, financial service, personal financial recommendation, escrow, investment, cryptocurrency, insurance or payment. All money, values, assets, permissions and people are invented fixtures. This branch remains stacked on PUDDLE-006 and separate from Jubilee Treasury main.

## Two ends of the same problem

We have explored:

- **PENNY:** tiny fragments too economically insignificant or expensive to use individually; aggregate responsibly and match to a legitimate purpose.
- **PUDDLE:** cents scattered across accounts; propose provider-permitted and consented paths into actual spendability, not imaginary transfer abilities.
- **WORTH TO WHOM?** A nonrare object may be meaningful to one willing counterparty; find mutual consent instead of a universal speculative price.

The next symmetry:

> Some assets are *too large, specialized, indivisible, valuable, or inconvenient* to be useful as a single transfer.

A community kiln can be too expensive for any one aspiring artist to buy. A large venue has idle hours, even though the building cannot be sold in pieces. An extraordinary "table-sized block of gold" may be enormous **if it exists, genuinely belongs to someone, is what the owner claims, can be lawfully transported, and has a verified buyer**. Until those facts are established, claiming instant spendable liquidity or a secure borrowing limit would be fiction.

**The design principle: separate the value of ownership from the value of access, use, transport, processing, discovery, stewardship and people making agreements.**

## Four ways to unlock big assets, before money transmission

1. **Separate use from title.** The kiln owner may voluntarily grant a particular firing slot, with conditions and compensation. Participants retain rights; conflicts and simultaneous use reservations are considered. Owner gets use fees or another agreed good; someone else gets access without buying the kiln.
2. **Split access in time or functionality instead of splitting property.** A single building can host different events at different times; one industrial machine can serve different small makers. This is not fractional ownership or a security.
3. **Create a contingent real service market.** Moving, storing, inspecting or preserving property are separate jobs; pay workers from authorized service contracts, not from invented collateral yields.
4. **Only then contemplate financial liquidity.** Legitimate sale, loan secured by verified collateral, joint acquisition, deposit into lawful custody or physical subdivision may be appropriate in some circumstances, **but are separate legal and technical pathways**, requiring verified owners, real valuation, counterparties and protections. The tool does not mint shares in gold or issue tokens on its appraisal.

## DEALWEAVER: an enabling layer, not a compulsory market maker

A user's intended trade has several distinct dimensions:

```text
OWNER: What can I spare without being worse off?
NEIGHBOR: What would actually help me?
BOTH: What concrete terms can we each freely accept?
COMMUNITY: Does the proposal improve access and relationships?
EARTH: Does it reduce waste or ecological cost, backed by evidence?
RAILS: Is any actual payment / transport / service permitted and executable?
```

### Enabling, not extracting

`dealweaver.mjs` accepts explicit synthetic participant preferences, ownership, an asset's **limited access windows**, proposed bilateral uses, and three *separate*, bounded assessment dimensions:

- **Individual/financial** — **each** involved participant has positive *self-declared* net benefit. A net-negative owner cannot be overridden merely by a large sum of others' benefits. The module refuses permission-denied deals.
- **People** — a reported community outcome signal, with its source label and explanation, not automatically monetary income or independently measured social impact.
- **Planet** — a separately reported environmental outcome signal, likewise evidence-labeled. We cannot say shared tools save emissions without measurements and a meaningful comparison.

It explores compatible **bundles** and reports Pareto-nondominated proposals. It intentionally **does not choose a "winner" for people**. When options trade off between stakeholder gains, social and environmental dimensions, all relevant options remain on the frontier for people to discuss.

Individual scores are ordinal, from each fictional participant, and **are not interpersonally calibrated utility**. An equal numeric score assigned by two different people does not establish equal welfare. Likewise the human and environmental impact labels remain *scenarios*, not outcomes.

One asset/slot cannot be allocated twice. A kiln's Saturday morning and Saturday afternoon slots can both be proposed, but conflicting Friday evening uses of the same hall cannot simultaneously be matched.

**The negotiation itself is the product:** surfacing compatible options, asking about conditions, giving each party a refusal path, recording conditions to be independently confirmed, and checking whether the final bargain was mutually considered worthwhile.

## Reconceiving the "large gold block" as a rights graph

`asset-doors.mjs` offers exactly **questions**, not an evaluation or lender approval:

| Door | Nature | Limits |
|---|---|---|
| Preserve and document | Knowledge without exchange | Owner permission, private evidence |
| Exhibit or license limited use | Service/use opportunity | Legal title, terms, insurance, genuine counterparty |
| Whole-object sale | A specific counterparty transaction | Actual title, buyer, safe transfer, settlement |
| Consenting buyer group | A possible co-purchase arrangement | Property structure, securities and legal review |
| Lawful physical division | Potentially smaller independently owned pieces | Assay, processing, tax and environmental costs; may destroy value |
| Collateralized loan / fractional claim | Higher-risk finance | **BLOCKED** without a real authorized lender and independent legal review |

In the test fixture, title and composition are unverified and the supposed owner wants to retain title: sale and financing remain held or blocked. No invented gold spot quote or tokenized ownership emerges.

The U.S. SEC has specifically explained that tokenization does **not** make a security cease being a security. A digital share or claim could be a regulated investment depending on the structure; this isn't a loophole. Source: https://www.sec.gov/newsroom/speeches-statements/corp-fin-statement-tokenized-securities-012826-statement-tokenized-securities

Secured lending can expose the owner's property to loss. See the CFPB on pledged/pawn property and risk: https://files.consumerfinance.gov/f/documents/201605_cfpb_ymyg_toolkit-legal-aid.pdf

## PRINCIPAL ONLY — an explicitly funded zero-interest bridge

This is a **different financial instrument from shared asset access**. `principal-only.mjs` demonstrates:

- a fictional $50 spendable pool,
- a voluntary $30 principal allocation for a specific essential repair,
- a hypothetical $12 principal repayment, leaving $18 remaining,
- **zero interest, zero borrower fees, zero late fee, no automatic rolling debt**, no interest compounding,
- a distinct sponsor-funded reserve for administrative expenses and losses,
- explicit review of repayment capacity, and write-off paths that acknowledge real economic losses instead of inventing repayment.

The model **never treats a pledged gold object as automatic collateral** and never gives debt collection powers. Defaulted principal actually reduces the fictional pool; a pre-funded loss reserve can only replace it **up to the reserve's balance**, at its sponsor's expense. If no sponsor can bear default/servicing costs, **a zero-cost loan is not economically free**. It may be better to offer a grant, donated use of an asset, payment-plan negotiation, or no debt at all.

This isn't impossible in practice: Kiva U.S. currently facilitates **zero-interest, zero-fee, no-collateral business loans** for eligible U.S. entrepreneurs, although its requirements and fundraising process apply. It does **not** offer these as an instant general-purpose household rent solution. Source: https://www.kiva.org/borrow ; https://help.kiva.org/s/article/How-do-I-apply-for-a-personal-loan-1611075993334

For a lawful field trial, collaborate with a qualified nonprofit loan fund, credit union, mission-focused CDFI or other appropriate lending organization rather than publicly pooling people's funds and initiating loans through an experimental ledger. The U.S. Treasury says CDFIs include loan funds, banks and credit unions offering affordable community finance. Source: https://www.cdfifund.gov/faq

**Zero interest is not inherently a legal exemption** from lending, consumer protection, charities, or money-services rules. Jurisdiction-specific financial and tax review is required, including any low/below-market loan tax consequences. Minnesota Commerce discusses licensing and short-term loan compliance here: https://www.commerce.mn.gov/commerce/money/consumer/banks-credit/

## Important accounting boundaries

| Unit | What it truly denotes | What it does not do |
|---|---|---|
| Signed/consented proposed deal | A candidate mutual bargain | Does not authorize legal possession or financial transfer |
| Access slot | A proposed temporary right to use something | Not fractional title or a tradable security |
| Noncash barter | Goods/services actually delivered between parties | Not an automatic currency or tax exemption |
| Repayable principal | A defined future obligation if a lawful loan actually occurs | No interest-free credit is magically created |
| Sponsor/admin/loss reserve | Separately funded donated coverage in a lawful program | Cannot be spent without actually settled funds |
| Large collectible/gold asset | Unique physical property with ownership, risk and handling | Not bank liquidity, not a guaranteed appraisal, not fungible PENNY collateral |
| Successful PUDDLE settlement | Real funds available through permitted partner rails | Not identical to a proposed quote or an internal ledger event |

The IRS states that bartering may be taxable even without a cash payment, and certain barter exchanges may have reporting obligations. No bartering tax exemption is asserted here: https://www.irs.gov/taxtopics/tc420

## Implemented slice: local, bounded, deliberately fictional

The modules are isolated under `labs/penny-puddle-007/` and do **not** change existing Jubilee reserve accounting:

```sh
npm test --prefix labs/penny-puddle-007
npm run demo --prefix labs/penny-puddle-007
npm run serve --prefix labs/penny-puddle-007
# Open http://127.0.0.1:8803/ on the SAME computer
```

Node 20+ and no dependencies or external calls.

- `dealweaver.mjs`: declared participant benefits, permission-aware deal screening, time-slot collision detection, bounded exact compatible bundle search, four-axis Pareto frontier (min individual gain, total gain, social signal, planet signal).
- `asset-doors.mjs`: owner-controlled huge-asset utility/financial options. No quote, custody, title, token or bank access.
- `principal-only.mjs`: principal-reserve and risk reserve conservation; zero percent APR and fees in a synthetic model; explicit no automatic repayment.
- `demo.mjs`: composed sample, including PUDDLE-006 grade-optional direct meaningful exchange.
- `index.html` and `ui.mjs`: mobile browser demo; `server.mjs`: loopback-only, CSP with external connections blocked.
- `test/`: refusing coerced/owner-negative deals, no double booked time, protected asset title, distinct people/planet signals, no fictional gold collateral, principal-only lending conservation, default losses, fee funding and local server boundaries.

### Not claimed

This isn't a new bank, insurance product, instant financial network, legitimate loan contract, validated valuation formula, calibrated social benefit measurement, operational marketplace, asset fractionalization protocol, sound loan-underwriting decision, smart-contract escrow or deployment to public internet.

## Why this belongs inside Jubilee Treasury

Jubilee Treasury should not be confined to making scarce money circulate. It can become **the place where economic relationships are made mutually viable**.

The smallest resources are saved through *composition*.
The largest resources are unlocked through *appropriately limited access*.
Money is used **only when the deal actually requires money**.
And debt is proposed only when it provides a genuine improvement over grants, access or cooperative arrangements, with an independently funded bearable loss structure.

> **Don't optimize the exchange rate. Optimize the possibility of two people actually coming away better off.**

### Next validation frontier

Predeclare synthetic scenarios where Pareto maximization can mistakenly prefer a deal with one-sided domination or hidden negative ecological impacts, add fairness/dispute and veto tests, collect explicit mutually chosen deal terms without estimating people's psychological spending ceilings, and conduct a paper-only cooperative pilot before any actual asset, debt or liquidity execution.

The goal isn't maximum asset turnover or a new speculative token. It is **additional independently verified useful work, lower coordination costs, participant-reported satisfaction, avoidable waste reduction, and genuine financial resilience**.
