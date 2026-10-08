# DOOR REGISTRY 012 — every form has a door

**Status:** Runnable, local-first **noncustodial contribution entrance**; no live payment providers, wallets, station systems, charity accounts, vaults, payroll systems, or banking systems are connected. PR is an experiment layered on Jubilee Treasury's signed Trickle and reLATTE work.

## The single interface

Different things can become **separately addressable possibilities** without being prematurely converted into dollars or treated as fungible assets.

    Existing source owner + configured destination/physical offering
                           |
                 Owner-signed OPEN door
                           |
        Local public-safe static HTML index (optional)
                           |
            Someone uses the EXISTING channel
           (Cash App / Venmo / PayPal / wallet
                  / physical / useful work)
                           |
               Independent evidence and permission
                           |
        Local manual source report, if explicitly made
                           |
         Source-signed Trickle 009: observation only
                           |
             Native reLATTE signed crossing
                           |
             RECEIVED -> R3_HOLD by local receiver
                           |
      Separate asset-owner admission may occur elsewhere

`OPEN != DONATE`
`LINK != PAYMENT`
`PUBLIC KEY != VERIFIED RECIPIENT`
`SOURCE REPORT != PROVIDER RECONCILIATION`
`WALLET ADDRESS != ON-CHAIN FINALITY`
`PHYSICAL COUNT != CUSTODY`
`ASSAY != TITLE`
`WORK OFFER != SERVICE DELIVERED`
`RECEIVE != ADMIT`
`HOLD != OWNERSHIP`

## Supported door vocabulary

| Door | What is actually implemented | What **is not** implemented |
| --- | --- | --- |
| Cash App | User-supplied exact `https://cash.app/$Handle` link syntax, safe output, source-signed publication | No Cash App API, payment check, balance, donor identity or received amount |
| Venmo | User-supplied exact `https://venmo.com/u/Handle` profile link syntax | No verified charity status, QR generation, Venmo API, payments or fee accounting |
| PayPal | User-supplied exact `https://paypal.me/Handle` link syntax | No PayPal capture, PayPal webhook, donation receipt or merchant checkout |
| MetaMask-style EVM wallet | Read-only 20-byte public Ethereum-compatible lowercase address pinned to one supported chain ID | No wallet connection, seed phrase, private key, provider RPC, blockchain watcher, transaction finality or assets controlled |
| Jar of pennies | Explicit count of individual pennies, `unit=penny`; source may manually report 37 | No automatic bank conversion, physical custody or money transfer |
| Gold bullion | Explicit quantity in **milligrams**; absence of verified assay/weight/purity/title or any dollar pricing | No buyback, appraisal, vault, assay, exchange or estimated cash value |
| Equipment / supplies | Explicit item count and local terms | No delivery confirmation, authentication, warehousing, shipping |
| Volunteer time, compute, transportation, broadcast rights | Explicit minutes, compute-hours, miles or license units and terms reference | No automatic scheduling, performance confirmation or rights assignment |

The exact provider URLs must be deliberately supplied by the local owner. The code does **not invent payment handles**. A valid domain/path is not proof the handle belongs to an authorized recipient or verified charity. Confirm the recipient by a separate trusted channel before going public.

### Source-backed provider shape, not integrated provider data

Cash App lets recipients share an existing $Cashtag or payment link: https://cash.app/learn/getting-started/how-to-send-and-receive-money

PayPal.Me uses owner-defined payment link names: https://www.paypal.com/us/cshelp/article/paypalme-frequently-asked-questions-help432

Venmo charity QR and profile links remain owner-managed via Venmo: https://help.venmo.com/cs/articles/qr-codes-for-charity-profiles-vhel217

MetaMask never needs to reveal its Secret Recovery Phrase to receive a transfer. The only data allowed in this door type is its public **lowercase EVM address** and an explicit network. Upper/mixed-case checksum addresses are rejected in this bounded prototype rather than pretending to verify EIP-55. Never enter a Secret Recovery Phrase or private key: https://support.metamask.io/stay-safe/safety-in-web3/basic-safety-and-security-tips-for-metamask

No provider-backed payment verification has been built. Future adapters require source-owned, signed/verified webhook or settlement records, and independent custody and regulatory review. **The source signer here is a local Jubilee operator**, not any named provider, beneficiary or charity.

## Local demonstration — jar of pennies

Node.js 20+.

    npm test
    npm run doors:demo

`doors:demo` produces only three **synthetic** doors (37-penny experiment basis, bullion and contributed time) with no public payment URLs, no real people, no money, no posted address and no external effects.

### Configure an operator workspace

    npm run doors -- init ./private-doors local-owner-doors-012 purpose-neighbor-support-001

The directory gets:
- `private-door-signer.json` — locally generated Ed25519 private signer key. Protect and back up securely; never commit.
- `door-config.json` — allowlisted private source ID and purpose(s).
- `registry.json` — owner-signed open/withdraw door history; the immutable source provenance.
- `inbox.json` — signed Trickle 009 source reports; **not payments**.

Open one physical door by preparing a local `penny-door.json` file containing:

    {
      "id": "penny-jar-001",
      "kind": "physical",
      "purposeId": "purpose-neighbor-support-001",
      "termsRef": "terms-contact-steward-001",
      "publicationRef": "owner-approval-for-directory-001",
      "target": {"assetType":"pennies","unit":"penny"}
    }

Then:

    npm run doors -- open ./private-doors penny-door.json
    npm run doors -- show ./private-doors
    npm run doors -- board ./private-doors ./door-local-board.html

The board is **local HTML only**, without cookies, scripts, forms, analytics, donor identity capture, wallet interactions or payment processing. It is not hosted or deployed. Publishing the board or connecting a public QR requires explicit identity/recipient verification, careful permissions, safety moderation and separate authorization from any organization whose name would be used.

### Explicit manual source observation

To source-sign a local claim that **37 pennies are offered**, make a private report:

    {
      "eventId":"penny-count-report-001",
      "assetId":"penny-jar-asset-001",
      "quantity":37,
      "evidenceHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "observedAt":"2026-10-08T18:00:00.000Z",
      "sourceAuthority":"local_operator_claim"
    }

The example evidence hash above is **synthetic**, not a verified count. Real source assertions should reference actual retained private evidence under an approved steward process, and should not be turned into public claims without appropriate verification.

    npm run doors -- record ./private-doors penny-jar-001 penny-report.json
    npm run doors -- show ./private-doors
    npm run doors -- hold ./private-doors penny-jar-asset-001 ./door-observation.json

A `record` is only a local operator's source-signed assertion, **not** proof of external payment, human identity, provider settlement, custody, assay or delivered volunteer service. The static board is not an input collector; it cannot record a payment merely because someone clicks a link. The software does not permit a status of `settlement_reported` or `delivery_reported` from these source doors. Source reports remain `offer_reported` for physical, wallet or service objects and `pledge_reported` for a manually claimed USD payment intent. This deliberately cannot count Cash App / Venmo / PayPal or wallet income.

To revoke new traffic through the door:

    npm run doors -- withdraw ./private-doors penny-jar-001 owner-withdrawal-001

A new local board excludes the withdrawn link, but already shared HTML is not recalled from caches or copies. Previously recorded observations remain historically verifiable; they are not fresh authorization for another transaction.

## Native signed reLATTE receiving world

After one has created a **private signed Trickle source observation** above, install reLATTE's local donor runtime and dependencies, then:

    npm run doors:relatte -- ./private-doors penny-jar-asset-001 /path/to/reLATTE ./door-native-work

This calls the *real* `scripts/opaque-roundtrip.ts`, produces source-signed crossing + distinct receiver-signed `RECEIVED` and `R3_HOLD` receipts, and checks cold replay stable crossing/receipt identities.

The receiving world is an independent *local test receiver*. Its HOLD is not legal title, verified charitable acceptance, a bank balance, completed delivery or permission to perform work. Actual downstream acceptance could use Asset Treasury 007 under its own owner-local rules and explicit terms.

## Hard limits before launch

- No identity/authentication for the asserted recipient or self-attested publication consent. The steward public key must be pinned and checked out of band.
- A static payment link lets people leave for a third-party service; it never verifies their actual transaction, invokes a provider API, requests a refund or confirms ownership of a wallet.
- EVM address support is currently a *read-only notation*, not a QR, transaction parser or chain finality oracle. Wrong chain, token and public-address exposure risks remain.
- The current generic money-intent observation uses explicit `minor_usd`, not an international multi-currency payment ledger. It does not infer amounts from providers or cards and has **no fiat conversions**.
- Gold milligrams have no purity, assay or pricing semantics. A penny count has no bank settlement semantics. Counted physical gifts require separate custodial evidence.
- Service/rights doors use local terms references and cannot sublicense anything automatically.
- No anti-impersonation public publication authority, centralized moderator, escrow, tax receipt, private donor contact, DSA/KYC/AML controls, secure upload, scheduling service, webhook reconciliation or tax-deductible charity determination.
- Do not use a named radio station's payment URLs or fundraising claims without its approval.
- Registry and inbox store signed histories with domain separation. Cold replay detects edits and broken ancestry, but external current head pinning is still required to detect rollback/truncation.
- The signed private source report binds its evidence commitment to the current registry head. Removing/revoking a door prevents **new** source reports. Historical observations remain reviewable, never admission.

## Next executable experiments

1. Explicit charity/operator recipient verification and public-key trust pins before publishing payment links.
2. Provider-native payment receipts and reversal idempotency with consent; provider UI handles actual money.
3. Chain-specific read-only finalized transaction proofs and matched wallet receiver consent.
4. Two-witness physical custody evidence, scales/assay receipts, bank coin deposit events.
5. Offline low-bandwidth QR cards generated strictly from **owner-approved** destinations, separate from unverified handles.

**Design target:** everybody may contribute in the form they already have. Nobody is forced through our checkout. Every separate owner retains authority over what a source report means.
