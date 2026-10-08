# AMBIENT TRICKLE 009 — no new checkout, source-owned giving, low-work intake

**Status:** Experimental, executable **private observation inbox**. Not a fundraising portal, Kinship integration, public donation service, payment processor, charity accounting platform, or legal gift custodian. No station permission or connected giving data exists in this implementation.

## The long-term interaction

A donor follows **the giving path they already trust**. A neighbor offers a material gift through their own established community process. A volunteer helps using an existing scheduling system. Nobody is required to join Jubilee Treasury.

If and only if **the source organization authorizes a data adapter**, that adapter may emit a minimal, signed, privacy-safe report into a local drop folder:

    EXISTING SOURCE (station's processor, creator app, community inventory)
            |
    SOURCE-OWNED, AUTHORIZED ADAPTER
    (signs strict typed minimal event, no donor identity)
            |
    FILE DROP / OPTIONAL SCHEDULED SCAN
            |
    TRICKLE INBOX: VERIFIED SOURCE KEY + HOLD
            |
    local private observation projection
            |
    separate human steward acceptance and asset rights/custody review
            |
    Jubilee Asset Treasury 007
            |
    optional signed reLATTE RECEIVE -> R3_HOLD
            |
    independent recipient's explicit admission

The observer has **no write access** to the upstream source and no credentials for its payment provider. A pinned source-adapter key proves the signature came from *that configured adapter*, not that it is the station, an individual donor, or a settlement authority. The adapter does not exist yet for any live donor or station. A local synthetic adapter is supplied for tests.

This intentionally reuses:
- Asset Treasury 007: source-owned accepted asset inventory and terms-aware reservations.
- Living Capacity Index 008: candidate combinations of inputs that might enable work.
- reLATTE: transport of **observations** as opaque data into a separate owner's HOLD, never inherited financial or inventory authority.
- Kinship KINSHIP-006: *optional human-reviewed* public-safe program story candidates after entirely separate station consent.

## Zero-friction has three different meanings

**Donors**: zero new login or checkout for money; keep the original giving page. Other gifts retain their original offering mechanism. Nothing is redirected, intercepted or scraped.

**Source owners**: after explicitly authorizing and configuring a *separate* sanitized event export, no manual re-entry for each gift. The initial consent/security review and source mapping cannot be skipped.

**Jubilee operator**: once configured, a file drop can be scanned repeatedly by a trusted local scheduler using the CLI. Safe replay is idempotent, so an unchanged folder can be scanned again. This code does **not** start a daemon or schedule itself, and it does not connect to Kinship's provider or station systems.

When there is no authorized source feed, **there is nothing to ingest**. We do not infer donations from web pages, receipts found elsewhere, private prayer requests, social posts, or donor messages. A link to Kinship's official giving page remains a link, not a source connector.

## Strict source event

One source adapter emits a signed envelope with a source ID and a precisely bounded payload:

- opaque event ID, asset ID, revision number, and predecessor hash;
- typed kind, quantity (bounded **integer**), unit, purpose ID, and status;
- cryptographic **hash of referenced evidence**, not the evidence bytes;
- observation timestamp;
- an Ed25519 signature from the **allowlisted adapter key**.

Statuses distinguish:
- `offer_reported`: nonfinancial gift reported but not accepted or received;
- `pledge_reported`: a pledge, not settlement;
- `settlement_reported`: source *reports* a money settlement; Jubilee does not independently verify it;
- `delivery_reported`: source *reports* physical delivery; no recipient confirmation is inferred;
- `revoked`: this source observation is no longer active for future interpretation. This is **not** a legal refund or erasure of historical claims.

Money uses an explicit **integer minor currency unit**, e.g. `minor_usd`, so `2500` means $25.00 if the upstream adapter actually uses US cents. This prevents floating-point confusion. Neither settled claims nor nonfinancial pledges become Jubilee-owned money balances or confirmed inventory.

An event has **no** donor name, amount as narrative text, location, private contact, card numbers, prayer details, medical description, beneficiary ID, or unrestricted URL. Extra fields, unsupported purposes, unsigned records, corrupt signatures, contradictory reuse of an event ID, broken revision ancestry, forged asset-kind changes, and resurrected revoked observations fail closed.

The local inbox is intentionally private and must not be hosted at a public Git URL.

## Try the executable slice

Node.js 20+.

    npm test
    npm run trickle:demo

### Private source-policy initialization

An approved source adapter would supply a pinned Ed25519 public key. Write a local policy file of the form:

    {
      "schema": "jubilee.trickle-policy/v0.1",
      "policyId": "policy-ambient-trickle-009",
      "sources": [{
        "sourceId": "authorized-export-001",
        "publicKey": "-----BEGIN PUBLIC KEY-----\n...REAL PINNED ADAPTER KEY...\n-----END PUBLIC KEY-----\n",
        "allowedKinds": ["money", "goods", "service"],
        "allowedPurposes": ["purpose-station-001", "purpose-community-001"]
      }],
      "visibility": "private",
      "automaticDisposition": false
    }

That snippet is explanatory: replace the placeholder with a real key generated and administered by the authorized adapter operator. **No source adapter or station key is provisioned by this PR.**

    npm run trickle -- init ./private-trickle ./policy.json
    npm run trickle -- scan ./private-trickle ./approved-drop
    npm run trickle -- show ./private-trickle

A trusted operator may optionally arrange a local job to rerun the `scan` command at an agreed cadence. The scanner reads up to 100 *.json files per pass and atomically imports their signed events; repeats are no-ops. A malformed batch fails without mutating the held inbox. It never deletes the source files.

Use the same interface to ingest one signed JSON file:

    npm run trickle -- ingest ./private-trickle ./signed-event.json

After an observation, the operator may export a **non-authoritative HOLD candidate** shaped like reLATTE's current `relatte.opaque-organ-spec/v0`:

    npm run trickle -- hold ./private-trickle authorized-export-001 asset-candidate-001 ./observation-hold.json

`artifact_kind: OBSERVATION_NOT_ASSET`, `requested_effect.permissionGranted: false`.

The output is **not yet a signed crossing**; reLATTE's native tool can transport the candidate, then sign its own RECEIVE and HOLD. A recipient must not auto-ADMIT on the strength of the observation. Actual accepted resources can go through Asset Treasury 007's distinct native reLATTE HOLD interface after separate review.

## What changes over time

A few small source reports can accumulate into an explainable graph of *reported* capacity: possible supplies, hours, contributed rights and station-reported money outcomes. The **Living Capacity Index 008** can only compute against independently admitted accepted assets, not these incoming observations. That prevents a reported offer from inflating the list of resources we claim to own.

The service can stay quiet indefinitely, even when there are zero donations. Source signatures and private histories remain replayable. Withdrawal preserves attribution but suppresses the revoked report as a current opportunity.

## Important unresolved gates

- Explicit source consent, lawful source credential management, adapter maintenance, and true provider webhook/export verification.
- Source key rotation and revocation, replay across independent devices, authorized cross-host state sync, file encryption and backups.
- Real donor privacy/compliance agreements and an appropriate retention/deletion policy. A signed digest may still be sensitive by association.
- Station-authorized financial reconciliation and charity accounting, money-transfer and in-kind gift-acceptance review.
- Independently authenticated steward confirmation, real resource custody/rights proof, and safe beneficiary communication.
- No station announcement, broadcast donation solicitation, automated follow-up, or donor segmentation without explicit approval.

### Law

`TRICKLE != SETTLEMENT`
`OBSERVATION != ASSET`
`SOURCE SIGNATURE != PROVIDER TRUTH`
`FILE ARRIVAL != ADMISSION`
`ZERO EXTRA DONOR STEPS != ZERO INITIAL CONSENT`
`SLOW ACCUMULATION != AUTOMATIC SPENDING`

The experiment is successful if **the second, third and hundredth already-authorized source records** require no new staff or donor workflow, and if unplugging the source leaves the existing station and its supporters completely unaffected.
