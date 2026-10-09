# PENNY-015 — Two Sovereigns, One Penny

**Executable local simulation, not a deployed decentralized network, financial token, real coin vault, legal redemption contract, banking service or guaranteed safety protocol.**

Stacked on PENNY-014; keeps its physical evidence, work proof and transfer/redemption laws. This experiment proves a more precise boundary: **Node A may authorize work and propose movements; Node B alone owns the backing journal and may admit financial effects.** reLATTE can carry a signed *observation* of B state; it cannot grant A physical custody powers.

## What changes

| Participant | Sole local authority | Cannot do |
| --- | --- | --- |
| **Node A — Workbench** | Own Ed25519 source journal, independent work witness, signed candidate messages, separate receipt acknowledgments | Sign B's treasury journal, declare a box deposit, approve a false count, mint backed units unilaterally |
| **Node B — Jubilee Box** | PENNY-014 treasury signer, custody/witness-backed physical intake, independently evaluated release/transfer/redemption, durable signed B admissions | Pretend A authorized work without A's pinned signed certificate; overwrite A history |
| **Maker (person)** | Holder consent for release, token sender/surrender, depositor consent for own pennies | Represent the independent box counter or custodian |
| **Recipient organization** | Signed recipient acceptance and physical withdrawal surrender | Spend or redeem a position it never received |
| **Box custodian and independent counter** | Source-attested evidence of actual counted coins, loss and redemption | Establish physical truth merely through cryptographic signatures |

Nodes use different pinned signers. This is an *authority split* rather than a central simulated wallet with two labels.

## Signed protocol

    A: signed WORK certificate / independent proposal journal
          |
          | transport only; MAY BE LOST / DUPLICATED / REORDERED
          v
    B: verify A entire journal, pin A message event hash
          |
          | independently call native PENNY-014 ledger effect
          | (reject if insufficient real-source box attestations)
          v
       B journal event + B-signed exact-source receipt
          |
          | B serially commits BOTH to one immutable state snapshot
          | ACK may be dropped; source still cannot infer effect
          v
    A: verify B full journal, signed B receipt, exact native effect
          |
          | append own separate A-signed ACK
          v
      A and B can compare anchored histories, then continue

### Crash/resume boundary

The receiver-side transport accepts one A message at a time. B returns **one new immutable aggregate object** containing the PENNY-014 native journal and signed B admission receipts. This is the unit the caller must persist *atomically* before acknowledging. This experiment's demo uses in-memory JSON snapshots; there is **no crash-safe filesystem database, multi-host replicated storage, lease coordinator or network daemon here**.

If B state commits but its reply disappears, A has not recorded an ACK. Resending the **identical** proposal against the restored B state yields its original B receipt with **no new PENNY-014 event**. The sender then verifies receipt, source message hash, exact B event/sequence, and the whole signed B journal before recording ACK in A's independent history.

A repaired source branch that disagrees with an already pinned, previously admitted source event is refused: `SOURCE_FORK_HOLD`. A truncated/rewritten B journal cannot substantiate the same signed B receipt: `B_FORK_HOLD`. **No software can detect a hidden fork before independent checkpoints are compared.** Real distributed nodes need an external checkpoint exchange / reconciliation channel.

### Out-of-order messages

B refuses a previously uncommitted source proposal arriving after a later proposal, and refuses any *later* message until earlier A proposals reconcile. B's authority doesn't follow the latest message ID or wall-clock arrival order. It cannot treat a DISPUTE or REDEEM proposal still held in A's journal as though B has already executed it.

While a partition remains unresolved, A's messages are proposals only; B's last observed state is **not** a locally verified spendable balance on A. On a real network, further leases, expirations and independent recovery governance would be needed to prevent stale status from masquerading as fresh permission.

## Full synthetic challenge

    npm test
    npm run penny015:demo

The demo's trace:

1. A privately signs a 100-unit work certificate; network is **partitioned**. B remains 0 work, 0 active.
2. A sends the certificate. B commits 100 **pending**, but its response is dropped. A still has no confirmation.
3. Both nodes are serialized/reconstituted. A retries identical signed event. B returns original signed admission receipt; **pending remains 100, not 200**.
4. B **locally** receives 37 synthetic pennies under depositor + box custodian + counter signatures. A holder consent/release proposal can then activate only 37.
5. B separately receives 63 synthetic pennies. A proposes a new approved release for remaining 63; B's source-bounded state now has **100 outstanding tokens pinned to 100 booked pennies**.
6. A proposes a 12-unit move to a typed organization; actual maker **and** organization each sign the same TRANSFER. B holds coins physically while changing its locally authoritative holder balances.
7. The organization signs surrender of 7. B's custodian and counter witness an equal withdrawal. **93 units outstanding / 93 box-book pennies / 7 retired.**
8. A physical AUDIT changes the attested actual box count from 93 to 81. **12-unit shortfall, HOLD_REVIEW_REQUIRED.** Any unapproved new transfer/redeem fails closed.
9. B records a separately dual-signed loss write-off of 12. Claims remain **93 active units, 81 booked pennies, shortfall 12**; no automatic owner confiscation or imaginary reimbursement.
10. Another freshly authorized, triple-signed 12-penny DEPOSIT replenishes B's recorded backing. **93 outstanding / 93 coins / shortfall 0**, without new token issuance. This is only a synthetic reinstatement, not actual recovery.

No digital observation makes a penny into two. **An independently funded replenishment** can restore coverage without pretending to be interest.

## Hostile tests

- Unverified or fake A signer; altered source message or work certificate
- A attempt to sign B treasury journal; unsupported remote physical deposit / AUDIT / LOSS
- Replayed B commit after packet/ACK loss; duplicate receipt or deposit ID
- 38-unit request against 37 pennies; attempted 101st unit after 100 certified work
- Forged recipient signature, overdrawn holder or unconsented transfer
- Two divergent A branches, incompatible B journal history, invalid B receipt signatures
- Late out-of-order proposal and prior uncommitted work/dispute event
- Disputed work blocks already released positions from fresh movement
- Missing physical pennies freeze circulation; dual-signed loss doesn't erase claims
- Independent local restart and exact replay
- Read-only independent native reLATTE HOLD of B snapshots before funding, after funding, during shortage and after repair

## reLATTE integration

PENNY-015 reuses the **actual existing native PENNY-014 reLATTE runner** as a separate test:

    npm run penny014:relatte -- ./private-node-b-world.json /path/to/reLATTE ./private-node-b-reLATTE

The independent receiving world sees only:

- Signed source history head and a digest-bound state observation
- `artifact_kind=PENNY_STATE_OBSERVATION_NOT_SPENDABLE_TOKEN`
- Explicit `permissionGranted=false`
- Independently signed `RECEIVED` and `R3_HOLD` results

The receiver neither accepts physical penny custody nor money title, reissues tokens, chooses reward values, settles deposits or grants public redemption rights. Node A/B relay admission is **not the same** as reLATTE's independent receiver disposition.

## Boundary and unsolved production questions

1. Simulated nodes hold *JSON* histories, not real peer-to-peer online processes. No transport protocol, consensus, duplicate-safe durable queue, atomic disk transactions, distributed synchronizer or public identities are deployed.
2. The box book is based on locally signed *claims*. A signer may lie; cryptography does not independently verify coin authenticity, physical possession or that distinct keys represent independent humans.
3. During partitions, nodes cannot know each other's newest operations. They must HOLD offline spend assumptions; availability may be sacrificed for safety. Conflicting B key use/dual histories requires external checkpoints and human conflict resolution.
4. A's work witness controls award quantity under **agreed terms**, not an AI's valuation of human worth. Fair wages, labor and tax rules aren't represented.
5. Transferable/redeemable public PENNY tokens would need legal entity/issuer definition, custody and safeguarding, insolvency/claims protection, audits, loss allocation and financial regulatory assessment before any public use.
6. Access control, secure signer devices, clock integrity, encrypted storage, rate limits, fraud monitoring, revocation and dispute-resolution time windows aren't production-grade.

**Laws**

- `PROPOSE != EFFECT`
- `ACK_LOSS != NEW ISSUANCE`
- `A WORK WITNESS != B BOX OWNER`
- `A BRANCH != SOURCE TRUTH`
- `SOURCE CHECKPOINT != FRESH MONEY`
- `MISSING PENNIES != ERASED CLAIMS`
- `COLD REPLAY != SECOND PAYMENT`
- `B RECEIVED != A AUTHORISED TO SPEND`
- `RELATTE RECEIVE != ASSET ADMISSION`
