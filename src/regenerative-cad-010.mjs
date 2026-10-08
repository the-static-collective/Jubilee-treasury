import {digest, inspect, append} from './asset-treasury-007.mjs';
import {livingIndex} from './living-capacity-index-008.mjs';

// 010 is a consumer of STATIC OS's ACTUAL native verification export.
// JSON content addressing is NOT a signature. Only an explicitly selected
// trusted source verifier against original STEP/STL and native reLATTE can
// justify a steward's separate sourceReviewed decision.
const schema='static-os.regenerative-design-capacity/v0';
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
const HASH=/^[a-f0-9]{64}$/;
const keys=(x,ks)=>x!==null && typeof x==='object' && !Array.isArray(x) &&
  Object.keys(x).length===ks.length && ks.every(k=>Object.hasOwn(x,k));
const refuse=r=>{throw new Error('CAD_TREASURY_HOLD: '+r);};
const req=(c,m)=>{if(!c) refuse(m);};
const id=v=>typeof v==='string' && ID.test(v);
const hash=v=>typeof v==='string' && HASH.test(v);
const nativeRoles=['source-sketch','design-decision-trace','step-brep','stl-mesh'];
const allowedFamilies=['STATIC_CAD_005','STATIC_CAD_006'];

export function inspectDesignExport(exported) {
  req(exported && typeof exported==='object' && !Array.isArray(exported),'candidate object required');
  const body={...exported}; const candidateId=body.candidate_id;delete body.candidate_id;
  req(keys(body,['schema','source_repository','family','source_ids','native_relatte','artifacts',
    'declared_capacity','authority_effect','economic_value_established','public_warning']),
    'strict native candidate schema');
  req(body.schema===schema &&
    body.source_repository==='the-static-collective/static-os' &&
    allowedFamilies.includes(body.family) &&
    candidateId==='static-os-design-010:'+digest(body),
    'candidate provenance or hash mismatch');
  const ids=body.source_ids;
  req(keys(ids,['sketch','decision_trace','solid_manifest','feature_branch']) &&
    [ids.sketch,ids.decision_trace,ids.solid_manifest].every(id) &&
    (ids.feature_branch===null || id(ids.feature_branch)) &&
    (body.family==='STATIC_CAD_006')===(ids.feature_branch!==null),
    'source identity or branch mismatch');
  const r=body.native_relatte;
  req(keys(r,['crossing_id','receive_receipt_id','hold_receipt_id','disposition',
    'native_signatures_cold_verified']) &&
    [r.crossing_id,r.receive_receipt_id,r.hold_receipt_id].every(id) &&
    r.disposition==='HOLD' &&
    r.native_signatures_cold_verified===true,'native R3 HOLD contract');
  req(Array.isArray(body.artifacts) && body.artifacts.length===4 &&
    nativeRoles.every((role,i)=>keys(body.artifacts[i],['role','sha256']) &&
      body.artifacts[i].role===role && hash(body.artifacts[i].sha256)), 'exact signed source artifactual refs');
  const c=body.declared_capacity;
  req(keys(c,['kind','unit','quantity','subject','real_software_artifacts',
    'fabricated_physical_units','engineering_safety_certified','legal_rights_verified',
    'eligible_for_treasury_receipt']) &&
    c.kind==='digital_design' && c.unit==='design' && c.quantity===1 &&
    c.real_software_artifacts===true && c.fabricated_physical_units===0 &&
    c.engineering_safety_certified===false && c.legal_rights_verified===false &&
    c.eligible_for_treasury_receipt===false &&
    body.authority_effect==='NONE' && body.economic_value_established===false &&
    typeof body.public_warning==='string' &&
    body.public_warning.includes('not a physical machine'), 'candidate tries to launder physical or economic authority');
  return {candidateId,sourceSketchId:ids.sketch,sourceSolidId:ids.solid_manifest,
    stepDigest:body.artifacts[2].sha256,stlDigest:body.artifacts[3].sha256,
    crossingId:r.crossing_id,holdReceiptId:r.hold_receipt_id,
    sourceFamily:body.family,signatureClaim:'SOURCE_NATIVE_VERIFIER_REQUIRED'};
}

export function proposalForDesign(exported,{purposeId,termsRef}={}) {
  req(id(purposeId) && id(termsRef),'explicit rights and purpose references required');
  const source=inspectDesignExport(exported);
  // Same STEP bytes are one local design *catalog entry*, not a count of
  // manufactured parts or independent licenses. Two different lineages
  // may reference the same immutable design without multiplying inventory.
  const assetId='asset-cad-'+source.stepDigest.slice(0,32);
  const asset={id:assetId,kind:'digital_design',
    label:'Source-verified digital CAD candidate (not physical machine)',
    quantity:1,unit:'design',mode:'license',purposeIds:[purposeId],termsRef};
  const body={schema:'jubilee.regenerative-cad-offer-proposal/v0',
    source,asset,disposition:'HOLD_PROPOSAL_ONLY',
    nativeReverificationByThisJavascript:false,
    sourceRightsConfirmed:false,fabricationPermission:false,
    realWorldMachineCount:0,automaticReceipt:false,
    note:'Native Static OS must actually reverify signed source files; this JSON is only a self-consistent candidate. Human steward must independently review rights and acceptance.'};
  return {...body,proposalId:digest(body)};
}

export function stewardOfferDesign(ledger,steward,exported,policy,decision) {
  const p=proposalForDesign(exported,policy);
  req(keys(decision,['proposalId','decision','sourceNativeReverified','licenseReviewed','humanSelection']) &&
    decision.proposalId===p.proposalId &&
    decision.decision==='OFFER_ONLY' &&
    decision.sourceNativeReverified===true &&
    decision.licenseReviewed===true &&
    decision.humanSelection===true,
    'separate native verification, rights review, explicit human offer required');
  inspect(ledger);
  return {ledger:append(ledger,steward,'OFFER',p.asset),proposal:p};
}

export function designIndex(ledger,{recipes=[],expectedHead}={}) {
  const cut=livingIndex(ledger,{recipes,...(expectedHead===undefined?{}:{expectedHead})});
  return {...cut,designRule:'SIGNED_RECEIVE IS A STEWARD ATTESTATION, NOT A PHYSICAL MACHINE OR ENGINEERING CERTIFICATION'};
}
