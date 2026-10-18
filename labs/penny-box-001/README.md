# PENNY BOX — 001

> **NEW: PENNY BOX 002 — physical + digital identity.** See [the responsive phone page, printable box labels, US Letter QR-ready poster and offline steward-approved QR generator](DESIGN-SYSTEM-002.md). Open `npm start` and visit `/` for the new visual layout or `/print` to see the print kit. The QR area is blank until a real church-approved HTTPS site exists.

**Small things count.** A standalone, church-portable, **local-only** prototype for the pop-tab / Box Tops / church scrip *participation pattern*: a physical coin collection box, an accessible QR-ready community board, and **separate** records for counted physical pennies, candidate offers, received equipment and steward-confirmed service.

This is **not** a payment processor, PENNY mint, scrip system, verified donation portal, tax-receipt service or deployed church application. All sample community needs are synthetic. No church is endorsed or integrated.

## Quick start

Requires **Node.js 22+**, no external JavaScript packages.

```sh
cd labs/penny-box-001
npm test
npm run seed
npm start
```

Open `http://127.0.0.1:8797/` on the same computer. The synthetic demo creates three needs with **zero** recorded contributions: a 500-penny pantry box, eight grocery deliveries, and two devices for a future computing shelf. Once seeded, the demo refuses to seed the same journal twice. `PENNY_BOX_JOURNAL` may point to an independent, local data file for additional experiments.

The public page shows progress **by unit, not a single invented value**. Each card has a button to raise a hand anonymously. That signal records only a need UUID and a category (time, transportation, equipment, groceries); no name, email, phone, address, free-text statement, IP or other contact field is written to the journal. **An interest signal is not an accepted pledge or completed action.** Participants must speak directly with a designated church steward to arrange real help. An interest signal **never** changes a public progress bar.

The demo HTTP server binds to **127.0.0.1** only. Do not expose it to the Internet, a public church app, or real community data.

## Steward controls

Set a locally protected, random `PENNY_BOX_STEWARD_TOKEN` with at least 24 characters before starting the server. Without it, the administrative endpoints are unavailable. The example below is **not** a suitable production credential:

```sh
PENNY_BOX_STEWARD_TOKEN='CHANGE-ME-TO-A-LONG-SECRET' npm start
```

On the same computer:

```sh
export PENNY_BOX_STEWARD_TOKEN='CHANGE-ME-TO-A-LONG-SECRET'

# Public board includes the need UUIDs
curl -fsS http://127.0.0.1:8797/api/board

# Steward-only candidate signals, observations and need status
curl -fsS -H "Authorization: Bearer $PENNY_BOX_STEWARD_TOKEN" \
  http://127.0.0.1:8797/api/steward/ledger

# Record a physical observation ONLY after the steward counted the coins.
# Replace <NEED_UUID> with the pantry need ID from /api/board.
curl -fsS -X POST http://127.0.0.1:8797/api/steward/observe \
  -H "Authorization: Bearer $PENNY_BOX_STEWARD_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"needId":"<NEED_UUID>","quantity":7,"unit":"pennies","basis":"STEWARDS_COUNTED_COINS"}'
```

Additional steward-only HTTP actions: `POST /api/steward/need` with `{title,summary,goal,unit}` to open a reviewed need, `POST /api/steward/close` with `{needId}` to close it. For other observation units, use `deliveries` with `STEWARD_CONFIRMED_DELIVERY` or `devices` with `STEWARD_RECEIVED_DEVICE`. These are **human-recorded local observations**, not receipts proving that delivery, custody, banking or settlement happened.

## Physical box and QR

`GET /print` provides a companion poster with a reserved QR area. A real QR must be generated **after** the steward approves a public **HTTPS** address. A phone cannot reach your computer by scanning its `127.0.0.1` URL. This demo intentionally has no public address.

Optional local, offline QR SVG generator (uses the `qrcode` Python library; never a third-party QR API):

```sh
python3 -m pip install 'qrcode[pil]'
python3 scripts/make-qr.py 'https://example.org/penny' --output penny-box-qr.svg
```

The address shown is a placeholder, **not** a live site. Print or place the SVG beside the collection box only after scan-testing a steward-approved destination. No money, personal information, private tokens or signing keys should be encoded.

## Four distinct contributions

| Lane | What happened | Stored state | Public progress |
| --- | --- | --- | --- |
| **Box** | A steward physically counted coins | `pennies`, `STEWARDS_COUNTED_COINS` | Counted physical pennies; **not** a verified bank deposit, ledger balance or minted PENNY |
| **Hands** | Someone anonymously expressed interest | `CANDIDATE_ONLY` offer kind, no personal fields | **Never** counted as completed work |
| **Service** | A steward reports a delivery completed | `deliveries`, `STEWARD_CONFIRMED_DELIVERY` | Counted separately, not converted to money |
| **Equipment** | A steward records a received device | `devices`, `STEWARD_RECEIVED_DEVICE` | Counted separately, not credited as hosting-hours |
| **Shop** | Everyday shopping supports a church through an arranged business rebate | **Not implemented.** Requires separate signed agreements and reconciled financial records | None |

**PENNY's rule is preserved:** one potentially issued PENNY would have to represent one verifiably backed cent under an entirely separate custody, redemption and retirement process. **This prototype issues zero PENNY.** Counted coins aren't automatically-backed units, and hours of service do not create currency. This prevents counting the same money twice as spendable revenue and outstanding monetary claims.

## Journal and interoperability boundaries

The local `.local-demo/events.jsonl` is an append-only, typed single-writer observation journal with a SHA-256 hash chain. The chain helps detect accidental edits. **Anyone with filesystem write access can recompute these hashes**, so this is not tamper-proof evidence, a church financial control, cryptographic identity or a bank reconciliation. There is no fsync-grade crash recovery or multi-writer concurrency guarantee.

- **Jubilee Treasury**: a reviewed public-safe need could later cross to the Treasury's owner-signed need/offer protocol. This implementation does not claim that integration.
- **GHoT**: a contributed device could eventually become a verified computing host. Receiving hardware does not establish work, uptime or energy capacity.
- **reLATTE**: eventual signed, typed crossings for steward-approved views. Current journal rows are not reLATTE admissions.
- **Church Commons / Living Hymnal**: this independent program could be linked or embedded as a *read-only* church contribution doorway without installing a new church app.
- **PENNY**: no exchange rates, tokens, settlement, account balances, equity, rewards, tax certificates or payment rails exist.

## Before real congregation use

This lab needs steward and church consent, an abuse-reporting process, practical money custody and reconciled bookkeeping, data retention/deletion policy, child/privacy protections, safe contact workflows, vetted host/domain/HTTPS, accessibility testing, persistent anti-spam limits, CSRF protection, production authorization, backup/recovery, legal/charitable-compliance review, volunteer safeguarding and independent verification policies. **None of those production gates are satisfied yet.**

**Law:** SMALL != WORTHLESS · SIGNAL != COMMITMENT · OBSERVATION != SETTLEMENT · SERVICE != CASH · BOX COUNT != PENNY ISSUANCE · MIRROR != OWNER
