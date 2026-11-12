/**
 * PENNY × PUDDLE-008 / Angel Replenishment
 *
 * The recipient owes NOTHING. A sponsor may satisfy an urgent need directly,
 * and later unrelated donors may optionally replenish that sponsor's outlay or
 * fund another need. A nontransferable impact receipt is NOT a loan/security,
 * debt, tradable token, guaranteed reimbursement, charity tax receipt, or
 * bank-verified payment. Every source and payment below is entirely fictional.
 */
const amount=(n,label,zero=false)=>{
  if(!Number.isSafeInteger(n)||n<(zero?0:1)||n>1000000000)
    throw new TypeError(label+' must be a bounded integer cent amount');
  return n;
};
const id=(s,label)=>{
  if(typeof s!=='string'||!s.trim()||s.length>150)
    throw new TypeError(label+' must be a short nonempty string');
  return s.trim();
};
const clone=obj=>JSON.parse(JSON.stringify(obj));

export function createAngelPuddle({
  campaignId,beneficiaryId,payeeId,sponsorId,
  goalCents,
  separatelyPrefundedLikeReserveCents=0,
  publicCause='Urgent documented bill'
}){
  for(const [k,v] of Object.entries({campaignId,beneficiaryId,payeeId,sponsorId}))
    id(v,k);
  if(new Set([beneficiaryId,payeeId,sponsorId]).size!==3)
    throw new Error('Distinct beneficiary, payee and sponsor identities required as test assertions');
  amount(goalCents,'goalCents');
  amount(separatelyPrefundedLikeReserveCents,'separatelyPrefundedLikeReserveCents',true);
  if(typeof publicCause!=='string'||!publicCause.trim()||publicCause.length>300)
    throw new TypeError('Public cause needs privacy-preserving summary');
  let verifiedNeed=false,syntheticPaidCents=0,sponsorReimbursedGrossCents=0,
    sponsorRecycledCents=0,communityFundCents=0,donorPaidCents=0,
    likeReserveRemainingCents=separatelyPrefundedLikeReserveCents,
    fundedLikeCents=0,sponsorWaivedFutureRecoveryCents=0;
  const events=[], seen=new Set(),likes=new Set(),endorsements=new Set();
  let certificate=null;
  const snapshot=()=>{
    const recoveredOutstanding=Math.max(0,syntheticPaidCents-
      sponsorReimbursedGrossCents-sponsorWaivedFutureRecoveryCents);
    const externalInflow=syntheticPaidCents+donorPaidCents+fundedLikeCents;
    const destinationOutflow=syntheticPaidCents+
      (sponsorReimbursedGrossCents-sponsorRecycledCents)+communityFundCents;
    if(externalInflow!==destinationOutflow)throw new Error('Monetary conservation violation');
    return {
      syntheticOnly:true,campaignId,publicCause,
      status:!verifiedNeed?'awaiting-independent-need-review':
        !syntheticPaidCents?'verified-in-fixture-awaiting-angel':
        'need-satisfied-continued-voluntary-replenishment',
      recipientDebtCents:0,recipientRepaymentObligation:false,
      actualPayeeFundsVerified:false,externalPayeePaymentMade:false,
      originalNeedCents:goalCents,
      syntheticPayeePaidCents:syntheticPaidCents,
      originalNeedStillUnpaidCents:Math.max(0,goalCents-syntheticPaidCents),
      sponsorGrossRecoveryCents:sponsorReimbursedGrossCents,
      sponsorNetRecoveryCents:sponsorReimbursedGrossCents-sponsorRecycledCents,
      sponsorVoluntarilyRecycledCents:sponsorRecycledCents,
      sponsorRecoveryRemainingPermittedCents:recoveredOutstanding,
      sponsorWaivedFutureRecoveryCents,
      communityFundCents,donorPaidCents,
      fundedLikeCents,unfundedEndorsements:endorsements.size,
      likeReserveRemainingCents,
      separateSponsorLikeReserveInitiallyCents:separatelyPrefundedLikeReserveCents,
      certificate:certificate?clone(certificate):null,
      events:events.map(clone),
      conservation:{
        allSyntheticExternalSupportCents:externalInflow,
        payeeAppliedCents:syntheticPaidCents,
        sponsorNetRecoveryCents:sponsorReimbursedGrossCents-sponsorRecycledCents,
        communityPoolCents:communityFundCents,
        balanced:externalInflow===destinationOutflow
      },
      outstandingTransferRightsCents:0,
      tradableSecurityIssued:false,
      financialServicesEnabled:false,actualDonationsReceivedCents:0,
      realMoneyMovedCents:0
    };
  };
  const unique=(eventId)=>{
    id(eventId,'eventId');
    if(seen.has(eventId))throw new Error('Duplicate event receipt');
    seen.add(eventId);
  };
  function verifyNeed({eventId,reviewerId,evidenceReference}){
    if(verifiedNeed)throw new Error('Need already reviewed');
    id(reviewerId,'reviewerId');id(evidenceReference,'evidenceReference');
    if([beneficiaryId,payeeId,sponsorId].includes(reviewerId))
      throw new Error('Independently asserted reviewer ID required');
    unique(eventId);
    verifiedNeed=true;
    events.push({eventId,kind:'NEED_REVIEW_ASSERTED_IN_FIXTURE',
      reviewerId,evidenceReference,notExternalVerification:true});
    return snapshot();
  }
  function sponsorPaysPayee({eventId,actorId,paymentReference,amountCents,
    sponsorAffirmed,independentPayeeReceiptAsserted}){
    id(actorId,'actorId');id(paymentReference,'paymentReference');
    if(!verifiedNeed)throw new Error('Need must be reviewed first');
    if(actorId!==sponsorId||sponsorAffirmed!==true)
      throw new Error('Only the consenting sponsor can model direct payee payment');
    if(independentPayeeReceiptAsserted!==true)
      throw new Error('Need distinct payee receipt evidence assertion');
    if(syntheticPaidCents)throw new Error('Urgent need already satisfied');
    if(amountCents!==goalCents)throw new Error('First experiment requires exact complete payee funding');
    unique(eventId);
    syntheticPaidCents=amountCents;
    certificate={
      certificateId:'angel-receipt:'+campaignId,
      kind:'nontransferable-impact-attestation-in-fixture',
      sponsorId,originalCampaignId:campaignId,
      originallyAddressedNeedCents:goalCents,
      fiatFaceValueCents:0,guaranteedReturnCents:0,
      beneficiaryOwesCents:0,
      fundingStory:'A fictional independent payee receipt says the sponsor satisfied the need; donors may now opt to replenish or circulate help.',
      proofOfActualExternalSettlement:false,registeredCharityReceipt:false,
      tradable:false,redeemable:false,security:false,
      automaticDonationEntitlement:false
    };
    events.push({eventId,kind:'ANGEL_PAYEE_PAYMENT_ASSERTED',
      paymentReference,cents:amountCents,payeeId,realMoneyPaid:false});
    return snapshot();
  }
  function donate({eventId,donorId,amountCents,designation}){
    id(donorId,'donorId');
    amount(amountCents,'donation');
    if(!syntheticPaidCents)throw new Error('No completed need yet; this branch is post-angel support only');
    if(!['replenish-sponsor','next-community-need'].includes(designation))
      throw new Error('Donor must choose exactly where their new money would go');
    if(designation==='replenish-sponsor' &&
       amountCents>syntheticPaidCents-sponsorReimbursedGrossCents-sponsorWaivedFutureRecoveryCents)
      throw new Error('Sponsor reimbursement cannot exceed unrecovered, unwaived principal');
    unique(eventId);
    donorPaidCents+=amountCents;
    if(designation==='replenish-sponsor')sponsorReimbursedGrossCents+=amountCents;
    else communityFundCents+=amountCents;
    events.push({eventId,kind:'FICTIONAL_NEW_DONOR_PAYMENT',
      donorId,designation,cents:amountCents,
      rentAlreadyPaid:true,originCampaignReusedAsStoryNotUnpaidBill:true,
      realPaymentMade:false});
    return snapshot();
  }
  function sponsorRecycles({eventId,actorId,amountCents}){
    if(actorId!==sponsorId)throw new Error('Only original sponsor may voluntarily recycle reimbursements');
    amount(amountCents,'recycled cents');
    if(amountCents>sponsorReimbursedGrossCents-sponsorRecycledCents)
      throw new Error('Cannot recycle funds sponsor has not even been fictionally reimbursed');
    unique(eventId);
    sponsorRecycledCents+=amountCents;
    communityFundCents+=amountCents;
    events.push({eventId,kind:'FICTIONAL_SPONSOR_RECYCLE',cents:amountCents,
      realTransferMade:false,recipientDebtCreated:false});
    return snapshot();
  }
  function waiveFutureRecovery({eventId,actorId,amountCents}){
    if(actorId!==sponsorId)throw new Error('Only sponsor may waive an unguaranteed recovery hope');
    amount(amountCents,'waiver');
    if(amountCents>syntheticPaidCents-sponsorReimbursedGrossCents-sponsorWaivedFutureRecoveryCents)
      throw new Error('Waiver exceeds unrecovered principal');
    unique(eventId);
    sponsorWaivedFutureRecoveryCents+=amountCents;
    events.push({eventId,kind:'SPONSOR_VOLUNTARILY_WAIVES_FUTURE_REIMBURSEMENT',
      cents:amountCents,notALegalDebtForgiveness:true});
    return snapshot();
  }
  function endorse({eventId,actorId}){
    id(actorId,'actorId');
    if(!syntheticPaidCents)throw new Error('Awaiting payment history to endorse');
    if(endorsements.has(actorId))throw new Error('Duplicate endorsement by this fictional identity');
    unique(eventId);
    endorsements.add(actorId);
    events.push({eventId,kind:'UNFUNDED_SOCIAL_ENDORSEMENT',actorId,
      moneyAllocatedCents:0,identityIndependentlyVerified:false});
    return snapshot();
  }
  function fundedLike({eventId,actorId}){
    id(actorId,'actorId');
    if(!syntheticPaidCents)throw new Error('Need not completed');
    if(likes.has(actorId))throw new Error('One fictional sponsored cent per asserted actor');
    if(likeReserveRemainingCents<1)throw new Error('Separate pre-funded-like pool exhausted');
    unique(eventId);
    likes.add(actorId);
    likeReserveRemainingCents-=1;
    fundedLikeCents+=1;
    communityFundCents+=1;
    events.push({eventId,kind:'FICTIONAL_PREFUNDED_ONE_CENT_ENDORSEMENT',
      actorId,cents:1,designation:'next-community-need',
      donorBudgetAlreadyCommitted:true,identityIndependentlyVerified:false,
      realMoneyTransferred:false});
    return snapshot();
  }
  return {
    snapshot,verifyNeed,sponsorPaysPayee,donate,
    sponsorRecycles,waiveFutureRecovery,endorse,fundedLike
  };
}
