# PENNY-014 — Work / Matter Crossing

**Executable simulation. No real PENNY token, custody, vault, financial claim, coin deposit, interest or external payment provider exists.** This is a signed local accounting model and reLATTE HOLD specimen.

## Exact insight

**Completed work produces a PENDING allocation. Only separately accepted physical penny custody can release matching active units.**

The same pennies may remain in a stewarded Jubilee Box while a *separately recorded* holder position moves to a participant, organization or node. A physical withdrawal requires corresponding token surrender and retirement. Nothing about a digital signature verifies the actual physical contents of a box: source authority is limited to who signed an assertion.

    Work witnessed & quantified
                 |
             WORK event
                 |
          PENDING in treasury            physical side:
                 |                  DEPOSIT (depositor consent,
                 |                    box custodian, counter)
                 |                            |
                 +------- available backing --+
                               |
                       RELEASE with recipient consent
                               |
                   active PENNY positions per
                        WORK x BOX x HOLDER
                               |
                   dual-consent TRANSFER
                               |
                      signed SURRENDER
                      + dual box release
                               |
                      REDEEM + RETIRE
                        1:1 coin release

The generated token stays ledger-internal and cannot be publicly sent, sold, claimed as e-money or redeemed from a real organization. This prototype does not authorize public issuance.

## Two quantities, two independent sources

### Work-side source

A role-pinned work witness signs an exact record: unique work ID, typed beneficiary (`person:…`, `org:…`, `node:…`), positive award quantity, agreed work terms reference, work evidence commitment and completion timestamp.

A work witness **cannot** be the treasury steward, box counter, box custodian or participant under the immutable local key policy. The signing authority is an experimental policy role, not proof of a real person's identity, acceptable work, wage fairness or tax status.

Ledger `WORK` adds units only to `workProducedPending`. They are not circulating or spendable, are not "interest," and are not counted as physical coins.

### Physical-side source

A deposit references the box ID, globally unique deposit ID, donor/depositor ID, penny count, owner consent reference, box backing terms, observed timestamp and an evidence SHA-256 commitment.

To enter the signed source journal, **three distinct pinned keys must authorize the exact same claim**:
- depositor: claims permission to put the coins into custody under the stated backing/redemption terms;
- custodian: claims that a specific Jubilee Box accepted the coins;
- independent counter: claims the same physical count was observed.

The roles cannot share a key. Nevertheless, cryptography **does not prove three independent humans were physically present**, that the coins are genuine, or that the depositor owned them. Real-world enforcement is a separate launch gate.

### Treasury release

A release references the work ID, exact holder ID, explicit award terms, box ID and unique release ID, plus the holder's signed acceptance. It may consume only remaining pending work quantity and independently unencumbered book coins in a box whose last signed audit does not disagree.

Each unit is locked to one `workId × boxId` lot, even after transfers. No second release can encumber the same physical coin within the ledger.

### Movement to another network participant

The sender and recipient both attest to the precise same work/box/quantity/transfer ID. The source box does **not** move. The token position does **not** lose its original work provenance. A node or organization may be represented by a typed public-key identity, but the model does not establish a legal organization or the signer's authority to represent it.

### Redemption, retirement and physical release

A holder signs a token surrender with exact work/box/withdrawal ID, quantity, evidence hash and timestamp. Custodian and counter separately sign that exact withdrawal. The same event atomically reduces the holder's position, the outstanding tokens assigned to the box and the box's book coins, incrementing the cumulative retired count.

Duplicate withdrawal ID, insufficient holder position, forged signer or changed evidence rejects the entire event. A signed withdrawal is still only a custody **attestation**, not proof the coins physically reached a beneficiary.

### Dispute and shortage

- `DISPUTE` is signed by the work witness, freezes all active positions from that work ID including previously transferred parts. `CLEAR` requires a subsequent distinct signed witness decision. Pending work cannot release during a dispute.
- `AUDIT` requires custodian and counter signatures. If it reports fewer physical pennies than the signed box journal, the state exposes the discrepancy and freezes new releases, transfers and redemptions from that box.
- `LOSS` is a separately signed shortage/write-off of book coins. It never reduces the holder token balances by fiat. If liabilities exceed actual backing, the projection reports `auditedPhysicalShortfall` and stays frozen. Restoring book coins needs a separate three-party new deposit; a new audit must reconcile any other outstanding discrepancy.

This is not a legally sufficient resolution for a live backed token. Real-world shortfalls require claims treatment, incident review, and enforceable rights.

## Conservation

Define:
- `W` = total locally certified work allocation units.
- `P` = still-pending work units.
- `I` = cumulative released/issued units.
- `R` = cumulative retired/redeemed units.
- `A` = all holder positions currently outstanding.
- `C_b` = signed box book coins for box b, net of individually attested redemption and loss.
- `L_b` = outstanding claims pinned to box b.

The verified journal requires:

    W = P + I
    A = I - R
    A = sum_b(L_b)
    at RELEASE time: L_b + newly_released <= C_b
    at REDEEM time: holder_position >= surrendered units
    if physical audit contradicts book: freeze source box

If physical audit demonstrates actual shortage, outstanding liabilities may exceed the backing. **This is a recorded default/shortfall, not a license to silently cancel holders or mint substitute pennies**.

Because `WORK` and `DEPOSIT` are separate authority proofs, a work record cannot supply its own backing and a jar intake cannot allocate tokens to a worker.

## Synthetic reference execution

    npm test
    npm run penny014:demo

Fixture:
1. Witness signs 100 units earned by `person:maker-001`. Treasury shows **pending 100 / active 0**.
2. Maker consents to deposit 37 pennies into `box-jubilee-001`; custodian and counter attest. **pending 100 / active 0 / book coins 37**.
3. Maker authorizes release of 37. **pending 63 / active 37 / book coins 37**.
4. A separately witnessed 63-penny deposit adds backing to the **same** box; after a separate release: **pending 0 / active 100 / book coins 100**.
5. Maker and `org:station-001` both sign a 12-unit move; box still holds 100 on the local books.
6. The organization signs surrender of 7; box custodian and counter attest 7 coins physically leave. **active 93 / coins 93 / retired 7**.
7. Two witnesses audit that 93 remain.

All actors, keys, receipts and physical counts in this demo are created by the simulator. No actual coins, dollars, accounts, payouts, donations, members or organization powers have been accessed.

## Native reLATTE boundary

    npm run penny014:relatte -- ./private-signed-world.json /path/to/reLATTE ./private-relatte-014

This bridges the signed journal's digest and private-safe aggregate into a native `relatte.opaque-organ-spec/v0` with:

- `artifact_kind = PENNY_STATE_OBSERVATION_NOT_SPENDABLE_TOKEN`
- `requested_effect.permissionGranted = false`
- source-history head bound to the policy and signed journal head
- no private keys, account secret, donor address or spend rights

The independent native receiver issues distinct signed `RECEIVED` and `R3_HOLD` receipts. Cold replay of the unchanged world yields identical crossing and receipt identities. A later work/coin/redemption event changes the source head and crossing.

**Native reLATTE HOLD is not proof of physical backing, the right to mint, public spend permission, a bank deposit or a legal redemption promise.**

## Hard gates before real deployment

- Owner policy/consent and separate legal right of title and redemption for the penny backing, including what happens if a box operator disappears.
- Real independent verified identity, professional custody audits, tamper-evident boxes, witnessed physical handoffs and secure key management/recovery.
- Real work approval/compensation rules and dispute procedures, including disputes after token transfer.
- Consumer/financial-regulatory and taxation assessment before representing units as transferable redeemable claims, plus solvency, insolvency and theft contingency plans.
- Enforceability of holder claims; deposit and redemption fees, minimums, access, network latency and geographically disconnected boxes.
- No financial profit/interest claim: the work rule generates a conditional entitlement only, and physical pennies do not produce interest by being stored.
- Multiple node federation, offline conflict resolution, mint/redeem cross-node atomicity and public UI/QR integrations are NOT present here.

## Laws

`WORK CERTIFICATE != MONEY`
`WORK WITNESS != TREASURY STEWARD`
`DONOR CONSENT != LEGAL TITLE PROOF`
`BOX SIGNATURE != ACTUAL PHYSICAL INVENTORY`
`PENDING != ACTIVE`
`RELEASE <= UNENCUMBERED ATTESTED COINS`
`TRANSFER != BOX MOVEMENT`
`SURRENDER + WITHDRAWAL == RETIREMENT EVENT`
`LOSS != HOLDER CLAIM ERASURE`
`RECEIVED != ADMITTED`
