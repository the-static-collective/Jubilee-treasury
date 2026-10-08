# REGENERATIVE CAD ECONOMICS 010 — native signed design → Jubilee opportunity

**Experimental draft, stacked on Regenerative Capacity 009 PR #14 (and 008/007 parents).** There is no live asset registry, bank, verified financial instrument, printing/cutting machine, insurance policy, manufacturing certification or public aid gateway in this specimen.

## Source owner and real proof

STATIC OS's [design-capacity 010](https://github.com/the-static-collective/static-os/issues/58) **actually cold verifies** its own OCCT CAD files against the original source, signed native reLATTE crossing and distinct signed RECEIVE/R3_HOLD receipts. The document-alone candidate exported by Static OS lists source sketch/trace/STEP/STL digests and signed receipt IDs, but is not independently signed itself. It can be forged when copied without the source bytes.

That is why the native two-repo CI always executes the actual Static OS verifier directly on the original package *before* a Jubilee import: it does not trust a manually written `native_signatures_cold_verified` JSON boolean.

### What Jubilee may do after explicit source verification

```text
real signed CAD original / STEP / STL bytes
   → STATIC OS native signature, source and kernel cold verification
   → inert DigitalDesignCandidate
   → explicit rights / selection / steward review (synthetic in CI)
   → signed Treasury OFFER only
   → separate signed ACCEPT and separate signed RECEIVE
   → Living Index digital_design [1 design entry]
   → possible human planning recipe if separate work-hour exists
   → no automatic new work, machine, title, collateral or money
```

Jubilee's `inspectDesignExport` checks exact schema, content hash, a four-asset file digest vector and the `R3_HOLD` source contract. **This checks shape and self-consistency only.** The source-native verifier and trustworthy checkout/operator remain required for any real-world acceptance. This release never auto-imports a copied document as authenticated.

The local Treasury records a reviewed `digital_design` license **catalog entry**, quantity one, with an explicit purpose and rights-terms reference. That quantity is not a limitation on infinitely copyable bytes, not one finished machine and not evidence of a license that the source holder never granted. Identical STEP digest repeats map to the same local asset key, preventing identical design bits from silently increasing the capacity count. Different STEP bytes may represent different distinct design entries, but no economic value is assigned by the index.

### Reproduce in pinned native CI

The donor owns the real CAD construction and native reLATTE R14:
`the-static-collective/static-os` branch `experiment/regenerative-design-capacity-010` (draft on CAD-006).

From the STATIC OS source checkout after generating an actual CAD-005 package with its existing commands:
```sh
python3 scripts/static-design-capacity.py export \
  --family STATIC_CAD_005 --package dist/cad010-real-solid \
  --out dist/cad010-design-capacity.json
python3 scripts/static-design-capacity.py verify \
  --family STATIC_CAD_005 --package dist/cad010-real-solid \
  --out dist/cad010-design-capacity.json
```

Then from the Jubilee Treasury 010 source checkout:
```sh
NATIVE_CAD010_EXPORT=/path/to/dist/cad010-design-capacity.json npm test
node src/regenerative-cad-demo-010.mjs /path/to/dist/cad010-design-capacity.json
```

The demo uses synthetic owner-review flags, **not** cryptographic proof of a human decision or rights clearance. It records no actual purchase, donation, fabrication or planning service.

The Static OS 010 workflow fetches an exact version of this Jubilee consumer, runs this test suite against the **same real signed source export**, then simulates source-internal review/accept/receipt and a newly eligible `digital_design + hour → planning_session` recipe.

### Hostile boundaries
- Forged source sketch / trace / STEP or native signature: source must refuse in cold verifier.
- Forged detached 010 export could pass a self-consistent hash; can *never* count as independently verified without fresh native source check.
- No source rights, source holder consent, workshop qualification, physical design safety, construction tool, energy or material can be inferred from a STEP file.
- Changing `HOLD` to `ADMIT` or `fabricated_physical_units` to 1 is rejected by Jubilee's strict parser even if an adversary rehashes it.
- Work-hour and design requirement remain separate; proposals sharing either inventory cannot be summed as independent reserves.
- Treasury steward OFFER, ACCEPT and RECEIVE stay three different source-owned events. Direct design candidate has available capacity **zero**.
- The index is no financial valuation, credit line, yield guarantee, claim on human labor, reputation score, or investment return.
- Private reLATTE signing keys and source-owner private data do not belong in public CI artifacts.

**Laws:** `PROOF OF DESIGN != DESIGN RIGHTS`; `RIGHTS != PHYSICAL STOCK`; `VALID BREP != SAFE MACHINE`; `SIGNED HOLD != AUTHORIZATION`; `AVAILABLE DESIGN != COMPLETED PLANNING`; `REUSABLE IDEA != MULTIPLIED SCARCE STOCK`.
