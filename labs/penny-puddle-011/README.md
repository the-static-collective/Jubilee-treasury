# RELAY-011 — ASK FIRST / CONTEXTUAL CONSENT WEAVE

**Jubilee Treasury × RELAY × DEALWEAVER.** The goal is not merely to find someone who *can* do a task. It is to discover what *kind of arrangement* the actual participants would freely prefer, using **only first-person, purpose-specific, revocable context**.

**Status:** executable, entirely *fictional* research prototype. The public source contains made-up actors, skills, preferences, community paths, benefit scores, and YES/NO choices. No identity authentication, private address book, third-party profiling, actual agreement, lesson, payment, landlord consent, gold rights, or real human benefit has been verified or performed. It is not publicly deployed and not a production social application.

## The failure of a skill-only matcher

Person L needs help with a tractor. Person M knows how to troubleshoot tractors.

A primitive matching engine immediately suggests **M repairs the tractor for L**. The skill is a match, but in our deliberately invented fixture M does **not** want another hired repair job. M would instead consider a session **teaching L how to diagnose the tractor**, with safe, time-bounded terms.

A local hub H knows M from previous work. Rather than announce private preferences on M's behalf, H offers **one neutral question**:

> Would you like to discuss a learning-focused tractor-repair arrangement?

M decides whether and how much to answer. A disclosed preference is not a psychological diagnosis, not public profile data, and not consent to perform the work. L independently chooses whether to propose a specific session.

**In our fixture**, two potential formats emerge only after all introductions and disclosure have been separately allowed:

| Proposed format | L's hypothetical self-rated benefit | M's hypothetical self-rated benefit | Social / ecological hypotheses |
|---|---:|---:|---|
| Learn together on Saturday | +8 | +6 | +2 people; +1 planet |
| Short remote guidance | +2 | +3 | +1 people; 0 planet |
| Hire M to do the repair | Not proposed | Explicitly unwanted by M | No authority to recommend the job |

The locally calculated Pareto comparison favors the learning arrangement across the **separate hypothetical axes** in this fixture. This is **not a measured outcome**, and individuals' ordinal 0–10 numbers are not objectively comparable or evidence that any actual two people would be happy. Neither imagined environmental benefit nor social benefit is monetized. The conventional keyword baseline is intentionally simplistic and is not an empirical benchmark against sophisticated existing platforms.

## Source-owned crossings already implemented

### RELAY-010 — consented introduction path

`weave.mjs` imports the **actual RELAY-010** source code and constructs a fictional opt-in hub route:

```
L (learner) -- requests opt-in hub --> H (community hub)
H -- independently asks M --> M (mechanic)
M -- may agree to discuss the PURPOSE --> possible preference request
```

Each individual must explicitly accept their **own** introduction. A yes to an introduction does *not* grant permission to reveal private preferences, consent to terms, or ability to make commitments on another person's behalf. If H or M declines, the context request is held. A public-intake entrance provides a route for L without requiring a private insider relationship.

### RELAY-011 — first-person context without psychological profiling

`context.mjs` holds a private, self-authored-in-fixture subject profile and lets the subject opt to disclose, **to one specified requester and purpose only**, exactly which activity formats and time windows they are willing to discuss. Motivation remains undisclosed unless the subject separately permits it.

- An introducer can suggest **a question** but cannot add facts about someone's personality.
- No hidden inference from emails, contacts, past conversations, social clout, wealth, medical status, demographic profile, politics, or reputation.
- Subject chooses formats and whether to disclose a narrative motivation.
- Nonwanted formats are filtered **without disclosing the subject's private hard refusals** to the requester.
- A consented disclosure has a bounded expiry; it can be revoked before or after a hypothetical deal proposal, invalidating ongoing synthetic negotiations.
- A refusal is never penalized. No auto-messaging, ranking of persons, contact scraping, or automated psychological targeting.
- The other party's own declared needs, format preferences, safety terms, and time windows must align.
- If anyone withholds context, no matching recommendation occurs. A generic skill match is explicitly marked **unsafe to act on**.

A future real implementation must prove the participant's identity, control private storage, encrypt and expire data, process withdrawal and deletion rights, protect every relationship edge and avoid private-graph side channels. Literal `actorId` assertions in this demo are **not** authentication.

### DEALWEAVER-007 — mutually acceptable agreement candidates

`weave.mjs` also imports the **original DEALWEAVER-007** proposal engine. The code translates only subject-authorized hypothetical alternatives into its explicit-benefit/safeguard schema and executes the existing Pareto planner.

The original engine's time-slot/asset collision rule prevents two incompatible agreements being simultaneously recommended for the same made-up Saturday workshop window. It cannot assign a person's time or convert personal preferences into transferable property; the workshop slot is only a fictional scheduling placeholder.

The output remains **a candidate option**, not a binding deal. A second negotiation state machine requires:

1. L to voluntarily propose the precise session and safeguards;
2. M to accept or decline those terms;
3. L to reaffirm or withdraw;
4. later actual identity verification, lawful terms, and independently evidenced performance before any real completed-economic-outcome claim.

The current maximum state is **`mutual-interest-HOLD`**. No real lesson, legally binding contract, verified financial transaction or measured satisfaction occurs.

### Source-owned MOTIF research adapter

`carrier()` exports a **read-only proposed option field** with newly reachable follow-up questions. It is shaped for future MOTIF-style affordance reasoning but **does not invoke or update the native MOTIF runtime**. No signed/reLATTE cross-project admission is claimed. The field deliberately omits all personal motivations and retains authority `OFFER_ONLY_HOLD`.

## Run the local experiment

Node 22+, no dependencies:

```sh
npm test --prefix labs/penny-puddle-011
npm run demo --prefix labs/penny-puddle-011
npm run serve --prefix labs/penny-puddle-011
# Open http://127.0.0.1:8807/ on the SAME computer
```

The mobile-friendly board offers a sequence of *fictional* button-driven decisions: request the community hub, H's yes/no, M's introduction yes/no, neutral contextual question, M's choice of formats and motivation visibility, two policy comparisons, L's specific offer, M's response, L's reaffirmation, and M's revocation. One click is not an action by a genuine person. Refresh to reset the scenario.

The loopback-only HTTP server has explicit read-only module routes and a CSP with `connect-src 'none'`; no contacts API, social lookup, tracking, messaging, business connection, invoice, wallet or bank request exists. The server allowlists the imported RELAY-010 and DEALWEAVER-007 modules; nothing is published publicly.

## What the tests need to falsify

- Conventional skill-only match can be **wrong about willingness**, even when technically capable.
- An intermediary's assumption does not become a fact or authorize a third-party preference disclosure.
- Every step from open hub to mechanic requires independently asserted consent in the fixture.
- Subjects can decline, withhold motivation, narrow the disclosure to teaching only, restrict its recipient and purpose, expire it, and revoke it.
- Hidden preferences, deleted/expired disclosures, denied introductions and stale opportunities cannot drive further matching.
- Both parties must choose specific mutually preferred terms, and refusal or withdrawal stops the proposed agreement.
- Stronger contextual agreement suggestions remain conditional **not actually fulfilled**.
- RELAY's sourced relationships cannot be converted into personal financial creditworthiness.
- All quantitative impact measures are explicitly unverified scenario values, not an invented improvement to actual lives.
- A private relationship graph must not leak names beyond an authorized first-hop introduction.

## What would validate the actual human hypothesis?

In a consented paper pilot, invite participants via **their chosen, allowed community channels**, not contacts scraped from existing services. Ask separately:
- What task do you want help with, and what would you like to learn or contribute yourself?
- Is there a format you would genuinely enjoy, and any format you'd rather not do?
- Are the proposed participants willing to be introduced, or would they prefer an open intake route?
- Were the terms they eventually chose actually good for each person?
- After any completed agreement, did each person **independently report satisfaction**? Was there a real community gain or avoided material waste?

Compare task-only suggestions to **first-person, context-informed** options on the same tasks. Collect both positive outcomes **and refusal/pressure complaints**. A match rate or number of introductions does not establish benefit. Record real-world outcomes only from independently sourced evidence; protect all participants' privacy and ability to withdraw.

## Why this matters to Jubilee Treasury

Previously:
- PENNY finds overlooked objects and tiny resources.
- PUDDLE composes dispersed resources, lawful funding and urgent need.
- DEALWEAVER explores nonextractive mutual-surplus arrangements.
- ANCHOR-009 explores new ways to satisfy a need around an otherwise unspent giant asset.
- RELAY-010 finds respectful, purpose-scoped introductions.

**RELAY-011 adds the missing question: What kind of cooperation would the people *themselves* want?**

This keeps the source of social context in the hands of its subject and the reason for the connection in the hands of the participants.

**The simplest rule: a person is not a fungible skill, and knowing someone is not permission to volunteer them.**
