# CAPABILITY-015 — BUILD THE MISSING VERB

**Jubilee Treasury × CONCORD-014 × GRAFT's public-source nursery.**

The previous CONCORD experiment could recombine abilities already described in a graph. It couldn't turn a missing capability into a **tested new local operator**. This experiment makes the missing step explicit, asks for a strictly bounded synthetic implementation, and independently verifies the returned GRAFT bytes before recomposing any potential agreement.

**Truth boundary:** this is a proof of a deterministic offline **text-to-printable-HTML** technique. It is not the invention of a new language model, the invention of a genuinely new type of money, or proof that any real individual would trade the resulting content for $300 rent. No actual gold, creditor, image rights, donor, filmmaker, person, legal release, title, customer or money is used.

## Reproducible gap

Start from the original `penny-puddle-014` agreement grammar. In the artificial fixture all three existing landlord preferences (repairs, rental film, workshop) are explicitly **NO**. A fourth potential landlord card mentions a portable story display, which still has an **UNKNOWN** answer and requires the missing token:

```text
existing source token: fictional-image-permission:F
  → [ NO TESTED LOCAL TRANSFORMATION ]
desired output token: portable-storyboard-for:L
  → L might consider a display as part of separate rent-negotiation terms
```

The old composer correctly reports **zero feasible conditional chains**, and `findMissingCapability()` reports the unsupported transform, rather than silently assuming someone can do it.

## Source-owned proposal into GRAFT

`makeGraftRequest()` exports `jubilee.graft-capability-proposal/v1`, which contains:
- exact source/target tokens, a bounded invented title and three fictional captions;
- explicit no-real-consent, no-verified-title, no-financial-authority state;
- acceptance tests for a deterministic, locally generated, printable HTML display with escaping and no remote content or executable script;
- `PROPOSE_ONLY` authority and intentionally small size limits.

The export is plain JSON with a SHA-256 digest over its UTF-8 serialized bytes. The contract is *not* an admission to production GRAFT or an authorization to use images, works or people from other accounts.

The separate **GRAFT capability-nursery-015** branch implements the missing local technique using Node 22, writes `offline-story-card.html` and `capability-receipt.json` **only after an explicit local output-path decision**, and refuses to overwrite a directory. The full cross-project GitHub Actions test checks out an **exact commit** of Jubilee's source, builds from its actual request object, compares the receipt's digest to the actual HTML bytes, and calls Jubilee's own independent verifier. No GRAFT production admission is claimed.

## From built technique to new conditional structure

`verifyGraftLocalProof(request,packet)` rejects missing, modified or mislabeled evidence. It independently checks:
- exact typed request identity and GRAFT receipt contract;
- SHA-256 of the request and returned artifact bytes;
- bounded offline HTML, expected source and target tokens, and exact declared local test results;
- absence of any claim of actual property transfer, work performed, money or GRAFT production admission.

If all pass, `composeWithGraftProof()` adds one still **UNKNOWN** volunteer/curator action to the original CONCORD composer:

```text
fictional object image permission
  → locally tested story-card tool + independent potential curator
  → portable story display
  → landlord's own unanswered possibility to negotiate
```

**Old conditional plans in the deliberately blocked case: 0.**
**Plans after local technique verification: 1, nonbinding and conditional.**

The technique's existence does **not** settle the missing human participation. The person who would use it must still opt in; the real owner must actually possess and authorize relevant rights; and the creditor must lawfully agree to precise terms. No loan, guarantee, token, payment or debt discharge is created.

### How this differs from CONCORD-014

014 discovered new **sequences of known operators**. 015 identifies a needed operator with *no source*, defines tests for one narrow missing technique, and treats an independently compiled, reproducible executable artifact as evidence that the *local technique* exists. The system still cannot autonomously invent and verify an arbitrary new primitive, material transformation, or scientific fact. The new capability tested here is **ordinary software document assembly**; this is a bounded end-to-end architecture proof rather than a claim of radical underlying algorithmic novelty.

### Source boundaries

- RELAY-010, QUESTION-012, and CONCORD-014 stay in Jubilee. No live private-contact search, actual MOTIF model-service update or real field request is performed.
- GRAFT is a separate repository with its own reviewed research branch and explicit return proof. Jubilee cannot silently alter its main branch or accept its authority.
- A forged GRAFT receipt cannot install a tested operator. A correctly hashed receipt only proves a local transformation test, not that the source content was authored by the real person or accepted by the landlord.
- This source commit must be pinned by GRAFT's own workflow rather than assuming a changing branch head is authoritative.
- The offline display contains invented text, not a real object's photographic likeness, private data, or the legal rights to use the object's story.
- The outcome remains **HOLD** until independent, real-world verification of the people, object rights, useful performance, and any creditor discharge.

## Run in Jubilee (Node 22+, zero dependencies)

```bash
npm test --prefix labs/penny-puddle-015
npm run demo --prefix labs/penny-puddle-015
node labs/penny-puddle-015/export-request.mjs > /tmp/jubilee-015-request.json
```

With GRAFT's `graft/jubilee-capability-nursery-015` checked out separately:

```bash
node experiments/capability-015/cross.mjs \
  --request /tmp/jubilee-015-request.json \
  --out /tmp/a-new-unused-graft-015-output-directory
```

Then from the Jubilee checkout:

```bash
node labs/penny-puddle-015/verify-output.mjs \
  --request /tmp/jubilee-015-request.json \
  --kit /tmp/a-new-unused-graft-015-output-directory
```

The explicit `--out` directory cannot exist beforehand; this is an intentional write to the operator's local filesystem only.

## Next frontier

Observe independent GRAFT source contributions and compile a small **method family** rather than a single predefined builder. MOTIF could then reason about which unknown methods are falsifiable, which tests are affordable, and whether an entirely unlisted method should be tested. Compare it to a classical planning/tool-retrieval baseline, preserve observed failures and uncertainty, and never promote a hypothetical build into production authority.

**Rule:** *Discover a missing verb, demonstrate exactly what the local tool can actually do, and keep the human and legal rights separate.*
