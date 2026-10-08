import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {digest,generateSteward,newLedger,append} from '../src/asset-treasury-007.mjs';
import {inspectDesignExport,proposalForDesign,stewardOfferDesign,designIndex}
  from '../src/regenerative-cad-010.mjs';

const keys=generateSteward(),policy={purposeId:'purpose-shop-010',termsRef:'rights-checked-010'};
const hex=c=>c.repeat(64);
function sample(family='STATIC_CAD_005',step=hex('a')){
  const body={
    schema:'static-os.regenerative-design-capacity/v0',
    source_repository:'the-static-collective/static-os',family,
    source_ids:{sketch:'sketch:aaa',decision_trace:'trace:bbb',solid_manifest:'solid:ccc',
      feature_branch:family==='STATIC_CAD_006'?'branch:ddd':null},
    native_relatte:{crossing_id:'cross:111',receive_receipt_id:'receive:222',
      hold_receipt_id:'hold:333',disposition:'HOLD',
      native_signatures_cold_verified:true},
    artifacts:[
      {role:'source-sketch',sha256:hex('1')},
      {role:'design-decision-trace',sha256:hex('2')},
      {role:'step-brep',sha256:step},
      {role:'stl-mesh',sha256:hex('4')}],
    declared_capacity:{kind:'digital_design',unit:'design',quantity:1,
      subject:'digitally verified CAD source, STEP and STL',
      real_software_artifacts:true,fabricated_physical_units:0,
      engineering_safety_certified:false,legal_rights_verified:false,
      eligible_for_treasury_receipt:false},
    authority_effect:'NONE',economic_value_established:false,
    public_warning:'Cold verified signed digital CAD evidence is not a physical machine, transferable right, cash, manufacturing permission or investment value.',
  };
  return {...body,candidate_id:'static-os-design-010:'+digest(body)};
}
const offer=(ledger,proof)=> {
  const p=proposalForDesign(proof,policy);
  return stewardOfferDesign(ledger,keys,proof,policy,{proposalId:p.proposalId,
    decision:'OFFER_ONLY',sourceNativeReverified:true,licenseReviewed:true,humanSelection:true});
};
test('full strict source contract becomes only an inert proposal',()=>{
  const e=sample(),p=proposalForDesign(e,policy);
  assert.equal(inspectDesignExport(e).signatureClaim,'SOURCE_NATIVE_VERIFIER_REQUIRED');
  assert.equal(p.asset.kind,'digital_design');
  assert.equal(p.asset.quantity,1);
  assert.equal(p.realWorldMachineCount,0);
  assert.equal(p.disposition,'HOLD_PROPOSAL_ONLY');
  assert.equal(p.sourceRightsConfirmed,false);
  assert.equal(p.nativeReverificationByThisJavascript,false);
});
test('empty value until separately reviewed signed offer, accept, receive',()=>{
  const p=sample();
  let l=newLedger(keys);
  proposalForDesign(p,policy);
  assert.equal(designIndex(l).assets.length,0);
  l=offer(l,p).ledger;
  assert.equal(designIndex(l).assets[0].available,0);
  l=append(l,keys,'ACCEPT',{assetId:proposalForDesign(p,policy).asset.id,termsEvidenceRef:'manual-terms-010'});
  assert.equal(designIndex(l).assets[0].available,0);
  l=append(l,keys,'RECEIVE',{assetId:proposalForDesign(p,policy).asset.id,
    evidenceRef:'manual-digital-receipt-010',assertion:'asset_received_attested'});
  assert.equal(designIndex(l).assets[0].available,1);
  assert.equal(designIndex(l).noSpendableMoney,true);
});
test('a newly possible design plus real hour is a recipe, not physical machine',()=>{
  let l=newLedger(keys);
  const h={id:'asset-hour-010',kind:'time',label:'Shop review hour',quantity:1,unit:'hour',
    mode:'service',purposeIds:[policy.purposeId],termsRef:'terms-hour-010'};
  l=append(l,keys,'OFFER',h);
  l=append(l,keys,'ACCEPT',{assetId:h.id,termsEvidenceRef:'time-terms-010'});
  l=append(l,keys,'RECEIVE',{assetId:h.id,evidenceRef:'time-receipt-010',assertion:'asset_received_attested'});
  const recipe={id:'recipe-shop-plan-010',purposeId:policy.purposeId,termsRef:'terms-planning-010',
    inputs:[{kind:'digital_design',unit:'design',quantity:1},{kind:'time',unit:'hour',quantity:1}],
    output:{kind:'service',unit:'planning_session',quantity:1}};
  const before=designIndex(l,{recipes:[recipe]});
  assert.equal(before.compositions.length,0);
  const e=sample();
  l=offer(l,e).ledger;
  assert.equal(designIndex(l,{recipes:[recipe]}).compositions.length,0);
  const assetId=proposalForDesign(e,policy).asset.id;
  l=append(l,keys,'ACCEPT',{assetId,termsEvidenceRef:'terms-cad-010'});
  l=append(l,keys,'RECEIVE',{assetId,evidenceRef:'source-owned-receipt-010',
    assertion:'asset_received_attested'});
  const after=designIndex(l,{recipes:[recipe]});
  assert.equal(after.compositions.length,1);
  assert.equal(after.assets.some(x=>x.kind==='physical_machine'),false);
  assert.equal(after.assets.some(x=>x.kind==='service'),false);
  assert.notEqual(before.cutHash,after.cutHash);
});
test('replayed STEP bytes with different declared lineage cannot mint a second stock unit',()=>{
  const a=sample('STATIC_CAD_005',hex('a'));
  const b=sample('STATIC_CAD_006',hex('a'));
  assert.equal(proposalForDesign(a,policy).asset.id,proposalForDesign(b,policy).asset.id);
  const l=offer(newLedger(keys),a).ledger;
  assert.throws(()=>offer(l,b),/duplicate asset/);
});
test('different actual STEP byte identity yields a distinct local proposal ID',()=>{
  const a=proposalForDesign(sample('STATIC_CAD_005',hex('a')),policy);
  const b=proposalForDesign(sample('STATIC_CAD_005',hex('b')),policy);
  assert.notEqual(a.asset.id,b.asset.id);
});
test('fake physical units, non-HOLD, counterfeit native assurance or unknown fields fail',()=>{
  const cases=[
    x=>{x.declared_capacity.fabricated_physical_units=1;},
    x=>{x.native_relatte.disposition='ADMIT';},
    x=>{x.declared_capacity.legal_rights_verified=true;},
    x=>{x.declared_capacity.engineering_safety_certified=true;},
    x=>{x.economic_value_established=true;},
    x=>{x.native_relatte.native_signatures_cold_verified=false;},
    x=>{x.artifacts[2].sha256='bad';},
    x=>{x.untrustedPrivateKey='extra';},
  ];
  for(const mutate of cases) {
    const bad=sample();
    mutate(bad);
    const body={...bad};delete body.candidate_id;
    bad.candidate_id='static-os-design-010:'+digest(body);
    assert.throws(()=>inspectDesignExport(bad),/CAD_TREASURY_HOLD/);
  }
});
test('a false rights-review checkbox or wrong exact ID denies even OFFER',()=>{
  const e=sample(),p=proposalForDesign(e,policy);
  for(const changed of [
    {proposalId:p.proposalId,decision:'OFFER_ONLY',sourceNativeReverified:false,licenseReviewed:true,humanSelection:true},
    {proposalId:p.proposalId,decision:'OFFER_ONLY',sourceNativeReverified:true,licenseReviewed:false,humanSelection:true},
    {proposalId:p.proposalId,decision:'OFFER_ONLY',sourceNativeReverified:true,licenseReviewed:true,humanSelection:false},
    {proposalId:p.proposalId,decision:'AUTO_ADMIT',sourceNativeReverified:true,licenseReviewed:true,humanSelection:true},
    {proposalId:'not-matching',decision:'OFFER_ONLY',sourceNativeReverified:true,licenseReviewed:true,humanSelection:true}
  ]) {
    assert.throws(()=>stewardOfferDesign(newLedger(keys),keys,e,policy,changed),/explicit human offer required/);
  }
});
test('missing legal rights and purpose identifiers cannot become an offer',()=>{
  assert.throws(()=>proposalForDesign(sample(),{...policy,termsRef:'x y'}),/references required/);
  assert.throws(()=>proposalForDesign(sample(),{purposeId:'bad url',termsRef:'rights-009'}),/references required/);
});
if(process.env.NATIVE_CAD010_EXPORT){
  test('actual Static OS native OCCT + signed reLATTE HOLD candidate imports unchanged',()=>{
    const source=JSON.parse(readFileSync(process.env.NATIVE_CAD010_EXPORT,'utf8'));
    const parsed=inspectDesignExport(source);
    assert.equal(parsed.sourceFamily,'STATIC_CAD_005');
    assert.equal(parsed.signatureClaim,'SOURCE_NATIVE_VERIFIER_REQUIRED');
    assert.equal(proposalForDesign(source,policy).realWorldMachineCount,0);
  });
}
