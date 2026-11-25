# QUESTION-013 — THE NETWORK INVESTIGATOR
## Who should Jubilee ask first?

**Goal:** extend QUESTION-012 from a single learner/mentor conversation to a *multi-party obligation-satisfaction network*. Search for the question that can open the greatest amount of mutually agreed useful work (or avoid useless introductions), accounting for relationship distance, declared question burden, uncertainty, and individual refusal.

**Status:** executable, **completely synthetic** experiment. All identities, prior weights, relationships, permissions, hypothetical payoffs, gold, rent, lender/donor alternatives, answers, and invitations are invented. No one has been contacted. No actual title, relationship, asset, services, money, financial partner, loan, consent, or debt discharge has been verified or created.

## The experiment

Reuse the deliberately eccentric gold-to-rent example:

```text
G owns an illiquid object, wants to help A
G --image or story permission--> F (filmmaker)
F --promotional video----------> E (electrician)
E --lawful specified repairs---> L (landlord)
L --separately signed release--> A (tenant)
```

Would the landlord consider accepting specific repairs, with advance agreed terms, instead of $300? Would the electrician consider working for a video? Would the filmmaker consider creating that video for a genuine license to depict the asset?

**All three people must freely choose to discuss their own roles.** The asset owner and resident independently choose whether their need and property may be involved in an inquiry at all. The landlord's preliminary willingness to discuss noncash satisfaction is **not** a legally binding rent discharge, nor does it mean repairs are safe or permissioned. The source-owned SATISFACTION-009 engine stays on HOLD until separately verified real agreements and actual performance.

## A three-hop question can be more valuable than a one-hop introduction

The source-owned RELAY-010 graph provides these *invented* paths starting from gold owner G:

| Person we might ask | RELAY introductions | First currently known contact |
|---|---:|---|
| Landlord L | 3 (G → F → E → L) | F |
| Electrician E | 2 (G → F → E) | F |
| Filmmaker F | 1 (G → F) | F |

**Every hop needs its own willing YES.** A route is only permission to ask the next person; no friend can speak for another. At every stage the requester only sees their immediate first contact in the network preview. A stale, purpose-forbidden, or refused route isn't assumed available.

QUESTION-013 imports the **actual** QUESTION-012 `optimalDirectAction`, `questionValue`, and `optimalQuestionPolicy` (bounded exact response-tree lookahead, maximum 3 questions). It creates eight *fabricated* possible worlds representing yes/no willingness from L, E and F with arbitrary scenario prior weights. The fictional potential outcomes are:

- `weave-satisfaction`: +18 hypothetical points if all three independently express hypothetical interest; −15 if someone would reject the arrangement. No real service is performed or contract signed.
- `angel-funded-alternative`: +5 hypothetical points, but **no actual sponsor, beneficiary funding or money** is available merely because the planner names this fallback.
- `no-deal`: 0 model points. Saying no is always a valid human outcome, and this model must never override it.

Questions carry a fictional burden consisting of direct asking cost plus a small cost per potential introduction. These are **NOT measured welfare, probability-calibrated human willingness, money, social credit scores, or objective value**.

The baseline model expects to prefer the theoretical angel route rather than risk an uncertain whole chain. A greedy 'ask the nearest person' strategy picks F first (one hop). **Finite decision-value search instead asks about L's preliminary willingness first (three hops)**, because L can veto the entire need-satisfaction route.

If L declines, no unnecessary requests to E or F follow. If L is interested, the next hypothesis-testing question is about E (two hops), then possibly F (one hop). This is a *synthetic counterfactual*, not evidence that real landlords or workers would agree to these terms.

The `compareNetworkQuestionStrategies()` function reports:
- the no-question fallback decision;
- nearest-contact-first with optimal later questioning;
- one-step decision-value question;
- optimal 3-question lookahead;
- expected number of asked questions under the invented belief distribution;
- who can actually be asked under RELAY's scoped, fresh network fixture.

**What makes this distinct from QUESTION-012:** costs depend on the sourced (toy) relationship path, the order spans multiple differently situated people, and one person's answer can eliminate an entire multi-party search. The core expected-value mathematics were already in 012; this is a new application/cross, not a claim to have invented active learning.

## Source-owned crossings

- **RELAY-010** `../penny-puddle-010/relay.mjs`: actual import for directed, short-lived, purpose-limited, individually consented introductions and first-known-contact-only privacy.
- **QUESTION-012** `../penny-puddle-012/question-value.mjs`: actual import for finite expected-value-of-information calculations. The probabilities and payoffs are intentionally invented and therefore should *not* be used for real-person ranking.
- **SATISFACTION-009** `../penny-puddle-009/satisfaction.mjs`: actual import for read-only creditor-satisfaction opportunity snapshot. Three 'interested' answers unlock **negotiation only**. No deliverables are confirmed, no real creditor agreement asserted, and legally discharged dollars remain exactly $0.00.
- **MOTIF source relationship:** 012 already executes the real source-pinned native MOTIF-003 structural affordance probe in CI. 013 reuses the independently written QUESTION-012 expected-value operator in JavaScript; it does **not** claim to update a running MOTIF server or to have turned social relationships into automatic execution authority.

## Permission/consent and failure boundaries

1. **Start with the person whose life is affected.** Tenant A must expressly opt in to the experiment before their rent situation is brought into the imagined network.
2. **Respect ownership.** Gold owner G must opt in to exploration but does **not** pledge, sell, divide, exhibit, or license the actual asset.
3. **Each relay controls only their own referral.** A consent to introduce is not agreement to work, lend, inspect, buy, pay or sign a creditor waiver.
4. **Ask the target their own question.** A friend-of-friend's guess about L, E or F is not treated as the target's answer. No unsolicited personal profiling.
5. **Stop at refusal.** A denied referral or question does not infer 'no', impose reputation penalties, or permit automated harassment through other mutual contacts.
6. **Reserve irrevocable steps for later.** A person's willingness to *discuss* repairs is not consent to an actual deal; property/tenancy rights cannot be altered by a toy planner.
7. **Source conservation.** The 'angel-funded fallback' is only a theoretical utility action in the model; it is not a funded PUDDLE, lender, benefit or bank balance.
8. **No greenwashing.** No participant satisfaction, ecological gain, completed work, legal creditor settlement, or real money is claimed without independent evidence.
9. **Local-only security.** The browser app contains invented public fixtures, no imported contact lists, authentication, personal data, message APIs or financial endpoints; CSP blocks browser network egress. Real contact use requires independently designed privacy, storage, identity, redaction, rate limits, expiration and revocation.
10. **Human right to stop:** the owner or tenant may revoke inquiry consent; the local toy session discards previously modeled answers and prevents further inquiries.

An eventual real pilot must verify landlord consent and legally binding arrangements, safe/qualified repair work, insurance, title/IP/license rights, IRS barter treatment, financial compliance for any angel crowdfunding, tenant protections, explicit participant consent, and independent verification of work and discharge. None is provided here.

## Run

Node 22+, no npm dependencies:

```sh
npm test --prefix labs/penny-puddle-013
npm run demo --prefix labs/penny-puddle-013
npm run serve --prefix labs/penny-puddle-013
# Open http://127.0.0.1:8809/ on the SAME computer
```

The mobile-friendly localhost board contains policy comparison, separate tenant/owner gates, step-by-step permissioned contact path, voluntary question/answer or decline, and source-owned creditor-satisfaction HOLD summary. It does **not** send questions or import personal contacts. Its fake actor-ID clicks cannot authenticate real people.

### What would actually validate the hypothesis?

Pre-register a small paper-only pilot with real, knowingly participating community volunteers. Compare a short first-question approach against the closest-contact-first approach, while respecting everyone's right not to answer. Observe **real** introductions approved by actual individuals, refusals, time spent, meaningful proposed agreements, verified completion, affected-party satisfaction, privacy incidents and financial/legal harms.

Measure whether a single appropriate early question truly avoids unnecessary requests, protects privacy and improves actual outcomes. Real-world results could falsify the assumed usefulness of the landlord-first policy. The modeled priors must never be mistaken for observed human preferences.

**Jubilee rule: Reach the right person for the right reason, ask what could change the outcome, and stop when further questions would only create burden.**
