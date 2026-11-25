# World Door v1 — operator boundaries

Public source docs/index.html; custom domain jubilee.abundent.org. Backend jubilee-intake-v1 in existing Supabase pantry-gate project. Private queue jubilee_private.intake; service-only RPC jubilee_submit_v1. No payment rails. Anonymous signal is category-only, never a protected evidence channel. Provider metadata may persist. Do not add uploads or identifying testimony until independent security review, safe contact policy and restricted separate infrastructure exist.

## Triage
- individual/church: verify offer independently; never count as received funds; church retains custody and discretion. Do not solicit payments until approved lawful receiving channel exists.
- partner: verify institutional identity, approvals, local counsel and transfer/closing route.
- expert/introduction: verify role and consent before sharing or contacting others.
- update: confirm consent and contact before sending updates. No automatic mailing.
- signal: category-only warning; treat as unverified; no public posting, automated forwarding, attribution or local contact based on signal alone.

Operator review query (aggregate only): SELECT lane, count(*) FROM jubilee_private.intake WHERE state='pending' GROUP BY lane ORDER BY lane;

Authorized human review via Supabase SQL editor; do not paste private submissions into public logs, GitHub, shared sheets or automatic alerts. Set review state only after explicit review. Preserve distinction between reported and verified amount, approved commitment, church-held funds and actual settlement. No auto-disbursement. No automated retention policy configured; owner must approve access and retention policy before expanded intake. Global cap 60 accepted per minute, no IP-based application tracking; targeted abuse and quota exhaustion remain possible. Public origin is not authentication. No public read route.

Verification: DB grants check and rolled-back synthetic category test passed. Public browser end-to-end test pending; verify Pages publication, receipt and matching queue row, then mark test as test. Roll back page by restoring prior blob if needed; preserve queue.
