# CAPABILITY-018 — THE MISSING PRIMITIVE

**A new kind of failure:** not just *a wrong candidate program*, but a task for which the **entire existing operator vocabulary** cannot produce the requested output.

The 017 program language had 72 complete, typed programs. It could insert escaped text, label cards, create full printable HTML documents and number cards. **None could compute a new attribute from the content of a card.** The new challenge requires a per-card HTML data attribute, `data-graphemes`, containing the number of **Unicode extended grapheme clusters** (roughly user-perceived characters), not UTF-16 units, Unicode code points, word tokens or a hardcoded constant.

**Example:** `e\u0301` is one displayed accented character but two Unicode code points and two JavaScript UTF-16 units. `👩‍💻` is one displayed grapheme cluster but multiple code points. `🇺🇸` is one flag grapheme composed of two regional indicator code points.

## Why the gap is real, and what “new” means

`independent.mjs` actually enumerates **all 72 original source-owned 017 typed programs** with two distinct artificial captions. It verifies that **0** produce the new data-derived attribute. This is a finite proof of an **expressivity gap in our previous toy DSL**—not a proof that the problem is mathematically impossible or that the underlying computation had never been discovered.

The GRAFT companion experiment creates a *new-to-017 primitive* by composing:

```
text caption → segmentation strategy → count segments → attach data-graphemes
```

Five known alternatives are tested: constant-one; JavaScript UTF-16 length; Unicode codepoint count; whitespace token count; and existing **Intl.Segmenter** with grapheme granularity. The chosen segmenter is an **established standard API**, not our invention. The code now includes that capability as a distinct typed operator where none existed in 017.

### Active research: failures that change the hypotheses

Public examples contain only one-character captions; a faulty constant-one strategy can appear to work. An independent development oracle then presents counterexamples **only after a candidate was proposed**:

| Development case | Expected grapheme count | Why it matters |
|---|---:|---|
| `ab` | 2 | Rejects constant-one |
| `e\u0301` | 1 | Rejects UTF-16 length and codepoint counts |
| `👩‍💻` | 1 | Checks joined emoji |

A previously failing proposal is retained, its new input is added to subsequent search constraints, and a new candidate is tested. Failed hypotheses cannot simply become labeled successes. The exact observed outputs are checked by **Jubilee's independent evaluator**.

### Real controls

1. **Original finite 017 language:** exhaustive over all 72 old typed programs. None has the requested derived attribute.
2. **Classical complete primitive search:** enumerate five known candidate computations with the identical public examples and on-demand feedback. Strong control; no artificial handicapping of a natural comparison.
3. **Native MOTIF-003 ordering:** original source-pinned affordance code evaluates a hand-authored five-branch hypothesis graph. Its ranking determines the actual candidate order in GRAFT. It cannot assert that a candidate is correct. A conventional type-aware classical heuristic could use the same Unicode requirements and rank equivalently.

This does not demonstrate spontaneous invention of an unknown algorithm, unrestricted program synthesis, better-than-classical generalization, or novel Unicode science. It tests **detection, bounded extension and independent verification of a formerly missing language feature**.

## Final-only assessment

`heldout.mjs` includes **five cases** not given to the search process: family emoji with joiners, flag sequences, skin-tone modifiers, combining accents mixed with ordinary letters, and a five-card boundary case. Literal expected counts are written separately from GRAFT's candidate implementations. Jubilee invokes them **after the proposed primitive is frozen**.

The source is publicly readable, so “held out” means process-separated and no tuning after the final call, not cryptographically inaccessible. These fixtures are limited and cannot certify all of Unicode or general secure HTML rendering.

## Actual source-owned cross

- `contract.mjs`: publishes the *problem*, two ordinary public cases and original 017 base method but no chosen derived primitive.
- `independent.mjs`: executes all 72 original programs, interprets proposed new primitive descriptors independently, checks actual expected counts, formatting and code safety boundaries.
- `development.mjs`: deterministic on-demand counterexamples; no real personal observations.
- `heldout.mjs`: literal expected counts for final-only Unicode tests.
- `verify.mjs`: independently replays GRAFT output hashes and each failed proposal, tests the frozen methods on heldout, and adds one still-*unknown* optional human-curator exchange to the real source-owned CONCORD-014 composer.
- `export.mjs`, `verify-output.mjs`: explicitly chosen local JSON paths, no outgoing traffic or production deployment.

Separate GRAFT `experiments/capability-018` implements actual candidate algorithms, CEGIS search, original native MOTIF-003 branching and exact source-pinned CI crossing.

### Human and money boundary

Even a locally validated Unicode story-card tool does not confer image, gold, title, copyright or privacy rights. It doesn't authenticate people; it doesn't know whether a landlord will accept the output; it cannot perform an electrical repair; and it doesn't discharge anybody's rent.

The original 014 composer may show **0 → 1 hypothetical conditional option** after the new local technique is verified, but a real curator and landlord still must independently consent to terms. **Actual services: 0; actual money: $0; actual creditor discharge: $0.**

## Reproduce (Node 22+)

On the Jubilee 018 branch:

```sh
npm test --prefix labs/penny-puddle-018
node labs/penny-puddle-018/export.mjs > /tmp/jubilee-018-public.json
```

With GRAFT 018 source and pinned native MOTIF 003:

```sh
MOTIF_SOURCE_ROOT=motif-source python3 experiments/capability-018/native_motif_priority.py > /tmp/motif-018-order.json
JUBILEE_SOURCE_ROOT=jubilee-source node experiments/capability-018/cross.mjs \
 --request /tmp/jubilee-018-public.json \
 --priority /tmp/motif-018-order.json \
 --out /tmp/graft-018-new-unused-output
```

Back on Jubilee:

```sh
node labs/penny-puddle-018/verify-output.mjs \
 --request /tmp/jubilee-018-public.json \
 --kit /tmp/graft-018-new-unused-output
```

The actual GitHub Actions workflow checks out the exact original Jubilee and MOTIF commits, performs each search, records the counterexamples and source-generated primitive descriptor, then freezes the output for Jubilee's independent final-only verdict. No separate production build is automatically admitted.

**Research rule:** An unreachable output is a reason to investigate what operation is missing—not evidence that new people or rights can be invented to fill it.
