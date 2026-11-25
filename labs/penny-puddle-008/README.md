# PENNY × PUDDLE-008 — ANGEL CIRCLE / REPLENISHMENT CERTIFICATE

**Core idea:** A person pays an urgent bill in full immediately, while the *story of that help* remains open to voluntary donors who may reimburse that person or build a community pool for the next need. The original recipient never owes repayment. Not every like creates a penny; only an independently pre-funded like uses real earmarked value.

**Status:** executable **fictional** demonstration, not operational crowdfunding, charity, lending, payment processing, a loan instrument, guaranteed repayment, investment return, financial custody or tax-deductible donation scheme. Every payee receipt, sponsor payment, need check, identity, donor fund, like and settlement in this branch is fictional.

## What is this? What isn't it?

A person A has a verified, urgent $300 rent need. Angel B has $300, can cover it immediately, and chooses to pay the **payee** directly through an independently verified lawful mechanism (future). That resolves the bill. A does **not** owe B $300, pay interest or sign a debt. We deliberately model this as an **angel-funded cause with optional third-party replenishment**, not a microloan to A.

B receives a **nontransferable impact attestation / PUDDLE certificate**, containing:
- the cause and what was actually paid in the idealized external workflow,
- its funding history and a limited ceiling on voluntary *donor-funded* replenishment,
- whether subsequent donors chose to replenish B or benefit the **next community need**,
- B's voluntary future choice to pass received replenishment into the common pool.

**This certificate is not a token with cash face value, evidence of a debt, negotiable payment claim, security, insured deposit, legal tax receipt or ownership right over A's need.** No guaranteed repayment exists and no recipient obligation is issued.

### The important semantic change once rent is paid

Once the landlord has been paid, the fundraiser must NOT continue saying **"donate to pay A's rent"** as though the rent remained unpaid.

It must say something like:

> **A's urgent rent has been covered by Angel B.** Help make generosity repeatable. You may voluntarily direct your contribution to **(1) reimburse Angel B's documented outlay, up to $300**, or **(2) fund the next community need**. Angel B may separately donate any reimbursement they actually receive back into the pool. Every destination is explicit before you donate.

This is a continuing social *story and provenance record*, but the underlying financial obligation has changed. A donated dollar must only follow the donor's chosen purpose. It cannot simultaneously reimburse B and enter the community pool, and cannot pay a now-closed rent bill again.

## Three versions that must not be conflated

1. **Gift-forward:** B covers the rent permanently. New donors contribute **only** to the next community reserve. B has no reimbursement expectation. This is the cleanest community-pilot route.
2. **Optional sponsor replenishment:** B covers the rent, donors knowingly contribute toward **reimbursing B** for that completed expense, capped at the actual sponsor outlay, with **zero interest and no guaranteed payout**. There is no debt for A. Recipient reimbursements can raise separate private-benefit, crowdfunding, tax and payment-law questions; choose lawful organizational structure and transparent disclosures before collecting anything.
3. **Replenish and recycle:** Donors reimburse B, then B voluntarily makes a separate new contribution to the larger pool. That **second transfer must actually occur and have a receipt**; the platform cannot assume B will recycle money or claim it as an existing community reserve before it's paid.

An alternative is for B to explicitly waive any opportunity for reimbursement and direct future support to the common pool, in which case those new donations remain donor-consented support for future needs. Each option is valid only if the actual payment partner and campaign terms permit it.

## The accounting invariant / no perpetual-money loophole

If B covers **$300**, and later third parties donate **$300**, those are **two distinct sources of $300**. There can be $300 of completed rent relief and $300 of next-community capital *only if the later donations truly reached that fund*, or B was reimbursed and **subsequently donated the same $300** back.

There is no automatic doubling, compounding interest, balance-backed coin issuance, debt against A, or beneficiary-funded repayment. The network can **compound reach and willingness to participate**, not money without new sources.

The synthetic conservation receipt asserts:

```text
angel payee outlay + cash from later donors + funded sponsor-likes
  = payee help completed
  + angel reimbursement still retained
  + money presently in the future-community pool
```

The model rejects duplicate transaction IDs, reimbursement beyond unrecovered/unwaived principal, recycle attempts exceeding reimbursements already received, unfunded likes that claim cash, and repeat likes by the same asserted identity. **A name or actor ID is not proof of a unique real human.** Production would need anti-Sybil safeguards, fraud review and valid payment receipts.

## What the sample actually does

The default reproducible demonstration (all invented):
- A $300 rent requirement is reviewed and marked **paid by Angel B**.
- Donor D directs **$120** toward replenishing Angel B.
- Donor E directs **$30** toward a new community pool.
- One unfunded endorsement **generates 0¢**.
- One one-cent sponsor-funded like consumes **1¢** of an *independent* precommitted 5¢ marketing budget for the community pool.
- Angel B voluntarily recycles **$70** of their $120 fictional reimbursement into the community pool.

Result: **$300 bill addressed**, **$50 retained by B**, and **$100.01 available for future help within the *fictional* ledger**, all funded by **$450.01 of separate modeled outside sources**. A owes **$0**, and **real funds moved are $0**.

The example deliberately does **not** assert an actual certificate, tax receipt, insured bank account, payment transaction, obligation to B, authentic landlord receipt or community pool.

## Social amplification without reward inflation

B may have social reach and choose to share the *verified story*. That can help bring in real donors, but it doesn't automatically turn a like into money. A sponsor may fund a separate pool (e.g. $10 = 1,000 possible one-cent funded engagements) with consent and safeguards. Each funded interaction debits exactly one precommitted cent and routes it to a **clearly disclosed** recipient reserve. A click not backed by an existing sponsor budget is only social attention.

A social profile, public badge, certificate or reputation score **must not** become a transferable profit claim. Helping one person is not permission for wealthy participants to purchase governance, financial entitlements, influence over the recipient or exclusive campaign ownership.

## Source-owned implementation

Node 22+ and no npm dependencies:

```sh
npm test --prefix labs/penny-puddle-008
npm run demo --prefix labs/penny-puddle-008
npm run serve --prefix labs/penny-puddle-008
# Open http://127.0.0.1:8804/ on the SAME computer
```

- `angel-puddle.mjs`: conservative state machine from modeled independent need review → modeled payee receipt → immutable nontransferable history certificate → donor-explicit designation → optional sponsor recycling or waiver → sponsor-funded like bank → conservation-checking read-only snapshots.
- `demo.mjs`: an end-to-end $300 synthetic relief cycle with sponsor recovery and a community fund.
- `index.html`/`ui.mjs`/`server.mjs`: mobile-friendly loopback-only interactive proof, zero external requests and no credentials.
- `test/`: recipient no-debt assertions, designated donor routing, double-payment prevention, capped reimbursement, optional recovery waiver, separate sponsor-like pool, identity-ID replay, source conservation and local-only module routes.
- `.github/workflows/penny-puddle-008.yml`: independent CI regression.

## Hard gates before real-world pilot

**Need / payee:** Protect A's privacy. Obtain A's voluntary participation and lawful authority to pay the bill, confirm the actual obligation with the landlord/provider without disclosing A's private information publicly, verify amount and avoid disbursement to impostors. A landlord payment can have eligibility, assistance-program, or legal consequences that need assessment.

**Sponsor:** Genuine external settlement evidence and a capped outlay; no personal debt for A. A sponsor should not automatically gain publicity, repayment priority, resale rights, governance weight or claims against a person's story. Allow public anonymity if appropriate.

**Donors:** Explicit destination and fees shown *before payment*. Refund/return pathways, chargebacks, donations beyond caps, platform insolvency, duplicate charges and anti-fraud controls. New donors must understand that rent was **already paid** and that they may be reimbursing an individual rather than contributing to a recognized charity. Contributions to a named individual are usually not tax deductible.

**Community fund:** Its own governed stewardship, ledger, bank/custodian settlement, donor restrictions and beneficiary selection rules; cannot silently spend restricted reimbursement donations on the next campaign. Not an insured deposit until an actual qualifying banking arrangement exists.

**Regulatory:** Different structures (individual benefit fundraiser, charitable general reserve, third-party reimbursements, trustee/custodian, loan, payment service) have different tax, charity, financial-services and consumer protections. A nontransferable receipt does not bypass those. Minnesota's Attorney General explicitly distinguishes aid to **named individuals** from general charitable crowdfunding and stresses that fundraiser proceeds must be used for the promised purpose. IRS says tax treatment of crowdfunding depends on facts and records; gifts to individuals are not necessarily tax-deductible charitable contributions.

## Reference reading

- [Minnesota Attorney General: Raising Funds to Help Named Individuals](https://www.ag.state.mn.us/charity/RaisingFundsNamedIndiv.asp)
- [Minnesota Attorney General: Raising Money for a Charitable Cause](https://www.ag.state.mn.us/Consumer/Publications/RaisingMoney.asp)
- [Minnesota Attorney General: Crowdfunding Websites](https://www.ag.state.mn.us/Consumer/Publications/Crowdfunding.asp)
- [IRS: Crowdfunding may be taxable / gift classification](https://www.irs.gov/newsroom/money-received-through-crowdfunding-may-be-taxable-taxpayers-should-understand-their-obligations-and-the-benefits-of-good-recordkeeping)

## The real hypothesis to test

Can paying someone's urgent bill quickly and keeping their completed cause visible **produce more independent donors, lower delays, more meaningful matches and a more resilient community reserve** than an ordinary fundraiser that merely closes on reaching a target?

Measure with independent evidence: time from request to actual creditor receipt, consent quality, direct assistance delivered, real donor trust, lawful donor-restricted disbursements, repeat sponsors, complaints, risk and charges, repeat cycles funded from *new actual contributions*, and outcomes for the person helped. No synthetic run proves these outcomes.

**Do not confuse:** angel-paid relief, optional third-party reimbursement, debt to an individual, volunteer gift, donor-restricted charitable fund, certified donation, or a transferable financial claim. They are not the same thing.
