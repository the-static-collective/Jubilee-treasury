# Bounded adapters, safety, and the next public field test

## Source-owned authority (no parallel ledger)

| Donor | Read | Treasury may propose | Source must admit | Not allowed |
| --- | --- | --- | --- | --- |
| Full Measure | Opted-in, public-safe projected need + category/unit | Candidate resource alignment | Project opener and local witness process | Creating Deeds or awarding capacity |
| Jubilee Campfire | Human-approved public projection of a circle-local need | Portable request, candidate pledge | Circle's authenticated Pledge/Accept/Report/Witness API | Treating signed mirror records as confirmed physical delivery |
| NanaSpork/Garden | Selected per-requirement POUR after device-local HOLD | Public-safe portable Need projection | Explicit device human selection plus authenticated member RLS | Ingesting held drafts, private purpose, unselected requirements |
| BananaGram | Opted-in public need/offer intention | Share card, signed pointer, opt-in invitation | Destination circle human acceptance | Silent publishing of chats, device contact book, locations |
| reLATTE | Source-declared boundary envelopes | Structural mapping, transport receipt | Each receiving organ's local contract | Assuming transport grants source authority |

For each adapter record: precise source version and contract, readable surface, prohibited private fields, intended proposal, admitting human or authority, event/receipt refs, and failure/HOLD semantics. No adapters above are implemented in v0.1.

## Locality and category

Resources use explicit stable keys (`firewood`, `wheelchair`, `groceries`, `transport`), a unit, quantity, kind, and a **coarse** region. The simple matcher requires the same signed revision, requirement, kind, unit, and declared service region (or `remote`). The candidate list states *why* it matched. It does not score human worth, automatically prioritize distress, geolocate people, promise stock availability, or reserve a resource. Detailed addresses and contact information must be exchanged separately using a consent-based private channel, not public manifests.

## Key continuity and mirror operation

A `need` starts with a signed revision 1. Each subsequent owner-signed revision binds its immediate predecessor's SHA-256 digest. Mirrors reject history gaps, owner-key swaps, invalid signatures, forks and stale replays; identical latest replays are idempotent. Export is the sequence of **public** signed revisions. Another host can import this entire bundle without permission or continued access to the original host. Signatures make tampering detectable; they do not establish that a signer is the person named by a fundraiser or even that a real need exists.

A signed tombstone (`status: withdrawn`) is the strongest portable signal to halt new matching. Previously copied documents may remain publicly visible. Real emergency safety will require takedown, propagation, abuse moderation, key recovery, and safe redaction plans before deployment. Losing an owner key prevents updates in this prototype; do not claim recovery has been solved.

## Stages

1. A helper signs an `offer` referencing an exact signed Need revision and one requirement.
2. The requester signs `accepted` or `declined` about the exact offered object.
3. The helper signs a `report` referencing a specific owner-signed acceptance.
4. The requester may sign `confirmed` referencing that helper report.

This v0 demo demonstrates these signatures but does **not** provide a distributed dispute-aware event ledger, an independently signed third-party human witness, or external confirmation of delivery. It cannot determine truth from a cryptographic signature.

## Production gates

1. Define explicit consent and verified authorization for beneficiary ≠ campaign organizer, including revocation and handoff.
2. Secure private offer coordination, abuse reporting, moderation and appeals; defend spam, impersonation, duplicate campaigns, payment-link substitutions and coercion.
3. Protected payment adapter: provider-managed accounts and webhook verification, idempotent payment state, refunds and chargebacks. No donated funds touch core protocol or application server.
4. Legal and financial product review for jurisdiction-specific charity rules, taxes, payment processing, sanctions and appropriate emergency fund safeguards.
5. Non-optional accessibility and low-bandwidth workflows; privacy review for minors, DV survivors, health emergencies, exact locations and contact details.
6. Federated integration proof: two separately authenticated real users, two independently administered servers, live signed offer/accept/report with no authority laundering, cold boot, network outage, takedown requests and malicious mirror behavior.
7. Time validity / expired needs, replay protection on event acceptance, owner key recovery/rotation, signed off-chain removal notices, and no untrusted feed ranking.

### First acceptance goal beyond the isolated specimen

A NanaSpork user explicitly POURs one wheelchair requirement from held household context. Jubilee Treasury receives **only** a minimal public-safe projection. A BananaGram circle sees an eligible wheelchair offer but does not auto-post private chat or contact information. The requester, within the native Campfire authority plane, accepts it. A physical delivery report is distinct from human confirmation. Two independent public mirrors carry the same history while neither can accept on the requester's behalf.
