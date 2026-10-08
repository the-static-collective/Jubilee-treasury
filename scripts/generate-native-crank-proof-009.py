#!/usr/bin/env python3
"""Run exactly ONE native pinned Static-OS CRANK turn for Jubilee 009 CI.

This writes a PUBLIC/SYNTHETIC test fixture. It never writes donor credentials,
reLATTE signatures, an OS grant, or a Treasury event.
"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

PIN="0d460524d0db129a8cccb0661cb9f533f3e6793b"

def main() -> None:
    p=argparse.ArgumentParser()
    p.add_argument("--source-root",required=True)
    p.add_argument("--out",required=True)
    args=p.parse_args()
    source=Path(args.source_root).resolve()
    assert (source/"crank"/"runtime.py").is_file(), "Trusted pinned STATIC OS source required"
    sys.path.insert(0,str(source))
    from crank.runtime import execute_turn
    registry=json.loads((source/"fixtures"/"cranknode-001"/"capabilities.json").read_text())
    request={
        "schema":"static-os.crank-turn-request/v0",
        "turn_id":"TURN-REGENERATION-009",
        "source":{"kind":"human","id":"owner-example-009"},
        "selected_capability":"TEXT.UPPERCASE",
        "budget_units":1,
        "authority_request":"none",
        "admission_request":"none",
        "payload":{"text":"Repair the bridge; share one usable instruction."},
    }
    bundle=execute_turn(registry,request)  # exactly ONE bounded native turn
    assert bundle["result"]["output"]["text"] == request["payload"]["text"].upper()
    assert bundle["receipt"]["signature_status"] == "unsigned-local-receipt"
    evidence={
        "schema":"jubilee.static-os-native-turn-evidence/v0",
        "donor":{
            "repository":"the-static-collective/static-os",
            "commit":PIN,
            "assurance":"UNSIGNED_LOCAL_RECEIPT_NOT_DONOR_AUTHENTICATION",
        },
        "registry":registry,
        "request":request,
        "bundle":bundle,
    }
    out=Path(args.out).resolve()
    out.parent.mkdir(parents=True,exist_ok=True)
    with out.open("x",encoding="utf-8") as f:
        json.dump(evidence,f,indent=2,sort_keys=True)
        f.write("\n")
    print(json.dumps({
        "native_source":"STATIC_OS_CRANKNODE_001",
        "source_commit":PIN,
        "turn_count":1,
        "receipt_sha256":bundle["receipt"]["receipt_sha256"],
        "authenticity":"UNSIGNED_LOCAL_RECEIPT",
        "authority_effect":"none",
    },sort_keys=True))

if __name__=="__main__":
    main()
