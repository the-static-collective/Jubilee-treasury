# REGENERATIVE CAPACITY 009 — Static OS work into Jubilee usable capacity

**Status: draft, synthetic cross-repository execution.** This is a runnable connection between the current Static OS CRANKNODE and Jubilee's Living Capacity Index, **not** a claim of physical asset creation, tax valuation, insurance coverage, credit issuance, custody, or autonomous production.

## What actually crosses

A previously implemented Static OS primitive executes ONE real software transformation:

```text
separately selected STATIC OS CRANKNODE TEXT.UPPERCASE turn
 → actual native Python function
 → exact result + unsigned, hash-addressed CRANK receipt
 → Jubilee verifies bounded deterministic result and receipt consistency
 → inert derived digital_artifact OFFER CANDIDATE (HOLD)
 → separate owner review + Treasury-steward signed OFFER
 → separate signed ACCEPT
 → separate signed RECEIVE attesting artifact existence
 → LivingIndexV0 now reflects one locally attested noncash artifact
 → declared multi-input recipe may newly become POSSIBLE
 → STOP — no second CRANK turn, physical execution, or auto-mint
```

Source program is pinned at **the-static-collective/static-os**, commit
`0d460524d0db129a8cccb0661cb9f533f3e6793b`. CI checks out that exact donor and invokes `crank.runtime.execute_turn` from the original module. This is **not** a rewritten Static OS work executor. It is the founding deterministic, ASCII-only `TEXT.UPPERCASE` capability, not the later QUESTION-FIRST/CAD host and not a live model. The Python runner executes exactly once and emits one synthetic JSON proof.

The source CRANKNODE receipt has `signature_status: unsigned-local-receipt`. A SHA-256 self-address validates internal consistency, **not producer authentication**. Recomputing every field can forge a self-consistent unsigned packet. Therefore Jubilee labels the result `SELF_CONSISTENT_UNSIGNED_NATIVE_FORMAT`, and its source commit field is a declared provenance label rather than an independent remote-attestation mechanism. The hosted CI exact SHA checkout provides separate build evidence for the tested fixture, but cannot prove that an arbitrary exported packet came from that checkout.

### Executable files
- `scripts/generate-native-crank-proof-009.py`: calls exact pinned native Static OS runtime once.
- `src/regenerative-static-os-009.mjs`: verifies source format and deterministic output; emits a bounded **non-authoritative candidate** with opaque asset ID and explicit source digest.
- `src/regenerative-demo-009.mjs`: separate native-work → hold → OFFER → ACCEPT → RECEIVE → changed index phases.
- `test/regenerative-static-os-009.test.mjs`: local mock-format hostile cases and optional exact native-donor evidence test.
- `.github/workflows/regenerative-static-os-009.yml`: pins actual donor, runs native Python, full Node tests, demonstration.

## Reproduce with a trusted exact donor checkout

```sh
python3 scripts/generate-native-crank-proof-009.py \
  --source-root ./donor-static-os \
  --out ./dist/native-crank-proof-009.json
STATIC_OS_NATIVE_PROOF=dist/native-crank-proof-009.json npm test
node src/regenerative-demo-009.mjs dist/native-crank-proof-009.json
```

The `donor-static-os` directory must be checked out from the exact pinned commit shown above. Do not provide private text or personal details to this public CI test. Output files contain the full transformed text and an unhashed source payload; treat non-synthetic versions as private.

## The economic result

Before native source work: the example owns one locally attested teaching hour but no digital artifact. Its declared `digital_artifact + time → educational_material` recipe is blocked.

After a single Static OS software turn: a text transformation really exists **in the synthetic specimen**. That proof by itself creates no Treasury capacity or legal rights.

After explicitly reviewed steward OFFER: the source artifact is merely offered, with available quantity zero.

After signed ACCEPT: still available quantity zero.

After separate signed RECEIVE: a steward **attests** one digital artifact is held with rights terms reviewed. The Living Index reports one locally available noncash artifact and one new *possible* education-packet composition. The packet itself does not exist merely because the recipe is now possible.

This is genuine **nonmonetary possibility discovery**, not money issuance or guaranteed increasing yield. New signed source events change the index. The output quantity is bounded; duplicate source turn IDs deterministically map to the same Jubilee asset ID and the local signed Treasury rejects a second OFFER of that same asset.

## Authority and safety

- Static OS owns bounded work and its unsigned source receipt. `TURN != LOOP`.
- Jubilee Treasury owns steward claims and exact local transitions. The steward's signature authenticates its own events, not the donor's origin or legal ownership.
- The person who submits an OFFER must separately review rights and identity. A boolean in a demo is an operator-request field, **not evidence of human presence**.
- Receiving a digital artifact means at most that a local steward attests receipt; it does not establish copyright clearance, exclusivity, independent witness, or resale value.
- reLATTE owns durable signed crossings / RECEIVED / HOLD if a **later** adapter uses those APIs. This 009 CRANK receipt is NOT reLATTE-signed. The existing Static OS CAD-005 and CAD-006 stacks do have native signed reLATTE artifacts, but those represent **digital models**, not fabricated mechanisms. Their proper next role is a separately source-verified CAD-evidence adapter under local admission.
- Human work, medical needs, physical supplies, loans, insurance, grants, and land rights remain distinct kinds with explicit terms and units; never assume universal unit conversion.
- Output hashes may reveal low-entropy private text by guessing. No personal or confidential work data belongs in public candidate JSON, GitHub CI or open demos. A real deployment must keep raw source and sensitive digests private and develop access controls and withdrawal.
- No automatic scheduling, next question turn, recursive minting, production grant, cash balance, verified charitable receipt or regulated financial account.

## Hostile acceptance
Tests cover forged source ref declarations, mismatched native hash/outcome, rights approval refusal, illegal chaining, source import deduplication, incompatible proposed AI output, output not created by recipe, no capacity on OFFER/ACCEPT, no physical or financial assertions, public projections without raw text and exact pinned native integration.

### Bigger possible future

QUESTION-FIRST 001 can identify a missing instrument. APPARATUS 002 can propose an instrument graph. CAD-005/006 can produce genuinely executed and signed digital engineering artifacts. A later **regenerative CAD adapter** should verify the actual native OCCT and reLATTE evidence and create only an explicitly reviewed design-capacity candidate. Independent physical fabrication, inspection, ownership, custody, actual productive utility and post-use return are separate human/physical gates.

**Core laws:** `COMPUTED != OWNED`; `SIGNED_SOURCE_EVENT != PHYSICAL_TRUTH`; `DIGITAL DESIGN != PHYSICAL CAPACITY`; `RECIPE != CREATED OUTPUT`; `OFFER != RECEIVE`; `NEXT OPPORTUNITY != NEXT EXECUTION`; `INDEX != FINANCIAL CREDIT`.
