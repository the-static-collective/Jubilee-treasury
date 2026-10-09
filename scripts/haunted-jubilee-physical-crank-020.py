#!/usr/bin/env python3
"""PENNY-020 physical ingress bridge.

Use source-owned Static OS CRANKNODE-003 serial receiver and durable claim_edge.
This shim only transports an accepted local receipt to the Penny-020 cabinet.
No automatic restart, printer, currency, broadcast or next turn.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

def main():
    p = argparse.ArgumentParser(description="Consume one physical CRANKNODE-003 detent then exit.")
    p.add_argument("--static-os", required=True, type=Path, help="explicit checkout of the owning Static OS project")
    p.add_argument("--expected-physical-sha256", required=True, help="operator-pinned SHA-256 of crank/physical.py")
    p.add_argument("--tty", required=True, help="operator-chosen POSIX serial port (e.g. /dev/ttyUSB0)")
    p.add_argument("--ledger", required=True, type=Path, help="private, persistent native CRANKNODE gate ledger")
    p.add_argument("--baud", type=int, default=115200)
    p.add_argument("--timeout", type=float, default=10)
    opts = p.parse_args()
    root = opts.static_os.resolve(strict=True)
    file = root / "crank" / "physical.py"
    actual = hashlib.sha256(file.read_bytes()).hexdigest()
    if actual != opts.expected_physical_sha256:
        raise ValueError("source CRANKNODE-003 physical module hash changed; refuse, do not autodowngrade")
    if not (root / "crank" / "runtime.py").is_file():
        raise ValueError("required native CRANKNODE runtime unavailable")
    sys.path.insert(0, str(root))
    from crank.physical import read_one_tty_frame, claim_edge
    # Read exactly one newline-delimited hardware-origin shaped event; no loop.
    edge = read_one_tty_frame(opts.tty, baud=opts.baud, timeout_seconds=opts.timeout)
    # Source-owned gate fsyncs this edge BEFORE anything is sent to PENNY-020.
    receipt = claim_edge(edge, opts.ledger)
    packet = {
        "schema": "haunted-jubilee.edge-packet-020/v0",
        "source": "STATIC_OS_CRANKNODE_003",
        "edge": edge,
        "gate_receipt": receipt,
    }
    print(json.dumps(packet, sort_keys=True, separators=(",", ":")), flush=True)
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print("HOLD / " + str(exc), file=sys.stderr)
        raise SystemExit(2)
