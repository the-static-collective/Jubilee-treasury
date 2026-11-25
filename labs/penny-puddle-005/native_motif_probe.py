"""PENNY x PUDDLE-005: run REAL pinned MOTIF-003 on an invented coin graph.

No network, payment, credential, actual coin, title, offer, observation, AI
learning, mutation of project-owned state, or externally authorized action.
The MOTIF module is imported from a *separately checked-out* pinned source.
"""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

MOTIF_COMMIT = "66d27cfbd077b2c91d0d86d66e320206d88d8f95"
MOTIF_MODULE_GIT_BLOB = "db25da0d50a9c8e2cd87aa576a22f969405737cf"


def load_original_motif():
    root = os.environ.get("MOTIF_SOURCE_ROOT")
    if not root:
        raise RuntimeError("MOTIF_SOURCE_ROOT must point to a locally checked-out pinned MOTIF repository")
    path = Path(root).resolve() / "experiments" / "003" / "affordance.py"
    if not path.is_file():
        raise RuntimeError("Pinned MOTIF-003 source is unavailable")
    data = path.read_bytes()
    git_blob = hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()
    if git_blob != MOTIF_MODULE_GIT_BLOB:
        raise RuntimeError("MOTIF-003 source blob differs from pinned reference: HOLD, no auto-adaptation")
    spec = importlib.util.spec_from_file_location("puddle_motif_003_pinned", path)
    if not spec or not spec.loader:
        raise RuntimeError("Could not safely import native MOTIF source")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def initial_world():
    """Purely fabricated typed relations; none are observations of a real coin."""
    return frozenset({
        ("specimen", "held-by-fictional-owner"),
        ("authority", "fixture-owner-assertion-only"),
        ("backing", "not-pledged-in-fixture"),
        ("market", "all-quotes-fabricated"),
        ("phase", "unexamined"),
        ("sponsor", "budget-fictional"),
        ("settlement", "none"),
    })


def change_phase(world, from_phase, to_phase, *facts):
    assert ("phase", from_phase) in world
    return (world - {("phase", from_phase)}) | frozenset({("phase", to_phase), *facts})


def imagined_actions(world, _verbs):
    """Explicitly invented possible events; they never touch real people or cash."""
    terminal = ("phase", "sold") in world or ("phase", "kept") in world
    if terminal:
        return []
    outcome = []
    phase = next(v for k, v in world if k == "phase")
    if phase == "unexamined":
        outcome.extend([
            ("inspect-positive", ("fictional-specimen",),
             change_phase(world, phase, "screen-positive", ("cost", "screen-100"))),
            ("inspect-negative", ("fictional-specimen",),
             change_phase(world, phase, "screen-negative", ("cost", "screen-100"))),
        ])
    if phase == "screen-positive":
        outcome.extend([
            ("authenticate-rare", ("fictional-specimen",),
             change_phase(world, phase, "certified-rare", ("cost", "authenticate-2500"))),
            ("authenticate-ordinary", ("fictional-specimen",),
             change_phase(world, phase, "certified-ordinary", ("cost", "authenticate-2500"))),
        ])
    if phase == "certified-rare":
        outcome.append(("collector-proposal", ("fictional-collector",),
                        change_phase(world, phase, "sold", ("mock", "collector-net-9750"))))
    if phase in {"unexamined", "screen-positive", "screen-negative", "certified-ordinary"}:
        outcome.append(("raw-buyer-proposal", ("fictional-local-buyer",),
                        change_phase(world, phase, "sold", ("mock", "raw-net-380"))))
    if ("activity", "fictional-sponsored-story") not in world:
        outcome.append(("licensed-story-proposal", ("fictional-sponsor",),
                        world | frozenset({("activity", "fictional-sponsored-story")})))
    outcome.append(("preserve-owner-property", ("fictional-owner",),
                    change_phase(world, phase, "kept")))
    return outcome


def mock_utility(world, _initial):
    """Just a numerical study; mock funds are NOT real wallet balances."""
    weights = {
        ("mock", "raw-net-380"): 380,
        ("mock", "collector-net-9750"): 9750,
        ("activity", "fictional-sponsored-story"): 150,
        ("cost", "screen-100"): -100,
        ("cost", "authenticate-2500"): -2500,
    }
    return sum(v for k, v in weights.items() if k in world)


def run_native():
    motif = load_original_motif()
    world = initial_world()
    rows = motif.analyze_first_moves(world, None, imagined_actions, mock_utility,
                                    horizon=3, max_worlds=100)
    immediate = motif.select_first_move(rows, "immediate")
    affordance = motif.select_first_move(rows, "new-choices")
    if not immediate or not affordance:
        raise RuntimeError("No viable synthetic first moves")
    # The exact native implementation is pinned and invoked. It is a STRUCTURAL
    # first-move test, not an import of the PUDDLE JS belief-state policy.
    return {
        "experiment": "PUDDLE-005 x native MOTIF-003",
        "motif_repository": "the-static-collective/MOTIF",
        "motif_source_commit": MOTIF_COMMIT,
        "motif_source_blob": MOTIF_MODULE_GIT_BLOB,
        "puddle_contract": "penny-puddle-005/prediction-only-v0",
        "inputs": "fabricated relational coin/custody/collector/sponsor graph",
        "candidate_first_moves": len(rows),
        "native_motif_immediate_first": immediate["operator"],
        "native_motif_affordance_first": affordance["operator"],
        "new_affordances_from_chosen_move":
            [list(x) for x in affordance["new_affordances"]],
        "reachable_after_chosen_first_move":
            affordance["reachable_after_first_move"],
        "distinct_first_choices":
            immediate["operator"] != affordance["operator"],
        "observed_external_events": 0,
        "real_money_moved_cents": 0,
        "real_coin_actions": 0,
        "world_predictions_are_real_evidence": False,
        "execution_rights": "NONE / RESEARCH HOLD",
        "comparison_limit": "MOTIF-003 counts structural new actions. JS finite-horizon classical DP models independent costs and weighted outcomes; their scores are not interchangeable."
    }


if __name__ == "__main__":
    print(json.dumps(run_native(), indent=2))
