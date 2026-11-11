# PUDDLE-001 · Every Cent Counts

**PENNY × PUDDLE — a strictly noncustodial, local-first experiment inside Jubilee Treasury.**

**Question:** If a person has money in several existing accounts but cannot use the individual balances for an ordinary purchase, how can technology make their existing cents more useful without adding transfer fees?

**Current answer:** This prototype **does not pool or transfer funds**. It computes whether a hypothetical purchase can be paid by one **user-declared eligible** spending method or by several methods **only when the merchant confirms split tender**. It reports inaccessible value and refuses to imply that multiple wallet balances can be spent through one card.

## Run (Node.js 20+, no dependencies)

```sh
cd labs/puddle-001
npm test
npm start
# Open http://127.0.0.1:8798
```

The browser form is mobile-first and local to the machine running it; the server binds to loopback and uses no external services, cookies, analytics, stored balances or credentials. Do not deploy it as a real financial service. The demo values are fictional, and the browser keeps entries only in current page memory. `planner.mjs` is independently tested using Node's built-in test runner.

### What the calculation means

- Enter **reported cents** per source and explicitly indicate whether each can **really be used for this merchant**. Having a wallet balance does not imply having a debit card or merchant acceptance.
- If one eligible source covers the price, display a one-method candidate.
- If combined eligible sources cover the price but no single source does, show a split **only when `allowsSplitTender` is explicitly true**; otherwise classify it as blocked by split support.
- If accessible funds fall short despite aggregate wealth, report the difference. If aggregate wealth falls short, report that instead.
- No price of money, fee, transfer speed, account connection, advance, merchant acceptance or bank/card authorization is inferred.
- Numerical amounts are **integer cents**. We explicitly reject fractional cents, negative amounts, duplicates and precision overflow.

### Separations we must preserve

- **PENNY ≠ deposit balance.** PENNY's older work models conserved verified-cent claims subject to physical backing, custody and independent admission. This application only interprets self-reported ordinary account balances. It does not issue PENNY claims, create reserves, imply FDIC insurance, or convert points into currency.
- **Aggregate display ≠ unified spendable balance.** Total cents are not a promise that any merchant will let the customer use them all.
- **Proposal ≠ authorization ≠ settlement.** This system never reads credentials, calls payment providers, moves money or initiates transfers.
- **Free to user ≠ costless settlement.** A future bridge might subsidize fees or liquidity, but requires authorized financial partners, funding, controls, consumer protection and review.
- **Consent ≠ platform permission.** A user consenting to a transfer doesn't authorize an unofficial transfer API or violate a provider's agreement.

### Design options to investigate, NOT present as working

1. **Routing:** Research permissible provider APIs, account verification, data permissions, issuer restrictions, merchant split capabilities, processing costs and real-time rail support. Do not promise Venmo/Cash App interoperability.
2. **Liquidity matching:** Model multi-party netting with conservation of funds and independent consent. The naive cross-platform swap is non-atomic; include fraud/chargeback exposure, risk of account restrictions, identity/AML obligations and likely money transmission analysis before any live pilot.
3. **Funded bridge:** A regulated financial partner or properly structured sponsor could temporarily front a purchase and settle through permitted slower rails. This is credit/liquidity provision, not mere routing; reserve, defaults, loss allocation, disclosures, legal review and economics are prerequisites.
4. **Interop research with reLATTE:** Potentially carry proposal and consent receipts across systems, not balances, tokens or financial authority. Do not silently graft into another project's ledger.

### Acceptance criteria for next stage

- Obtain actual merchant payment capabilities (including split tender and minimum tender) with source evidence, never assumptions.
- Quantify per-route costs, delays, limits, failure modes and trust boundaries for each provider.
- Separate observed funds, pending funds, holds, available-to-spend and verified settlement in the model.
- Threat model privacy, fraud, duplicate spends, chargebacks and replays before connecting to accounts.
- Measure whether any mechanism can actually help a $0.50–$5 user without costs exceeding benefit; disclose who pays the residual costs.

**Status:** PUDDLE-001 is an isolated, synthetic feasibility tool. No API integrations. No deployed card, cash exchange, settlement provider, fund custody, or actual payment capability. Existing Jubilee Treasury project authority and PENNY custody rules remain untouched.
