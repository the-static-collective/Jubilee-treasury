# Steward Desk 004 — StaticID-backed owner review

Status: experimental child of CONCORD 003. No deployed Worker, registered OAuth client, applied SQL, seeded access grant, domain change, or real-data browser test. Production landing and intake are unchanged.

## Reuse
StaticID's exact main blobs: oidc.mjs 89f1417067c3a7076595dec5c8d94fd0d2863f90; cloudflare.mjs f75c4c61bcb4bd0e2af23c9df904a3053e7e69fc. Source: https://github.com/the-static-collective/staticID. Willow's feature/static-fileport-neon-001 is a server-side deployment reference; no Colton credentials, data, or private source imported. Separate OAuth client and cookie, no service role, no shared session. Existing Proton login is one factor, not proven MFA. This first owner-only design does not support delegated accounts.

## Scope
Read redacted queue, route gates, next questions, and stage-separated totals. Review a single pending item using one of three fixed dispositions. SQL audit records actor/time and the existing review record; no review implies consent or execution. Anonymous and no-reply entries cannot be contact candidates. Raw contact/notes, evidence documents, capability admission and native 002/003 runtime are intentionally not wired into the initial UI. The underlying live 001 views are the read target. Reviewed records remain stored; UI currently shows pending only. No contact/send/payment paths.

## Onboarding (not yet performed)
1. Choose a dedicated origin, proposed https://steward.abundent.org, and create separate Cloudflare Worker, no changes to jubilee.abundent.org. Follow StaticID's onboarding docs for the existing pantry-gate issuer. Register a new confidential client with exact callback /api/static-id/callback on that origin. Keep dynamic registration disabled; don't alter HUMKIN enrollment or keys. Confirm issuer, owner UUID and correct client ID privately.
2. Configure Worker bindings STATIC_ID_ISSUER, STATIC_ID_APP_ORIGIN, STATIC_ID_CLIENT_ID, STATIC_ID_CLIENT_SECRET, STATIC_ID_OWNER_SUB, STATIC_ID_COOKIE_KEY (independent random 32-byte base64url), JUBILEE_PUBLISHABLE_KEY (existing same-project publishable key). Use encrypted secret bindings; never share secrets in chat or Git. No service-role key. Worker config: main worker.mjs, compatibility_date 2026-11-24; choose app name and custom domain in dashboard. Deploy only after security review.
3. Apply staged.sql to an isolated staging database with existing Dispatch 001 and Concord 001 schema. The SQL is intentionally dormant, no grants or members. Review security definer ownership, search_path, ACLs, policies and Supabase advisors. Check all other existing schema/function grants before granting authenticated schema usage. Use comments at end as separate activation migration, only after testing direct RPC denials. Explicitly insert an expiring grant for the verified owner subject AND this app client ID. Do not grant Colton access or reuse a client ID. Revoking the row denies new RPC calls immediately, even if a session token is still valid.
4. Test login, correct client, wrong user, wrong client, anonymous request, direct RPC, revoked/expired grant, cross-origin mutation, stale review, anonymous contact candidate refusal, audit, logout. Test on synthetic data first. Browser receives no raw JWT. Native identity tests are synthetic; no live IdP verification performed here. Grant expiry is independent of cookie expiry, but upstream session revocation is not instant; sensitive witness data remains excluded.

## Tests
Node 22.16.0:
node --experimental-strip-types --test ops/concord-live-002/adapter.test.mjs ops/concord-live-003/field.test.mjs ops/steward-desk-004/worker.test.mjs
The Worker tests mock database RPCs; the staged SQL requires its own database integration tests before any activation.
