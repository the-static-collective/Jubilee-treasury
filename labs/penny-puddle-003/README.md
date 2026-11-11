# PENNY × PUDDLE 003 — Proof of Custody, Useful Work, and Network Weaving

**Status, 2026-11-11:** working **synthetic, noncustodial experiment**. None of the mock balances, custodian deposits, reserves, role attestations, confirmations, compensation, netting instructions or transfers are real. No external financial institution is integrated and no money is held, issued, advanced, paid, escrowed, lent or redeemed.

## What's new

The proposal joins three ideas:

1. **PENNY BANKS**: small local stewards (potentially a participating church, business, or other authorized operator) physically count, store, audit and facilitate appropriate recirculation of pennies. People might earn fees **for that useful work**, funded by an actual sponsor or service contract—not by inventing new PENNY backing or paying unsupported stake yield.
2. **PUDDLE WEAVER**: people hold cents stranded across existing payment apps and banks. A constrained route optimizer asks which permitted paths, time windows and costs could make those cents **spendable at one destination**, without pretending that Cash App, Venmo, a bank card and FedNow have a common consumer API.
3. **NETWORK COMPOSITION**: after explicit permissions, a future **regulated or otherwise authorized clearing partner** could collect permitted external settlements, net obligations and pay a larger bill, potentially reducing the number of expensive external movements. Mathematical offsetting alone does not change anyone's provider balance.

## Run locally

Requires **Node.js 20 or newer** and zero dependencies.

```sh
npm test --prefix labs/penny-puddle-003
npm run demo --prefix labs/penny-puddle-003
npm run serve --prefix labs/penny-puddle-003
# Open http://127.0.0.1:8799/ on the same computer
```

The demonstration runs an invented $3.58 example split into $0.58 wallet B, $1 bank, $2 wallet A and asks about a $3.25 purchase.

- **Within 30 minutes**: fictional instant routes charge a **hypothetical flat 25¢ per wallet**; the model has insufficient net value to reach $3.25. The optimal simulated result is $3.08, a 17¢ shortfall, despite $3.58 of nominal ownership.
- **Within 72 hours**: fictional standard routes charge zero fees, and the model can deliver $3.25. That does **not** guarantee free cash-outs at those minimum amounts or that any provider will approve the transfer.
- **Funded bridge** (future separate model): someone else fronts the required cents, with consent and a real financial partner, before delayed replenishment; the advance's credit/loss/economic structure **must be established first**.

The module `weave.mjs` uses exact-cent dynamic programming over at most six sources and twelve modeled **direct-to-destination** routes, with one route per source. It rejects overcapacity sources, invalid fee definitions, unsupported routes, nonconsented scenarios, and paths past the spending deadline. It does not solve unrestricted multi-hop cash movement, real compliance or API orchestration. Every output states `providerExecutionAvailable:false` and `settlementCompleted:false`.

### Why "network weaving" matters

Account balances and transport capabilities form a graph:

```text
                [wallet A 200¢] -- fee / delay / consent --> 
               /                                          \
PERSON ------ [bank 100¢] ----------------------------> [spendable destination]
               \                                          /
                [wallet B 58¢] -- fee / delay / consent -->
```

At the proposed next stage, permitted banks/issuers/service providers would attach verified capability passports to each graph edge: minimums, limits, supported transaction type, timing distribution, fee payer, per-transaction fees, return/reversal behavior, KYC/AML jurisdiction gates, risk and source authorization. **Absence of an approved edge means no transaction.** People do not expose passwords or private bank data to an open graph.

### Real-time is a property of a *particular rail*

FedNow and RTP connect **participating financial institutions**, not arbitrary Venmo/Cash App wallets via an automatically available consumer interface. Consumers cannot directly issue FedNow orders through this repo. A bank participating in FedNow can matter at the **final leg**, but the money must first reach that bank through a valid, permitted source-specific path. A provider's partner bank does not mean the fintech app provides transferable FedNow access to every user balance.

A transfer request, debit-card authorization, ACH settlement, booked ledger credit, and irrevocable final payout are different events.

### Batch netting / reciprocal networks

`batch-net.mjs` calculates a fictional **zero-sum liability offset**, for example:

```text
A owes B: 50¢
B owes C: 50¢
Mathematical net obligation: A owes C 50¢
```

It produces *no actual transactions*, even if the test claims everybody consents. Live netting would require participant contracts, bank or regulated-provider authority, correct settlement legal character, trust and insolvency treatment, consumer protections, anti-fraud and correct handling of returns. No third-party wallet balance is redirected by a ledger equation. Do not use opportunistic crowdsourced cross-app swaps as an unprotected escrow service.

### PENNY BANK — proof of custody, not automatic proof of stake

"Proof of stake" is a helpful metaphor for a participant putting resources at risk to protect the network, but **one coin sitting in a box does not generate cash yield**. If there are 100 physical pennies, the maximum *coin-collateralized* penny claims are 100 cents, not 100 plus interest.

Proposed steward duties:
- verify and log intake and outtake of *actual* coins, with witnessed counts, custody location, theft/loss reporting and periodic independent reconciliation;
- provide safe physical access, packing/transport and legitimately authorized coin recirculation to participating local shops;
- service reviewed physical-cash requests, preserve privacy, keep custody separate from campaign disbursement authority;
- get a transparent service stipend only from an independent **funded sponsor/fee budget**, never from a claimed stake inflation rate;
- optionally post a separately approved performance bond, but never confiscate someone's coins or slashed stake without clear lawful authority, dispute process and review.

The current `penny-bank.mjs` simulates witnessed batch counts (two asserted witness IDs), capacity limits, no double-encumbrance, budget-capped service awards, and freeze on loss. **These are not real eyewitness verification.** A real system would require authentication, legal custodial status, secure storage, independent counting/audit, provenance and reconciled bank records.

A $1,000 campaign backed solely by existing 2.5g circulating pennies needs 100,000 physical coins (~250 kg). That mass creates a **real job in logistics but also a real loss-producing cost center**. Physical backing is attractive for small local reserve circles and deliberate civic participation; the plan for large electronic bills should ordinarily involve separately backed USD-cent balances with an authorized payment partner. Never silently swap the two backing classes.

## Work, rewards, and anti-capture

Steemit proved creators can earn from attention. The lesson for PENNY is not to mint coins for likes. A sponsor could fund $10 of approved social microgrants, at most **1,000 one-cent awards**, and allocate them by human-reviewed useful contributions. A "like" merely proposes where a preexisting cent goes; an unfunded like is a nonmonetary social signal.

Likewise, a penny bank gets paid for **measurable custody/transport/reconciliation service**, not just holding extra coins or convincing participants to lock funds for an APY. Simple pay-to-stake reward formulas risk incentivizing hoarding and fake reserves.

Any live program should simulate collusive stewards, duplicate deposits, forged witness attestations, lost coin bags, service-award replay, blocked accounts, account restrictions, insolvency, counterfeit/provider-return risk and disproportionately high per-cent payment costs.

## Conservation and settlement laws

| Class | Unit | Evidence | Can it directly pay rent? |
|---|---|---|---|
| COIN-PENNY | physical coin | verified possession, recounted coin claims | **No**, not without separately arranged deposit/exchange and institution payout |
| USD-CENT | funded electronic reserve | actual provider/custodian settlement receipt | **Maybe**, with authorized payment route |
| PLEDGE | promised donation | uncollected commitment | **No** |
| LIKE | social attention | action event | **No**, unless sponsor already funds a reward |
| STEWARD AWARD | service compensation | contractual budget and completed service | **Only** when actually paid and available |
| BRIDGE | advance/liquidity | regulated/partner funded disbursement and repayment terms | **Only** if real reserve & legal payout executed |

Guardrails: `proposal ≠ authorization`, `authorization ≠ settlement`, `coin counts ≠ real verified coins`, `human attestations ≠ independent proof`, `sponsor budget ≠ coins minted`, `ledger netting ≠ bank transfer`, `sponsor-backed prepaid allocation ≠ insured deposit`, `proof of custody ≠ risk-free yield`.

## Product milestones after these simulations

1. **Source-owned capability matrix**: direct public documentation from each provider for minimum cash-out, supported transfer routes, limits, fees, settlement/returns and API permissions. Verify carefully when provider pages disagree; test only authorized sandboxes. An identity-linked source balance is private and requires explicit user permission to import.
2. **Simulation with adversaries**: dispute, stolen coins, false attestations, compromised steward, race between competing earmarks, duplicate sponsor awards, failed payment, donor refund, frozen wallet, 100,000 bot likes.
3. **Participation pilot**: paper-only and voluntary, sponsor-funded, nonredeemable social credit/candidate allocations with real human stewards; no token issuance or cash custody without approval.
4. **Licensed partner exploration**: one institutional bank/credit union/processor and one participating institution for a **funded** microgrant or recipient-directed payment. Document permissible money transmission, redemption and charitable/escrow structure before pilots.
5. **Penny bank economics**: `net steward value = authorized service revenue + sponsors - coin handling - transport - insurance - security - reconciliation - bank processing`. Unless positive, the role is a community volunteer service, not a sustainable paid job.

## Research sources / status as of Nov. 11, 2026

- U.S. Mint final circulating cent production, Nov. 12, 2025: https://www.usmint.gov/news/press-releases/united-states-mint-hosts-historic-ceremonial-strike-for-final-production-of-the-circulating-one-cent-coin
- U.S. Mint penny specs, weight 2.5g, no general melting: https://www.usmint.gov/news/media-kit/penny
- Federal Reserve announced penny deposit acceptance and all FedCash terminals fulfilling penny orders as of Nov. 9, 2026 (for authorized financial institutions, *not direct consumer access*): https://www.frbservices.org/resources/financial-services/fedcash-services-resources/fedcash-frequently-asked-questions/penny-order-deposit-information/
- FedNow participating banks and approved service providers: https://www.frbservices.org/financial-services/fednow-service/fednow-service-participants-service-providers/
- Venmo standard and instant fee/delay rules: https://help.venmo.com/cs/articles/standard-bank-transfers-faq-vhel299 and https://venmo.com/legal/fees
- Cash App standard transfer and instant fees (provider pages currently have differing descriptions; **do not embed one immutable fee into production routing**): https://cash.app/learn/getting-started/how-to-send-and-receive-money and https://cash.app/bank/no-fees
- FinCEN: https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-persons-administering ; 2019 detailed guidance: https://www.fincen.gov/system/files/2019-05/FinCEN%20Guidance%20CVC%20FINAL%20508.pdf
- CSBS Money Transmission Modernization Act state adoption update: https://www.csbs.org/csbs-money-transmission-modernization-act-mtma

**This experiment neither claims a regulatory exemption nor makes legal conclusions.** Physical penny custodians and liquid, transferable cent claims are materially different business/legal scenarios and require separate classification.

## Related
- Previous branch PR #27: `labs/puddle-001` fragmented-checkout feasibility planner.
- Previous branch PR #28: `labs/puddle-001/penny-campaign.mjs` conditional campaign, funded sponsor-like pennies and separate physical/electronic claim classes.
- This lab is layered on those open draft branches, **not** an adoption into Jubilee Treasury main, nor an assertion of existing real PENNY reserves.
