# FALL SHARE ASSET TREASURY 007

**Operationally executable, local reference ledger — NOT an authorized Kinship station service or payment platform.**

Kinship's [official Fall Share 2026 giving page](https://donate.kinshipradio.org/pledge/kinship-radio-fall-share) remains the only money-giving link in this specimen. This treasury never receives funds, publishes donor lists, claims a station goal amount, or touches card/bank/payment data.

## Operable resource inventory

Donors may offer **any declared asset kind**, using a safe token such as `goods`, `service`, `time`, `equipment`, `space`, `compute`, `broadcast_rights`, `transport`, `money`, or `other`. Each asset has a kind, label, integer quantity, unit, gift/loan/license/service/external-funds mode, explicit permitted purpose IDs and a terms reference. Split mixed gifts into multiple discrete assets: rights ≠ equipment ≠ labor ≠ cash.

Asset transitions are independent and recorded in a local signed steward journal:

    OFFER → ACCEPT → RECEIVE → RESERVE → FULFILL
                                 ↘ RELEASE

A cash offer must be `kind:money` and `mode:external-funds`. Its RECEIVE claim can only be `external_settlement_attested` with a separate external evidence reference. It is never an automatically verified Kinship donation, nor spendable inside Treasury. In-kind deliveries use the distinct `asset_received_attested` assertion.

All events are signed by a generated local Ed25519 key and hash-linked, replayed with fail-closed state validation. This is **one local steward**, not multiple authenticated people. A signing key does not prove a gift was actually delivered, nor does a terms reference prove the legal rights have been transferred.

## Quick start — Node.js 20+, no npm dependencies

    npm test
    npm run treasury:demo
    npm run treasury -- init ./private-treasury

Save an ordinary UTF-8 `offer.json`:

    {
      "id": "asset-firewood-001",
      "kind": "goods",
      "label": "Two cords of firewood",
      "quantity": 2,
      "unit": "cord",
      "mode": "gift",
      "purposeIds": ["purpose-neighbor-heat-001"],
      "termsRef": "consent-local-001"
    }

Use the commands below:

    npm run treasury -- apply ./private-treasury OFFER ./offer.json
    npm run treasury -- show ./private-treasury
    npm run treasury -- matches ./private-treasury
    npm run treasury -- board ./private-treasury ./board.html
    npm run treasury -- export ./private-treasury ./ledger-export.json

Open `board.html` as a static read-only operator board. It shows separately: available noncash assets, possible need-to-asset matches, and external money attestations **without** adding them to official station fundraising totals.

Write each transition payload to a small JSON file; then use `npm run treasury -- apply DIR EVENT_TYPE JSON_PATH`. For example:

    ACCEPT  {"assetId":"asset-firewood-001","termsEvidenceRef":"steward-review-001"}
    RECEIVE {"assetId":"asset-firewood-001","evidenceRef":"manual-delivery-record-001","assertion":"asset_received_attested"}
    NEED    {"id":"need-heat-001","title":"Winter household heat","kind":"goods","unit":"cord","quantity":2,"purposeId":"purpose-neighbor-heat-001"}
    RESERVE {"id":"reserve-001","assetId":"asset-firewood-001","needId":"need-heat-001","quantity":1}
    FULFILL {"reservationId":"reserve-001","evidenceRef":"recipient-report-001"}
    RELEASE {"reservationId":"reserve-001","evidenceRef":"cancel-record-001"}

`DECLINE` or `WITHDRAW` an unaccepted offer with `{"assetId":"asset-firewood-001","termsEvidenceRef":"reason-001"}`. The system denies stale dispositions, double allocation, wrong unit/kind, mismatched purposes and artificial settlement claims.

Keys and ledger live inside `private-treasury`, not Git. Never publish the generated private key or donor data. Local backups must be protected; manually edited or interrupted locks require operator inspection. Truncation cannot be detected without independently pinning a previous head.

## reLATTE linked but not authority laundering

After a gift has a separate RECEIVE event:

    npm run treasury -- relatte ./private-treasury asset-firewood-001 ./candidate.json

The output uses the actual `relatte.opaque-organ-spec/v0` input contract in the current reLATTE `src/organ.ts`:

- `source_particular`: original asset identity
- `source_history_head`: source ledger's signed history head
- `payload_refs`: digest commitment to asset+head, no donor PII
- `donor_claims`: kind, quantity, unit, available, mode, purposes, terms reference, local receipt claim
- `requested_effect`: `HOLD_PROPOSAL_ONLY`, with `permissionGranted: false`

The output is a **candidate descriptor**, not a signed reLATTE crossing, receipt, or capability. For the genuine crossing, use reLATTE's own `sealOpaqueOrganCrossing` / `runOpaqueOrganRoundTrip` and a sovereign LocalReceiver, recording signed RECEIVE then owner-local HOLD. Don't automatically ADMIT or execute assets; the receiving organ must verify terms and separately decide.

## Authority map

- **Kinship Radio** owns official cash collection, accounting, broadcasts, volunteers and donor privacy.
- **Jubilee Treasury** owns typed local asset offers, steward dispositions, constraints, and portable proposals.
- **reLATTE** owns signing/carrying a crossing and receiving local disposition receipts, not the gift's meaning.
- **Full Measure / Campfire** owns human offer acceptance, practical work, and actual confirmation.
- **NanaSpork / BananaGram** owns private Help Slip HOLD and explicit consent-driven sharing.
- **Kinship Fall Share Room** remains a voluntary local producer desk, not a real payment or prayer intake service.

Before accepting real third-party gifts, a deployed service needs authenticated operators, secure private communication, beneficiary consent, custody/valuation policies, fraud response, takedowns, regulated payment handling, legal/tax review, and station permission if it claims to represent Kinship.

**Founding law:** `OFFER != RECEIVED != RESERVED != FULFILLED`. No cash shortfall is closed by a promised noncash item, no receipt proves external physical truth, and neither money nor a reLATTE crossing buys authority.
