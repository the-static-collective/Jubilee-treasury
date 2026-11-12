import test from 'node:test';
import assert from 'node:assert/strict';
import {createAngelPuddle} from '../angel-puddle.mjs';

const pud=()=>createAngelPuddle({
  campaignId:'rent-nov',beneficiaryId:'familyA',payeeId:'landlord',
  sponsorId:'angelB',goalCents:30000,
  separatelyPrefundedLikeReserveCents:3,
  publicCause:'November rent support'
});
function reviewed(p){
  p.verifyNeed({eventId:'need-reviewed',reviewerId:'independent-helper',
    evidenceReference:'mock-need-evidence'});
  return p;
}
function angel(p){
  p.sponsorPaysPayee({eventId:'payee-funded',actorId:'angelB',
    paymentReference:'fictional-payee-receipt',amountCents:30000,
    sponsorAffirmed:true,independentPayeeReceiptAsserted:true});
  return p;
}
test('no rent can be recorded as paid until separate need and payee receipt assertions',()=>{
  const p=pud();
  assert.throws(()=>p.sponsorPaysPayee({
    eventId:'x',actorId:'angelB',paymentReference:'mock',amountCents:30000,
    sponsorAffirmed:true,independentPayeeReceiptAsserted:true
  }),/reviewed first/);
  reviewed(p);
  assert.throws(()=>p.sponsorPaysPayee({
    eventId:'x',actorId:'angelB',paymentReference:'mock',amountCents:30000,
    sponsorAffirmed:true,independentPayeeReceiptAsserted:false
  }),/payee receipt/);
  assert.equal(p.snapshot().originalNeedStillUnpaidCents,30000);
  assert.equal(p.snapshot().certificate,null);
});
test('angel payment marks cause addressed, while recipient has zero obligation',()=>{
  const p=angel(reviewed(pud()));
  const s=p.snapshot();
  assert.equal(s.originalNeedStillUnpaidCents,0);
  assert.equal(s.syntheticPayeePaidCents,30000);
  assert.equal(s.recipientDebtCents,0);
  assert.equal(s.recipientRepaymentObligation,false);
  assert.equal(s.sponsorRecoveryRemainingPermittedCents,30000);
  assert.equal(s.certificate.originallyAddressedNeedCents,30000);
  assert.equal(s.certificate.fiatFaceValueCents,0);
  assert.equal(s.certificate.guaranteedReturnCents,0);
  assert.equal(s.certificate.redeemable,false);
  assert.equal(s.certificate.tradable,false);
  assert.equal(s.externalPayeePaymentMade,false);
  assert.equal(s.conservation.balanced,true);
});
test('duplicate angel payout and duplicate receipt cannot fund the same bill twice',()=>{
  const p=angel(reviewed(pud()));
  assert.throws(()=>p.sponsorPaysPayee({eventId:'payee-funded',actorId:'angelB',
    paymentReference:'2',amountCents:30000,sponsorAffirmed:true,
    independentPayeeReceiptAsserted:true}),/already satisfied/);
  assert.equal(p.snapshot().syntheticPayeePaidCents,30000);
});
test('donor must explicitly select reimbursement versus new community need',()=>{
  const p=angel(reviewed(pud()));
  assert.throws(()=>p.donate({eventId:'d1',donorId:'donor',amountCents:5000,
    designation:'unspecified'}),/Donor must choose/);
  let s=p.donate({eventId:'d1',donorId:'donor',amountCents:5000,
    designation:'replenish-sponsor'});
  assert.equal(s.sponsorGrossRecoveryCents,5000);
  assert.equal(s.communityFundCents,0);
  s=p.donate({eventId:'d2',donorId:'donor2',amountCents:2000,
    designation:'next-community-need'});
  assert.equal(s.sponsorGrossRecoveryCents,5000);
  assert.equal(s.communityFundCents,2000);
  assert.equal(s.originalNeedStillUnpaidCents,0);
  assert.equal(s.conservation.allSyntheticExternalSupportCents,37000);
  assert.equal(s.conservation.sponsorNetRecoveryCents,5000);
  assert.equal(s.conservation.communityPoolCents,2000);
  assert.equal(s.conservation.balanced,true);
  assert.equal(s.actualDonationsReceivedCents,0);
});
test('sponsor may recycle only actually simulated reimbursements',()=>{
  const p=angel(reviewed(pud()));
  assert.throws(()=>p.sponsorRecycles({
    eventId:'recycle',actorId:'angelB',amountCents:1000
  }),/not even been/);
  p.donate({eventId:'donation',donorId:'friend',amountCents:7000,
    designation:'replenish-sponsor'});
  const s=p.sponsorRecycles({
    eventId:'recycle',actorId:'angelB',amountCents:3000
  });
  assert.equal(s.sponsorGrossRecoveryCents,7000);
  assert.equal(s.sponsorNetRecoveryCents,4000);
  assert.equal(s.sponsorVoluntarilyRecycledCents,3000);
  assert.equal(s.communityFundCents,3000);
  assert.equal(s.conservation.allSyntheticExternalSupportCents,37000);
  assert.equal(s.conservation.payeeAppliedCents,30000);
  assert.equal(s.conservation.balanced,true);
});
test('owner may waive prospective reimbursement and future donors cannot silently repay anyway',()=>{
  const p=angel(reviewed(pud()));
  p.waiveFutureRecovery({eventId:'waiver',actorId:'angelB',amountCents:25000});
  assert.throws(()=>p.donate({eventId:'excess',donorId:'donor',amountCents:6000,
    designation:'replenish-sponsor'}),/cannot exceed/);
  const s=p.donate({eventId:'community',donorId:'donor',amountCents:6000,
    designation:'next-community-need'});
  assert.equal(s.sponsorRecoveryRemainingPermittedCents,5000);
  assert.equal(s.communityFundCents,6000);
});
test('there is no guaranteed reimbursement and funds cannot exceed original sponsor outlay',()=>{
  const p=angel(reviewed(pud()));
  p.donate({eventId:'repay-all',donorId:'donor',amountCents:30000,
    designation:'replenish-sponsor'});
  assert.throws(()=>p.donate({eventId:'extra',donorId:'donor2',amountCents:1,
    designation:'replenish-sponsor'}),/cannot exceed/);
  assert.equal(p.snapshot().sponsorRecoveryRemainingPermittedCents,0);
  assert.equal(p.snapshot().sponsorGrossRecoveryCents,30000);
  assert.equal(p.snapshot().recipientDebtCents,0);
});
test('likes without separate prefunding are not money',()=>{
  const p=angel(reviewed(pud()));
  const s=p.endorse({eventId:'like1',actorId:'volunteer'});
  assert.equal(s.unfundedEndorsements,1);
  assert.equal(s.donorPaidCents,0);
  assert.equal(s.communityFundCents,0);
  assert.equal(s.fundedLikeCents,0);
  assert.throws(()=>p.endorse({eventId:'like2',actorId:'volunteer'}),/Duplicate/);
});
test('one-cent sponsored likes debit finite independent budget and cannot mint money',()=>{
  const p=angel(reviewed(pud()));
  const a=p.fundedLike({eventId:'sponsor-like1',actorId:'one'});
  assert.equal(a.likeReserveRemainingCents,2);
  assert.equal(a.communityFundCents,1);
  assert.equal(a.fundedLikeCents,1);
  assert.throws(()=>p.fundedLike({eventId:'duplicate-human',actorId:'one'}),/One fictional/);
  p.fundedLike({eventId:'sponsor-like2',actorId:'two'});
  const s=p.fundedLike({eventId:'sponsor-like3',actorId:'three'});
  assert.equal(s.likeReserveRemainingCents,0);
  assert.equal(s.communityFundCents,3);
  assert.equal(s.conservation.allSyntheticExternalSupportCents,30003);
  assert.equal(s.conservation.balanced,true);
  assert.throws(()=>p.fundedLike({eventId:'sponsor-like4',actorId:'four'}),/exhausted/);
  assert.equal(s.realMoneyMovedCents,0);
});
test('social clout never creates financial rights or a borrower balance',()=>{
  const p=angel(reviewed(pud()));
  for(let n=1;n<=5;n++)p.endorse({eventId:'endorse'+n,actorId:'actor'+n});
  const s=p.snapshot();
  assert.equal(s.unfundedEndorsements,5);
  assert.equal(s.outstandingTransferRightsCents,0);
  assert.equal(s.tradableSecurityIssued,false);
  assert.equal(s.recipientDebtCents,0);
  assert.equal(s.sponsorRecoveryRemainingPermittedCents,30000);
  assert.equal(s.communityFundCents,0);
});
test('sponsor B can direct later reimbursement into common fund, conserving external sources',()=>{
  const p=angel(reviewed(pud()));
  p.donate({eventId:'donor-reimburses',donorId:'benefactor',amountCents:30000,
    designation:'replenish-sponsor'});
  const s=p.sponsorRecycles({eventId:'new-puddle',actorId:'angelB',amountCents:30000});
  assert.equal(s.sponsorNetRecoveryCents,0);
  assert.equal(s.communityFundCents,30000);
  assert.equal(s.syntheticPayeePaidCents,30000);
  assert.equal(s.conservation.allSyntheticExternalSupportCents,60000);
  assert.equal(s.conservation.payeeAppliedCents+s.conservation.communityPoolCents,60000);
  assert.equal(s.conservation.balanced,true);
  assert.equal(s.recipientRepaymentObligation,false);
});
test('snapshot cannot mutate certificate or recorded event provenance',()=>{
  const p=angel(reviewed(pud()));
  const s=p.snapshot();
  s.certificate.redeemable=true;
  s.events[0].kind='FAKE';
  assert.equal(p.snapshot().certificate.redeemable,false);
  assert.notEqual(p.snapshot().events[0].kind,'FAKE');
});
