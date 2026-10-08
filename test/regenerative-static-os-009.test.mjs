import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {digest,generateSteward,newLedger,append,inspect} from '../src/asset-treasury-007.mjs';
import {proposeRegenerativeAsset,submitRegenerativeOffer,verifyCrankEvidence,
  regenerativeCut,DONOR_REF} from '../src/regenerative-static-os-009.mjs';
const keys=generateSteward();
const policy={purposeId:'purpose-repairs-009',termsRef:'rights-reviewed-009'};
function syntheticProof(text='repair this bridge',turnId='turn-repair-009') {
  const registry={schema:'static-os.crank-capability-registry/v0',node_id:'static-os:cranknode:founding-001',
    capabilities:[{id:'TEXT.UPPERCASE',description:'Transform one text particular to uppercase.',handler:'uppercase-text',
      cost_units:1,proposal_only:false,authority:'none'}]};
  const request={schema:'static-os.crank-turn-request/v0',turn_id:turnId,
    source:{kind:'human',id:'test-operator-009'},selected_capability:'TEXT.UPPERCASE',
    budget_units:1,authority_request:'none',admission_request:'none',
    payload:{text}};
  const result={schema:'static-os.crank-turn-result/v0',turn_id:request.turn_id,
    capability_id:'TEXT.UPPERCASE',output:{text:text.toUpperCase()},
    proposal_only:false,authority_effect:'none',admission_effect:'none',automatic_next_turn:false};
  const receipt={
    schema:'static-os.crank-receipt/v0',turn_id:request.turn_id,source:request.source,
    capability_id:'TEXT.UPPERCASE',request_sha256:digest(request),
    input_sha256:digest(request.payload),result_sha256:digest(result),
    budget:{declared_units:1,cost_units:1,remaining_units:0,authority_effect:'none'},
    proposal_only:false,authority_effect:'none',admission_effect:'none',transport_effect:'none',
    automatic_next_turn:false,carrier_profile:'canonical-json-utf8',
    signature_status:'unsigned-local-receipt',
    laws:['TURN != LOOP','WORK != AUTHORITY','COMPUTATION != ADMISSION',
      'INFERENCE != DECISION','AVAILABLE != SELECTED','SELECTED != EXECUTED',
      'EXECUTED != ACCEPTED','NODE != NETWORK','TRANSPORT != TRUST',
      'OFFLINE != DEAD','PAPER != LOSSY FALLBACK','HUMAN TURN != HUMAN APPROVAL','ENERGY != AUTHORITY']
  };
  receipt.receipt_sha256=digest(receipt);
  return {schema:'jubilee.static-os-native-turn-evidence/v0',
    donor:{repository:'the-static-collective/static-os',commit:DONOR_REF,
      assurance:'UNSIGNED_LOCAL_RECEIPT_NOT_DONOR_AUTHENTICATION'},
    registry,request,bundle:{result,receipt}};
}
const staged=()=>({ledger:newLedger(keys),evidence:syntheticProof()});
const accept=(ledger,a)=>{
  ledger=append(ledger,keys,'ACCEPT',{assetId:a,termsEvidenceRef:'steward-terms-009'});
  return append(ledger,keys,'RECEIVE',{assetId:a,evidenceRef:'steward-receipt-009',
    assertion:'asset_received_attested'});
};
test('digital result is verifiably consistent, but explicitly unsigned',()=>{
  const p=verifyCrankEvidence(syntheticProof());
  assert.equal(p.proofClass,'SELF_CONSISTENT_UNSIGNED_NATIVE_FORMAT');
  assert.match(p.receiptId,/^[a-f0-9]{64}$/);
});
test('repeat proposal is deterministic and cannot carry raw text',()=>{
  const a=proposeRegenerativeAsset(syntheticProof('bridge repair steps'),policy);
  const b=proposeRegenerativeAsset(syntheticProof('bridge repair steps'),policy);
  assert.deepEqual(a,b);
  assert.equal(a.state,'HOLD_PROPOSAL_ONLY');
  assert.equal(a.asset.kind,'digital_artifact');
  assert.equal(a.asset.quantity,1);
  assert.equal(JSON.stringify(a).includes('bridge repair steps'),false);
});
test('valid proof changes NO index capacity without human event',()=>{
  const {ledger,evidence}=staged();
  proposeRegenerativeAsset(evidence,policy);
  assert.equal(regenerativeCut(ledger).assets.length,0);
});
test('steward review creates only signed OFFER; ACCEPT distinct from RECEIVE',()=>{
  const {ledger,evidence}=staged();
  const p=proposeRegenerativeAsset(evidence,policy);
  const a=submitRegenerativeOffer(ledger,keys,evidence,policy,
    {proposalId:p.proposalId,decision:'OFFER_ONLY',sourceReviewed:true,rightsReviewed:true});
  assert.equal(inspect(a.ledger).assets[0].state,'offered');
  assert.equal(regenerativeCut(a.ledger).assets[0].available,0);
  const accepted=append(a.ledger,keys,'ACCEPT',{assetId:p.asset.id,termsEvidenceRef:'review-009'});
  assert.equal(regenerativeCut(accepted).assets[0].available,0);
  assert.equal(regenerativeCut(accept( a.ledger,p.asset.id)).assets[0].available,1);
});
test('one attested digital result plus available time reveals a new *option*, never output',()=>{
  let l=newLedger(keys);
  l=append(l,keys,'OFFER',{id:'asset-hours-009',kind:'time',label:'One hour',
    quantity:1,unit:'hour',mode:'service',purposeIds:[policy.purposeId],termsRef:'terms-time-009'});
  l=accept(l,'asset-hours-009');
  const recipe={id:'recipe-public-guide-009',purposeId:policy.purposeId,termsRef:'terms-guide-009',
    inputs:[{kind:'time',unit:'hour',quantity:1},{kind:'digital_artifact',unit:'artifact',quantity:1}],
    output:{kind:'educational_material',unit:'packet',quantity:1}};
  const before=regenerativeCut(l,{recipes:[recipe]});
  assert.equal(before.compositions.length,0);
  const proof=syntheticProof();
  const p=proposeRegenerativeAsset(proof,policy);
  const offered=submitRegenerativeOffer(l,keys,proof,policy,
    {proposalId:p.proposalId,decision:'OFFER_ONLY',sourceReviewed:true,rightsReviewed:true});
  assert.equal(regenerativeCut(offered.ledger,{recipes:[recipe]}).compositions.length,0);
  const after=regenerativeCut(accept(offered.ledger,p.asset.id),{recipes:[recipe]});
  assert.equal(after.compositions.length,1);
  assert.notEqual(after.cutHash,before.cutHash);
  assert.equal(after.assets.some(x=>x.kind==='educational_material'),false);
  assert.equal(after.noSpendableMoney,true);
});
test('the same source turn cannot be imported twice into one authoritative ledger',()=>{
  const e=syntheticProof(),p=proposeRegenerativeAsset(e,policy);
  let l=submitRegenerativeOffer(newLedger(keys),keys,e,policy,
    {proposalId:p.proposalId,decision:'OFFER_ONLY',sourceReviewed:true,rightsReviewed:true}).ledger;
  assert.throws(()=>submitRegenerativeOffer(l,keys,e,policy,
    {proposalId:p.proposalId,decision:'OFFER_ONLY',sourceReviewed:true,rightsReviewed:true}),/duplicate asset/);
});
test('repeat of identical work with a new turn ID cannot inflate one capacity',()=>{
  const e=syntheticProof('same useful instructions');
  const f=syntheticProof('same useful instructions','turn-again-010');
  assert.notEqual(e.bundle.receipt.receipt_sha256,f.bundle.receipt.receipt_sha256);
  const first=proposeRegenerativeAsset(e,policy);
  const second=proposeRegenerativeAsset(f,policy);
  assert.equal(first.asset.id,second.asset.id);
  let l=submitRegenerativeOffer(newLedger(keys),keys,e,policy,
    {proposalId:first.proposalId,decision:'OFFER_ONLY',sourceReviewed:true,rightsReviewed:true}).ledger;
  assert.throws(()=>submitRegenerativeOffer(l,keys,f,policy,
    {proposalId:second.proposalId,decision:'OFFER_ONLY',sourceReviewed:true,rightsReviewed:true}),/duplicate asset/);
});
test('unreviewed proposal, wrong ID and inferred permission are refused',()=>{
  const e=syntheticProof(),p=proposeRegenerativeAsset(e,policy);
  for(const decision of [
    {proposalId:p.proposalId,decision:'OFFER_ONLY',sourceReviewed:true,rightsReviewed:false},
    {proposalId:p.proposalId,decision:'OFFER_ONLY',sourceReviewed:false,rightsReviewed:true},
    {proposalId:'wrong',decision:'OFFER_ONLY',sourceReviewed:true,rightsReviewed:true},
    {proposalId:p.proposalId,decision:'ACCEPT_AND_RECEIVE',sourceReviewed:true,rightsReviewed:true}
  ]) assert.throws(()=>submitRegenerativeOffer(newLedger(keys),keys,e,policy,decision),/review required/);
});
test('mutated native result, receipt, and pin fail closed',()=>{
  const e=syntheticProof();
  const result=structuredClone(e);
  result.bundle.result.output.text='UNTRUE';
  assert.throws(()=>verifyCrankEvidence(result),/observed result/);
  const receipt=structuredClone(e);
  receipt.bundle.receipt.input_sha256='0'.repeat(64);
  assert.throws(()=>verifyCrankEvidence(receipt),/native receipt semantics/);
  const pin=structuredClone(e);
  pin.donor.commit='untrusted-head';
  assert.throws(()=>verifyCrankEvidence(pin),/donor provenance/);
});
test('no autonomous next turn or admission effects are importable',()=>{
  const e=syntheticProof();
  e.bundle.result.automatic_next_turn=true;
  assert.throws(()=>verifyCrankEvidence(e),/observed result/);
  const f=syntheticProof();
  f.bundle.receipt.admission_effect='ADMIT';
  assert.throws(()=>verifyCrankEvidence(f),/native receipt semantics/);
});
test('mismatched rights purpose and incompatible text scope fail closed',()=>{
  assert.throws(()=>proposeRegenerativeAsset(syntheticProof(),{...policy,termsRef:'bad url'}),/purpose/);
  assert.throws(()=>proposeRegenerativeAsset(syntheticProof('straße'),policy),/bounded explicit native request/);
});
test('proposal-only AI seam is not misrepresented as completed digital artifact',()=>{
  const e=syntheticProof();
  e.request.selected_capability='AI.PROPOSE';
  assert.throws(()=>proposeRegenerativeAsset(e,policy),/bounded explicit native request/);
});
test('unsigned source receipts cannot establish external authorization',()=>{
  const e=syntheticProof();
  const p=proposeRegenerativeAsset(e,policy);
  assert.equal(p.rightsVerified,false);
  assert.equal(p.physicalEffectVerified,false);
  assert.equal(p.automaticAdmission,false);
  assert.match(p.provenanceNotice,/not authenticated/);
});
if(process.env.STATIC_OS_NATIVE_PROOF) {
  test('pinned native Static OS CRANK output imports without normalization or signer substitution',()=>{
    const p=JSON.parse(readFileSync(process.env.STATIC_OS_NATIVE_PROOF,'utf8'));
    const verified=verifyCrankEvidence(p);
    assert.equal(verified.turnId,'TURN-REGENERATION-009');
    assert.equal(p.bundle.receipt.receipt_sha256,verified.receiptId);
    assert.equal(p.bundle.result.output.text,'REPAIR THE BRIDGE; SHARE ONE USABLE INSTRUCTION.');
    assert.equal(proposeRegenerativeAsset(p,policy).state,'HOLD_PROPOSAL_ONLY');
  });
}
