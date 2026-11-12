# RELAY-010 — WHO YOU KNOW, HOW YOU KNOW THEM

**Jubilee Treasury / PENNY × PUDDLE / RELAY** — consent-first discovery of potential agreements across a network of *relationships*, not a marketplace setting exchange rates or a public directory scraping everyone's contacts.

> What if the missing ingredient between a huge illiquid asset and a satisfied community need is a single willing introduction?

**Status:** runnable, isolated, totally **synthetic** experiment. No real identities, address books, phone numbers, social graph, emails, messages, payee receipts, cash, loans, introductions, contracts, services, gold rights or creditor waivers. The example roles G, F, E, L, A, B and H are explicitly invented.

## The hypothesis

A straight marketplace knows **what people list**. An actual community also knows:
- *who* has met whom;
- *how* they met: worked together, shared an artistic project, online acquaintance, neighbor, or a publicly opted-in community hub;
- *what* that person is willing to discuss;
- *whether* this is still a current, relevant relationship;
- *whether* each individual chooses to make another introduction;
- whether an eventual agreement would actually meet **each** affected party's interests without adverse financial or environmental effects.

A contact map can reveal an opportunity to negotiate. It **cannot establish trustworthiness, ability to pay, authenticity of an asset, legally effective consent, or that a deal has happened**.

Rather than using `popularity`, `social clout`, `reputation`, `friendship intensity`, or another aggregate personal ranking as a proxy for value, the experiment uses **directed, purpose-scoped, age-limited offers to introduce**. The context is relevant to whether it's reasonable to ask a person; it doesn't grant a right over their friends.

## How RELAY composes with 009: the unspent gold

009 already modeled a multilateral obligation-satisfaction scenario:

```
G: asset owner     → F: filmmaker    → E: electrician
   image/story        promo video        electrical repair
                                         ↓
                                      L: landlord → A: renter
                                      creditor consent  rent relief
```

All five fictional parties need *individually appropriate* arrangements. The genuine landlord would have to **agree in advance to specific work instead of rent**; work must actually be performed, any trade/use rights clarified, and the landlord must legally release the obligation. Without that, A's rent remains owed in full. A's own privacy and freedom to refuse also matter.

**RELAY-010 does not presume they know each other or authorize the deal.**

It asks how someone can *appropriately invite them* to consider it. In the default fictional graph:
- G knows F from a prior creative collaboration;
- F knows E through a weaker online acquaintance;
- E knows L from previous work;
- an alternate, longer route from F to E uses B, a community intermediary;
- a stale shortcut G→L is excluded;
- G→E is excluded because its social scope is only garden news and permission to ask was refused;
- A, who may have few insiders, can reach F via an openly opt-in community hub H;
- L and A have a separately asserted contractual communication relationship.

The shortest route G→F→E→L has **three introductions**, not three completed trades. The fallback G→F→B→E→L requires **four introductions**. In a strict strong-ties-only control, some reachable routes disappear. This illustrates the classical *weak ties* observation: connections outside one's tight inner circle can bridge otherwise disconnected groups. Reference: Mark Granovetter, [The Strength of Weak Ties](https://sociology.stanford.edu/publications/strength-weak-ties), *American Journal of Sociology* 78(6), 1973, DOI [10.1086/225469](https://doi.org/10.1086/225469). Our synthetic case proves no empirical claim about the user's real community.

### The difference between *discovery* and *permission*

1. **Ask for help finding a connection:** G privately asks to locate a willing route to a person able to discuss repair/work/creditor satisfaction.
2. **Only show the next person G already knows:** do not expose F's entire friend list or contacts at E, L, or B.
3. **G requests permission:** no external message in the lab; a real system would authenticate sender and recipient and use purpose-limited invites.
4. **F says YES or NO:** F's acceptance authorizes, at most, asking the next person; it is not consent on that next person's behalf.
5. **Every next person answers independently:** a refusal ends that proposal. Origin or participants can withdraw.
6. **Only then invite separate deal negotiation:** introduction consent is *not* license to sell, hire, move a gold object, record video, grant financial guarantees, enter a legal contract, or accept a change to a tenant's obligations.
7. **Only actual independently evidenced performance counts:** the source-owned 009 satisfaction ledger remains HOLD until legal creditor settlement can be verified in a future real-world integration.

The output is an **option to negotiate**. That option can be valuable *before* there is any money or transaction, but it's neither spendable nor legally enforceable on its own.

## Executable experiment

Run with Node 22+, no dependencies:

```sh
npm test --prefix labs/penny-puddle-010
npm run demo --prefix labs/penny-puddle-010
npm run serve --prefix labs/penny-puddle-010
# On the SAME COMPUTER open http://127.0.0.1:8806/
```

`relay.mjs` includes the full fictional directed graph, declared context, use restrictions, recency windows, and bounded simple-path search. It returns a **redacted preview** naming only the requester's immediate known contact, not the hidden friend-of-friend path. Its invitation state machine permits stepwise opt-in, refusal, and withdrawal; audit makes clear that no messages have been sent.

`weave.mjs` reads the existing **009 satisfaction scenario** and checks that each proposed interaction is reachable as a permission-respecting *request*, including contact with the ultimate beneficiary. It never promotes this to real contract acceptance or legal release. It also provides an end-to-end fictional consent progression to prove every hop can separately say yes.

`demo.mjs` compares (a) opt-in purpose-scoped weak ties and alternative longer routes, (b) close-ties-only control, (c) possible public onramp for an isolated person, (d) all-introduction-consent in an entirely fabricated role graph, and (e) still-zero actual rent discharged.

`index.html`, `ui.mjs`, `server.mjs` give a local-first mobile UI with **Find an introduction**, **Restrict to close ties**, **Try the public community door**, **Simulate next person's YES/NO**, and **Check whether a deal could be discussed**. Source code and participants are public fictional fixtures: it is **not** a private-contact product and has no authentication.

The tests enforce: scope, freshness, no unauthorized friendship extrapolation, sequential informed choice, refusal, withdrawal, replay protection, no duplicate contact listing, public hub alternative, creditor and beneficiary hold conditions, no financial authority, and server egress/network restrictions.

## Not a social credit score

No likes, donations, social follower count, personal connections, introductions, refusal, wealth, or public service should be converted into someone's personal credit score, wage entitlement, governance privilege, priority over aid, or claim over the beneficiary. *Who you know* may help locate a route; it must never determine whose essential needs are worthy.

People lacking established connections should have **public, opt-in intake paths** to find community organizations or volunteers. A connected person's private friend network is not a public resource. Also, a contact's willingness to make an introduction does not make that contact a guarantor for performance, money or honesty.

The collaborative governance literature offers useful guardrails around consent and dispute resolution, including Elinor Ostrom's principles for participants having a voice in local arrangements and access to conflict resolution. Her [Nobel lecture](https://www.nobelprize.org/uploads/2018/06/ostrom_lecture.pdf) discusses these in the context of sustainable commons; it does not validate our prototype's outcomes.

## Security and rights boundaries

- **No imported private graph:** never access, ingest, traverse or publish a real person's Gmail, social network, phonebook, address, private notes or relationships unless they knowingly authorize the exact operation and each participant's data rights are respected. This lab does not do that.
- **No synthetic identity as real authentication:** `actorId='F'` is a convenient fictional test string, not identity verification or a permission grant.
- **No unintended reveal:** public previews contain only the first contact and a path length. A future production design should consider whether even path existence/count leaks private metadata and should support rate limits, expiration and revocation.
- **No intermediary pressure:** refusing introductions has no penalty, does not lower social score, and cannot be publicly ranked.
- **No contact extraction or bot outreach:** the browser server has no API endpoints for contact import, notifications, payments or external network calls; CSP blocks browser egress.
- **No pledged rights by referral:** a friend cannot pledge someone else's gold, land, labor, time, collateral or reputation.
- **No recipient as instrument:** the person receiving assistance does not acquire debt by being introduced to an angel or creditor.
- **No guaranteed environmental/social surplus:** actual triple-bottom-line success needs independently measured participant satisfaction, social benefit and environmental effects after any voluntary agreement is completed.

## Next proposed engineering crossing — NOT YET IMPLEMENTED

A production-ready **source-pinned RELAY envelope** should be admitted by the *receiving project* only when a trusted identity, purpose, data minimization, rate limits, redaction, short expiration, consent and audit are established. Each participant should own their contact edges and control whether they expose them. A human-readable local intro ticket should be possible *without* exposing the rest of that person's relationships.

When actual agreements are completed, the independent source systems can send evidence of the *performed* value across a separately authorized reLATTE or MOTIF adapter, not proofs generated from relationship guesses. No native MOTIF integration or live reLATTE update occurs here.

## Falsification targets

- Denied or stale relationship edges must never create a route.
- Strong-tie-only path search may miss connections permitted by purpose-limited weaker ties.
- A public opt-in intake point must make at least some discovery possible for someone lacking direct insider access.
- A positive path must **never** imply positive party consent or fulfillment.
- A landlord who refuses alternative performance cannot be overridden by arbitrarily many introductions.
- A popular person's endorsement generates **zero dollars** unless a separate sponsor actually funds the help.
- Any recorded purported transaction with no independently verified underlying performance must remain HOLD.

**Measure real usefulness only later:** number of *participant-initiated, consented, completed* introductions that lead to satisfying, mutually beneficial agreements; participant-reported harms or pressure; access to open doors for isolated people; actual time and money saved; and verified obligation resolution. No relation graph's size or number of automatically sent requests is evidence of success.

**Rule of Jubilee RELAY:** *The right person, reached for the right reason, through a relationship that willingly carries the request—without ever granting authority over anyone else.*
