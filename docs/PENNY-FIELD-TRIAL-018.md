# PENNY-018 — Operator-controlled real-world evidence trial

**Goal:** take PENNY-017's read-only OctoPrint interface and PENNY-016's independently authorized fourth-box proposal into an operator-run capture and human review workflow. This is an optional field kit, **not live printing or a money-issuing node**.

## Reproducible operator sequence

Prerequisites: Node.js 20+, an independently SELECTED PENNY-016 fourth-box field and candidate JSON, the exact supervised G-code, a controlled local OctoPrint instance with STATUS-only token, and **three people/role holders with separately provisioned PEM signing keys whose public keys already appear in the PENNY-016 field**. A source field imported from the earlier demo is synthetic and must not be represented as real assets.

1. **Start trial**. On an operator-controlled computer:

       npm run penny018 -- init ./field.json ./proposal.json ./box-d-part.gcode ./private-field-trials/trial-001

   This creates an exclusive private directory, stores exact signed field/proposal, hashes the G-code and generates a fresh random `JUBILEE-018-...` challenge. It **does not** invoke a printer. Present the challenge physically next to the completed object during inspection; independently confirm it is visible. The system cannot do visual recognition.

2. **Supervise fabrication externally.** The operator uses their own safe normal printer workflow and is responsible for machine configuration, emergency stops, safe temperatures/materials and approval. This repository sends no commands to print or move the printer.

3. **Capture two read-only states** at different times during a real job. Do this once while the same named file is Printing, then again after it reports Operational with 99.9%+ completion:

       OCTOPRINT_API_KEY=<local-status-only-secret> npm run penny018 -- observe ./private-field-trials/trial-001 http://127.0.0.1:5000

   Repeat the exact same command once after the job has ended. Only `GET /api/connection` and `GET /api/job` are used, with redirects blocked and a local/private host required. The API key is never added to session files or console results. Machine status is **untrusted telemetry**.

4. **Inspect in person**. Independently inspect the object, measure its width/height/depth in whole millimeters, and prepare a PNG/JPEG photo and a UTF-8 inspection notes file containing the literal line `JUBILEE-CHALLENGE <challenge-from-step-1>` plus meaningful inspection details. Write a JSON file with exactly these keys:

       {
         "widthMm": 125, "heightMm": 130, "depthMm": 95,
         "assembled": true, "looksSafeForUse": true
       }

   The sample values are **examples only**; supply actual measurements and observations. Then:

       npm run penny018 -- inspect ./private-field-trials/trial-001 ./post-print-photo.png ./inspection-notes.txt ./measurements.json

   The inspector is accountable for accuracy. The software hashes the photo, G-code and notes, binds the observed machine snapshots and timestamps, and refuses backdated or altered-source files. A PNG/JPEG signature or a SHA-256 digest does **not** prove a scene.

5. **Independent pinned signers**. The fabricator, witness and prospective new box owner must examine the actual physical object and evidence, then use *their own* approved keys:

       npm run penny018 -- sign ./private-field-trials/trial-001 fabricator ./fabricator.private.pem
       npm run penny018 -- sign ./private-field-trials/trial-001 witness ./witness.private.pem
       npm run penny018 -- sign ./private-field-trials/trial-001 new_box_owner ./new-owner.private.pem

   The role key must match the independently pinned PENNY-016 role. The program neither generates fake signers automatically nor copies key material to trial files. Operators must arrange secure key custody, human identity checks and independent approvals.

6. **Verify exact original bytes and prepare a review-only artifact:**

       npm run penny018 -- verify ./private-field-trials/trial-001
       npm run penny018 -- handoff ./private-field-trials/trial-001

   `verify` rereads actual local G-code/photo/notes and refuses any change or missing private input. `handoff` writes a single exclusive `handoff-public-review.json` (no private key, raw media or OctoPrint token). Public handoff still needs out-of-band provision of full source history and source media for independent third-party validation. It is **not a financial receipt or box commissioning certificate**.

## No automatic crossing

At every step: candidate != selection, machine report != finished hardware, file hash != photographed scene, three role signatures != three trustworthy real-world humans, inspection report != owner commissioning, a Box D plan != custody permission. The result is deliberately `EVIDENCE_READY_FOR_MANUAL_OWNER_REVIEW_NO_AUTOMATIC_APPLY`.

The existing PENNY-017/PENNY-016 handoff may be executed **only through separate, explicitly authorized human and owner actions**. This field trial never calls `applyAtNode`, never connects hardware control, never executes G-code, never transfers real assets and never releases tokens. In particular, all PENNY-014 source pennies remain fully allocated to their existing claims. No real physical device was connected during CI.

## Recovery and adversaries

- Locked local session directory (0700) and exclusive files (0600). Event snapshots and signoffs are persisted using a rename transition. A leftover `.lock` after a crash requires manual reconciliation rather than blind simultaneous writes.
- More than two observations, missing Printing phase, changed printer job name/profile, wrong or stale timestamp, duplicate observation or status-only counterfeit => HOLD.
- G-code altered after challenge, missing challenge in independent notes, changed photo after witness signoff, missing observations, unsigned roles, invalid private key, changed source history or proposal => HOLD.
- Observing a compromised OctoPrint controller is not tamper-resistant device measurement. A human may paste the challenge into a note without photographing the correct object. Authentic camera challenge response, secure clock, material testing, sensor signatures, safe print verification, and trusted commissioning are explicit future work.
- Real privately signed trial files and third-party photograph rights should remain private. The public export shares signed claims and metadata only. Check consent before sharing photos or identifying people.

## Proposed next physical milestone

One supervised, small, nonfinancial printed enclosure prototype, a real locally scoped status capture, separately documented physical inspection, and comparison with the simulation. **Even then Box D remains in HOLD until independent owner commissioning, enforceable custody policy, real physical count and any financial compliance reviews are completed.**