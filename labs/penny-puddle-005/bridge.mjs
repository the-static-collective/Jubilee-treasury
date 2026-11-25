import {validateFixture,planOpportunity} from './opportunity.mjs';

/**
 * Read-only typed candidate graph. The source project remains the owner.
 * This is NOT a native MOTIF cartridge, reLATTE admission, market evidence,
 * permission document, settlement, or ledger transaction.
 */
export function createOpportunityGraph(f){
  validateFixture(f);
  const nodes=[
    {id:'specimen:'+f.specimen.id,type:'particular',evidence:'fictional-fixture',frozen:true,
      reportedFaceValueCents:f.specimen.denominationCents},
    {id:'owner-consent',type:'authority-assertion',evidence:'fictional-fixture',
      verifiedHumanIdentity:false},
    {id:'service:'+f.services.screen.id,type:'inspection-service',
      evidence:'synthetic-cost',costCents:f.services.screen.costCents},
    {id:'service:'+f.services.certify.id,type:'appraisal-service',
      evidence:'synthetic-cost',costCents:f.services.certify.costCents},
    {id:'goal:community',type:'community-need',targetCents:f.goal.targetCents,
      actuallyFundedCents:0,evidence:'fictional-fixture'}
  ];
  const edges=[
    {from:'specimen:'+f.specimen.id,to:'owner-consent',kind:'subject-to-owner-choice',
      status:'asserted-only',effectiveAuthority:false},
    {from:'specimen:'+f.specimen.id,to:'service:'+f.services.screen.id,
      kind:'proposed-physical-inspection',costCents:f.services.screen.costCents,
      status:'HOLD',effectiveAuthority:false},
    {from:'service:'+f.services.screen.id,to:'service:'+f.services.certify.id,
      kind:'conditional-review-if-signal',status:'HOLD',effectiveAuthority:false}
  ];
  for(const b of f.demand){
    const nodeId='market:'+b.id;
    nodes.push({id:nodeId,type:b.kind==='raw'?'as-is-buyer':'post-certification-buyer',
      evidence:'invented-quote',authenticOffer:false,buyerAuthorized:false});
    edges.push({from:'specimen:'+f.specimen.id,to:nodeId,
      kind:b.kind==='raw'?'proposed-raw-sale':'proposed-certified-sale',
      status:'HOLD',effectiveAuthority:false,requiresActualSale:true});
  }
  if(f.creativeSponsor){
    const s=f.creativeSponsor;
    nodes.push({id:'sponsor:'+s.id,type:'sponsor-budget',
      syntheticGrantCents:s.grantCents,realGrantCents:0});
    edges.push({from:'specimen:'+f.specimen.id,to:'sponsor:'+s.id,
      kind:'owner-licensed-creative-work-proposal',status:'HOLD',
      effectiveAuthority:false});
  }
  edges.push({from:'goal:community',to:'specimen:'+f.specimen.id,
    kind:'potential-owner-opt-in-collector-premium-only',
    status:'HOLD',actualContributionCents:0,effectiveAuthority:false});
  return {
    schema:'penny-puddle-motif-proposed-field-v0',
    provenance:{ownerProject:'Jubilee-treasury',sourceModule:'labs/penny-puddle-005/opportunity.mjs',
      sourcePinnedByGitCommit:false,externalSignatureVerified:false,
      world:'entirely synthetic',origin:'PENNY × PUDDLE 005'},
    nodes,edges,observationTickets:[
      {id:'ask-screen',question:'Does independent non-destructive screening find a reason to seek expert review?',
        action:'inspect',independentEvaluatorRequired:true,realWorldActionPermitted:false},
      {id:'ask-certification',question:'What would an independently verified coin authentication conclude?',
        action:'authenticate',independentEvaluatorRequired:true,realWorldActionPermitted:false}
    ],
    authority:'OFFER_ONLY_HOLD',externalLedgerMutationPermitted:false,
    realMoneyCents:0
  };
}
export function proposalCarrier(f){
  const p=planOpportunity(f);
  const field=createOpportunityGraph(f);
  return {
    contract:'penny-puddle-005/prediction-only-v0',
    producer:'Jubilee-treasury',
    receiverIntended:'MOTIF read-only experiment / reLATTE independent HOLD',
    sourceAssertions:['user-modeled-consent','hypothetical-coin-type-weights','fictional-demand-quotations'],
    field,decisionPreview:{
      goal:'Discover next informative candidate action without changing authority',
      expectedFirst:p.optimalClassicalExpected.action,
      affordanceFirst:p.affordanceFirst,
      robustFirst:p.robustWorstCase.action,
      newOptions:p.firstMoves.find(x=>x.actionId===p.affordanceFirst)?.newAffordances||[],
      disclaimer:'Even a source-pinned signature would not prove consent, market price, title or authenticity.'
    },
    destinationConsentVerified:false,recipientAdmitted:false,
    liveConnectionExecuted:false,realMoneyMovedCents:0
  };
}
