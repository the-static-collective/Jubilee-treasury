# CONCORD 003 — Living Capability Field

Experimental child of CONCORD 002. No production deployment, public page change, or live-data ingestion. This branch carries forward the exact CONCORD-014 and Full Measure PLENTY sources. RELAY-010 is vendored unchanged (blob f86c88a0a1a51adfceaa10e778b1486604fd0587) and its original synthetic consent restriction is tested; the field adapter uses its own scoped directed relationship projection, not the RELAY fixture as real data.

## Bounded operational hypothesis
The case can need verification preparation as well as funding. A person may offer document access, translation, interpretation, property counsel, bilingual property counsel, or independent review. The engine joins these independently offered capability *types* into candidate review-packet structures. For example, document access + interpreter + counsel + reviewer is an alternative to document access + bilingual counsel + reviewer. Neither establishes actual evidence or legal authority. These are authored composition rules, not machine-invented new capability types.

Inputs are fresh, purpose-bound, private operator-reviewed snapshots with opaque references only. Source and consent reference strings are pointers, not authenticated attestations. No free text, real names, email addresses, documents, money, or public directory. Do not derive cards from raw intake, anonymous warning signals, third-party statements or inferred preferences. A private operator must independently review first-person permission, source, freshness and actor identity before preparing a snapshot. The adapter cannot establish these facts itself. Its relationship links are directed, require distinct consent references, expire and can be declined/withdrawn. No reverse or transitive permission to actually contact or disclose is implied.

Source IDs are exclusive within each candidate proof; shared actor/source/link dependencies remain visible across candidates, not additive resources. All capability claims and authority are unknown to PLENTY. All routes HOLD, even with a complete structural proof and recorded consent references. Missing kinds generate optional PRIVATE discovery invitations with no rewards or rankings. They are not proof of need or authority to contact. JAR;VIS-style work packet is prepare-only; MOTIF ranking and Full Measure quest format are adapted concepts, not native integrations here. Native Full Measure Dogram quest adapter requires genuine Dogram measurement/delta receipts, so none are fabricated.

## Run
Node 22.16.0, no dependencies:
```sh
node --experimental-strip-types --test ops/concord-live-002/adapter.test.mjs ops/concord-live-003/field.test.mjs
```
Use field(snapshot,{now}) from field.mjs. See synthetic tests for the exact schema. Snapshot and output must remain private. No production DB connection or automated outreach. Future work: private reviewer admission and consent evidence, independently verified snapshot transport, signed revocation, operator UI, bounded expansion of grammar, real capability admission with consent, privacy review and live dry-run before deployment.
