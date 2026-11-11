import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from native_motif_probe import run_native, load_original_motif, initial_world, MOTIF_COMMIT


@unittest.skipUnless(os.environ.get("MOTIF_SOURCE_ROOT"), "requires pinned read-only MOTIF checkout")
class NativeCrossingTests(unittest.TestCase):
    def test_original_motif_is_loaded_from_pinned_source(self):
        native = load_original_motif()
        self.assertTrue(callable(native.analyze_first_moves))
        self.assertTrue(callable(native.select_first_move))

    def test_new_affordance_is_not_immediate_cash(self):
        report = run_native()
        self.assertEqual(report["motif_source_commit"], MOTIF_COMMIT)
        self.assertIn("raw-buyer-proposal", report["native_motif_immediate_first"])
        self.assertIn("inspect", report["native_motif_affordance_first"])
        self.assertGreater(report["candidate_first_moves"], 3)
        self.assertGreater(len(report["new_affordances_from_chosen_move"]), 0)
        self.assertTrue(report["distinct_first_choices"])

    def test_no_real_money_coin_or_execution(self):
        report = run_native()
        self.assertEqual(report["real_money_moved_cents"], 0)
        self.assertEqual(report["real_coin_actions"], 0)
        self.assertEqual(report["observed_external_events"], 0)
        self.assertFalse(report["world_predictions_are_real_evidence"])
        self.assertIn("NONE", report["execution_rights"])
        self.assertIn(("market", "all-quotes-fabricated"), initial_world())


if __name__ == "__main__":
    unittest.main()
