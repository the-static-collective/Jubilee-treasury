# CAPABILITY-019 — THE MISSING METHOD FROM A SINGLE GATE

**MOTIF × GRAFT × Jubilee Treasury — source-owned executable experiment**

**Question:** When the correct function is not in our complete-method catalog, can we construct it from a smaller, functionally sufficient primitive; learn from concrete counterexamples; prove a lower bound for this bounded language; and demonstrate that the resulting method can be **reused on a different task** rather than merely memorizing examples?

**Truth:** The task is textbook Boolean circuit synthesis. We deliberately provide **NAND as the only elementary operation**, and construct the well-known **XOR/disagreement function** without prelisting any complete NAND XOR circuit. This is an original implementation relative to this toy GRAFT skill catalog, not historically new mathematics, electronic hardware, machine learning or a demonstrated advance beyond classical exact synthesis.

## What was actually withheld from the builder?

The source-owned **PUBLIC** challenge supplies only the NAND semantics, two input wires, the desired behavior in natural language ('return 1 when the two inputs differ'), the four-gate search cap, and two incomplete examples:

| Inputs a,b | Expected output |
|---|---:|
| 0,0 | 0 |
| 0,1 | 1 |

It does **not** give a correct complete circuit. GRAFT must enumerate canonical NAND circuits from 1–4 gates; every gate references two previously existing wires, and gate operand order is canonicalized because NAND is symmetric.

The separate Jubilee **development oracle** supplies `(1,0)→1` and `(1,1)→0` only after a candidate is proposed and fails. Wrong candidates are retained and the failed sample becomes a new input constraint.

A completely separate **final-only** test takes the resulting *frozen* two-input circuit and composes that derived macro **twice** to calculate three-input odd parity. It then checks every one of the **eight possible three-input combinations**, none of which the two-input synthesizer has seen. It also checks four two-input truth table entries and commutativity.

This directly tests **reusability of a newly derived operator** outside the original two-input test interface. All heldout files are visible in public GitHub; exclusion is by the GRAFT research process and final-only CI invocation, not cryptographic secrecy.

## Strict finite impossibility proof

The existing old catalog does not contain XOR as a primitive. The independent `independent.mjs` evaluator **actually enumerates all canonical circuits using at most three NAND gates**:

| NAND gate count | Total canonical complete programs | Programs implementing required function |
|---|---:|---:|
| 1 | 3 | 0 |
| 2 | 18 | 0 |
| 3 | 180 | 0 |

**201 programs checked; 0 correct.** Four NAND gates are therefore the minimum **within this explicitly defined canonical NAND-only program grammar**. This is not a general computability-impossibility claim. Both a standard logic textbook and exhaustive classical search can find the four-gate answer.

## Two search strategies under identical conditions

- **Classical exact enumeration + counterexamples:** search by gate count, then canonical operand order. A short circuit may satisfy incomplete friendly examples yet fail new evidence. Each failure adds a concrete Boolean truth-table row. The final minimal four-gate method is found by exact replayable search.
- **Original native MOTIF-003 structural ordering + the identical exact search:** source-pinned MOTIF-003 runs `analyze_first_moves()` and `select_first_move()` on actual first/second NAND gate truth functions. The hand-authored metric ranks initial gates by the number of distinct two-input-dependent functions accessible after one additional NAND. This is **real computed gate-level structure** rather than arbitrary fictional economic affordance labels. There are 2, 4, and 2 such functions for first gate `NAND(a,a)`, `NAND(a,b)`, and `NAND(b,b)`. MOTIF therefore places the cross-input gate first in GRAFT's enumeration.

This is an intentionally favorable, domain-specific heuristic. A classical semantics-guided synthesizer given the same metric could make the exact same choice. The experiment's *actual* improvement, if verified, is narrower: a source-pinned original MOTIF implementation can direct the order of a real executable gate-level synthesis search.

## Evidence boundaries

- The separate GRAFT code physically enumerates canonical gate recipes and executes them, retaining failed attempts and counts, and outputs only an inert structured JSON circuit report.
- Jubilee **does not trust reported success or search-speed counts**. `verify.mjs` independently re-enumerates all previous circuit candidates under exactly the reported strategy and examples, verifies each selected candidate, re-observes every development counterexample, recomputes exact evaluation counts, proves the 201-circuit lower bound, and finally tests the frozen macro in three-input transfer.
- The two independent interpreters use arithmetic NAND equivalences, not the same function import. They compare *behavior*, not fabricated model points.
- Actual binary circuits are inert typed data; no eval, runtime self-modification, arbitrary node code, file import, remote AI inference, deployed plugin or contact action occurs.
- **A successful NAND parity macro does not directly solve the gold/rent economic challenge.** We explicitly do **not** create a Jubilee creditor-satisfaction route from an unrelated electronic logic function. Economic benefit, real money moved, legal creditor release, service, human consent and property rights all remain **zero**.

The original MOTIF module and source Jubilee are pinned by the separate GRAFT GitHub workflow. The generated report includes source metadata but is not a cryptographic identity signature. CI execution provenance and independent source checkout support reproducibility.

## Run (Node 22+)

In Jubilee:

```sh
npm test --prefix labs/penny-puddle-019
node labs/penny-puddle-019/export.mjs > /tmp/jubilee-gates-019.json
```

In GRAFT's `graft/capability-019-nand-synthesis` research branch, with source-pinned MOTIF-003:

```sh
MOTIF_SOURCE_ROOT=motif-source python3 experiments/capability-019/native_motif_priority.py > /tmp/motif-019-gate-order.json

JUBILEE_SOURCE_ROOT=jubilee-source node experiments/capability-019/cross.mjs \
  --request /tmp/jubilee-gates-019.json \
  --priority /tmp/motif-019-gate-order.json \
  --out /tmp/new-unused-graft-019
```

Back to Jubilee, inspect the frozen local report:

```sh
node labs/penny-puddle-019/verify-output.mjs \
  --request /tmp/jubilee-gates-019.json \
  --kit /tmp/new-unused-graft-019
```

The GitHub Actions workflow pins both source repos, runs native MOTIF, executes GRAFT CEGIS and classical exhaustive search, invokes independent Jubilee final-only transfer tests, and uploads the inert JSON evidence. Neither main branch is changed.

## Where the hypothesis is falsifiable

Fail if any 1–3 NAND gate program implements the desired operator under our grammar, if reported candidate counts differ from independent search replay, if the development challenger has been bypassed, if two-input final behavior is incorrect, if the frozen new macro fails any unseen three-input parity case, or if software capability is claimed to be financial/legal authority.

If the circuit passes, the established result is **an independently verified derived reusable gate-level method from a smaller primitive, rather than a complete prewritten method**. It is still established NAND logic, not novel theoretical CS or universal recursive self-improvement.

**Research rule: A new capability should do something the previous language demonstrably could not do within its limits—and should remain useful when composed outside its original task.**
