# EXODUS 002 — The Returning Node
Status SYNTHETIC_ONLY / HOLD. Reconstructed subset of the original HON plan, not recovered September source or a live rescue desk.
## Provenance
- Original HON design: https://docs.google.com/document/d/1LIWOPd6nwTmNQjudveoZIDdogIRVcp9UgrPBUJQhrDU/edit
- Original HON implementation plan: https://docs.google.com/document/d/11t79hAPv40GEaeO9MWIyi6WBM7MKjOcOkIPocoWWItc/edit
- Intended private repo healer-of-nations-node and feat/plan-001-core returned 404. Separate Node 007 unconfirmed.
- Main parent 420c1f99066b7ce3d1ee6827487a1a961f6fca45; EXODUS 001 native prepare (blob 9dfe1b518fdb57969410bfffae6ebbf8f5cbd37c) is invoked rather than reimplemented. PR 53 promoted prior work. PR 48 remains conflicting; PR 50 is superseded in relevant part by 53.
## Scope
One fixed synthetic need, eight fixed hypothetical shares, explicit proposed path, distinct fixture review and admission events, bounded simulated movement, receipt and replay. All actual commitments and movements zero. No real inputs, identity vault, payment, case intake, storage service, RPC activation, publicity or outreach. No private case details are accepted. Digest detects accidental corruption, not authenticity. This is not a full immutable on-disk record store or paper transcription workflow. Real consent, withdrawal, multiple currencies, authenticated stewardship, durable local storage and independent legal/financial review remain separate gates.
## Run
node --experimental-strip-types --test ops/concord-live-002/adapter.test.mjs ops/concord-live-003/field.test.mjs ops/exodus-001/exodus.test.mjs ops/exodus-002/returning-node.test.mjs ops/steward-desk-004/worker.test.mjs
No claim of test success until observed. No production activation by merging this lab.
