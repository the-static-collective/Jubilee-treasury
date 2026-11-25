"""QUESTION-012: source-pinned *native* MOTIF-003 structural question frontier.

This is a separate structural affordance probe, NOT the same decision-theoretic
Bayesian policy as question-value.mjs. The original MOTIF-003 code does not
represent realistic stochastic observations, consent, or calibrated personal
preferences; those must remain distinct from synthetic graph branches.

No real identities, contact sources, messages, money or external actions.
"""
from __future__ import annotations

from dataclasses import dataclass
import importlib.util
import json
from pathlib import Path
import sys


def load_pinned_motif():
    # Reuse the existing project's SOURCE-PIN + verified Git blob loader.
    old = Path(__file__).resolve().parents[1] / "penny-puddle-005" / "native_motif_probe.py"
    if not old.is_file():
        raise RuntimeError("Missing source-owned pinned loader from 005")
    spec = importlib.util.spec_from_file_location("puddle005_pinned_loader", old)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot import existing pinned MOTIF verification")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module.load_original_motif(), module.MOTIF_COMMIT, module.MOTIF_MODULE_GIT_BLOB


def first_world():
    return frozenset({
        ("phase", "unasked"),
        ("policy", "fictional-first-person-consent-assumed"),
        ("person", "no-real-identity"),
        ("agreement", "OFFER_ONLY_HOLD"),
        ("service", "none-performed"),
    })


def transition(world, old, next_phase, *facts):
    assert ("phase", old) in world
    return (world - {("phase", old)}) | frozenset({
        ("phase", next_phase), *facts
    })


def synthetic_options(world, _verbs):
    """Every 'answer' below is an imagined BRANCH, not an asserted human reply."""
    phase = next(value for name, value in world if name == "phase")
    results = []
    if phase == "unasked":
        results += [
            ("ask-learner-learning", ("fictional-learner",),
             transition(world, phase, "learner-answer-pending")),
            ("ask-mechanic-teaching", ("fictional-mechanic",),
             transition(world, phase, "mechanic-answer-pending")),
            ("ask-tractor-color", ("fictional-tractor",),
             transition(world, phase, "color-answer-pending")),
            ("naive-skill-only-offer", ("fictional-job",),
             transition(world, phase, "wrong-job-proposal")),
        ]
    if phase == "learner-answer-pending":
        results += [
            ("imagined-learner-prefers-learning", ("toy-yes",),
             transition(world, phase, "learner-wants-learning")),
            ("imagined-learner-prefers-service", ("toy-no",),
             transition(world, phase, "learner-wants-service")),
        ]
    if phase == "mechanic-answer-pending":
        results += [
            ("imagined-mechanic-prefers-teaching", ("toy-yes",),
             transition(world, phase, "mechanic-willing-teach")),
            ("imagined-mechanic-declines-teaching", ("toy-no",),
             transition(world, phase, "mechanic-not-teaching")),
        ]
    if phase == "color-answer-pending":
        results += [
            ("imagined-color-red", ("toy-red",),
             transition(world, phase, "color-red")),
            ("imagined-color-blue", ("toy-blue",),
             transition(world, phase, "color-blue")),
        ]
    if phase == "learner-wants-learning":
        results += [
            ("ask-mechanic-with-consent", ("private-self-report-required",),
             transition(world, phase, "mechanic-answer-pending")),
            ("stop-without-pressure", (), transition(world, phase, "stop")),
        ]
    if phase == "learner-wants-service":
        results.append(("respect-service-preference", (),
                        transition(world, phase, "stop")))
    if phase == "mechanic-willing-teach":
        results += [
            ("offer-joint-lesson-not-contract", (),
             transition(world, phase, "lesson-proposed",
                        ("opportunity", "joint-learning"))),
            ("offer-remote-coaching-not-contract", (),
             transition(world, phase, "remote-proposed",
                        ("opportunity", "remote-help"))),
            ("request-safety-terms", (),
             transition(world, phase, "safety-terms-pending")),
            ("no-deal-respects-autonomy", (), transition(world, phase, "stop")),
        ]
    if phase == "mechanic-not-teaching":
        results += [
            ("ask-alternative-format", (),
             transition(world, phase, "alternative-pending")),
            ("respect-no", (), transition(world, phase, "stop")),
        ]
    if phase in {"color-red", "color-blue"}:
        results += [
            ("ask-relevant-question-next", (),
             transition(world, phase, "mechanic-answer-pending")),
            ("stop", (), transition(world, phase, "stop")),
        ]
    return results


def fictional_utility(world, _initial):
    # This is a separate *structural* MOTIF-003 signal. Not the 012 Bayesian
    # value-of-information expected utility, not external value to a person.
    bonuses = {
        ("opportunity", "joint-learning"): 5,
        ("opportunity", "remote-help"): 2,
        ("phase", "wrong-job-proposal"): -2,
    }
    return sum(v for k, v in bonuses.items() if k in world)


def run_native():
    module, commit, blob = load_pinned_motif()
    world = first_world()
    moves = module.analyze_first_moves(
        world, None, synthetic_options, fictional_utility,
        horizon=3, max_worlds=120
    )
    immediate = module.select_first_move(moves, "immediate")
    affordances = module.select_first_move(moves, "new-choices")
    if not moves or not immediate or not affordances:
        raise RuntimeError("Native MOTIF-003 did not return synthetic first-move candidates")
    return {
        "experiment": "PUDDLE-012 x SOURCE-PINNED NATIVE MOTIF-003",
        "source_commit": commit,
        "source_blob": blob,
        "native_003_executed": True,
        "synthetic_moves_count": len(moves),
        "native_immediate_first": immediate["operator"],
        "native_new_options_first": affordances["operator"],
        "native_reachable_after_chosen": affordances["reachable_after_first_move"],
        "native_new_affordances": sorted([str(x) for x in affordances["new_affordances"]]),
        "original_module_has_calibrated_human_answers": False,
        "original_module_is_bayesian_question_planner": False,
        "comparison_with_JS_question_value": "Independent structural vs stochastic policies; numerical scores are NOT interchangeable.",
        "actual_people_contacted": 0,
        "external_actions_authorized": False,
        "real_money_moved_cents": 0,
    }


if __name__ == "__main__":
    print(json.dumps(run_native(), indent=2))
