import {createAngelPuddle} from './angel-puddle.mjs';
export function runAngelCycle(){
 const a=createAngelPuddle({
  campaignId:'fictional-rent-help',
  beneficiaryId:'person-A',payeeId:'fictional-landlord',
  sponsorId:'angel-B',goalCents:30000,
  separatelyPrefundedLikeReserveCents:5,
  publicCause:'One month of rent covered, with an ongoing gift-forward invitation'
 });
 a.verifyNeed({eventId:'independent-review',reviewerId:'reviewer-C',
   evidenceReference:'invented-private-bill-evidence'});
 const before=a.snapshot();
 a.sponsorPaysPayee({eventId:'angel-paid-payee',actorId:'angel-B',
   paymentReference:'invented-landlord-receipt',amountCents:30000,
   sponsorAffirmed:true,independentPayeeReceiptAsserted:true});
 const paid=a.snapshot();
 a.donate({eventId:'new-donor-1',donorId:'donor-D',amountCents:12000,
   designation:'replenish-sponsor'});
 a.donate({eventId:'new-donor-2',donorId:'donor-E',amountCents:3000,
   designation:'next-community-need'});
 a.endorse({eventId:'ordinary-like',actorId:'actor-F'});
 a.fundedLike({eventId:'funded-like',actorId:'actor-G'});
 const beforeRecycle=a.snapshot();
 a.sponsorRecycles({eventId:'recycle-from-recovery',actorId:'angel-B',
   amountCents:7000});
 const afterRecycle=a.snapshot();
 return {
  scenario:'PENNY × PUDDLE-008 / Angel-funded need, replenished circle',
  reality:'Entirely invented people, payee confirmations and money. No bank integrations.',
  before:{phase:before.status,unpaidNeedCents:before.originalNeedStillUnpaidCents},
  immediateHelp:{
   causePaidCents:paid.syntheticPayeePaidCents,
   debtToPersonACents:paid.recipientDebtCents,
   payeeReceiptReal:false,
   angelCertificate:paid.certificate
  },
  donorSupportBeforeAngelRecycles:{
   sponsorReimbursedCents:beforeRecycle.sponsorGrossRecoveryCents,
   sharedCommunityCents:beforeRecycle.communityFundCents,
   socialEndorsementsNotMoney:beforeRecycle.unfundedEndorsements
  },
  cyclicalOutcome:{
   originalCausePaidCents:afterRecycle.syntheticPayeePaidCents,
   sponsorNetRecoveryCents:afterRecycle.sponsorNetRecoveryCents,
   newCommunityPoolCents:afterRecycle.communityFundCents,
   sponsorRemainingPotentialRecoveryCents:afterRecycle.sponsorRecoveryRemainingPermittedCents,
   externalSupportRecordedCents:afterRecycle.conservation.allSyntheticExternalSupportCents,
   conservationBalanced:afterRecycle.conservation.balanced,
   personAOwesCents:afterRecycle.recipientDebtCents,
   realMoneyMovedCents:afterRecycle.realMoneyMovedCents
  }
 };
}
if(process.argv?.[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
 console.log(JSON.stringify(runAngelCycle(),null,2));
