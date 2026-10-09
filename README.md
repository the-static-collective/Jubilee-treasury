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

## FALL SHARE ASSET TREASURY 007 — multimodal, locally operable gifts

The [Asset Treasury 007 operator guide](docs/FALL-SHARE-ASSET-TREASURY-007.md) describes a working signed local ledger for donor offers across money (external settlement **reports only**), physical supplies, volunteer time, equipment, licenses, facilities, and other typed resource classes. Need-to-capacity matching is deterministic and **proposal-only**; actual stewardship receipts, reservations, and fulfillment remain separate.

Run `npm test` (the native reLATTE integration test runs when `RELATTE_ROOT` points to an installed reLATTE checkout), then `npm run treasury:demo`. For a local operator state:

    npm run treasury -- init ./private-treasury
    npm run treasury -- apply ./private-treasury OFFER ./offer.json
    npm run treasury -- show ./private-treasury
    npm run treasury -- board ./private-treasury ./operator-board.html
    npm run treasury -- relatte ./private-treasury ASSET_ID ./candidate.json

The native hold adapter uses the **actual current** reLATTE `runOpaqueOrganRoundTrip` runtime, not a substitute simulation:

    npm run treasury:relatte -- ./private-treasury ASSET_ID /path/to/reLATTE ./local-relatte-results

This invokes a signed reLATTE crossing through file transport, receives `RECEIVED` and `R3_HOLD` signed receipts, and proves cold replay. The receiver is an independently constructed **simulation** that only HOLDS the claim. No gift ownership, payment, station permission, beneficiary authorization, or external delivery is conveyed.

For actual financial donations to Kinship Radio, use [Kinship's official Fall Share giving page](https://donate.kinshipradio.org/pledge/kinship-radio-fall-share). This experimental treasury is **not** Kinship-operated or authorized as a replacement payment path. No independently verified shortfall or official accounting total is claimed.


## AMBIENT TRICKLE 009 — silent, authorized inflow without a new donor checkout

The [ambient source inbox](docs/AMBIENT-TRICKLE-009.md) is a **private, standalone, runnable** signed observation queue for independently authorized source adapters. Donors use existing channels; after a source owner deliberately configures an export, a local operator can repeatedly scan signed, privacy-safe event files without manually copying every gift into the Treasury.

    npm run trickle:demo
    npm run trickle -- init ./private-trickle ./source-policy.json
    npm run trickle -- scan ./private-trickle ./approved-drop
    npm run trickle -- show ./private-trickle

No station data, donor data, payments, or real source adapters are connected. An observation is **not** an accepted asset, fund balance, real settlement proof, donation tax receipt, or reLATTE admission. Further consent, stewardship and recipient review are separate. A signed observation can be offered to native reLATTE as a `HOLD_OBSERVATION_ONLY` candidate, not as spendable inventory.

If Kinship never chooses to connect, their official giving and operations remain unchanged; the experiment does not scrape or infer their donations.


## BANDCAMP SOURCE 011 — private artist sales to Jubilee Trickle

[Bandcamp Source 011](docs/BANDCAMP-SOURCE-011.md) implements a real **owner-operated Bandcamp raw sales CSV parser** and an **explicitly authorized Bandcamp Sales Report API v4 client** with the existing private Trickle source signer. Sales, payouts, full reversals, and unresolved partial/ambiguous refunds remain distinct. No buyer names, emails, street addresses, payment account details or actual money move into Jubilee.

    npm run bandcamp:source -- init ./private-bandcamp BAND_ID purpose-artist-income-001 bandcamp-artist-001
    npm run bandcamp:source -- csv ./private-bandcamp /secure/path/to/your-bandcamp-sales.csv
    npm run bandcamp:source -- show ./private-bandcamp

Where eligible access has **already** been granted by Bandcamp and securely configured, the same CLI can call the official Sales Report API with an operator-supplied short-lived `BANDCAMP_ACCESS_TOKEN`. Missing authorization fails closed; API access is not generally available for all artist accounts. Raw owner sales reports can be used without the API.

The private signed inbox stores opaque source reports and an SHA-256 transaction reconciliation index only. An exact full, related refund revokes the original source claim; ambiguous/unlinked/partial refunds remain HOLD instead of becoming fabricated settlements. This is **not** Bandcamp-authorized charity giving, an official Kinship donation, a bank balance, or a transferable IP license. Neither a live artist account nor any Bandcamp credentials are connected to this repository.


## BANDCAMP SOURCE 011 — artist-owned sales reports with signed Trickle receipts

[Bandcamp Source 011](docs/BANDCAMP-SOURCE-011.md) adds a **runnable private importer** for an account owner's own Bandcamp Tools raw sales CSV, and an optional official Sales Report API **v4** adapter for accounts already granted API access. Buyer names, addresses and payment-account details are excluded from the minimal source observations.

    npm run bandcamp:source -- init ./private-bandcamp BAND_ID purpose-artist-income-001 bandcamp-artist-001
    npm run bandcamp:source -- csv ./private-bandcamp /secure/path/to/your-bandcamp-sales.csv
    npm run bandcamp:source -- show ./private-bandcamp
    npm run bandcamp:source -- hold ./private-bandcamp ASSET_ID ./observation.json

A separate `npm run bandcamp:hold` command exercises an **actual signed reLATTE crossing** into an independent local receiver that emits distinct `RECEIVED` and `R3_HOLD` receipts, without admitting funds or assets. Duplicate imports remain idempotent. Full, unambiguous linked refunds revoke the original observation; partial and unclear reversals HOLD for reconciliation. Sale, payout and refund reports are never conflated with available cash.

No live Bandcamp account is currently connected and no authenticated Bandcamp artist data has been read. The OAuth-gated API path needs Bandcamp's own authorization and a short-lived operator-provided access token; the owner CSV path does not. This does not affect fans' checkout, connect to Kinship, or assert any rights over artists' contributions.


## DOOR REGISTRY 012 — one entrance for every contribution form

[DOOR REGISTRY 012](docs/DOOR-REGISTRY-012.md) adds a **signed, locally owned registry of contribution doors** without inventing a new payment processor:

- Owner-configured **Cash App, Venmo and PayPal** provider links with strict, official HTTPS host/path allowlists and a public-safe, offline HTML board. No handle/recipient is invented or preapproved.
- An explicit, **watch-only EVM public wallet address** with chain ID. No wallet connect, keys, recovery phrases, RPC or blockchain transaction verification.
- **Pennies, gold bullion, equipment and supplies** with declared counts/units, but no custody or invented dollar valuations.
- **Volunteer time, compute, transport and broadcast-rights offers**, with terms references rather than assumed work performed or transferred rights.

    npm run doors:demo
    npm run doors -- init ./private-doors local-owner-doors-012 purpose-neighbor-support-001
    npm run doors -- open ./private-doors ./penny-door.json
    npm run doors -- board ./private-doors ./door-local-board.html
    npm run doors -- record ./private-doors penny-jar-001 ./penny-report.json
    npm run doors:relatte -- ./private-doors penny-jar-asset-001 /path/to/reLATTE ./door-native-work

The owner-signed registry can withdraw a destination. A local, manually asserted source report enters private Trickle 009 only as `offer_reported` or `pledge_reported`, **never as a provider-confirmed settlement, chain-confirmed crypto transfer or verified physical receipt**. A real native reLATTE crossing can carry the observation into separately signed `RECEIVED / R3_HOLD` without granting ownership. The 37-penny case is intentionally synthetic and does not require any bank account, payment handle, actual gold, or donor identity.

**This is a reusable front door, not a fundraising launch, live payment connection, hosted public service or charity verification.** Publishing another organization's donation links requires its explicit approval. Each actual contribution remains governed by its source and recipient owners.


## PENNY RECURSION 013 — accumulating held coins without fabricated interest

[Penny Recursion 013](docs/PENNY-RECURSION-013.md) is a signed-Asset-Treasury-pinned, read-only recursive **option planner**: a 37-penny steward-attested lot plus an independently accepted 63-penny lot accumulate into a 100-penny inventory; separately attested labor enables bounded candidate paths through counting, sorting, community art, storytelling, matching invitations and possible bank outreach.

    npm run pennies:demo
    npm run pennies -- inspect /secure/path/to/ledger.json purpose-neighbor-support-001 4 500 12

**One penny lot creates many *mutually exclusive alternative uses*, never multiple real coin balances.** Each hypothetical route conserves the exact source penny count and draws down its own scenario work budget; additional real coins require new locally signed OFFER/ACCEPT/RECEIVE events. The optional monthly compounding calculation is a separately labeled **illustration only**; actual earned interest and deposited cash always remain zero unless independently evidenced by real outside monetary systems (not integrated here). No fiat, physical custody, legal title or interest is produced by code execution.

CI exercises two distinct signed penny-asset native reLATTE RECEIVE/R3_HOLD crossings and exact cold replay, without any independent authority inference. This is an experimental source-attested plan, not a bank, collector appraisal, payment processor or deployed giving channel.


## PENNY-014 — Work / Matter Crossing (experimental token accounting)

[PENNY-014](docs/PENNY-WORK-MATTER-014.md) adds a **signed local simulation**, not a public token or currency. Work attested by a pinned independent witness creates pending PENNY allocations in treasury; **three-party signed physical coin deposits** create separately recorded box backing. Releases require consenting work holders and enough unencumbered coins. Movement between people, organizations and nodes requires both sending and receiving signatures while preserving the originating work and box. Redemption requires exact holder surrender and two box witnesses, retiring the units and recording the decrease in physical box count atomically.

    npm run penny014:demo
    npm run penny014:relatte -- ./private-penny-world.json /path/to/reLATTE ./private-penny-relatte

The synthetic demonstration witnesses 100 pending work units, 37 + 63 individual pennies deposited in a Jubilee Box, releases 100 backed internal units, transfers 12 to an organization, then retires 7 with a separately attested physical withdrawal. The final local source projection has **93 outstanding units, 93 book pennies, 7 retired**, zero generated interest. No actual coins or money moved.

Hostile tests prevent duplicate physical backing, forged work signatures, unauthorized recipient allocation, unsupported transfers, double redemption and missing-coin laundering. Disputed work and audit shortfalls freeze affected units while retaining claim history. A native signed reLATTE crossing carries only **the inert state observation**, with independent RECEIVED / R3_HOLD and cold replay. Neither a released *simulated* token nor its reLATTE observation creates enforceable redemption rights, bank collateral, actual custody, or public-money authority.

**Before any deployment**: establish legal issuer/custody/redemption obligations and holder protections, verified real identities and physical audits, secure keys, loss coverage, fraud/dispute mechanisms, financial-regulatory review and actual institution approval.


## PENNY-015 — two-node sovereignty, network partition and missing physical pennies

[PENNY-015](docs/PENNY-TWO-NODE-015.md) puts a **separately signed work node A** opposite a **sovereign PENNY-014 physical custody node B**. A may propose work, release, holder transfer and redemption using existing exact role proofs; B independently checks and commits one atomic local journal effect and signed source-bound receipt. Actual physical DEPOSIT / AUDIT / LOSS requires B's local owner/witness authority, not a remote A message.

    npm run penny015:demo
    npm run penny015 -- audit ./private-node-a.json ./private-node-b.json

The synthetic scenario disconnects A, drops B's signed ACK after a successful commit, kills/reconstitutes both local JSON worlds, and retries identically **without issuing again**. B then funds 37+63 pennies for 100 units of source-signed work, accepts a dual-consent transfer of 12 to an organization, redeems/retires 7 with three-party physical evidence, identifies a missing 12-penny discrepancy and freezes circulation. A separate deposit restores locally attested backing (93/93) without inventing money or deleting holder claims.

CI also feeds the B source world through the **actual native reLATTE** HOLD crossing before funding, while fully funded, during box shortfall and after recovery; distinct source states preserve distinct signed receipts, with exact cold replay for unchanged evidence.

This is a local adversarial protocol *specimen*, not a deployed distributed peer-to-peer network, user-visible payment instrument, verified coin vault, or public cryptocurrency.


## PENNY-016 — The Box That Asks: three sovereign boxes compose a fourth

[Experiment and boundary laws](docs/PENNY-BOX-THAT-ASKS-016.md). A source-owned PENNY-014 coin box (100 signed book pennies, all backing existing internal claims), an independently owned tool box (3 tools), and an independently owned work box (60 minutes) are combined by a **proposal-only** composition engine. It initially **HOLDs** because the construction kit is missing. A new independently signed kit receipt permits proposing—but not automatically executing—the construction of Box D.

    npm run penny016:demo
    npm run penny016 -- print ./private-receipt-016.html
    npm run penny016:relatte -- ./private-field.json ./private-proposal.json /path/to/reLATTE ./private-016-receiver

Nested 1–11 dials control attention only. Three resource owners must independently approve; a fabricator, external witness and incoming box owner must independently attest an exact completion statement. Only after all three owner APPLY records does the simulator show *signed completion attested*, never actual physical verification. It consumes **one kit and 45 minutes**, returns the tool, and preserves all **100 pennies and 100 PENNY backing assignments**. A printable HTML receipt carries owner signatures, source digest, and explicit nonfinancial warnings.

Hosted tests include forged proof/kit/inventory refusals, box disconnection and replay, lost/duplicate receipts, stale source heads, and a **native reLATTE R3_HOLD** of only the completed observation. No deployed hardware, live Static OS or Full Measure connector, QR, financial token, physical box construction, or real-money custody is claimed.


## PENNY-017 — hardware witnesses, local G-code/photos and read-only OctoPrint status

[Hardware evidence contract](docs/PENNY-HARDWARE-WITNESS-017.md). This is the first local live-capable *read-only* fabrication observation seam, layered on PENNY-016's three-box signed proposal/selection system. It can probe an operator-owned private/loopback OctoPrint server's STATUS API without sending a command, hash actual local G-code/photo bytes, bind two ordered job observations to the approved construction plan, and require three independent human-signature roles on post-job measurements. Only then is a PENNY-016 completion claim produced, without affecting existing coin backing or creating PENNY tokens.

    npm run penny017:demo
    OCTOPRINT_API_KEY=... npm run penny017 -- probe http://127.0.0.1:5000
    npm run penny017 -- fingerprint /private/box-d-part.gcode /private/photo.jpg

The default demo uses mocked read-only OctoPrint STATUS replies, sample G-code/photo bytes and synthetic signers. No printer, camera, real manufactured fourth box, physical inspection, money or actual wallet is connected. A photo hash is not image verification, and even a printer state saying "Operational" after printing does not establish that a real part was built. Native opt-in tests carry the resulting evidence-bound signed completion to actual reLATTE R3_HOLD; ownership, custody and issue rights remain false.

## PENNY-018 — actual operator-controlled physical capture, no machine execution

[PENNY-018 field-trial manual](docs/PENNY-FIELD-TRIAL-018.md) implements a privacy-preserving optional read-only printer-observation and physical evidence procedure. This new stage begins with an already **independently selected** PENNY-016 proposal, creates a fresh on-site challenge, captures two operator-requested read-only OctoPrint states, fingerprints real G-code/photo/inspection-note bytes, and requires three separate pinned human role keys to sign the exact same evidence manifest. Re-review always rereads the original local files; any change HOLDs.

    npm run penny018 -- init ./field.json ./proposal.json ./box-d-part.gcode ./private-field-trials/trial-001
    OCTOPRINT_API_KEY=... npm run penny018 -- observe ./private-field-trials/trial-001 http://127.0.0.1:5000
    npm run penny018 -- status ./private-field-trials/trial-001

See the manual for on-site independent inspection, signature handoff, and allowed/rejected commands. **No real printer or human was accessed during CI**, no automatic print or issuance occurs, and the output is only `EVIDENCE_READY_FOR_MANUAL_OWNER_REVIEW_NO_AUTOMATIC_APPLY`. Any Box D commissioning and PENNY backing/token permissions remain separate future authorized decisions.