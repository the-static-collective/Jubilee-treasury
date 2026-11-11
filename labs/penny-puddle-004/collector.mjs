/**
 * PENNY x PUDDLE 004 — strictly fictional numismatic custody and value discovery.
 * Manual flags are NOT authentication or price quotes. No money, auction, transfer,
 * appraisal or fungible coin backing is issued or executed.
 */
const denominations = new Set([1,5,10,25,50,100]);
const nonEmpty = (v, label) => {
  if (typeof v !== 'string' || !v.trim()) throw new TypeError(label + ' requires a nonempty string');
  return v.trim();
};
const cents = (value, label, zero = false) => {
  if (!Number.isSafeInteger(value) || value < (zero ? 0 : 1) || value > 1_000_000_000)
    throw new TypeError(label + ' must be a ' + (zero ? 'nonnegative' : 'positive') + ' safe integer, at most 1 billion cents');
  return value;
};
const snapshotSpecimen = s => ({
  ...s, signals:[...s.signals], reviewEvidence:s.reviewEvidence ? {...s.reviewEvidence} : null,
  proposedTerms:s.proposedTerms ? {...s.proposedTerms, sharesBasisPoints:{...s.proposedTerms.sharesBasisPoints}} : null,
  settlement:s.settlement ? {...s.settlement, allocationsCents:{...s.settlement.allocationsCents}} : null,
});
export function createRareCoinLab({specimens}) {
  if (!Array.isArray(specimens) || specimens.length > 250) throw new TypeError('At most 250 fictional specimens');
  const map=new Map(), observations=[];
  for(const s of specimens){
    const specimenId=nonEmpty(s?.id,'specimen id');
    if(map.has(specimenId)) throw new Error('Duplicate specimen id');
    if(!denominations.has(s.denominationCents)) throw new TypeError('Unsupported U.S. coin denomination');
    nonEmpty(s.declaredOwnerId,'declaredOwnerId');
    nonEmpty(s.declaredFinderId,'declaredFinderId');
    if (s.collateralized===true) throw new Error('Cannot separately sell or recirculate pledged collateral. Unencumber with authorized replacement first.');
    if(s.collateralized!==false) throw new TypeError('Explicit noncollateralized status is required');
    const signals=Array.isArray(s.observedSignals) ? s.observedSignals.map(x=>nonEmpty(x,'signal')) : [];
    if(signals.length>12) throw new TypeError('At most 12 observation signals');
    const coin={
      id:specimenId, denominationCents:s.denominationCents,
      declaredOwnerId:s.declaredOwnerId,declaredFinderId:s.declaredFinderId,
      observedYear:Number.isInteger(s.observedYear)?s.observedYear:null,
      observedMintMark:typeof s.observedMintMark==='string'?s.observedMintMark.slice(0,12):'unrecorded',
      signals,status:'quarantined-for-owner-review',
      custodyClaim:'simulated-not-verified', titleClaim:'self-declared-not-verified',
      reserveBackingIssuedCents:0, faceValueCents:s.denominationCents,
      collectorValueConfirmedCents:0,reviewEvidence:null,proposedTerms:null,settlement:null
    };
    map.set(specimenId,coin);
    observations.push({specimenId,kind:'intake-held',status:coin.status});
  }
  const coins=()=>[...map.values()].map(snapshotSpecimen);
  const get=id=>{nonEmpty(id,'specimen id');const coin=map.get(id);if(!coin)throw new Error('Unknown specimen');return coin;};
  const inspect=()=>({
    coins:coins(),events:observations.map(e=>({...e})),
    totalFaceValueCents:[...map.values()].reduce((n,c)=>n+c.faceValueCents,0),
    issuedCoinBackedCents:0,realCoinSales:0,realPayoutsCents:0,realCustodyVerified:false,
    syntheticOnly:true
  });
  function review({specimenId,reviewerId,disposition,evidenceReference}) {
    const s=get(specimenId);
    nonEmpty(reviewerId,'reviewerId');
    nonEmpty(evidenceReference,'evidenceReference');
    if(reviewerId===s.declaredOwnerId || reviewerId===s.declaredFinderId) throw new Error('Independent assessor assertion required');
    if(s.status!=='quarantined-for-owner-review') throw new Error('Specimen already reviewed or closed');
    if(!['needs-expert','cleared-ordinary','disputed'].includes(disposition)) throw new Error('Unknown review disposition');
    s.status=disposition==='needs-expert'?'suspected-numismatic':
      disposition==='cleared-ordinary'?'ordinary-held-for-owner-choice':'disputed-hold';
    s.reviewEvidence={reviewerId,evidenceReference,disposition,trust:'fixture-assertion-only'};
    observations.push({specimenId,kind:'review',status:s.status});
    return {status:s.status,state:inspect()};
  }
  function authenticate({specimenId,expertId,reference,outcome}) {
    const s=get(specimenId);
    nonEmpty(expertId,'expertId');nonEmpty(reference,'reference');
    if(expertId===s.declaredOwnerId || expertId===s.declaredFinderId)throw new Error('Independent expert assertion required');
    if(s.status!=='suspected-numismatic')throw new Error('Authenticate only a review-held candidate');
    if(!['authentic-collectible','not-collectible','inconclusive'].includes(outcome))throw new Error('Unknown expert outcome');
    if(outcome==='inconclusive') {
      observations.push({specimenId,kind:'inconclusive-review',status:s.status});
      return {status:s.status,state:inspect()};
    }
    s.status=outcome==='authentic-collectible'?'collector-confirmed-in-fixture':'ordinary-held-for-owner-choice';
    s.reviewEvidence={reviewerId:expertId,evidenceReference:reference,disposition:outcome,trust:'fixture-assertion-only'};
    observations.push({specimenId,kind:'expert-assessment',status:s.status});
    return {status:s.status,state:inspect()};
  }
  function proposeOwnerChoice({specimenId,ownerId,choice,reference,sharesBasisPoints}) {
    const s=get(specimenId);nonEmpty(ownerId,'ownerId');nonEmpty(reference,'reference');
    if(ownerId!==s.declaredOwnerId)throw new Error('Only declared owner may choose disposition in this mock; ownership is not verified');
    if(!['return','exhibit','collector-offer'].includes(choice))throw new Error('Unsupported choice');
    if(['disputed-hold','quarantined-for-owner-review','suspected-numismatic'].includes(s.status))
      throw new Error('Held until reviewed and ownership is resolved');
    if(s.proposedTerms)throw new Error('Choice already registered');
    if(choice==='collector-offer' && s.status!=='collector-confirmed-in-fixture')throw new Error('Only confirmed collectible fixture may enter offer review');
    const shares=sharesBasisPoints||{owner:10000,finder:0,steward:0,community:0};
    if(Object.keys(shares).sort().join(',')!=='community,finder,owner,steward')
      throw new TypeError('Exactly owner, finder, steward and community shares required');
    if(!Object.values(shares).every(x=>Number.isSafeInteger(x)&&x>=0&&x<=10000) ||
       Object.values(shares).reduce((a,b)=>a+b,0)!==10000)
      throw new Error('Premium split must total exactly 10000 basis points');
    s.proposedTerms={choice,sharesBasisPoints:{...shares},ownerAssertion:ownerId,reference};
    s.status=choice==='collector-offer'?'offer-approval-hold':choice==='return'?'return-proposed':'exhibit-proposed';
    observations.push({specimenId,kind:'owner-proposal',status:s.status});
    return {status:s.status,state:inspect()};
  }
  function simulateSale({specimenId,externalSalePriceCents,externalCostsCents,buyerReference,ownerReference}) {
    const s=get(specimenId);
    if(s.status!=='offer-approval-hold')throw new Error('No approved-for-review offer terms');
    nonEmpty(buyerReference,'buyerReference');nonEmpty(ownerReference,'ownerReference');
    cents(externalSalePriceCents,'externalSalePriceCents');
    cents(externalCostsCents,'externalCostsCents',true);
    if(externalSalePriceCents < externalCostsCents + s.faceValueCents)
      throw new Error('No positive collector premium after external costs and face-value return');
    const premium=externalSalePriceCents-externalCostsCents-s.faceValueCents;
    const shares=s.proposedTerms.sharesBasisPoints;
    const amounts={
      owner:Math.floor(premium*shares.owner/10000),
      finder:Math.floor(premium*shares.finder/10000),
      steward:Math.floor(premium*shares.steward/10000),
      community:Math.floor(premium*shares.community/10000)
    };
    // All sub-cent remainders go to owner, NEVER invented as additional currency.
    amounts.owner += premium-Object.values(amounts).reduce((a,b)=>a+b,0);
    amounts.owner += s.faceValueCents;
    if(Object.values(amounts).reduce((a,b)=>a+b,0)+externalCostsCents!==externalSalePriceCents)
      throw new Error('Sale conservation invariant failed');
    s.status='simulated-sale-not-settled';
    s.settlement={
      status:'fictional-ledger-only',sellerStillOwnsCoinUntilVerifiedSettlement:true,
      externalSalePriceCents,externalCostsCents,faceValueCents:s.faceValueCents,
      collectorPremiumCents:premium,allocationsCents:amounts,buyerReference,ownerReference,
      actualBuyerFundsReceived:false,coinTransferred:false,bankSettlementVerified:false
    };
    observations.push({specimenId,kind:'simulated-sale',status:s.status});
    return {status:s.status,state:inspect()};
  }
  function availableActions(specimenId) {
    const s=get(specimenId);
    const actions={
      'quarantined-for-owner-review':['independent-review','preserve'],
      'suspected-numismatic':['independent-expert-appraisal','preserve'],
      'disputed-hold':['ownership-resolution','preserve'],
      'ordinary-held-for-owner-choice':['owner-return','owner-exhibit','ordinary-coin-recirculation-after-owner-consent'],
      'collector-confirmed-in-fixture':['owner-return','owner-exhibit','owner-opt-in-sale-proposal'],
      'offer-approval-hold':['obtain-real-merchant-buyer-partner','simulation-only'],
      'return-proposed':['owner-controlled-physical-return'],
      'exhibit-proposed':['owner-controlled-display'],
      'simulated-sale-not-settled':['external-settlement-and-ownership-verification']
    };
    return {specimenId,status:s.status,actions:actions[s.status]||[],hypothetical:true};
  }
  return {inspect,review,authenticate,proposeOwnerChoice,simulateSale,availableActions};
}
