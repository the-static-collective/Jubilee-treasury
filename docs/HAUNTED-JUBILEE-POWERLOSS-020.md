# PENNY-020 — The Crank Remembers

A physical-crank-compatible offline experiment that can lose power halfway through a turn and still report what it knows afterward. Built on [PENNY-019 PR #22](https://github.com/the-static-collective/Jubilee-treasury/pull/22); this proposal is a separate draft.

## Test without devices

Run with Node 20 or newer:

```sh
npm run penny020:test
npm run penny020:demo -- /tmp/my-arcade-state
```

The second demo attempt using the same directory is refused: the synthetic edge is already consumed. The demo writes a claim, a printable UTF-8 postcard in `spool/<edgeKey>.txt`, and a preparation receipt. It does not print or create physical currency.

Inspect after a process restart:

```sh
node src/haunted-jubilee-powerloss-020.mjs inspect /tmp/my-arcade-state EDGE_KEY
```

Possible conditions include TURN_CONSUMED_NO_ARTIFACT, UNRECONCILED_SPOOL_FILE_HOLD, PREPARED_FILE_NOT_PRINTED, PRINT_ATTEMPT_STATUS_UNKNOWN_NO_RETRY, and SPOOLER_ACCEPTED_NOT_PAPER_PROOF. Missing work is never reconstructed merely from a prior intention.

## Hardware path, without claiming it has been connected

The [Static OS CRANKNODE-003](https://github.com/the-static-collective/static-os/pull/49) owner provides a POSIX TTY serial reader and a durable consumed-edge gate for a quadrature encoder ESP32. This experiment provides a small bridge into that existing code. Check out and review the source-owner branch locally; pin `crank/physical.py` by its SHA-256, and use a private, persistent ledger. A device operator would run:

```sh
sha256sum /private/static-os/crank/physical.py
python3 scripts/haunted-jubilee-physical-crank-020.py \
  --static-os /private/static-os \
  --expected-physical-sha256 PIN_FROM_SOURCE_REVIEW \
  --tty /dev/ttyUSB0 \
  --ledger /private/static-os-edge-ledger.jsonl \
  > /private/single-event.json
```

Only a single event is read. Static OS's source-owned `claim_edge` is fsynced before the packet is emitted. Then, with a separately human-reviewed postcard text file:

```sh
node src/haunted-jubilee-powerloss-020.mjs submit /private/arcade-state /private/single-event.json /private/postcard.txt
```

The resulting file is a postcard *candidate*. The serial packet plus hash receipt is not independently authenticated physical hardware evidence or proof of work. Authentic device and operator identity require a separate commissioning gate. A crash between native and local claims may sacrifice the attempt, not create a second turn.

## Optional local printer dispatch

Only the operator can explicitly start a single CUPS print attempt:

```sh
node src/haunted-jubilee-powerloss-020.mjs dispatch /private/arcade-state EDGE_KEY OperatorAlias
```

The program durably records dispatch intention before invoking `lp` with a fixed argument list and no shell. If interrupted, recovery reports unknown print outcome and refuses a second automatic attempt. A successful spooler status does **not** assert physical paper exists. Optionally, an operator and a second named human can file self-reported observation:

```sh
node src/haunted-jubilee-powerloss-020.mjs observe /private/arcade-state EDGE_KEY OperatorAlias WitnessAlias LocalNotesRef
```

These are unsigned human claims, not independent sensory proof. No live printer was contacted in CI. The older haunted camera and six-up visual developments remain separately owned by Pol-ish-roids; 020 prepares only a text postcard.

## Storage and authority

The local ledger uses exclusive create-once files, bounded input, file fsync and parent directory fsync. A claim is persisted before postcard generation. An interrupted or corrupted file remains refused. These guarantees depend on reliable filesystem durability and do not cover malicious operators, SD-card corruption, incomplete physical fsync, power loss before the acknowledged barrier, or rollback of the entire device.

Safety controls: no flash-bulb firing, motor or printer control except the explicit CUPS command, no automatic reprint or printing on boot, no camera upload, no token issuance, no real penny backing, no proof of donation or completed human service, and no Kinship publishing. The station owns station editorial decisions. Reusing an edge for another card is denied, including after power-loss interruption. A different device session is a separate event, not permission to retry this one.

**Invariants:** physical event is not semantic permission; file is not paper; spooler ACK is not proof of a sheet; memory of an interrupted action is not completion; human observation is not cryptographic authentication; a ghost's suggestion does not create custody, ownership or authority.
