# CONCORD LIVE 002 — Generative Cooperation
Status: bounded native transplant on an experiment branch. No production deployment. The 001 live SQL evaluator and public intake remain unchanged.

## Native sources
Exact Git blobs are vendored and tested, not edited:
- Jubilee CONCORD-014 composer.mjs: 61dafee54a5a0b615e7969ff768a01fba140f577 (experiment/penny-puddle-014-agreement-invention).
- Full Measure PLENTY index.ts: 0c4c8bd6c62d279cdc21101d067105f341dc9099; types.ts: e076a13266d518912faeddf53a6f6ec153b0da47 (feat/plenty-001-scarcity-inverter).
MOTIF next-question and JAR;VIS local-work packet principles are adapted, not native runtime imports.

## Use
Requires Node 22.16.0, no packages. Run:
```sh
node --experimental-strip-types --test ops/concord-live-002/adapter.test.mjs
node --experimental-strip-types ops/concord-live-002/cli.mjs /private/path/snapshot.json
```
An authorized operator may export exactly the following fresh read-only SQL snapshot from the private project, save just the JSON value locally (not in GitHub), and run the CLI within fifteen minutes:
```sql
select jsonb_build_object(
  'schema','jubilee.concord.snapshot/v1',
  'caseKey',case_key,
  'asOf',now(),
  'facts',jsonb_object_agg(gate,state)
) as snapshot
from jubilee_private.concord_facts
where case_key='JUB-HON-001'
group by case_key;
```
No contacts, notes, identifiers of visitors, financial account details, or untrusted free text may enter the adapter. Snapshot origin/authenticity is not cryptographically verified; an authorized operator must acquire it from the trusted private database, and the digest fingerprints the snapshot rather than authenticating it. No automatic polling or private DB credential in this branch.

## How it works
Primitive gates and typed grammar operations are joined by the original bounded backward AND/OR composer. The native API uses a synthetic-fixture vocabulary, so the adapter explicitly uses placeholder grammar roles, not claimed first-person offers; the synthetic priors are not used as likelihoods. Independent forward closure checks generated proof completeness; PLENTY evaluates structural dependencies with authority unknown. Distinct paths with common gates are not independent funding sources. All paths remain advisory; even satisfied gates yield REVIEW_READY only. Blocked paths are removed from the candidate result; absence is not proof of real-world impossibility. The grammar has four route families; expanding actual role-specific capability cards and consent attestations is future work. No case status is changed by the CLI.

Questions are ranked by number of remaining candidate paths affected, not estimated success probabilities. A prepare-only packet includes checklist, generic unsent draft, and tracking columns; no external action, recipient lookup, mailing or custody. Review before any action. No public disclosure or forwarding of anonymous observations.

## Tests and gates
Nine tests cover exact source blobs, original composer fixture, four initial paths, single refusal, common blocking, review-only even when all gates satisfied, stale input, unwanted fields, repeat determinism. CI uses read-only permissions. No production connection or merger before results and operator review. No live snapshots in CI or GitHub.
