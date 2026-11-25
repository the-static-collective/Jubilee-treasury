# Dispatch 001 — operational boundaries

Live project: existing Jubilee World Door, private Supabase schema jubilee_private. No public read API, no new payment rail. Apply migration.sql then 002-transfer-gates.sql in order on a clean compatible World Door schema. These were already applied to the live project. The original test receipt was classified separately and is not part of the reusable migration.

## Operator queries (authorized SQL access only)

- Pending aggregate: SELECT route,lane,count(*) AS pending,min(created_at) AS oldest,max(created_at) AS newest FROM jubilee_private.dispatch_queue GROUP BY route,lane ORDER BY route,lane;
- Stage totals: SELECT * FROM jubilee_private.treasury_totals ORDER BY case_key,currency,stage;
- Human review: inspect a specific intake only when necessary; enter a dispatch_review disposition and basis deliberately. The queue excludes rows already reviewed. Contact candidate is not consent to forward. Do not copy private intake into GitHub.
- Register institutional stewards as candidates. A human must verify actual authority and record an evidence reference before promotion. Evidence references are not self-proving.
- Relationship candidates require each party's permission separately before the both_consented state. No auto-contact.
- Commitment event journal starts offered and requires documented stage transitions. Before transfer-reporting, case, collecting church and receiving partner must be verified by humans. No payment is executed by this system. Amounts are fixed after the first event; a partial or adjusted commitment needs a separately reviewed accounting design to avoid double counting. This version is not a general accounting ledger.

## Reuse lineage (adapted rules, not imported runtimes)

- PENNY BOX 001: church-held resources, candidate signals separate from counted contributions.
- AMBIENT TRICKLE 009: source reports do not imply settlement; separate custody and review.
- DOOR REGISTRY 012: verified channels distinct from published links.
- RELAY 011: purpose-specific bilateral consent.
- QUESTION 012: proposed next questions rather than automatic outreach.
- ANCHOR 009 / CONCORD 014: guarantees and arrangements stay human-reviewed proposals; full search engines not yet integrated.

## Verification and monitoring

Six transactional assertions passed in the hosted database, covering skipped initial stage, unverified case transfer, preserved amount, amount rewrite, event rewrite and absent bilateral consent. Synthetic records rolled back. Public anonymous queue read and authenticated event insert privileges were false. Existing KEYHOLE watch extended to grouped Dispatch queue and treasury totals; no raw witness details or writes in scheduled checks. Its existing end date is November 30, 2026 local time. First scheduled run with the new query not yet observed.

## Open gates

Dedicated operator interface, fine-grained human roles, retention controls, protected witness communications, direct module integration and independent institutional/legal verification remain incomplete. Do not publish donation destinations or expand sensitive intake based solely on these tests. Shared project admins retain privileged access. No changes to public page or other application routes in Dispatch 001.
