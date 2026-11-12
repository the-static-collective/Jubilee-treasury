# CONCORD-014 — INVENT THE AGREEMENT

**Jubilee Treasury / PENNY × PUDDLE × RELAY × QUESTION × CONCORD**

> **Search for agreements nobody prelisted, without pretending to know what people want or turning their property, work, or hardship into financial instruments.**

**Status:** source-owned, dependency-free, executable **entirely synthetic** research experiment. All actors, gold, contracts, permissions, offer cards, probabilities, stakes, responses and money are invented. No real-world personal contacts, titles, rights, creditors, payments, contracts, work or debt relief are verified or touched. No human benefit has been measured. This demonstrates compositional search, not a novel mathematical theorem or proof that participants would prefer the agreements.

## What changed compared with QUESTION-013?

In 013 the **whole multi-party chain was already imagined**. The planner decided *who to ask first* about whether that chain would be worth discussing. That is valuable, but it has a limitation: if the landlord won't accept repairs, the original plan ends even though many other resources and skills may still exist.

**014 changes the search space itself.**

Instead of storing a complete deal, we store **local, independently first-person-authored offers** with typed prerequisites and outputs. A filmmaker can say they *might* create a rental listing video if they can photograph a striking object; a landlord can say they *might* consider a useful video as part of a separately negotiated rent settlement. Neither had to predescribe a complete gold→film→landlord agreement.

The `composer.mjs` engine uses bounded **AND/OR backward-chaining** from a target need, recursively joining compatible outputs to requirements. It generates provenance-preserving *conditional proof trees*, flags unknown authors and explicit refusals, prunes cycles and resource-exclusivity conflicts, and never upgrades an offer to a real agreement.

### Default invented operators

| Person | Single local idea they might discuss |
|---|---|
| G, asset owner | A narrowly limited, fictional depiction right |
| F, filmmaker | A promotional film for E, a listing film for L, or a poster for B |
| E, electrician | Lawful and properly qualified repairs to L for a film |
| B, community collaborator | A practical workshop for L in exchange for an event poster |
| L, landlord | A properly negotiated substitute for rent: repairs, listing film, or workshop |
| A, renter | The person affected, who must independently opt into exploration |

The engine doesn't receive three full chains. It receives individual **cards** that express what one person might want to exchange and the token it might make available. It synthesizes three distinct structures:

**1. Existing repair chain:** G image permission → F video for electrician → E lawful repair for landlord → L *might* accept repairs.

**2. Newly composed direct route:** G image permission → F rental listing video → L *might* accept that as alternative performance. **No electrician required.**

**3. Newly composed community route:** G image permission → F event poster → B skills workshop → L *might* accept the workshop. Different chain, no repair service.

All three are conditional; neither the real landlord nor any real rightsholder has consented to terms. The token named `rent-satisfaction-option:A` is deliberately an *option to negotiate*, never a debt-discharge instrument or a completed agreement.

**Falsifier:** when L's repair preference is explicitly `no`, the old fixed-chain control generates **0** routes, while the generator still identifies **2 conditional alternatives**. If L rejects all three, the generator produces **zero** routes, regardless of how much enthusiasm other people express.

This is novelty **relative to a fixed, prelisted chain**. Multi-party barter, planning over operators, alternative creditor satisfaction and resource compatibility are established concepts; we're not claiming historical invention.

### Plug in an additional offer without rewriting the search

Tests add three entirely new local cards:

F creates documentary narration for a hub; H considers hosting a community event for the landlord; L might consider that event as part of substitute-performance terms. No full chain is inserted. The unchanged planner discovers a **fourth** possible path. If the only source of a required input is a circle of promises, it refuses the cycle.

The implementation also detects attempts to promise the same exclusive-use right to multiple different people inside one candidate. It doesn't assert that unverified object image rights or title are valid: these would require an actual legal and owner-consented review.

## What decides the next question?

The `planner.mjs` imports the actual existing source-owned modules:

- **`010/relay.mjs`** — directed, purpose-restricted, time-limited introductions, first-contact-only previews, sequential voluntary YES/NO at each intermediary. A friend never consents for their friend.
- **`012/question-value.mjs`** — exact bounded lookahead with optional stopping, here over the newly generated candidate chains rather than a prewritten list of actions. Unknown offer cards are represented by finite, entirely invented yes/no worlds.
- **`009/satisfaction.mjs`** — original read-only settlement HOLD boundary; even a fully interested team does not create a rent discharge, actual services or a lien.

Each unknown card has an invented prior yes probability; asking cost includes a toy cost per introduction and declared question burden. An invented utility penalizes proposing a route whose required person actually wouldn't want it, and a `no-deal` branch preserves everyone's right to decline. The engine may decide an unknown person's question would be useful **only after owner + resident inquiry consent** and the intended contact path exists. After each answer, the input graph changes, the **candidate agreement structures are regenerated**, and the next question is recomputed.

**Critical limits:** priors aren't learned from people; scenario points aren't money, satisfaction, environmental measurement, creditworthiness, or predicted personalities. This is a combinatorial research toy, not a validated model of humans. One respondent's YES means *interest in discussing that card*, not contract acceptance. A NO removes only that local offer; it cannot be generalized to another aspect of their personality. Declining to answer leaves the answer unknown and blocks that invitation route without negative reputation or inferred unwillingness.

## Distinct stages (do not conflate)

```text
Possibly useful operator card (fictional self-authored interest)
  → source-provenance / freshness / purpose
  → COMPOSER conditional agreement dependency proof
  → selected missing QUESTION
  → resident + gold-owner permission for inquiry
  → RELAY purpose-limited willing introductions
  → subject separately chooses to hear one question
  → subject answers, refuses, or withdraws
  → recompute entire arrangement search space
  → potentially invite independent negotiation of specific terms
  → verified contract, work, title, payment and discharge (NOT IMPLEMENTED)
```

The current maximum is **`ready-to-discuss-specific-terms-HOLD`**. The name is intentional: it does not mean anyone has signed a contract, agreed on a price, performed work, accepted alternative rent, or paid the landlord. A landlord's affirmative interest in discussion does not extinguish the tenant's debt.

All physical property rights stay with their owners. The recipient incurs no debt to a relay, finder, owner, filmmaker or community facilitator.

## Code / reproducible checks

Node 22+, zero npm dependencies:

```sh
npm test --prefix labs/penny-puddle-014
npm run demo --prefix labs/penny-puddle-014
npm run serve --prefix labs/penny-puddle-014
# Open http://127.0.0.1:8810/ on the SAME computer
```

- `composer.mjs`: typed offer grammar, validation, finite AND/OR regression, cycle pruning, mutually exclusive resource prevention, first-person scoped offers, simulated answer updates and fixed-chain control.
- `planner.mjs`: dynamic response-world generation, actual QUESTION-012 finite value-of-information lookahead, actual RELAY-010 consented routes, per-person questionnaire and refusal state, source-owned 009 legal HOLD.
- `demo.mjs`: compare prewritten original and multiple independently generated chains, then simulate landlord refusing repairs while the network explores other routes.
- `index.html`, `ui.mjs`, `server.mjs`: mobile-friendly local interface with opt-in gates, introductions, questions, proposed dependency chains and legal boundary controls. Only an explicit allowlist of local files; no network egress permitted in browser by CSP.
- `test/*.test.mjs`: source integrity, self-authored scope, refusal, dynamic recombination, conditional proof completeness, cycle and double-use prevention, landlord veto, question budget, relationship consent, unknown-answer privacy, zero settlement, browser smoke checks.
- `.github/workflows/penny-puddle-014.yml`: isolated Node 22 test/demo/syntax CI.

### Engineering distinction vs actual AI invention

This engine doesn't invent entirely new **primitive capabilities** or know what a person truly wants; those must be offered as first-person cards or explicitly negotiated after neutral questions. It invents **new compositions of available primitives** through an explicit dependency search, and QUESTION-012 helps investigate missing choices. That is a meaningful capability increase from 013's fixed scenario, but not an unbounded creative intelligence or autonomous operational exchange.

For future deeper research, compare this bounded classical AND/OR synthesizer against MOTIF's *native* structural affordance search on exactly the same learned primitive graph. Determine whether new capabilities can be imagined, tested and rejected with provenance and consent while preserving the existing success criteria. Native MOTIF-003 continues to be source-pinned and tested in the earlier 012 experiment; this PR does **not** claim a new running native integration.

## What would make it genuinely useful?

A small opt-in community pilot would need real people **first** to independently describe a few safe, concrete goods/services they might offer and their own limits. Record only their chosen disclosures, avoid publishing contact networks, rate-limit approaches, provide a genuine refusal channel, and never offer someone else's property or labor without their own authorization.

Then test whether the engine proposes arrangements the participants **hadn't previously considered** and later genuinely welcome. Independently record completed work, verified obligations satisfied, costs, time, fairness, complaints, privacy incidents, resource displacement and effects on vulnerable participants. A generated candidate or public badge alone is not a fulfilled act of mutual aid.

**Rule:** *When an arrangement fails, don't invent consent or convert a person into a commodity. Recombine the possibilities, identify the missing question, and ask the person who actually has the choice.*
