/**
 * PUDDLE-007 — Asset large enough to be economically stranded.
 * Invented object and offers. No appraisal, gold price, tokenization,
 * asset-custody, secured credit, investment, or title transfer.
 */
const safeInt=(n,name,zero=false)=>{
  if(!Number.isSafeInteger(n)||n<(zero?0:1)||n>1_000_000_000)
    throw new TypeError(name+' must be bounded integer');return n;
};
const nonempty=(s,name)=>{if(typeof s!=='string'||!s.trim())throw new TypeError(name+' must be a string')};
export function suggestAssetDoors(asset){
  nonempty(asset?.id,'asset id');
  nonempty(asset.ownerId,'owner ID');
  if(!['oversized-valuables','equipment','land','special-collection'].includes(asset.kind))
    throw new Error('Unsupported scenario asset class');
  if(typeof asset.ownerWantsToRetainTitle!=='boolean'||typeof asset.titleAndCustodyIndependentlyVerified!=='boolean'||
     typeof asset.currentlyPledged!=='boolean')
    throw new Error('Explicit rights/custody assumptions required');
  const common={
    assetId:asset.id,actualOffer:false,externalApprovalObtained:false,
    ownerRightsRemainInPlace:true,monetaryValueEstablished:false,
    actualLiquidityCreatedCents:0
  };
  const doors=[
    {...common,id:'preserve-and-document',
      category:'information',
      feasibility:'proposal-for-owner-consideration',
      needs:['owner-permission-for-viewing','safe-identification','privacy-respecting-record'],
      explanation:'Document the unusual object without assuming an appraised value, sales price or right to possess it.'},
    {...common,id:'use-or-display-without-selling',
      category:'use-right',
      feasibility:'conditional-review',
      needs:['owner-licensed-time-window','insurance','custody-terms','counterparty-need','payment-agreement'],
      explanation:'If someone values a lawful temporary use or exhibition, negotiate a time-limited license rather than selling ownership.'},
    {...common,id:'authorized-whole-item-sale',
      category:'sale',
      feasibility:'conditional-review',
      needs:['verified-ownership','genuine-buyer','independent-valuation-or-informed-waiver','delivery-security','settled-payment'],
      explanation:'A direct negotiated sale is possible in principle but an asking price is not a spendable balance.'},
    {...common,id:'find-consenting-buyer-pool',
      category:'coordinated-purchase',
      feasibility:'complex-regulated-hold',
      needs:['real-sale-terms','multiple-buyer-consent','property-title-structure','dispute-recourse','professional-legal-review'],
      explanation:'Several parties may jointly purchase an asset under an appropriate legal ownership structure; coordinating bids is not an investment token.'},
    {...common,id:'divide-physical-asset-with-owner-approval',
      category:'physical-division',
      feasibility:'owner-decision-and-technical-review',
      needs:['lawful-divisibility','independent-assay-or-measurement','processing-cost','ownership-evidence','buyer'],
      explanation:'For physically divisible property, actual lawful subdivision may create smaller pieces, but can destroy unique value or incur significant costs.'},
    {...common,id:'collateral-loan-or-fractional-claim',
      category:'secured-finance',
      feasibility:'BLOCKED-UNTIL-LEGAL-PARTNER',
      needs:['real-asset-title','independent-valuation','licensed-or-authorized-lender','loan-contract','foreclosure-risks','collateral-rights',
        'securities-analysis-if-investment-interest'],
      explanation:'Borrowing on property, issuing interests, or selling collateral rights can destroy the owner\'s position; no automatic loan or fungible token is issued.'}
  ];
  if(asset.currentlyPledged){
    for(const d of doors)
      if(['sale','coordinated-purchase','physical-division','secured-finance'].includes(d.category))
        d.feasibility='BLOCKED-EXISTING-PLEDGE';
  }
  if(asset.ownerWantsToRetainTitle){
    for(const d of doors)
      if(['sale','coordinated-purchase','physical-division'].includes(d.category) &&
         !d.feasibility.startsWith('BLOCKED'))
        d.feasibility='HOLD-OWNER-RETAINS-TITLE';
  }
  if(!asset.titleAndCustodyIndependentlyVerified){
    for(const d of doors)
      if(!['information','use-right'].includes(d.category))
        d.feasibility=d.feasibility.startsWith('BLOCKED')?d.feasibility:'HOLD-UNVERIFIED-TITLE';
  }
  return {
    assetId:asset.id,kind:asset.kind,
    observedScale:asset.observedScale||'not verified',
    status:'questions-not-valuations',
    suggestedDoors:doors,
    participantFundsVerified:false,assetMarketValueVerified:false,
    inventedQuoteCents:null,financialProviderConnected:false,ownerTitleTransferred:false,
    actualMoneyMovedCents:0,unitsFractionalized:0,realRightsCreated:0
  };
}
export function oversizedFixture(){
  return {
    id:'imaginary-table-sized-gold-block',ownerId:'hypothetical-owner',
    kind:'oversized-valuables',observedScale:'bigger than a table',
    titleAndCustodyIndependentlyVerified:false,
    ownerWantsToRetainTitle:true,currentlyPledged:false,
    description:'Owner reports enormous gold-like object; composition, mass, authenticity, location and value unverified'
  };
}
