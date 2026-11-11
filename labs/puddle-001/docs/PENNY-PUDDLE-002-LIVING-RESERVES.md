# PENNY × PUDDLE — 002: Living Reserves, One-Penny Campaigns, and Creative Returns

**Proposal / simulation only — no real reserve, escrow, currency issuance, money movement, like payout, custodial license, or platform integration exists.**

## The human problem

Three distinct failures overlap:

1. **Fragmentation:** someone's $3.58 spread across existing apps cannot be combined into one usable payment.
2. **Minimum viable gift:** someone wants to give one cent but modern payment rails can cost more than the gift.
3. **Distribution:** a creator's photographs, songs, useful answers, ideas, and local work generate attention and value, but little of that value returns to the person making them.

Build a *common micro-unit* of **one cent** and routes for the unit to be **backed, earmarked, aggregated, and eventually disbursed** without pretending every tap is a bank transfer.

## Four distinct planes

- **PENNY / backing:** a conserved 1-cent claim evidenced by an **actual verified U.S. penny in an accountable custodian's possession**, with issuance/redemption caps and public-safe audit receipts. Do not issue claims against photographs, guesses, pledged donations or unsupported custodial assertions. An **electronic-dollar reserve** is a separate class of backing, never mislabeled as an actual coin.
- **PUDDLE / routing:** determine where cents are, which ones can be spent, and which *authorized* settlement path—if any—can deliver the necessary amount. A displayed aggregate is not an authorized payment.
- **WELL / shared giving:** a funded pool where one person may voluntarily give one cent and another may request a cent, with explicit pool budget, anti-drain limits, steward permissions, audit receipts and refusal/appeal. For an initial pilot, approved transfers are merely simulated allocations, not a withdrawable balance.
- **CAMPAIGN / conditional completion:** a bounded need (e.g. $850 rent due on a date), a target, recipient/payee, deadline, permitted funding class, excess/failure policy and proof of actual disbursement. A sponsor may promise *one penny per valid like* up to a fixed budget, or a giver may contribute a penny from an actually funded reserve.

### Steemit lesson, not Steemit monetary mechanics

The original Steem/Steemit model paid authors **and curators** from an inflation-funded reward pool, using stake-weighted voting. That offered a real on-ramp for ordinary creators; it also incentivized bot votes, paid influence, and concentrated voting power. We should copy the **rewarding of valuable attention and discovery**, not an inflationary reward promise or wealth-weighted distribution.

Proposed difference:

- A like is a **signal** unless a named sponsor has already funded an earmarked microgiving budget. A normal unfunded like creates **zero cash value**.
- Sponsors cap sponsored likes at a fixed number of cents, with clear expiry and fund destination (creator, campaign or communal well). A hypothetical sponsor financing 1,000 eligible engagements must first supply enough real funds to cover $10 of **net** intended awards and any external costs.
- Payouts aren't forced into micropayment rails individually. Ledger movements may be recorded in cents and **batch-settled** by an authorized provider when reasonable.
- Curation recognition may use nonredeemable public reputation instead of claimable financial rewards. If curators are paid, that payment also comes from an explicitly funded budget.
- One person, one meaningful vote is a social aspiration, **not** a property a pseudonymous handle guarantees. Rate limits, anti-sybil, appeals, optional privacy-respecting attestations, attack simulation and limits on sponsor concentration are required.

## The campaign sequence

Example: a tenant has a verified (privately held) $850.00 rental obligation. The public campaign may show only `Rent due soon · Goal $850` and an approved payee routing commitment; no public landlord name, address, proof-of-poverty dossier or identifying invoice.

```text
CAMPAIGN_DRAFT -> VERIFIED_PRIVATE -> OPEN
             |         |
             |         +-- funded penny allocations (already backed)
             |         +-- ordinary donations (pledged / pending / settled are distinct)
             |         +-- sponsored engagement pennies (budget-capped, backed)
             |
             +-- optional direct institutional payment commitment by a sponsor

OPEN -> fully backed and eligible -> GOAL_MET -> HOLD_FOR_PAYEE_REVIEW
     -> payout requested to approved institution using authorized provider
     -> provider acceptance / settlement evidence -> COMPLETED
     -> separate recipient confirmation (if possible)
```

**A pledge is not a funded penny.** A card authorization is not settled funds. An internal ledger transfer is not an instant bank transfer. Goal threshold can be recognized instantly in *local accounting*, but bank settlement is only instant when a regulated payment partner actually guarantees or executes it. In any emergency, display the real deadline and realistic payout window.

**What if the goal fails?** Define explicit, consented refund-or-reallocation rules *before* launching. A campaign that can only succeed with the full amount should not silently convert unmet or expired donor intent into general revenue.

**Who pays the bill?** Prefer direct authorized payment to the landlord, utility or other named institution with a private verified invoice and reconciled external transaction receipt. If a payment fails, reopen a controlled resolution state; never show paid merely because a transfer was requested.

**Who owns funds?** A regulated partner or an independently authorized local legal custodian owns the real custody and escrow questions. A church or business can be a **proposed trusted steward**, but goodwill doesn't automatically authorize money transmission, custody, deposits or fiduciary escrow.

## Physical penny economics and public trust

One dollar physically backed by coins requires 100 pennies. A $1,000 rent goal requires **100,000 physical pennies**, about **250 kg / 551 lb** of 2.5g coins. This makes physical backing compelling for bounded local participation and auditing—not a reasonable default for mass rental settlement.

Even more relevant in November 2026: the U.S. Mint stopped producing circulating pennies in November 2025; existing coins remain legal tender. PENNY may steward existing circulating coins, but a growing universal digital supply cannot assume unlimited new coin supply.

We should **keep both asset classes visible**:

- **COIN-PENNY:** one actually held physical cent, earmark and redemption controlled by the named local custodian; can support a small local physical payout but must **not** be shown as electronic rent-payment money until independently converted/reconciled.
- **USD-CENT:** one cent in an actual permitted, reconciled dollar reserve or payment-provider account, possibly held for a conditional campaign; it is denominated in cents but **not** claimed to be backed by a coin.

A sponsor can choose to fund either lane, with appropriate constraints; never auto-convert one into the other. Real currency/redeemability, charitable fundraising and conditional transmission require provider/regulatory review. A separate support plan may cover fees, rather than deducting 25 cents from a 1-cent gift.

## Prototype contract — what to build safely

`penny-campaign.mjs` below is a small **offline, in-memory, fictional** conservation demonstration. It starts with invented numeric fixture reserves—**these are not verified real funds**. It permits internal 1-cent sponsor-to-campaign allocations, blocks spending more than the fixture reserve, distinguishes physical-coin claims from electronic-payee campaigns, and labels goal completion as **ready for external review**, not an actual disbursement. It does not provide users a digital wallet.

No live custody, bank authorization, donor payments, donor tracking, stored PII, KYB/KYC, charity compliance, tax treatment, transfer APIs, token minting, external escrow or financial intermediary is being built in this slice.

## Experiments to decide next

1. **10-cent well test:** With a fictitious locally funded ten-penny pot, see how much one-tap giving/taking can accomplish *without* platform payment calls. Model exhaustion, duplicate taps, bots and reallocation approvals.
2. **$8.50 campaign test:** Simulate 850 **backed** cent units arriving from known reserves, ensuring a click never invents money and the campaign never crosses its target.
3. **$850 rent test:** Model real-world external payout constraints; show `READY, NOT PAID` at goal and exactly which financial partner would have to send the amount.
4. **Steemit attack test:** Simulate sockpuppet creators, colluding curators, sponsor withdrawal, 1000-bot likes, and voting concentration before monetizing any engagement.
5. **Governance test:** Community church or business can sponsor and witness physical coins *only if it opts in and obtains legal/operational approval*; individual beneficiary identity and invoice remain confidential.

## Success metric

Not `token value`, market cap or engagement count.

**How many extra *real-world payments* become possible, at what net delivered amount, what cost to the whole system, and without putting the poorest participant at fraud or financial risk?**

That is the useful crossing: **PENNY makes a penny accountable, PUDDLE makes it find a useful destination, and a sponsor-funded social interface makes it effortless to aim that penny.**

## External evidence to verify against (snapshot Nov. 11, 2026)

- U.S. Mint announcement: https://www.usmint.gov/news/press-releases/united-states-mint-hosts-historic-ceremonial-strike-for-final-production-of-the-circulating-one-cent-coin
- Steem original economics: https://github.com/steemit/whitepaper/blob/master/whitepaper.md
- Empirical abuse/decentralization study: https://arxiv.org/abs/1904.07310
- Steem/TRON governance study: https://arxiv.org/abs/2407.17825
- FinCEN cryptocurrency / money transmission guidance: https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-certain-business-models

**Source separation:** Existing PENNY branches in Jubilee Treasury describe physical receipts, local participation and speculative reserve architecture; proposals and unmerged branches are **not evidence of a live treasury, coins actually in custody, or public funding authorization**. This document is another explicit proposal, not a replacement for those designs.
