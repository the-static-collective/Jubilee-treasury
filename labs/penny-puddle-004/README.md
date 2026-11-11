# PENNY × PUDDLE-004 · The Numismatic Discovery Frontier

**A penny is worth one cent as money. The *physical specimen* may carry additional value, history or collector interest. Do not collapse these into one ledger.**

Status: **code-backed synthetic proposal, not a collector service, grading service, auction, custodian, currency issuer or money transmitter**. All specimen records, owners, appraisers, receipts and offers in this lab are invented. No coins, fiat or real tokens are held, sold, issued or moved.

## The next crossing: the value exchange's third layer

We already explored (1) PENNY's conserved coin-backed cent claims and (2) PUDDLE's fragmentation, funding and settlement routes. We now introduce a **third layer: individual historical/numismatic objects**.

```text
REPORTED PHYSICAL COIN (owner and prior collateral status established)
   |
   +--ordinary / owner's consent --> candidate local coin-circulation job
   |
   +--suspicious feature / historical interest
          |
          V
      QUARANTINE, DO NOT CLEAN OR MASS-COUNT AS STANDARD CENTS
          |
          V
      Independent screening; preserve photos, provenance and custody evidence
          |
          +--not collectible --> OWNER RETURN / CONSENTED CIRCULATION / EXHIBIT
          |
          +--possible collectible --> INDEPENDENT AUTHENTICATION + PRICE RESEARCH
                                |
                                V
                       OWNER'S INFORMED CHOICE
                       /       |           \
                   return    exhibit     offer for sale
                                            |
                                            V
                                 Actual buyer + proper custody/market partner
                                            |
                                            V
                                  REAL VERIFIED SALE (future only)
                                            |
                                            V
                         sale proceeds minus documented real expenses
                                            |
                          base face value returned to owner
                          + remaining *premium* allocated by prior agreement
                                            |
                     owner / consenting finder / useful-work steward / community
                                            |
                                            V
                      only actually settled dollar proceeds may enter PUDDLE
```

### Three economic layers, three separate proofs

| Layer | Accounted unit | What supports value? | Eligible to spend? |
| --- | --- | --- | --- |
| Ordinary PENNY coin-backed claim | 1 face-value cent | Verified, unique, unencumbered 1-cent coin legitimately held for a declared obligation | **Only under a real compliant redemption/settlement arrangement** |
| Numismatic specimen | Unique physical coin, any denomination | Its independent title, uniqueness, condition, authenticity, buyer demand | **No**: an uncertain estimated premium is not money |
| Settled sale proceeds | Actual received USD cents | Reconciled financial provider receipt, net of costs and existing obligations | **Potentially** through an authorized PUDDLE rail |

A $0.01 coin with a hypothetical $100 sale *does not* create 9,999 new backed PENNYs. The buyer's actual funds, once legitimately settled and owned, may provide **separately backed electronic dollars**. The coin ceases to be available as PENNY collateral before leaving custody; if previously pledged, **obtain an authorized replacement or release and verification first**. The test fixture prohibits intake of already-collateralized coins outright.

## Example: a possible treasure and a $850 rent campaign

A community penny-bank worker receives a batch of coins and observes one unusual 1943 cent. The U.S. Mint documents 1943 steel cents as normal, with a small number of copper cents struck in error. Color alone doesn't establish a copper error; alterations and fakes are a real risk.

The **correct first reward is knowledge, not a payout**:

1. **Do not clean, polish or melt.** Remove from ordinary bulk circulation, log unique object, protect physical evidence and ask who owns it.
2. Obtain an independent review. A candidate may be ordinary or counterfeit; no market price should be asserted until provenance, grade and comparable sales are evaluated.
3. If the rightful owner approves an offer, a collector/dealer/museum may acquire or exhibit the coin by separately authorized arrangement.
4. **Only after a genuine sale settles**, a pre-agreed portion of the collector premium (not the face-value backing) could support a finder reward, a steward's discovery work, or a give-a-penny campaign.

The default is: **owner receives 100%**, unless the owner previously agrees to share. A church, business or volunteer cannot simply claim a percentage of someone else's rare discovery. Charity participation is opt-in, not implied. A real program must define whether coins were a gift, deposit, bailment, purchase or permitted salvage *before handling*. Disputed ownership means **HOLD**, not forced sale.

## What we can invent creatively

**1. The Penny Passport.** A privacy-preserving local object record (date, denomination, observed features, photos, condition, chain of custody and source references) for a potentially collectible specimen. This is a **provenance dossier**, not a cryptocurrency, certification, transferable token or proof of legal title. Unshared owner identity and storage locations remain private.

**2. Discovery Dividend.** An optional, written, owner-approved sharing of *realized net collector premium*. For example, in a **fictional** sale priced at $100.01 with $10 costs and a one-cent base value, the $90 collector premium could be split 80% owner / 10% finder / 5% steward / 5% community. The owner also receives the 1¢ base; no one receives a cent until a provider independently verifies payout. This encourages careful discovery without paying people for false rarity or inflating PENNY supply.

**3. The Penny Museum.** With permission, exhibit the story, photos or educational material even when the coin itself stays with its owner. An exhibition sponsor may **independently** fund creativity rewards or community campaigns. A photo, story or like is not automatically redeemable money; explicit licenses, privacy and agreed compensation are needed.

**4. Coin rescuers as paid work.** The actual new job could be sorting, photographing, identifying potentially unusual pieces, preparing protective holders, securing chain-of-custody receipts and arranging reputable appraisal—not investing in the speculative price of a coin. Wages are paid by an authorized service purchaser or sponsor, never an unsupported APY.

**5. MOTIF's affordance frontier.** Treat a suspected rare coin as a node with a branching action space: `return to owner`, `request second opinion`, `exhibit`, `sell through regulated partner`, `reconcile actual proceeds`, `voluntarily donate share`. A low-cost inspection may create options for an owner that immediately spending the coin at face value would irreversibly destroy. The system should measure the **value of additional options** and information obtained, not assume rarity is fact.

**6. reLATTE proof-carrying crossing.** Export only a bounded `inspection proposed`, `independent review requested`, `owner choice proposed`, `offer held` or `real settlement witnessed` receipt to cooperating systems. Source actors remain independent. `proposal ≠ admission`; `signature ≠ true human identity`; `appraisal ≠ paid buyer`.

## Executable synthetic lab

Node.js 20+, no packages or credentials:

```bash
npm test --prefix labs/penny-puddle-004
npm run demo --prefix labs/penny-puddle-004
```

- `triage.mjs`: incomplete, conservative, observational screening for possible 1943 copper-like and 1944 steel-like pennies, 1955 doubled-die candidates, 1909-S VDB signals, older wheat-back observations and some pre-1971 silver-era dime/quarter/half-dollar questions. It **does not** grade, price or authenticate anything. Missing a rule is not evidence of ordinary value.
- `collector.mjs`: synthetic personal-object custody records across penny, nickel, dime, quarter, half-dollar and dollar. No fungible reserve issuance. Review and owner-opt-in transitions; no sale before collector confirmation; explicit basis-point shares of a hypothetical sale's *premium*, with every rounding remainder to the owner. The default share is **100% owner**.
- `demo.mjs`: connects the existing **003 fictional account-weaving + sponsor campaign context** to a hypothetical rare penny discovery. Critically, **even the simulated $100.01 sale remains zero current available spending power**, because no real buyer, legal title or settlement exists.
- `test/collector.test.mjs`: strict enforcement of quarantine, collateral separation, claimant control, conservation and no duplicate settlement.

### Fidelity limits and important real-world corrections

- 003's physical transport weight used 2.5g per penny, suitable as a *modern nominal* approximation, **not a physical-count proof for mixed historical lots**. Older copper cents commonly weigh 3.11g, while zinc-era cents are 2.5g, and 1982 was transitional. Individual suspects need direct counting and suitable instrument readings; bulk weight cannot establish authenticity or precisely count mixed coins.
- Coin grading and authentication can involve nontrivial fees; apparent upside can disappear after grading, transport, sale commissions, fraud and insurance. Do not encourage every common circulated coin to be graded.
- U.S. Mint advises against cleaning or polishing potentially collectible coins because doing so can reduce their value; proper storage and safe handling matter.
- U.S. rules prohibit melting/exporting cents or nickels in many circumstances (31 CFR Part 82), subject to stated exceptions. This project does not propose metal arbitrage or extraction.
- A physically present coin may belong to a depositor, donor, church, finder or another party. Custody or discovery **is not automatically title**; a witnessed count doesn't settle ownership.
- Store owner data, exact storage locations, serial tags, photos and high-value finds privately by default; publishing a coin's value and whereabouts could increase theft risk.
- Tax, charitable fundraising, consumer protection, auction/dealer, appraisal and financial-services obligations need context-specific legal review before actual operation. No "escrow" authorization exists.

## Technical project contract

This lab is a *separate source-owned application proposal* inside `Jubilee-treasury`, stacked after PUDDLE-003. **No writes to existing PENNY reserve ledger or physical coin-bank model**: the 004 fixture remains isolated and explicitly refuses coins already encumbered by claims. A future adapter must obtain typed intake/owner authorization, independently reconcile face values, lock collateral, and specify exact `HOLD / RELEASE / SUBSTITUTE` operations with replay prevention. No external transfers or side-effecting API calls are present.

## Relevant primary references

- U.S. Mint penny overview and 1943 anomalous cents: https://www.usmint.gov/learn/coins-and-medals/circulating-coins/penny
- U.S. Mint collectible coin storage and preservation: https://www.usmint.gov/learn/collecting-basics/caring-for-your-coin-collection
- Mint's documented penny weight transition and effects on mechanical counting: https://www.usmint.gov/content/dam/usmint/reports/2014-rd-biennial-report-appendix-3.pdf
- PCGS examples of doubled die varieties: https://www.pcgs.com/news/seeing-double
- U.S. Mint regulatory FAQ on 31 CFR Part 82: https://www.usmint.gov/help-center/faqs/products-and-coin-programs.html
- Federal Reserve's FedCash physical-penny services, for *institutions* only: https://www.frbservices.org/resources/financial-services/fedcash-services-resources/fedcash-frequently-asked-questions/penny-order-deposit-information/

**Economic metric:** not the maximum speculative price in an inventory. Instead: `independently verified value actually realized - all associated discovery, transport, grading and settlement costs`, together with the owner's consent, protected privacy, preserved numismatic history, and real benefit to intended recipients.
