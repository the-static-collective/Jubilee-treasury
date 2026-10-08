# JUBILEE TREASURY 002 — Native Need × Available-Capacity Routing

An explicitly selected Garden requirement and an independent signed physical-capacity assertion can now produce an explainable Treasury candidate and a native Campfire pledge. The source household decides acceptance. Treasury owns neither allocations nor fulfillment confirmation.

This branch stacks on [portable protocol PR #2](https://github.com/the-static-collective/Jubilee-treasury/pull/2). Its original `src/protocol.mjs`, demo, and 17 tests are unchanged. The 002 protocol uses a separate signature domain, `jubilee-routing/0.2`, because independent capacity and source consent are different contracts from a 001 offer tied to an existing need.

## Run and inspect

The core has no npm dependencies. Native execution requires Node **24**, Git, Docker, and network access to fetch a pinned donor and PostgreSQL image. It creates an isolated container with **no network interface**, installs the real donor SQL, runs the tests, then removes the container and its volume. It never connects to an existing Supabase project.

```sh
npm test                    # 17 unchanged oracle tests + 21 routing/boundary tests
npm run demo                # unchanged 001 simulation
npm run test:native         # 14 native PostgreSQL/Garden integration tests
node src/routing/cold-verify.mjs dist/routing-002/mirror-a.json 2026-10-08T12:00:00.000Z
```

Use an observation clock inside the generated invitation's window to see cold candidates; a clock outside it correctly returns none. `dist/routing-002/` contains two signed public histories and an evidence report of source event hashes. Private keys, raw source receipts, identities, private slips, contacts, and consent rows are not exported. The artifacts are synthetic test data. CI runs all three commands and uploads only this public evidence directory.

## Provenance and source selection

The exercised donor is [BananaSpork / Garden](https://github.com/the-static-collective/BananaSpork/tree/6738230a8557060dd59aabc19caf21826806d16f), pinned to `6738230a8557060dd59aabc19caf21826806d16f`. `integration/garden/run.mjs` restores this exact checkout and executes, unchanged:

- `src/domain/help-slip/pour.ts`: `buildCampfirePourPreview` and `pourHeldRequirement`;
- the July 27 schema/RLS and RPC migrations, their permission patch, and the July 28 confirmation correction;
- native `rpc_open_need`, `rpc_pledge_offer`, `rpc_accept_offer`, `rpc_report_fulfillment`, and `rpc_confirm_fulfillment`.

The conversation-plane migration is outside the selected contract and is not installed in the harness. No donor mathematics or fulfillment transitions are reimplemented. The harness creates synthetic auth users and circle membership, then calls real source RPCs under PostgreSQL's `authenticated` role. **The Supabase token-verification service is replaced by an explicit local JWT-claim fixture** in `bootstrap.sql`; live login, real users and Supabase/PostgREST deployment are not verified.

The Full Measure and Jubilee Campfire development servers were inspected but not chosen as authenticated authorities: they accept a caller-controlled actor header/fallback. Full Measure's transition helper is stricter about reporting before confirmation, but that is not an authentication proof. BananaGram invitations and reLATTE crossings are not exercised in 002. No claim of their native execution is made.

## Public projection and independent AvailableCapacity

`selectedGardenNeed` requires a native `need.opened` receipt, matching source ID/unit/quantity, explicit requirement selection, and **separate** publication approval. Native POUR remains circle-private. Treasury never imports a whole held slip or copies its description, purpose, medical facts, source household label, actor label, or other requirements into a public envelope.

Both public types contain exactly:

```text
id, revision, previousHash,
source { system, version, authority, object, revision },
status, resource, kind, unit, quantity, region, boundaries,
validFrom, expiresAt
```

The outer envelope binds version, type, payload and signing key with an Ed25519 signature. IDs are opaque references. A `capacity` (AvailableCapacity) has **no need ID or need hash**; the helper may publish it before a request exists. This remains an assertion of availability, not verified stock, suitability, ownership, or eligibility.

The experiment's resource catalog is wheelchair, firewood, groceries, transport, child-care, tool and materials; kinds are goods/service; units are item/cord/bundle/kg/slot/hour. Boundaries are pickup, delivery and accessible-transport. A new unit/resource rule requires an explicit versioned source contract. There are no implicit cord-to-bundle or goods-to-funds conversions. Region labels are declared coarse tokens rather than coordinates; their actual geographic meaning still requires source-owner review. No free-form title/summary, destination, payment link or contact field is admitted in 002.

Signing does not establish a person's real-world identity. The source additionally registers the exact signed manifest hash through an authenticated household/helper command. Matching a signature alone cannot bypass that registration or source admission.

## Routing and admission

`routeCapacity` compares exact resource, kind, unit and declared region; requires a current declared window and available state; checks all explicit need boundaries against helper-supported boundaries; and proposes the smaller declared quantity. Every candidate includes plain reasons and uncertainty. Sorting by content digest provides stable enumeration, not a priority score. Duplicate inputs do not create duplicate proposals.

The router never reserves, accepts, confirms, or introduces people. `GardenAdmissionAdapter` verifies the entire candidate before calling `rpc_pledge_capacity`. It requires a native `offer.pledged` receipt; a transport acknowledgment causes HOLD. A separately authenticated household client may call `accept`, which requires a matching native `offer.accepted` receipt. There is no Treasury report, confirm or Deed-writing method.

`createGardenRpcClient` supplies the existing Supabase HTTP RPC boundary with an explicit HTTPS source, source access-token callback, and public API key. It refuses redirects, missing sessions, unsupported operations and non-success responses. It has no actor-header fallback. This boundary is tested with a mocked HTTP transport, **not a live Supabase project**. Supply a normal user session, never a service-role token; the local fixture is not a deployable authentication server.

## Source-owned capacity guard

`integration/garden/capacity-admission.sql` is an **opt-in migration for the Garden authority database**, not a Treasury ledger. It adds private public-consent pointers, helper stock assertions, capacity-bound pledge associations, reservation flags, and private contact-consent rows. It uses the existing `witness_events`, membership rules and `command_idempotency` table. It preserves the original source acceptance function privately and exposes its original public signature through a guard. Authenticated clients cannot call the private original to bypass the guard.

The lock order is capacity, then circle. Under those locks the source rechecks exact registered hashes, live publication consent, availability/expiry, remaining stock, native need state, current circle head, and household authority. Reservation and the original native acceptance event commit together. A rejected command reserves nothing. Two communities racing for one wheelchair yield exactly one accepted reservation. Same-command retries return the original source receipt with an explicit replay marker; changing the command under that key is rejected. A replay marker is historical evidence, never a new availability grant.

Regular native offers with no bound capacity retain their existing behavior. They cannot be interpreted as reservations against this inventory. Confirmed stock remains consumed; the experiment deliberately has no automatic restock, release, cross-database reservation, or disputed-reservation reclamation. A helper can explicitly revise their quantity assertion, but cannot lower it below reserved units or revive a withdrawn identity. These checks cannot stop a human from making unrelated physical promises outside the source system.

The migration is installed automatically **only in the isolated harness**. A real Garden owner must review and install it in their own authority database, apply the existing migrations in order, reload the PostgREST schema cache, and wire their normal authenticated session and public opt-in UI. Treasury deployment alone cannot install or operate a new source authority. No production donor schema was changed. Do not reverse this migration while reservations exist: the original unguarded API would lose the stock invariant.

## Contact consent and withdrawal

Two distinct authenticated parties—the original source requester and capacity helper—must consent independently to a capacity-bound introduction. `rpc_consent_capacity_contact` stores only the latest decision and expiry privately. `rpc_capacity_contact_allowed` checks both parties, accepted reservation, current manifest hashes, publication permission and current windows. Outsiders cannot query permission or submit consent. Decline, withdrawal, expiry and source revisions block later introductions.

`nativePrivateIntroduction` invokes a trusted private provider only after this source check. The native test proves one-party consent does not invoke the provider and withdrawing consent blocks the next attempt. **The actual contact-delivery provider is a synthetic callback**: no secure messaging service, real contact exchange or encrypted transport is claimed. A production provider must authenticate delivery to these parties, perform the gate at delivery, and never cache approval for subsequent disclosure. Revocation cannot recall contact information already disclosed.

`exchangePrivateContact` separately demonstrates signed consent envelopes for a portable private coordinator. It requires fresh source challenges and the latest private decisions, rejects substituted/expired/revoked consent, and never admits consent to a public mirror. Its private reader/provider callbacks are simulated. Neither contact path writes contacts into a manifest, mirror or witness event.

Publication withdrawal produces a signed terminal tombstone and disables the source's public pointer. It cannot be re-enabled under the same identity. New public views use `publicRoutingPage`, which challenges the source hash and HOLDS on withdrawal, source outage, expiry or mismatch; fulfilled source needs stop returning a public hash. A stale mirror may retain historical categorical evidence but cannot create a fresh public request or source allocation. Already exported historical files cannot be erased from uncooperative hosts.

## Host loss and cold evidence

Two logical mirrors retain the full signed need **and independent capacity** histories. Each rejects bad signatures, source/key substitution, history gaps, stale origins and forks; bundle import is atomic. The cold verifier runs in a fresh process with public files only and reconstructs deterministic candidates, explicitly reporting that it has no authority.

The native test accepts a bound pledge, sends SIGKILL to the actual PostgreSQL process, starts a fresh process using its durable volume, and verifies that the reservation survived WAL recovery. Neither cold mirror supplies owner confirmation, and a second community still cannot claim the stock. The two mirrors are simulated on one machine, not independently administered external servers.

## Capability evidence matrix

| Capability | Simulated boundary | Locally demonstrated | Externally verified |
| --- | --- | --- | --- |
| Explicit Garden requirement selection / POUR | Synthetic private slip and human selection | Pinned real Garden functions and native `need.opened` SQL | No real household |
| Native authentication / owner acceptance | JWT-claim fixture replaces Supabase token verifier | Real PostgreSQL roles, source membership/authority RPCs and native acceptance receipt | No live Supabase/PostgREST login |
| Independent physical capacity | Synthetic wheelchair/firewood assertion | Ed25519 signature, source hash registration, exact-unit router | No verified inventory or physical delivery |
| Duplicate reservation defense | Two synthetic communities | Concurrent database sessions, one source reservation, crash persistence | No federation of source databases |
| Delivery report / confirmation | Synthetic human claims | Real donor report and separate household confirmation RPCs; self-confirmation rejected | No physical-delivery witness |
| Contact consent | Synthetic contact provider; signed coordinator callbacks | Both real source actor consent RPCs required; revocation/outsiders blocked; no public contact export | No encrypted messaging or real contacts |
| Treasury host loss / mirror portability | Logical mirrors on one machine | Fresh Node processes replay both signed histories; PostgreSQL survives SIGKILL | No independently administered mirrors |
| Supabase HTTP client | Mock HTTP transport | Session forwarding, fail-closed errors, redirect/operation restrictions | No live HTTP source execution |
| Full Measure / standalone Jubilee Campfire / BananaGram / reLATTE | Inspected or described contracts only | No adapter execution claimed | None |
| Funds / emergency response | Not implemented | Zero funds in the goods lifecycle; no payment calls | No payments or live emergency readiness |

## Hostile gates and results

On this branch: **38 protocol/routing tests (17 original + 21 new), 14 native integration tests, zero skipped or failed**. The unchanged 001 demo also passes. Required hostile cases map to:

| Scenario | Gate / evidence |
| --- | --- |
| Mirrored destination/contact substitution | Strict public fields plus signature validation; source/key continuity |
| Withdrawn HelpSlip or emergency requester declines publication | No held-slip ingress; separate public opt-in; terminal source withdrawal; live page challenge/HOLD |
| Same wheelchair claimed by two communities | Capacity lock + same-transaction native acceptance; exactly one concurrent winner |
| Cord versus bundle | Exact unit equality in router **and** source pledge RPC |
| Expired/revoked after proposal | Actual elapsed expiry test; source hash/status/time recheck at acceptance |
| Host dies during handoff | Actual PostgreSQL SIGKILL + WAL recovery; public-only cold replay; no synthesized confirmation |
| No funds pledged | Native goods pledge → owner accept → helper report → separate owner confirmation |
| Proposal laundering / stale source history | Entire candidate comparison; registered exact hashes; source revision/stale-head checks |
| Unauthorized introduction | Two-party private source consent, party checks, revocation, signed-consent expiry/substitution tests |

AVAILABLE != RESERVED · MATCH != INTRODUCTION · INTRODUCTION != CONSENT · ROUTE != ACCEPTANCE · DELIVERY REPORT != CONFIRMATION · MIRROR != AUTHORITY.
