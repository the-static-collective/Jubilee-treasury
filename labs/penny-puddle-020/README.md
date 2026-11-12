# CAPABILITY-020 — STRUCTURAL MEMORY

**New research frontier:** What if the previous capability's *representation of intermediate state* is inadequate, not merely the choices inside its current algorithm?

CAPABILITY-019 constructed a reversible adjacent-run encoder from a fixed reducer. That reducer stores already seen runs, but the old source library **does not expose** an arbitrary pending-obligation stack or bracket-matching witness. We now give GRAFT a **new behavior specification**, with a choice among alternative memory organizations.

The task is to recognize a string of two kinds of bracket tokens, `()[]`, and return both a Boolean validity decision and the index pairs of correctly nested openings and closings, ordered by opening index:

```text
"([])" -> {valid:true,pairs:[[0,3,"()"],[1,2,"[]"]]}
"([)]" -> {valid:false,pairs:[]}
"(())" -> {valid:true,pairs:[[0,3,"()"],[1,2,"()"]]}
```

A count of opening and closing brackets cannot distinguish `([])` from `([)]`. A single-register representation also loses the earlier pending opener during nesting. A **last-in-first-out structure** correctly remembers which type of opener has to be satisfied next.

## What actually gets constructed

This is **bounded architecture selection and typed composition**, not invention of a stack from first principles. The public contract provides five primitive choice slots:

| Stage | Choices |
|---|---|
| Intermediate memory | single last-opening register / per-type counters / generic LIFO list |
| Matching | any closer / correct opener–closer type |
| End condition | allow pending / require fully closed |
| Invalid token policy | ignore / sticky reject |
| Result | validity only / validity plus matched index pairs |

There are **48** distinct complete programs. GRAFT assembles each from the smaller primitives and uses an interpreter it wrote separately. The valid whole method is **not** supplied by this public contract.

The originating public examples show only one-level or sequential pairs, which can be passed by inferior memory representations. The developmental challenger supplies a specific counterexample **after** a proposed candidate, including nested mixed types, crossing brackets, same-type nesting, wrong closing type, an unclosed opener and a stray closing prefix.

After the selected AST is frozen, Jubilee's separate interpreter and manually authored ten-case heldout suite judge it. The tests include valid nested and sibling arrangements, crossed nesting, incomplete expressions and empty input. A conventional direct classical stack parser is the strongest relevant baseline; it solves the task without model-guided search. The experiment deliberately makes that fact explicit.

## Crucial honesty about novelty

- Earlier local source-controlled CAPABILITY-019 `48` programs are *actually executed* as a comparison; their output is run-count arrays, **not** a bracket validity object with matched indices.
- The new memory representation is **new to that small local tool vocabulary**, not to mathematics or computer science. A stack parser is standard classical CS.
- The generic architecture interpreter and three candidate memory types are **hand-authored**. The machine selects/composes among them; it has not learned to autonomously invent unrestricted memory representations, new data structures, or new computational theory.
- The original native MOTIF-003 (in the companion GRAFT branch) supplies a *fallible, hand-authored structural search ordering* only. Its first preference deliberately need not be correct; developmental evidence may overturn it.
- Equally informed classical structural heuristics and direct stack parsing are serious baselines; a count advantage over a naive exact enumerator would not establish superiority.
- “Held out” means not imported into the builder before freezing. Every GitHub source file is public; there is no cryptographic secrecy against an adversarial researcher.

## No fabricated economic benefit

An abstract bracket parser does not automatically give anyone rent relief, create an exchange, confer intellectual-property rights, or make a landlord accept a service. **Unlike previous experiments, 020 does not insert a fictional landlord deal into CONCORD just to claim economic progress.**

The only admissible result is a **tested candidate local software capability**, held for separate usefulness review and human authority before any production integration. Actual human participants contacted: 0; actual money, debt discharge, work, rights or contracts: 0.

This keeps the GRAFT capability laboratory honest about the difference between **technical competence and human utility**.

## Reproduce (Node 22+, Python 3.10+)

From the source-owned Jubilee 020 branch:

```sh
npm test --prefix labs/penny-puddle-020
node labs/penny-puddle-020/export.mjs > /tmp/020-public.json
```

On the sibling `the-static-collective/GRAFT` `graft/capability-020-structural-memory` branch, with pinned original MOTIF and exact Jubilee source:

```sh
MOTIF_SOURCE_ROOT=motif-source python3 experiments/capability-020/native_priority.py > /tmp/020-motif.json
JUBILEE_SOURCE_ROOT=jubilee-source node experiments/capability-020/cross.mjs \
  --request /tmp/020-public.json --priority /tmp/020-motif.json \
  --out /tmp/a-new-unused-020-results
node jubilee-source/labs/penny-puddle-020/verify-output.mjs \
  --request /tmp/020-public.json --kit /tmp/a-new-unused-020-results
```

GRAFT CI source-pins the actual original Jubilee and MOTIF commits, performs the generator search, preserves failed hypotheses in inert JSON, and runs final-only independent tests after freezing its proposed architecture. Neither repo main branch is mutated.

**Research rule:** *A failing arrangement may need a different kind of memory. Test that necessity before mistaking it for insufficient search effort.*
