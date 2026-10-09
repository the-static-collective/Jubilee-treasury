# PENNY-017 — Hardware Witness and Fabrication Evidence

**This experiment builds a read-only machine-status and byte-evidence bridge. It does not autonomously execute a printer or verify that physical hardware really exists.**

## What is implemented

- **OctoPrint read-only probe:** opt-in local (private IPv4 or loopback) target, finite timeouts, no redirects, API key only from local environment. Performs precisely GET /api/connection and GET /api/job (STATUS). No upload, start, stop, pause, motion or settings modification. Returns normalized printer profile/job state. Official API reference: https://docs.octoprint.org/en/main/api/connection.html and https://docs.octoprint.org/en/main/api/job.html.
- **Real file-byte provenance:** hash a locally provided G-code file and a PNG/JPEG photo with SHA-256, bound to exact filenames/sizes. File hashes establish *byte identity*, not image semantics, actual camera capture, completed print or manufacturing safety. Only basic G-code fingerprint checks; no print command.
- **Separate machine observations:** require timestamped Printing → Operational status for one exact G-code filename, same profile, with final 99.9%+ reported completion. These are untrusted machine *reports*, not actual printer attestation.
- **Post-job human measurement:** inspector must record assembled/safe claims and measured width/height/depth (bounded integer mm), evidence hash for detailed inspection notes, and timestamp *after* printer-reported completion.
- **Independent three-role signatures:** fabricator, witness, incoming fourth-box owner sign the same evidence bundle. Keys are pinned in PENNY-016; bytes, source head, file metadata, G-code job and inspection claim are jointly hash-bound.
- **Actual native PENNY-016 completion:** on a field where all three independently owned resource boxes already SELECTed the candidate, the hardware-evidence bundle produces a PENNY-016 completion and three owner APPLY events with evidence hash. No APPLY may be before inspection. Existing resource/coin conservation is preserved (1 material kit, 45 minutes, returned tool, **0 penny spent and 0 PENNY created**). A signed local completion is *not* a physically observed object.
- **Native reLATTE test:** uses the existing 016 signed opaque RECEIVED and R3_HOLD bridge with cold replay for the evidence-bound completion. No physical custody, tokens, public legal grants or hardware identity conferred.

## Run

    npm test
    npm run penny017:demo

Optional read-only probe of *your own local OctoPrint installation*, with a narrowly scoped STATUS-only API token:

    OCTOPRINT_API_KEY=... npm run penny017 -- probe http://127.0.0.1:5000

Optional real local G-code and image file hashing, which uploads nothing:

    npm run penny017 -- fingerprint /private/box-d-part.gcode /private/post-print-photo.jpg

These commands do not authorize printing, completion, financial settlement or token minting. The probe never returns your API key.

## Synthetic end-to-end demonstration

Use source-signed PENNY-016 simulated three-box state, all three box-owner selections, synthetically supplied G-code/image bytes, two mocked OctoPrint status GET responses, explicit fabricated inspection dimensions and independent simulated signatures. PENNY-016 then consumes one kit and 45 minutes of attested labor, while preserving the existing 100 penny backing claims. The resulting result status is HUMAN_ATTESTED_WITH_MACHINE_EVIDENCE_NOT_AUTONOMOUSLY_PHYSICALLY_VERIFIED. Box D cannot accept custody or issue tokens.

The demo and tests deliberately do not touch any real OctoPrint instance, physical device, camera, printed object or money. A real optional probe or fingerprint simply reads local observations.

## Important adversaries

- No/source-stale owner approval, wrong plan, inaccurate printer file name or changed G-code bytes
- Machine reports Operational without observed Printing first; completion below 99.9%; inconsistent printer profile; stale/reordered status timestamps
- Missing/forged fabricated-object inspector, maker or receiving owner signature; wrong role keys, changed dimensions, altered photo hash
- Backdated owner APPLY preceding measurement, forged original PENNY treasury source
- Public/private DNS confusion and redirect attempts, unbounded device reply, image nonbytes, unsafe or oversized G-code (not a general safety check)
- Unauthorized automatic printer commands, direct PENNY token mint, fake physical custody or inflated labor/material balances

## Trust and production boundaries

OctoPrint's REST job status and connection state are machine *claims*, not proof of physical motion or a finished object. Human inspectors may be mistaken, manipulated or collusive. SHA-256 of a picture does not prove a scene, camera identity, capture time or authenticity. G-code fingerprinting is not a printer-safety or material-quality certification; humans must supervise real hardware.

Actual independent physical verification would require locally trusted challenge markers, independent metrology, authenticated camera/sensor hardware, secure clock and key provisioning, manufacturing safety procedures and real operator consent. A fourth box would also require separate owner commissioning, legal custody rights, key lifecycle and token authorization before it could act as a financial participant.

**Law:** PRINTER SAID DONE != BOX EXISTS. THREE SIGNATURES != PHYSICAL TRUTH. MACHINE OBSERVATION != AUTHORITY. PENNY BACKING != SPENDABLE FABRICATION BUDGET.
