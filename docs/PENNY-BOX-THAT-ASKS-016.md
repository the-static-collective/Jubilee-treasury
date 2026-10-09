# PENNY-016 — THE BOX THAT ASKS

**Purpose:** prove a strictly noncustodial three-box composition: pennies, tools, and time can jointly propose a fourth physical box without inventing coins, work, tools, materials, permissions or a new legal owner.

**State:** local-only signed simulation. There is **no deployed P2P radio**, Autodisco agent, physical box, bank or cryptocurrency; source signed attestations are claims, **not external verification**.

## Three sovereign boxes

| Node | Starting source | Authority |
| --- | --- | --- |
| A — Jubilee Coin Box | *actual existing executable* PENNY-014 signed treasury state: **100 pennies in box-book custody; all 100 backing separate outstanding internal positions** | PENNY-014 treasury steward key. Can approve using a *read-only source reference*. Cannot spend collateral or manufacture new PENNY claims. |
| B — Tool Box | 3 separately owner-declared tools; initial material kits **zero** | Its own pinned Ed25519 owner key. A later owner-signed resource lot adds exactly **one kit**. |
| C — Work Box | 60 separately owner-declared labor minutes | Its own pinned Ed25519 owner key, not B, A or the inspector. |

A proposed 4th box needs: **one returned tool**, **one consumed material kit**, **45 completed labor minutes** and **zero pennies spent**. The initial request **HOLDs** because a physical kit is missing. Adding a separate signed kit opens a *new* signed, source-pinned candidate. The original candidate cannot pretend the kit existed.

### 1–11 dial console
Four input controls: exploration (1–11), risk (1–11), material attention (1–11), and 1–3 progressively fine 1–11 nested scales.

Dials adjust a **read-only candidate attention number**. They cannot change recipe requirements, work completion truth, donor intent, source ownership or grants. Candidate hash is independent of dial position. A dial setting never becomes an admission.

### Composition is not authority

1. **PROPOSE:** compare exact signed source histories; emit declared input requirements and independent missing-resource reasons. Nothing is reserved or built.
2. **SELECT:** owners A, B and C each sign their own append-only APPROVE event referencing the same proposal hash. B reserves one kit and one tool; C reserves 45 minutes. A permits referencing the coin state **without assigning backing**.
3. **FABRICATE/WITNESS:** fabricator, independent completion witness and new-box owner sign the same exact bounded statement, including a digest of separately retained evidence, intended outcome, consumed kit, minutes, tool returned, and no penny backing consumed.
4. **APPLY:** each of A/B/C signs its own APPLY journal event with that complete verified evidence and previously agreed selection. Interrupted partial execution does **not** announce a fourth box.
5. **ATTESTED BOX D:** only after **all three** source-owner APPLY events and matching fabrication/witness/new owner proofs may the local projection report `SIGNED_COMPLETION_ATTESTED_NOT_PHYSICALLY_VERIFIED`. This is a signed **claim about completion**, not proof physical hardware exists or that D may already receive backing. D cannot autonomously issue tokens or accept custody.

Every resource event has node-owned Ed25519 signature, hash-linked ancestry, fixed schemas and idempotent replay. The model never performs atomic multi-host transactions or proves liveness of a physical manufacturing process. The A source head must remain pinned across the operation; audit shortfall invalidates the candidate.

## Failure experiments

- Box B offline while A and C select: **HOLD_AWAITING_OWNER_SELECTION**.
- Box B later signs, then goes offline during APPLY: **HOLD_AWAITING_INDEPENDENT_APPLY**.
- B cold-restores from a JSON snapshot and replays identical APPLY: **no second material kit or 45-minute charge**.
- Alter one owner signature, witness proof, new-box-owner acceptance, source event, plan requirements, or signed evidence: refuse.
- Try to issue PENNY as a construction side-effect or spend already-backed coin inventory: refuse.
- Attempt to approve a second build with the single kit still reserved: **HOLD_MISSING_RESOURCES**.
- Physical verification remains outside software: **never claim the assembled box was seen or tested in reality**.

## Executable demo

    npm test
    npm run penny016:demo
    npm run penny016 -- print ./private-receipt-016.html
    npm run penny016 -- bundle

`penny016:demo` runs only synthetic keys and events. No actual donor, coin, box, fabricated object, private key exchange or payment. The deterministic recipe pins real PENNY-014 signed source *semantics* and tests independently owned B/C resource journals. The printed offline HTML receipt includes a signed **source event plus SHA-256 hash and public signing key**, and tells the bearer to verify both current history and public key out of band. It is not a banking or charity acknowledgment and is not a QR code.

Note: `bundle` emits synthetic private signing-role public state and signed event ledgers to stdout, **not private keys**, but the simulation remains private. Do not publish real receipts or identify a beneficiary without permission. Never treat receipt signatures alone as physical custody truth.

## reLATTE native crossing

After the three-source simulated completion, the experiment can transport a **single opaque observation** to a sovereign reLATTE local receiver:

    npm run penny016:relatte -- ./private-field.json ./private-proposal.json /path/to/reLATTE ./private-016-receiver

The bridge invokes the actual `scripts/opaque-roundtrip.ts`, checks native receiver-signed `RECEIVED` and `R3_HOLD`, and tests replay stability. Crossing cannot grant authority to own coins, mint PENNY, admit Box D for public custody, deliver an actual manufactured box or confirm a payment.

`artifact_kind = BOX_FOUR_SIGNED_COMPLETION_CANDIDATE_NOT_CUSTODY`
`requested_effect.permissionGranted = false`

## Existing systems and what is/ isn't integrated

- **PENNY-014:** imported real existing source ledger and checked by `inspectWorld`. No new coin backing, no token issuance, no physical redemption.
- **PENNY-015:** preserves its two-sovereign messaging authority split; this experiment extends the concept to three sovereign independently signed resource journals, not a deployed multi-node protocol.
- **reLATTE:** actually calls existing native crossing implementation in opt-in CI. Signed observation only.
- **Static OS:** recipe and constrained proposal contract is compatible in spirit with compositional planners, but **no actual Static OS runtime is invoked in this PR**.
- **Full Measure:** work evidence/witness requirements are compatible with its intent; the run uses local fixture witness signatures, **not Full Measure's native provenance, job execution, or field verification**.
- **Radio dials:** runnable deterministic bounded interface values, **no RF hardware or transmission**.
- **PAPER:** printable offline proof of a signed local event; not a real QR, verified donor acknowledgment, or key recovery mechanism.

## Remaining gates for physical deployment

Owner consent and full legal scope; trustworthy physical measurement, materials provenance, tool safety, fabrication validation and independent human inspection; secure key custody/recovery; out-of-band public-key pinning; durable per-node crash-atomic persistence; offline disputes and source forks; identity and safeguarding protocols; clear agreements for child box maintenance, physical custody, and any regulated PENNY token/redemption right.

**The model's success is controlled ignorance:** it can confidently answer *what is missing* and will HOLD when it cannot demonstrate it from locally authorized history. It does **not** make a machine physically real by signing a certificate.

### Laws

`QUESTION != ANSWER`
`CANDIDATE != ADMISSION`
`DIAL != AUTHORITY`
`MATERIAL OFFER != OWNED MATERIAL`
`SELECTION != EXECUTION`
`SIGNED COMPLETION != INDEPENDENT PHYSICAL TRUTH`
`SAME COIN != NEW COLLATERAL`
`BOX D ATTESTED != BOX D OPERATIONAL`
`RELATTE RECEIVED != PHYSICAL CUSTODY`
