# EXODUS 003 — THE ARK
Synthetic-only reconstruction from the Healer of Nations September 29 design and implementation plan (linked in ../exodus-002/RETURN.md). Parent: main c106d376d9ce840800bfa16d5ec5ca48768af0ac, PR 54 verified workflow 45548367492.
## Run (Node 22.16+, POSIX filesystem)
Create a NEW absolute directory outside the source tree; do not use actual congregation or identity information:
```sh
node ops/exodus-003/one-door.mjs init /tmp/ark-fictional
node ops/exodus-003/one-door.mjs append /tmp/ark-fictional '{"kind":"need"}'
node ops/exodus-003/one-door.mjs reconstruct /tmp/ark-fictional '{"kind":"offer","slot":1}'
node ops/exodus-003/one-door.mjs print /tmp/ark-fictional > /tmp/ark-fictional.html
node ops/exodus-003/one-door.mjs status /tmp/ark-fictional
```
Open HTML offline, print paper kit; CLI performs all mutations. The view is read-only and has no server or network dependency. Bridge only returns explicit reconciled synthetic projection, never sends it. Identity vault stores fixed fictional labels only; AES-GCM key held by caller, no real identities. Data directory outside repo, separate directories, exclusive hard-link records, fsync, sequence and hash-chain checks, visible stale-lock/pending-file HOLD. Hashes are integrity checks not authenticity; malicious rewrite/truncation without external trusted checkpoint is not detected in general. Filesystem modes and fsync/hard links depend on local OS. No Windows proof, real device power-loss test, full paper kit authentication, real consent, physical security review, authenticated interface, multi-device/LAN support or production deployment. A stale writer lock requires human review, not automatic removal. Do not treat as real case tool. No changes to public site or existing source. Tests: node --experimental-strip-types --test ops/exodus-003/ark.test.mjs plus regression workflow.
