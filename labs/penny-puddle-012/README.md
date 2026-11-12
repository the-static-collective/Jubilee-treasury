# JUBILEE QUESTION-012 — ASK THE NEXT USEFUL QUESTION

**Jubilee Treasury × RELAY × DEALWEAVER × source-pinned MOTIF.**

**Hypothesis:** the best next question is not necessarily the question that reveals the most uncertainty, nor the one that would most increase a social directory's data. It is the **smallest, consented, appropriately addressed question that could materially change which agreement the people themselves would be willing to consider**.

**Status: entirely synthetic, local-only experiment.** Every person, preference, hidden state, prior weight, numerical scenario outcome, question consent, introduction, and answer is invented. No real person was contacted, no personally sensitive information or address book read, no money moved, no actual service agreed or performed, and no source-owned partner other than the pinned native code was modified. **No claim of new mathematics or empirically demonstrated human-coordination improvement.**

## The surprising finding: entropy is not the same as useful information

Our toy model has *eight* invented equally or unequally weighted possible worlds built from four different hypothetical collaboration states × two possible tractor paint colors. "What color is the tractor?" has a full bit of answer entropy but provides **zero improvement in the proposed action decision**, as both colors are deliberately independent of the participant's preferences.

In the fictional numbers:

| Policy | First question / decision | Synthetic model result |
|---|---|---|
| Don't ask anything | Recommend `remote-guidance` in uncertainty | 4.70 hypothetical decision points |
| Ask highest-entropy question | `ask-tractor-paint` | 1.00 bit; **0.00 gross decision improvement**, −0.02 after burden |
| Myopic one-question expected value of information | `ask-mechanic-teaching` | +2.00 net modeled points over baseline |
| Exact two-question lookahead | **`ask-learner-learning`** | 8.15 expected outcome points after modeled question burdens |

Why does the best **two-question** policy *first ask the learner* when the best single immediate question asks the mechanic? It avoids asking another person about their preferences when the learner doesn't want a learning arrangement. If the learner expresses interest, and only after independent RELAY introductions and permission, it may make sense to ask the mechanic.

The detailed mathematics are in `question-value.mjs`. The policy enumerates finite responses and computes:

```
baseline = max_action E_model[scenario_utility(action)]

one_step_voi(question)
  = sum_answer P_model(answer) *
      max_action E_model[scenario_utility(action) | answer]
    - baseline
    - declared_asking_burden(question)

multi_step_plan(belief, questions, horizon)
  = max(
      baseline,
      max_question(
        -asking_burden(question) +
        sum_answer P_model(answer) *
          multi_step_plan(posterior, remaining_questions, horizon - 1)
      )
    )
```

The scores are **invented demonstration points**, not measured utility, prices, psychological information, verified social/planet benefit, or real effect sizes. Any future application needs *participants' own first-person assessments*, well-calibrated outcome estimates and a defensible consent/quality model. Using a deliberately weak entropy baseline shows an algorithmic distinction, not empirical superiority over real optimization products or assistant models.

### The important thing that doesn't happen

This system does not collect random personality facts because those might increase prediction accuracy. It does **not** learn from someone's emails, phone contacts, inferred mental state, social clout or private relationship graph.

A subject is not a data mine.

A question must be relevant, supported by explicit purpose, addressed to **that** person, and within a small query and privacy budget. They can say NO or ignore it. If a respondent declines, the answer cannot be inferred. A response to an invitation does not authorize a work contract or an economic transaction.

## What has actually been built

- `question-value.mjs` — finite weighted hypothetical-world model; validation; prior-optimal decision; response entropy; one-question decision value; exact lookahead with optional stopping, known asking burdens and bounded finite horizons; sequential question and personal-consent state machine. An unsupported/irrelevant question **cannot** be asked by the simulated planner. Private subject questions aren't eligible until the subject individually opted in after a simulated permissioned introduction. Stale authorization, privacy limits and exhausted question budget cause HOLD.
- `weave.mjs` — **real source-owned import of RELAY-011** (`../penny-puddle-011/weave.mjs`) and its existing imports from RELAY-010 and DEALWEAVER-007. First the fictional learner enters the opt-in community hub. Both intermediary and subject explicitly approve the introduction. The mechanic decides whether to hear a neutral question. The policy first asks the learner (avoiding an unnecessary subject prompt), then optionally asks the mechanic. Only a **separate first-person shared-format permission** from the mechanic opens actual source-owned DEALWEAVER proposal candidates. The terminal state is a nonbinding proposal; nothing real is executed.
- `native_motif_question_probe.py` — **real pinned MOTIF-003** structural affordance traversal (original module in `the-static-collective/MOTIF`, commit `66d27cfbd077b2c91d0d86d66e320206d88d8f95`, blob `db25da0d50a9c8e2cd87aa576a22f969405737cf`). It uses the existing 005 Git-blob-verifying source loader to import the native implementation. The original operator planner is then actually called to explore **a separate fictional question graph**.
- `demo.mjs` is not required: `weave.mjs` itself exports `runQuestion012()` and is the executable JSON demo.
- `index.html`, `ui.mjs`, `server.mjs` — mobile-first, same-machine interactive lab with policy comparisons and mocked answer buttons. Source allowlist, restrictive CSP, no network egress, outbound messages, identity provider, browser storage, contact API or financial endpoints.
- `test/question.test.mjs` — adversarial policy, answer routing, budget, privacy, consent, refusal, expiry, weak entropy baseline, multi-step counterfactual, and true source-owned 011/007 integration.
- `test/test_native_question.py` — native MOTIF blob pin and real function invocation with explicit no-real-action assertions.
- `test/server.test.mjs` — only permitted scripts and reads, no contact/private-data/finance endpoints.
- `.github/workflows/penny-puddle-012.yml` — Node22 tests, demo, syntax checks, source-pinned Python checkout/tests/probe.

### Important MOTIF architecture separation

The native MOTIF-003 `analyze_first_moves` / `select_first_move` explores **structural newly possible actions** in a hypothetical relational graph; its toy “imagined answer branches” are *not* authenticated human answers. The separately authored JavaScript Bayesian finite lookahead models hypothetical response probabilities and action outcomes. **These scores are not interchangeable.** Both are exercised, but no integrated production MOTIF reasoning service or reLATTE writer has been deployed.

The `carrier()` output from the 012→011 bridge is a **proposal-only typed envelope** (`jubilee-motif-012/question-proposal-only-v0`) with `OFFER_ONLY_HOLD`. It never exports the mechanic's private motivation or claims financial authority. A future native adapter would need to preserve typed source rights, budget constraints, evidence boundaries, privacy, and first-person consent at every layer.

## Falsifiability and privacy safeguards

1. **Entropy trap:** an answer with maximum entropy but zero decision relevance is rejected.
2. **Myopic vs finite lookahead:** the best first question can change when considering a second question's burden and its conditional necessity; one-step and two-step rankings are printed separately.
3. **No assumptions from relations:** a person's *friend* cannot tell the system which preferences that person holds; an intermediary may only ask a neutral question.
4. **No private-person questions before their opt-in:** a mechanic-targeted question is ineligible before source-owned RELAY paths and independent question authorization.
5. **Question budgets:** maximum two in the default model; one private question allowed; refuse trivial or repetitive low-value questions.
6. **No inference from silence:** declining a question produces no guessed YES/NO.
7. **Expiry and withdrawal:** once permission expires or is revoked, previously supplied toy answers are no longer used for new matching.
8. **Zero authority:** questions and suggested answers don't create a service agreement, creditor relief, payment, privacy entitlement, or verified real-world outcome.
9. **No real-world science by fiat:** changing the hypothetical prior weights or rewards can change the optimal question. This is a model feature, not proof of what real people want.

The HTML demo simulates every person by local buttons, which are **not** actual separate person's identity/authenticated consent. Never import real contact/health/finance data into this public demo or serve it as a real private profile application.

## How to run

With Node.js 22+ and no npm dependencies:

```bash
npm test --prefix labs/penny-puddle-012
npm run demo --prefix labs/penny-puddle-012
npm run serve --prefix labs/penny-puddle-012
# On the same computer open http://127.0.0.1:8808/
```

The **native** experiment additionally requires a *separately cloned, exact commit* of MOTIF. GitHub Actions performs that read-only checkout and refuses mismatched source contents.

## From experiment to a real Jubilee Treasury pilot (not implemented)

A valid human pilot should use opt-in participants and voluntary, plain-language question scripts. Compare a task-only invitation against a consent-first information-gain inquiry, with randomization where ethical, explicit refusal freedom, and independent participant satisfaction/outcome reporting.

A suitable test might be: “Would you prefer someone to perform this task, or help you learn how?” The possible outcomes are not only completed transactions; they can include a safer refusal, a better teaching session, a less wasteful resource use, and a genuine mutually welcomed introduction.

Do not declare success from generated “utility points,” synthetic satisfaction, number of contacts crawled, or the existence of a path. **The only meaningful realized win is a voluntary, independently evidenced improvement as reported by the people involved.**

**Rule:** *Ask the person whose choice matters, about a question that could change what is possible, and stop when further questioning doesn't help.*
