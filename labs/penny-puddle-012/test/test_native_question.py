"""Native MOTIF-003 source-only structural probe regression."""
from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import unittest


def load_probe():
    path = Path(__file__).resolve().parents[1] / "native_motif_question_probe.py"
    spec = importlib.util.spec_from_file_location("puddle_012_native_probe", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot import owned research probe")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class PinnedQuestionFrontierTests(unittest.TestCase):
    def test_actual_source_pinned_motif_runs_and_cannot_create_real_authority(self):
        module = load_probe()
        witness = module.run_native()
        self.assertEqual(witness["source_commit"],
                         "66d27cfbd077b2c91d0d86d66e320206d88d8f95")
        self.assertTrue(witness["native_003_executed"])
        self.assertGreaterEqual(witness["synthetic_moves_count"], 3)
        self.assertIn(witness["native_immediate_first"],
                      {"ask-learner-learning", "ask-mechanic-teaching",
                       "ask-tractor-color", "naive-skill-only-offer"})
        self.assertIn(witness["native_new_options_first"],
                      {"ask-learner-learning", "ask-mechanic-teaching",
                       "ask-tractor-color", "naive-skill-only-offer"})
        self.assertFalse(witness["original_module_is_bayesian_question_planner"])
        self.assertFalse(witness["original_module_has_calibrated_human_answers"])
        self.assertEqual(witness["actual_people_contacted"],0)
        self.assertEqual(witness["real_money_moved_cents"],0)
        self.assertFalse(witness["external_actions_authorized"])

    def test_no_native_source_or_modified_blob_blocks_execution(self):
        # The existing source verifier is intentionally reused from 005;
        # only the separately pinned source can load.
        module=load_probe()
        motif,sha,blob=module.load_pinned_motif()
        self.assertEqual(sha,"66d27cfbd077b2c91d0d86d66e320206d88d8f95")
        self.assertEqual(blob,"db25da0d50a9c8e2cd87aa576a22f969405737cf")
        self.assertTrue(callable(motif.analyze_first_moves))
        self.assertTrue(callable(motif.select_first_move))


if __name__ == "__main__":
    unittest.main()
