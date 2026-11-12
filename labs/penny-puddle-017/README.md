# CAPABILITY-017 — THE UNWRITTEN METHOD

**Question:** Can a builder construct a complete implementation that is *not* a prelisted whole method, by assembling elementary operations, testing failures, and revising a candidate—without touching real people, property or money?

**Actual output:** an executable **typed DSL program** composed from five independently selectable primitive stages. This is bounded, classical program synthesis / counterexample-guided inductive synthesis (CEGIS), with an additional **native MOTIF-003 structural-affordance branch-ordering heuristic** in GRAFT. It is **not** arbitrary JavaScript generation, unrestricted code writing, new mathematics, or evidence of autonomous general intelligence.

## The source-owned PUBLIC contract

`contract.mjs` publishes only:
- five typed primitive decision slots: text escaping (3 choices); card structure (3); document wrapper (2); printing (2); data indexing (2);
- two ordinary public examples, an input/output token for the existing hypothetical exhibit, explicit acceptance conditions;
- strict per-run 72-program enumeration cap and four-round counterexample limit.

**3 × 3 × 2 × 2 × 2 = 72** possible complete programs. None of those complete 5-stage programs is listed as a built-in finished method in GRAFT's 017 synthesizer. Instead it constructs ASTs and executes them through a bounded interpreter; arbitrary functions, unsandboxed JS, file imports and `eval` are outside the grammar.

`independent.mjs` has a **separate Jubilee-owned interpreter** and acceptance checks; the generator does not get to decide whether it passed. `development.mjs` supplies adversarial counterexamples **only after a candidate is offered**. The generator records that failure and repairs by searching again. `heldout.mjs` supplies four final-only unseen-by-process cases (Unicode/RTL, nested quotations, one-card and five-card bounds) after each final program is frozen.

**Important honesty about “hidden”:** all sources in these public GitHub repos can be read by a determined developer. These are *process-separated test inputs*, not cryptographically private oracle data. The workflow contract and tests deliberately avoid importing the heldout module into the synthesizer and disallow selection changes after its scores.

## Strong baselines and negative results

The paired GRAFT experiment implements:
1. A **catalog lookup** over original source-owned GRAFT-016 whole methods. They were built for the previous task and lack explicit data-card index requirements; no preexisting full 016 method should be passed off as the newly synthesized DSL program. This is a limited retrieval baseline, **not all available software**.
2. A **classical complete enumeration** of the exact same 72-program grammar with the exact same development counterexample oracle. It can discover the valid program without native MOTIF. This is the strong equal-footing baseline.
3. A **native MOTIF-003-informed ordering** of the first building block. The original source-pinned Python `analyze_first_moves()` scores newly reachable structural operations in a tiny, intentionally authored graph; a bounded JS search uses the resulting priority instead of a handcoded winner. This is a heuristic, **not a newly invented inference algorithm**. A simple typed classical heuristic can match its favorable branch ordering.

A program that only works on friendly names can still fail when it sees `<script>`, `&`, quotes, non-Latin Unicode or one vs five cards. That failure is the point. Source-owned validation demands exact escape semantics and card structure even when the initial public examples don't expose the flaw.

## Independent return and economic HOLD

The GRAFT research workflow emits `generated-method-report.json` containing **only** typed ASTs, bounded proposal traces, and public output hashes. Jubilee checks those hashes against outputs it executes independently, validates prior failed attempts against the development oracle, then runs the four heldout cases after the candidate is frozen.

Only a passing **local technique** can be added as an **UNKNOWN human-curator offer** to the existing source-owned CONCORD-014 composer. The toy system then returns one possible conditional path that still requires the curator, copyright/title owner, and creditor to freely agree to specific lawful terms.

No real identity, contact, landlord, tenant, gold asset, permissions, legal release, monetary value, payment, real work, code admission, deployment, outside network call, credit or loan is touched. The rendered story is fictional text only.

## Run

Node.js 22+, zero JavaScript dependencies:

```bash
npm test --prefix labs/penny-puddle-017
node labs/penny-puddle-017/export.mjs > /tmp/jubilee-017-public.json
```

On `the-static-collective/GRAFT` branch `graft/capability-lab-017-unwritten-method`, use its source-pinned MOTIF-003 probe and builder with this public JSON. Then from Jubilee independently validate GRAFT's output:

```bash
node labs/penny-puddle-017/verify.mjs \
  --request /tmp/jubilee-017-public.json \
  --kit /tmp/graft-017-new-unused-dir
```

The GRAFT workflow is responsible for checking out an **exact Jubilee source commit** and **exact original MOTIF-003 commit**, executing native source, comparing both search methods and invoking the independent Jubilee verifier on the GRAFT-generated artifact.

## Falsifier

Fail the experiment if the newly composed program fails any final-only case; if earlier failing candidates disappear from the evidence; if source material outside the permitted primitive grammar gets executed; if a source hash or public output differs; if the supposedly successful method can't be reproduced; or if a supposed local artifact is represented as a real right, completed service or satisfied rent obligation.

**Rule:** *Generate a method from proven components; let failure teach the search what to exclude; preserve the independent proof and never infer people's consent from software behavior.*
