# BANDCAMP SOURCE 011 — owner-controlled private sales import → Trickle → reLATTE HOLD

**Status: executable private importer, not a connected Bandcamp account.** No Bandcamp credentials, artist sales, buyer data, payouts, or source permission are accessible to this repo or its GitHub Actions. Actual owner-authorized reports must remain offline/private.

## Canonical references (October 2026)

- Official raw-data report instructions (Tools → raw data sales report): https://get.bandcamp.help/en/articles/15263368-reading-your-raw-data-sales-report
- Bandcamp report comparison (sale != payout != reversal): https://get.bandcamp.help/en/articles/15263083-which-sales-report-should-i-use
- Bandcamp Sales Report API v4: https://bandcamp.com/developer/sales
- API enrollment/OAuth rules: https://bandcamp.com/developer

Official raw CSV may contain buyer names/emails/addresses, payment destination, URLs, optional notes, and other sensitive fields. **Never upload the raw export to a public repo, issue, Actions artifact, drive share, chat, or screenshot**. All execution is designed for an owner-controlled local device.

The documented v4 API returns a `report` **array** with `bandcamp_transaction_item_id` for each item and `bandcamp_related_transaction_id` for reversals. Avoid legacy v3 object-map output, which can collapse repeated keys.

## No-friction intended flow

    Fan buys existing music/merch through Bandcamp as usual
              ↓
    Artist-owned authorized report or explicit CSV export
              ↓
    Private local Bandcamp Source 011
       whitelist safe transaction facts, discard buyer PII
              ↓
    Signed Trickle 009 claim, no payout authority
              ↓
    Distinct SALE / PAYOUT / FULL REFUND evidence
              ↓
    Optional reLATTE OBSERVATION_NOT_ASSET (HOLD only)
              ↓
    Owner independently reviews actual balance/rights
              ↓
    (maybe) a source-owned asset in Jubilee Treasury 007
              ↓
    (maybe) owner-authorized resource routing

**Do not put the Bandcamp checkout behind Jubilee.** The fan completes one ordinary purchase or contribution, regardless of whether Jubilee exists.

## Setup: real CSV import, no API enrollment needed

Requires Node.js 20+ and the [Jubilee Treasury](https://github.com/the-static-collective/Jubilee-treasury) branch containing this experiment. Use an owner-controlled secure local directory.

    npm test
    npm run bandcamp:source -- init ./private-bandcamp 123456 purpose-artist-income-001 bandcamp-artist-001

**Replace `123456` with the actual numeric `band_id` from your authorized Bandcamp account**, not the Bandcamp username or URL. The ID is a namespace chosen by the source owner; it does not authenticate ownership by itself. The operator's private Ed25519 key and policy-pinned private Trickle inbox are written under `./private-bandcamp`.

In your own Bandcamp artist account, open **Tools → raw data sales report** and download the desired date range as CSV. Keep the original file private. Then:

    npm run bandcamp:source -- csv ./private-bandcamp /secure/path/to/my-bandcamp-sales.csv
    npm run bandcamp:source -- show ./private-bandcamp

Repeat `csv` with overlapping downloaded periods. Signed items with the same transaction/item identity do not create duplicate contributions. Local exports may include row order variations and new reversal rows; source event identity is stable and **not** based on row number. When a legacy CSV lacks Bandcamp v4 item IDs, a deterministic source-row fingerprint provides fallback identity, but indistinguishable duplicate rows are refused instead of silently merged.

### Native hold interoperability

    npm run bandcamp:source -- hold ./private-bandcamp bc-sale-<opaque-id> ./bandcamp-hold.json

Replace the asset ID with an ID in the local `show` output. This returns `relatte.opaque-organ-spec/v0` with `artifact_kind=OBSERVATION_NOT_ASSET` and `permissionGranted=false`. The source descriptor itself is not a signed reLATTE crossing. To exercise an actual signed crossing, install the public reLATTE donor checkout locally and run:

    npm run bandcamp:hold -- ./private-bandcamp bc-sale-<opaque-id> /path/to/reLATTE ./private-bandcamp-work

This invokes the real reLATTE opaque roundtrip, issues signed `RECEIVED` and `R3_HOLD` receipts, and replays the same result idempotently. The independent test receiver HOLDS only an observation; no money, code, rights, authority or donor information is transferred.

**Never represent sale reports as Treasury-held funds or tax-deductible gifts.** The artist's approved payout report/bank ledger remains authoritative for the actual payment.

## Authorized v4 API route (if Bandcamp grants access)

Bandcamp says API access is provided to eligible labels and merchandise fulfillment partners on request. Artist API access should **not** be assumed. You must have explicitly authorized API credentials and access to the correct band ID from `my_bands`. Do not attempt scraping, cookie reuse, someone else's account access, or automated password login.

    export BANDCAMP_ACCESS_TOKEN='YOUR_OWN_SHORT_LIVED_OAUTH_ACCESS_TOKEN'
    npm run bandcamp:source -- api ./private-bandcamp "2026-09-01 00:00:00" "2026-10-01 00:00:00"

The adapter makes an explicit HTTPS POST to the documented `https://bandcamp.com/api/sales/4/sales_report` using `Authorization: Bearer`, `band_id`, `start_time`, and `end_time`. No token is saved in the source inbox, CLI arguments, or output. Unavailable entitlement or missing token results in refusal. Do not paste tokens into ChatGPT or GitHub issues. A responsible operator handles OAuth issuance, rotation, limited scopes and storage separately. Bandcamp's documented API may require async report generation for large windows; this first slice uses the synchronous v4 endpoint and intentionally rejects oversized reports.

A v4 JSON file from your own authorized sales API may also be privately imported without a live network request:

    npm run bandcamp:source -- json ./private-bandcamp /secure/path/to/authorized-v4-report.json

## Essential semantic boundaries

**Sale:** `item_type=album/track/package/...` creates a `money / pledge_reported` observation for **`sub_total + additional_fan_contribution`**, in original currency minor units, excluding shipping and tax. This is deliberately **not a bank settlement, payout, net income or artist profit**.

**Payout:** `item_type=payout` is a separate `money / settlement_reported` source claim, using `amount_you_received`. Source-reported payout still is not verified by bank records or a charity's accounting.

**Reversal:** `item_type=refund/reversal` must explicitly link to the original transaction via `bandcamp_related_transaction_id`. The private reconciliation index stores **only SHA-256 transaction commitments, opaque asset IDs, quantity and currency**, not buyer information. The importer automatically marks only a uniquely identified **full, same-currency refund** as revoked. A partial refund, missing link, ambiguous multi-item order or unmatched amount stays `HOLD_FOR_HUMAN_RECONCILIATION` and is not silently counted or used to adjust a cash balance. The Held list is in the immediate import response; an operator must address it, and future reporting needs a durable issue queue before production. Revocation preserves historical source proof; it does not itself initiate a refund.

**Currency:** monetary observations are integer minor units (`minor_usd`, `minor_eur` etc.) with explicit supported precision. Unsupported currencies/precision are refused rather than guessed. No FX conversion.

**Privacy:** The importer only reads a narrow set of required columns and hashes source transaction facts excluding buyer, contact, shipping, payment-account, visitor analytics, notes, SKU, artwork, lyrics, and URLs (aside from URL/name inside a cryptographic fallback item identity when no item ID exists). Do not expose buyer details in diagnostics or persist raw CSV inside the Treasury. The locally signed observations contain opaque asset IDs and quantities; they must remain private and should not be published individually.

## Reliability gates

- Strict CSV quote/column validation, bounded input size (12MB), bounded 20,000 rows.
- Source adapter Ed25519 private key stored under private directory, not Git.
- Local locked single-writer update: signed private inbox and hashed reconciliation index stored together in one atomically replaced state file.
- Duplicate file/API window → no new signal; conflicting same-identity row → error.
- Refund-only later export → private hashed transaction index enables exact full refund matching; multi-item ambiguity → HOLD.
- No direct automatic routing/valuation of Bandcamp financial claims. The Living Capacity Index 008 cannot spend them.
- No real data or API token in CI. Tests use fictitious synthetic sales and hostile buyer-PII strings.

## Still needed before always-on sync

API entitlement and explicit owner permission; a protected long-lived operator environment; safely managed short-lived Bandcamp OAuth tokens; private retry/checkpoint scheduling; payout reconciliation and partial-refund accounting policy; robust recovery and encrypted back-ups; historical currency precision/other currencies; verification of the artist's own actual export shape and any schema drift. A private scheduled CSV import isn't truly ambient until a legitimate authorized provider export is available automatically.

**The source connection is working as an importer, not yet attached to an actual Bandcamp account.**
