# Jubilee Treasury — 001: portable needs, independent mirrors, human admission

**A need is not a fundraiser. Money is one possible response.**

This is a runnable **experimental protocol specimen**, not a deployed crowdfunding site or live emergency-response service. It is noncustodial: **no payments, bank details, escrow, identity verification, or live assistance are handled here**.

Jubilee Treasury lets a person publish a signed, portable, public-safe need once, mirror it across independent hosts, receive transparent *candidate* offers, and survive the disappearance of the original host. It demonstrates a family seeking firewood, groceries, a wheelchair, or transport, but accepts any declared bounded requirement.

## Execute

Node.js 20+; no dependencies:

```sh
npm test
npm run demo
```

The demo simulates three hosts. After the first disappears, two independent mirrors retain the owner's request, one accepts an owner-signed update, and a fourth host cold-restores from a signed bundle. It writes `dist/portable-need.json` and `dist/winter-need.html` (public-safe, static view). It also demonstrates a helper's signed offer, owner's acceptance, helper's report, and owner's separate confirmation. **These are simulated identities and claims, not physical delivery proof.**

## Non-negotiable distinctions

- `NEED != CAMPAIGN`: one request may have multiple independent public views.
- `MIRROR != OWNER`: mirrors verify signatures and preserve revisions; they cannot edit the owner's story.
- `DISCOVERY != ADMISSION`: resource matching returns explainable proposals, never an automatic allocation.
- `OFFER != ACCEPTANCE != REPORT != CONFIRMATION`: signed stages preserve who claimed what; signatures do not prove a real-world delivery.
- `PLEDGE != SETTLEMENT`: **no settlement model or payment integration exists in 001**.
- `PUBLIC != PRIVATE`: public manifest schemas are strict; do not put names, contact details, exact locations, medical records, or credentials inside public request summaries.
- `SIGNED != VERIFIED HUMAN`: keys show continuity of a signing key, not identity, need authenticity, or eligibility.
- `WITHDRAWAL != ERASURE`: signed withdrawal blocks future live matching; already exported documents may persist on uncooperative hosts. Do not publish sensitive information.

## Relationship to the other organs

- [Full Measure](https://github.com/the-static-collective/full-measure-world-layer) owns playable participation and local-world projections; Treasury must not create a parallel authoritative deed ledger.
- [Jubilee Campfire](https://github.com/the-static-collective/Jubilee-Campfire) owns circle-local Offer → Join → Remember and Pledge → Accept → Report → Witness transitions.
- [NanaSpork / Garden](https://github.com/the-static-collective/BananaSpork) owns private Help Slip HOLD, per-requirement human POUR, and its authenticated scoped shared actions.
- [BananaGram](https://github.com/the-static-collective/BananaGram-Gram-to-Fork) supplies lightweight mobile and messaging-based need/offer doorways.
- [reLATTE](https://github.com/the-static-collective/reLATTE) may carry well-defined crossings and receipts but does not become fundraising authority.

This repo currently implements **standalone typed signed envelopes**, not a real integration into these donors. See [`docs/BOUNDARIES.md`](docs/BOUNDARIES.md) for the adapter contract and remaining gates.

## Safety and production status

The reference protocol intentionally has no accounts, host authorization plane, anti-abuse reporting, real-world verification, notification delivery, payment rails, consent capture, private secure messaging, or jurisdiction-specific charitable-compliance framework. Never present it as an operational fundraising platform. A hosted deployment requires a separate product security/privacy review, safety reporting and appeal mechanisms, and compliance review for its payment provider and jurisdictions. Crowdfunding support is not automatically tax deductible.

**Software licensed under MIT; reference implementation is not a promise of support.**