# PENNY / Stewardship Reserve 001 — proposal, not issued

**Status:** Accounting and governance design only. No bank balance, legal custodian, fundraising authorization, token redemption, payment rail, fiscal sponsorship, endowment, or partner approval exists in this document.

## Origin

A proposed whole-park GrO + Full Measure community stewardship quest at Sibley Park could participate in existing Kiwanis Holiday Lights volunteer opportunities and produce verified environmental benefits, subject to organizer and park permissions.

The user proposed putting any lawful organizational share of event proceeds **toward Penny**, so value created by voluntary work might eventually support a community resource pool. This is a reasonable *reserve hypothesis*, but **completed voluntary labor does not itself create cash collateral, an obligation to pay, or a right to receive donated funds**.

See proposed field locality: [GrO Sibley Park PR](https://github.com/the-static-collective/GrO/pull/30).

## Three ledgers, three authorities

1. **Ecological / participation:** GrO stores candidate opportunity and field lineage. An approved environmental steward supplies method-grounded findings. Full Measure can present Deed candidates only after the independent authorized human witness from its owning authority. These are *not monetary claims*.
2. **Volunteer-program allocations:** Kiwanis (and each participating group) controls volunteering, group eligibility, its donation formula and allocation timing. A volunteer group's participation is not proof that Static Collective is an eligible recipient; nor does working through an existing group authorize diverting that group's grant.
3. **Actual reserve money:** A lawful custodian (future nonprofit, approved fiscal sponsor, or other legally permitted entity, as appropriate) maintains real statements and a reconciled restricted/general ledger. Jubilee Treasury can **reference** proof of received funds and permitted earmarks. It does not custody or move money.

## Candidate state sequence

```text
opportunity proposed
  → organizer approves role and eligibility (separate)
  → volunteers perform work (separate human confirmation)
  → Kiwanis reports an allocation (not spendable yet)
  → authorized beneficiary ACTUALLY receives funds
  → legal custodian records donor restrictions/conditions
  → governing body designates allowed reserve budget
  → approved stewardship spending
  → independently reconciled disbursement/remaining balance
```

Never move a cash figure into **available backing** before actual receipt, satisfaction of restrictions and reconciliation. Pledges, estimates, volunteer hours, XP, internal transfer labels, and gross reported proceeds are not liquid reserves.

## Candidate record (illustrative only)

```json
{
  "schema": "jubilee/penny-reserve-receipt/v0.1",
  "status": "proposal_only",
  "source_locality": "gro:locality:sibley-park-mankato-mn",
  "allocation_claim_ref": null,
  "legally_eligible_beneficiary": null,
  "legal_custodian": null,
  "bank_verified_cash_received_cents": null,
  "restricted_amount_cents": null,
  "encumbered_amount_cents": null,
  "available_stewardship_reserve_cents": null,
  "reconciliation_at": null,
  "record_owner_signature": null,
  "redacted_public_audit_ref": null,
  "volunteer_credit_or_redemption_right": false
}
```

`available_stewardship_reserve_cents` (if later implemented) may not exceed independently reconciled received funds less restrictions/encumbrances, and can never be populated from GrO Deed count or hours volunteered. This document defines **no exchange ratio** or grant promise.

## What "PENNY = 1" could responsibly mean

An invariant **unit of honest accounting**: one real contribution is witnessed as one contribution, without inflation by narration. Or, after governance and actual custody exist, a unit of displayed reserve cents. These are different representations, and the latter cannot be implied merely by using the word `PENNY`.

There are **no redeemable tokens** and no "backed coin" today. Any later public redemption, earnings, profit-sharing or exchange instrument requires a distinct legal, consumer-protection, tax/accounting and financial-design review before marketing it. Keep gifts, grants, wages, volunteer recognition and investments unconfused.

## Decision gates

- **Kiwanis:** Will eligible groups be accepted? What expenses, organizational forms and allocations are allowed? Who receives funds? Is use for community stewardship within the program's terms? Group capacity currently reported as full; request a waitlist or volunteer through a willing existing group.
- **City/Event:** Which types of park-wide observation and cleanup are permitted, at what times and under whose safety procedures?
- **Blue Earth Project:** Does it wish to steward litter/environmental evidence through EcoMapper; how does it approve published results?
- **Authorized legal custodian:** Who may receive, restrict and spend any grant? Are there fiscal sponsorship or charitable-purpose constraints? Who signs and audits?
- **Collective:** Is Penny only an accounting narrative/receipt unit for now, or is some future mutual-aid reserve proposed? Do **not** auto-answer this by issuing units.

## API / implementation boundary

An approved **receive-only finance adapter** may consume a verified, redacted treasurer-confirmed deposit event and produce a noncustodial public-safe receipt/aggregate projection. It must not:
- ingest personal bank details into GitHub;
- create rights for quest performers;
- convert a self-reported cleanup into an earned balance;
- move, escrow or distribute payments;
- label expected donations as backing;
- silently change the legitimate beneficiary or restrictions;
- use proprietary organizer or third-party data without permission.

**Smallest useful proof:** one real approved cleanup with independent environmental observation, separate witnessed participation record, and (only if legitimately earned and received) a separately reconciled organizational contribution entry. All three remain independently inspectable.
