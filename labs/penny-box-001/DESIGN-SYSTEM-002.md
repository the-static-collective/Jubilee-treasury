# PENNY BOX 002 — physical + digital design

**Small things count.** The same original visual identity now unites the local phone page, a US Letter community poster, a collection-box front label, an optional narrow top strip, and a growing-penny emblem. **Still synthetic, localhost-only, and awaiting an owning church/steward.**

## Look and voice

- Penny/seedling emblem: contributions help something grow. **Not** a tradable token.
- Forest #163e32; deep evergreen #234f40; cream #faf5e8; copper #b57a42; gold #e6c48b.
- Georgia headlines with system sans-serif UI; no licensed font files or external font service.
- Invitation: **Small things count. Bring what you have. Help where you can.**
- Accessible basics: responsive mobile-first cards, focus-visible states, readable progress, button target sizes and live-status text. Still requires broader accessibility testing before public use.

## Editable physical pieces

| Source | Actual print size | Purpose |
| --- | --- | --- |
| [poster-letter.svg](assets/poster-letter.svg) | 8.5 × 11 inches | Public participation poster with a **deliberately blank** QR slot |
| [box-front-5x7.svg](assets/box-front-5x7.svg) | 5 × 7 inches | Adhesive/art front label for a reused container |
| [box-top-8x2.svg](assets/box-top-8x2.svg) | 8 × 2 inches | Optional top/slot-side label, not a physical die-cut plan |
| [mark.svg](assets/mark.svg) | scalable | The penny/seed emblem |

Use **Actual Size / 100%** in print dialogs. Reused collection tins and boxes vary: measure before cutting or applying a label. No coin-slot cutting measurements, secure collection hardware, cash handling policies or fiduciary controls are supplied.

The local app at `http://127.0.0.1:8797/` now serves the mobile-friendly page and `/print` as a print-kit index. The sources can be fetched directly via `/kit/poster-letter.svg`, `/kit/box-front-5x7.svg`, `/kit/box-top-8x2.svg`, and `/mark.svg`. The QR slot does **not** claim a working church app, website or payment link.

## When a real church-approved HTTPS page exists

To create a QR-embedded *copy* of the vector poster with an actual destination, use the **offline**, explicit-approval generator:

```sh
python3 -m pip install 'qrcode[pil]'
cd labs/penny-box-001
python3 scripts/build-poster.py 'https://REAL-APPROVED-DOMAIN.org/penny' \
  --approved-by-steward --output steward-approved-poster.svg
```

**Replace the URL** with the church's actual owned, authorized live HTTPS page. That illustrative address is not owned by this project. The script refuses generation without the explicit `--approved-by-steward` flag, cleartext HTTP, credential-bearing URLs, localhost, raw IPs, obvious placeholder domains, and overwriting files. The flag records the operator's **assertion** of approval; it does not independently verify church authorization or URL ownership. No network request is made to generate the QR. **Scan-test with more than one phone before posting.**

## Financial and privacy boundaries retained

The current public board uses the same typed observation journal as 001: physical pennies counted, received equipment, and confirmed service stay in **different units**. Anonymous interest does not contribute to progress. It does not receive names, contact information, payments or bank data. The penny motif does not mint or distribute PENNY, make anything redeemable, or validate tax donations.

Everything remains bound to loopback; **there is no deployed public mobile site** to put in a QR today.

Before any real physical collection, the owner must approve a collection policy, steward assignments, sealed-cash custody/counting, safeguarding and consent, privacy and retention terms, approved public HTTPS hosting, and any applicable charitable/financial requirements.

## Test

```sh
cd labs/penny-box-001
node --test test/*.test.mjs
```

New tests assert the physical artwork dimensions, source routes, HTML/CSS consistency, no invented public QR and refusal of unsafe QR generation.

**BOX != BANK · QR != AUTHORIZATION · OFFER != SERVICE · OBSERVATION != SETTLEMENT · PENNY != COIN COUNT**
