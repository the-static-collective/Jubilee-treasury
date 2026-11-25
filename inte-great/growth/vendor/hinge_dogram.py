from __future__ import annotations

from typing import Any


def _rule_map(rules: object) -> dict[str, str] | None:
    if not isinstance(rules, list):
        return None
    out: dict[str, str] = {}
    for rule in rules:
        if not isinstance(rule, dict):
            return None
        selector = rule.get("selector")
        relation = rule.get("relation")
        if not isinstance(selector, str) or not selector.strip():
            return None
        if not isinstance(relation, str) or not relation.strip():
            return None
        if selector in out:
            return None
        out[selector] = relation
    return out


def exact_relation_delta(before_rules: object, after_rules: object) -> dict[str, Any]:
    before = _rule_map(before_rules)
    after = _rule_map(after_rules)
    if before is None or after is None:
        raise ValueError("invalid rule set")

    before_keys = set(before)
    after_keys = set(after)

    added = tuple(
        (selector, after[selector])
        for selector in sorted(after_keys - before_keys)
    )
    removed = tuple(
        (selector, before[selector])
        for selector in sorted(before_keys - after_keys)
    )
    retargeted = tuple(
        (selector, before[selector], after[selector])
        for selector in sorted(before_keys & after_keys)
        if before[selector] != after[selector]
    )
    unchanged = tuple(
        (selector, before[selector])
        for selector in sorted(before_keys & after_keys)
        if before[selector] == after[selector]
    )

    return {
        "added": added,
        "removed": removed,
        "retargeted": retargeted,
        "unchanged": unchanged,
        "grammar_changed": bool(added or removed or retargeted),
    }


def verify_alex_hinge_receipt(
    before_rules: object,
    after_rules: object,
    alex_receipt: object,
) -> dict[str, Any]:
    if not isinstance(alex_receipt, dict):
        raise ValueError("alex receipt must be an object")

    computed = exact_relation_delta(before_rules, after_rules)

    expected_added = tuple(
        (item["selector"], item["relation"])
        for item in alex_receipt.get("added_rules", [])
        if isinstance(item, dict) and "selector" in item and "relation" in item
    )
    expected_removed = tuple(
        (item["selector"], item["relation"])
        for item in alex_receipt.get("removed_rules", [])
        if isinstance(item, dict) and "selector" in item and "relation" in item
    )
    expected_retargeted = tuple(
        (item["selector"], item["before"], item["after"])
        for item in alex_receipt.get("retargeted_rules", [])
        if isinstance(item, dict)
        and "selector" in item
        and "before" in item
        and "after" in item
    )
    expected_unchanged = tuple(
        (item["selector"], item["relation"])
        for item in alex_receipt.get("unchanged_rules", [])
        if isinstance(item, dict) and "selector" in item and "relation" in item
    )

    exact_match = (
        computed["added"] == expected_added
        and computed["removed"] == expected_removed
        and computed["retargeted"] == expected_retargeted
        and computed["unchanged"] == expected_unchanged
        and computed["grammar_changed"] == alex_receipt.get("grammar_changed")
    )

    return {
        "specimen": "HINGE-DOGRAM-001",
        "verdict": "EXACT_MATCH" if exact_match else "MISMATCH",
        "computed": computed,
        "alex_authority": alex_receipt.get("authority"),
        "alex_meaning_verdict": alex_receipt.get("meaning_verdict"),
        "authority_preserved": alex_receipt.get("authority") == "none",
        "meaning_verdict_preserved": alex_receipt.get("meaning_verdict") == "none",
        "does_not_establish": (
            "semantic_truth",
            "causation",
            "authority",
            "canonical_interpretation",
        ),
    }
