# GITHUB SOURCE 010 — first real upstream observation into Ambient Trickle

**Status:** Real, read-only GitHub REST source adapter, with signed private Trickle observations and native reLATTE HOLD proof. This is **not** a GitHub-operated or endorsed value registry. A merged PR is an observed public software event, not transferable IP, an economic asset, a charitable gift, or automatically reusable licensed work.

## The complete seam

    public GitHub PR + corresponding merge commit
                  ↓ exact-source checks through GitHub REST API
           optional local adapter signer
                  ↓ Ed25519 signed, minimal "delivery_reported"
         private Ambient Trickle 009 inbox
                  ↓ duplicate-proof on periodic scan
        status = PRIVATE_OBSERVED_HOLD
                  ↓ optional read-only reLATTE opaque spec
          native signed reLATTE crossing
                  ↓ signed RECEIVED -> signed R3_HOLD
       independent receiving world, no automatic ADMIT

This supplies the long-term slow-trickle pattern: **the donor, contributor, reviewer, and repository maintainer keep using GitHub exactly as usual**. Once an operator sets up a private source adapter, subsequent public merges can be observed without manual data entry.

## Trust boundary

The adapter uses **GitHub's REST API over HTTPS**, pinned to one explicitly configured repository and target base branch. It reads:
1. exact pull request number and GitHub repository identity;
2. GitHub's merged timestamp and merge commit SHA;
3. the corresponding commit fetched from that same repository.

It refuses open/unmerged PRs, a different target repo/base, mismatched commit SHA, mismatched location, untrusted HTTP redirects, unauthorized source keys, invalid signatures, and conflicting repeated event IDs.

Minimal private Trickle signal fields: §eventId§, §assetId§, revision, hash predecessor, §kind=software§, §status=delivery_reported§, §quantity=1§, §unit=merged_pr§, configured purpose, hash of the public source facts, and timestamp. **No title, contributor identity, email, source files, diff, payment data, or donor information** is copied into that signal.

The adapter **signs its own interpretation of a GitHub API response**. GitHub does not sign our Trickle payload, issue an economic valuation, confer ownership, or certify charitable receipt. The signal means only that the adapter observed a reported public repository merge event. The receiving steward remains separate.

## Local setup — one-time operator action

Node.js 22+ is recommended. These commands act only in a locally controlled directory:

    npm test
    npm run github:source -- init ./private-github-trickle the-static-collective/reLATTE purpose-open-source-observation-001 github-relatte-source-001 main

The init command writes:
- §github-adapter.json§ — exactly one allowlisted public repository, target branch, purpose and source ID.
- §source-key.json§ — locally generated Ed25519 **private** signer key. Never commit or share.
- §inbox.json§ — private Trickle inbox whose policy pins that generated public key and the permitted §software§ kind and purpose.

For a **single real merged event**, run:

    npm run github:source -- pull ./private-github-trickle 64
    npm run github:source -- show ./private-github-trickle

The real example is [reLATTE PR #64](https://github.com/the-static-collective/reLATTE/pull/64), merged on October 7, 2026. It verifies the exact PR and merge commit through live GitHub API. Any already-scanned event is idempotent.

For ongoing **slow trickle**:

    npm run github:source -- scan ./private-github-trickle 2

This inspects up to two recent pages (each 100 closed PRs) and independently verifies new merged PRs on the configured target branch, one at a time. Re-running it with no new merges adds **zero records**. An operator can later configure a local scheduler (cron/systemd/Task Scheduler) for a daily run, or install a hosted private service. **Nothing in this PR installs a daemon, requests source account access, or schedules collection behind the user's back.** Beyond the bounded pages, older events require additional intentional backfill.

For public repos, GitHub permits unauthenticated read-only API requests subject to rate limits. An optional §GITHUB_TOKEN§ environment variable uses a token supplied by the operator; it is never stored in the inbox, signed records, or emitted result. Never put a token into CLI arguments, repository configuration, or public code. For private repositories, explicit read authorization would be required and this prototype is **not** intended to export private merge metadata.

## Native reLATTE HOLD

To produce an inert source descriptor:

    npm run github:source -- hold ./private-github-trickle 64 ./observation-hold.json

This descriptor is §relatte.opaque-organ-spec/v0§ with §artifact_kind=OBSERVATION_NOT_ASSET§ and §permissionGranted=false§.

To exercise an actual cryptographically signed crossing through the current reLATTE donor runtime, first clone [reLATTE](https://github.com/the-static-collective/reLATTE) and install its dependencies, then:

    npm run github:hold -- ./private-github-trickle github-relatte-source-001 ghpr-64 /path/to/reLATTE ./private-relatte-work

The receiver signs its distinct §RECEIVED§ and §R3_HOLD§ receipts. Repeating the same **unchanged** source history produces the same durable crossing and receipt IDs. If source history changes, a new crossing must be independently received and admitted. **HOLD is not ownership, license assignment, accepted delivery, or a programming command.**

## What CI proves

The new GitHub Actions job contacts GitHub's **live public API** for the actual merged reLATTE PR #64, generates an **ephemeral test-only** signing key, imports one source claim into a temporary private Trickle inbox, and executes the real reLATTE crossing/RECEIVE/HOLD and cold replay. The Action does **not** enroll any donor or persist a private signing key. The ordinary full suite also tests invalid states and tampering using fully offline fixtures.

Live proof does not mean a source adapter is installed on a production server. To make it continuously useful, a responsible human must set up an operator-controlled directory, securely retain the signing key, and schedule the read-only §scan§ command after checking the intended source and purpose.

## Why this can precede Bandcamp or Kinship

GitHub's public merge API supplies a **real external source** without payment credentials or donor identities. It proves event identity, opt-in local scope, deduplication, signed transport, and owner-local HOLD. A future Bandcamp sales adapter must pass the same source/permission gates while adding settlement/reversal/rights safeguards; relevant Bandcamp report API access and the user's consent are **not** obtained here.

Likewise, Kinship continues using its own giving system. This experiment connects no Kinship account and has no relevance to its official donation totals.

**Governing laws:**

    REPOSITORY MERGE != ECONOMIC VALUATION
    SOURCE READ != REPOSITORY ENDORSEMENT
    CODE CONTRIBUTION != TRANSFERRED COPYRIGHT
    API RESPONSE != GITHUB CRYPTOGRAPHIC SIGNATURE
    SIGNED OBSERVATION != INVENTORY
    RECEIVE != ADMIT
    HISTORICAL SOURCE EVENT != CURRENT PERMISSION
