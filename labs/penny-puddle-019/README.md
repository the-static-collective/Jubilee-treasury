# CAPABILITY-019 — CONSTRUCT A MISSING PRIMITIVE

**Hypothesis:** Can a generator construct a complete new-to-the-local-library **algorithmic operation** from smaller computational mechanisms—without a complete solution supplied—and have the result falsified by independently written tests?

## What CAPABILITY-018 could not do

The preceding 018 library offered **five grapheme-counting primitives**, plus the 017 **72 typed static document compilers**. None had an ordered accumulator of consecutive equal input graphemes; none emitted an ordered, lossless run-length encoding.

019 requires a **reversible run-length encoder (RLE)** of Unicode grapheme clusters, e.g.:

```
"aaabbaa"       → [["a",3],["b",2],["a",2]]
"👩‍💻👩‍💻a"       → [["👩‍💻",2],["a",1]]
"Aa"            → [["A",1],["a",1]]
```

Unlike counting characters, this needs a stateful **transition rule**: inspect the prior run, compare its grapheme against the incoming grapheme, increment the previous count or append a new run, and emit a reversible ordered representation. There is **no complete correct RLE method in the old local catalog or the new public problem spec**.

The task is limited: this is a tiny source-owned typed fold DSL, not open-ended arbitrary JavaScript generation. Its generic fold interpreter is written by us and exposes five choices:

| Stage | Options |
|---|---|
| Segment text | UTF-16 units, Unicode code points, or grapheme clusters |
| Compare identity | Case-folded or exact |
| If equal | Append another entry or increment last run |
| If different | Increment last run or append a new entry |
| Output | Run lengths only or exact ordered pairs |

That yields **3 × 2 × 2 × 2 × 2 = 48 programs**. GRAFT is handed the primitive menu, not the winning five-stage program. The original 017 + 018 local catalog is independently executed as a control (72 + 5 old implementations, **0 satisfying the new output type**). This proves only that the **finite local library** lacked the operation, not that run-length encoding itself is a novel invention.

## Discovery, independent tests and failure

The public task has two harmless examples, `a` and `ab`. They cannot distinguish correct grapheme-aware grouping from several incorrect implementations.

On **first proposal**, a separate Jubilee developer oracle may return a concrete failure:
- `aa`: both graphemes should form one run of length 2.
- `Aa`: identical case-folded forms must **not** erase original case distinctions.
- `👩‍💻👩‍💻`: each joined emoji must remain a single grapheme.
- `aaba`: repeated symbols separated by another symbol must remain distinct runs.

Each incorrect proposal is retained in the submitted trace with the exact counterexample. The proposed method is then reassembled against the expanded evidence.

The separate final-only Jubilee `heldout.mjs` evaluates **eight harder cases**: separated runs, case sensitivity, joined emoji, combining marks versus precomposed letters, flags, whitespace, skin-tone modifiers and alternating runs. The GRAFT builder never imports the heldout module. The source is public on GitHub; separation is by process, not encryption.

The independently authored `independent.mjs` **does not use GRAFT's reducer**. It reinterprets the candidate AST and checks expected ordered pairs, exact reconstruction of the original string, maximal adjacent grouping, Unicode grapheme count conservation, deterministic repeat and bounded structure. `verify.mjs` also checks public output hashes, previously failed candidate traces and absence of financial/production authority.

## Strong comparisons

- **Old actual library lookup**: execute all 72 GRAFT-017/Jubilee-017 programs and all 5 018 count tools; none produces a reversible list of ordered run pairs. This is a narrowly scoped previous-library comparison, not evidence that no library on Earth has RLE.
- **Classical exhaustive CEGIS**: enumerate the exact same 48 combinations, receive the exact same developer counterexamples and test budget; classical search can solve the task and preserve wrong hypotheses.
- **Native MOTIF-003-guided CEGIS**: exact original MOTIF-003 source-code functions run on a hand-authored affordance graph to rank the tokenization component. The graph deliberately values the code-point pathway *above* the grapheme pathway. Its first preference can therefore be **wrong**, and concrete counterexamples—not the heuristic—must correct it.

No comparison claims a fundamentally superior reasoning algorithm, autonomous general coding or historically novel compression mathematics. Differences in candidate checks partly reflect program ordering and engineered example selection. The classical baseline is exhaustive and has the same capabilities and observations.

## Source-owned crossing

```
Jubilee public spec (no winning program) + original native MOTIF-003 heuristic
  → GRAFT 019 generic fold AST search
  → test on public cases
  → request on-demand Jubilee development counterexample
  → retain failed AST and new evidence
  → freeze complete 5-stage program
  → Jubilee's distinct interpreter + final-only heldout
  → if valid, one new CONDITIONAL operator in existing CONCORD-014 graph
```

Everything is fictional. An encoding primitive creates **no gold right, title, creditor consent, tenant consent, monetary value, contract, work, loan, financial credit, or legal rent discharge**. The new conditional CONCORD proposal must still be explicitly discussed by the human curator and landlord; there are zero actual service outcomes.

The generated artifact is a typed JSON recipe, not unrestricted executable code. The GRAFT research branch writes **JSON-only evidence**; no unsafe HTML runs or public website is deployed.

## Reproduce (Node 22+, Python 3.10+)

On the Jubilee branch:

```sh
npm test --prefix labs/penny-puddle-019
node labs/penny-puddle-019/export.mjs > /tmp/jubilee-019-public.json
```

On the companion GRAFT source branch with exact native MOTIF-003 checkout:

```sh
MOTIF_SOURCE_ROOT=motif-source python3 experiments/capability-019/native_priority.py > /tmp/motif-019-order.json
JUBILEE_SOURCE_ROOT=jubilee-source node experiments/capability-019/cross.mjs \
 --request /tmp/jubilee-019-public.json \
 --priority /tmp/motif-019-order.json \
 --out /tmp/new-graft-019-artifact-directory
```

Then have Jubilee verify the frozen artifact:

```sh
node labs/penny-puddle-019/verify-output.mjs \
 --request /tmp/jubilee-019-public.json \
 --kit /tmp/new-graft-019-artifact-directory
```

The output directory must not exist beforehand. Neither main branch is automatically updated; no GRAFT method is admitted to production.

**Research rule:** *A method that satisfies the examples but fails a real counterexample is an improved research question, not a demonstrated capability. The new primitive exists only when its executable behavior survives independent verification.*
