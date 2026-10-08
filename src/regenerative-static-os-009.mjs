import { createHash } from 'node:crypto';
import { canonical, digest, inspect, append } from './asset-treasury-007.mjs';
import { livingIndex } from './living-capacity-index-008.mjs';

// STATIC OS -> JUBILEE 009. The source CRANK receipt is UNSIGNED.
// This bridge proves exact deterministic output consistency only, not human
// identity, intellectual-property ownership, donor authenticity, or value.
export const DONOR_REF = '0d460524d0db129a8cccb0661cb9f533f3e6793b';
const SCHEMA = 'jubilee.crank-regeneration-candidate/v0';
const PROOF_SCHEMA = 'jubilee.static-os-native-turn-evidence/v0';
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
const ascii = s => typeof s === 'string' && s.length>0 && s.length<=4096 && /^[\x09\x0A\x0D\x20-\x7E]*$/.test(s);
const obj = (v,keys) => v && typeof v === 'object' && !Array.isArray(v)
  && Object.keys(v).length===keys.length && keys.every(k=>Object.hasOwn(v,k));
const fail = reason => {throw new Error('CRANK_REGEN_REFUSED: '+reason);};
const must = (ok,why) => {if(!ok)fail(why);};
const plain = (v) => v && typeof v === 'object' && !Array.isArray(v);
const safeId = s => typeof s === 'string' && ID.test(s);
const sha = s=>createHash('sha256').update(s).digest('hex');
function digestPythonSubset(v) {
  // Frozen 009 inputs contain only small positive integers and ASCII strings.
  // Python crank.runtime.digest = SHA256(json.dumps(sort_keys=True, separators=...)).
  return digest(v);
}
export function verifyCrankEvidence(evidence) {
  must(obj(evidence,['schema','donor','registry','request','bundle']), 'evidence fields');
  must(evidence.schema === PROOF_SCHEMA, 'evidence schema');
  must(obj(evidence.donor,['repository','commit','assurance']) &&
    evidence.donor.repository==='the-static-collective/static-os' &&
    evidence.donor.commit===DONOR_REF &&
    evidence.donor.assurance==='UNSIGNED_LOCAL_RECEIPT_NOT_DONOR_AUTHENTICATION', 'donor provenance declaration');
  const {registry,request,bundle}=evidence;
  must(obj(registry,['schema','node_id','capabilities']) &&
    registry.schema==='static-os.crank-capability-registry/v0' &&
    registry.node_id==='static-os:cranknode:founding-001' &&
    Array.isArray(registry.capabilities), 'registry scope');
  const cards=registry.capabilities.filter(c=>c.id==='TEXT.UPPERCASE');
  must(cards.length===1 && cards[0].handler==='uppercase-text' &&
    cards[0].cost_units===1 && cards[0].proposal_only===false &&
    cards[0].authority==='none', 'exact bounded donor capability');
  must(obj(request,['schema','turn_id','source','selected_capability',
    'budget_units','authority_request','admission_request','payload']) &&
    request.schema==='static-os.crank-turn-request/v0' &&
    safeId(request.turn_id) && request.selected_capability==='TEXT.UPPERCASE' &&
    obj(request.source,['kind','id']) &&
    request.source.kind==='human' && safeId(request.source.id) &&
    Number.isSafeInteger(request.budget_units) && request.budget_units>=1 &&
    request.budget_units<=1000 && request.authority_request==='none' &&
    request.admission_request==='none' &&
    obj(request.payload,['text']) && ascii(request.payload.text), 'bounded explicit native request');
  must(obj(bundle,['result','receipt']), 'turn bundle');
  const {result,receipt}=bundle;
  must(obj(result,['schema','turn_id','capability_id','output','proposal_only',
    'authority_effect','admission_effect','automatic_next_turn']) &&
    result.schema==='static-os.crank-turn-result/v0' &&
    result.turn_id===request.turn_id && result.capability_id==='TEXT.UPPERCASE' &&
    result.proposal_only===false && result.authority_effect==='none' &&
    result.admission_effect==='none' && result.automatic_next_turn===false &&
    obj(result.output,['text']) && result.output.text===request.payload.text.toUpperCase(),
    'bounded observed result contradicts input');
  must(plain(receipt) && receipt.schema==='static-os.crank-receipt/v0' &&
    receipt.turn_id===request.turn_id && receipt.capability_id==='TEXT.UPPERCASE' &&
    canonical(receipt.source)===canonical(request.source) &&
    receipt.request_sha256===digestPythonSubset(request) &&
    receipt.input_sha256===digestPythonSubset(request.payload) &&
    receipt.result_sha256===digestPythonSubset(result) &&
    receipt.proposal_only===false && receipt.authority_effect==='none' &&
    receipt.admission_effect==='none' && receipt.transport_effect==='none' &&
    receipt.automatic_next_turn===false &&
    receipt.signature_status==='unsigned-local-receipt' &&
    receipt.carrier_profile==='canonical-json-utf8' &&
    plain(receipt.budget) &&
    receipt.budget.declared_units===request.budget_units &&
    receipt.budget.cost_units===1 &&
    receipt.budget.remaining_units===request.budget_units-1 &&
    receipt.budget.authority_effect==='none', 'native receipt semantics or hashes');
  const without={...receipt};
  delete without.receipt_sha256;
  must(receipt.receipt_sha256===digestPythonSubset(without), 'self-addressed receipt hash');
  // This check never pretends the unsigned receipt was made by the trusted
  // checkout. CI separately proves a real pinned runtime produced one sample.
  return Object.freeze({receiptId:receipt.receipt_sha256,turnId:request.turn_id,
    resultHash:digestPythonSubset(result),outputDigest:sha(Buffer.from(result.output.text,'utf8')),
    proofClass:'SELF_CONSISTENT_UNSIGNED_NATIVE_FORMAT'});
}

export function proposeRegenerativeAsset(evidence,{purposeId,termsRef}={}) {
  must(safeId(purposeId) && safeId(termsRef), 'explicit approved purpose and rights-terms reference required');
  const proof=verifyCrankEvidence(evidence);
  const assetId='asset-crank-'+proof.receiptId.slice(0,32);
  const offer={
    id:assetId,kind:'digital_artifact',
    label:'Owner-reviewed transformed text artifact',
    quantity:1,unit:'artifact',mode:'license',
    purposeIds:[purposeId],termsRef,
  };
  const proposalBody={
    schema:SCHEMA,asset:offer,source:{
      repository:evidence.donor.repository,commit:evidence.donor.commit,
      sourceWorld:evidence.registry.node_id,sourceTurnId:proof.turnId,
      sourceReceiptHash:proof.receiptId,resultHash:proof.resultHash,
      privateOutputDigest:proof.outputDigest
    },
    proofClass:proof.proofClass,
    state:'HOLD_PROPOSAL_ONLY',
    rightsVerified:false,physicalEffectVerified:false,
    automaticAdmission:false,noMonetaryValuation:true,
    provenanceNotice:'An unsigned deterministic compute result exists in the supplied material. Its origin, rights, owner, and real-world usefulness are not authenticated by this portable proof.'
  };
  return {...proposalBody,proposalId:digest(proposalBody)};
}

// Explicit steward choice makes an OFFER only. It does not ACCEPT or RECEIVE.
// Both are separately gated through Treasury's native signed event machinery.
export function submitRegenerativeOffer(ledger,steward,evidence,policy,decision) {
  const proposal=proposeRegenerativeAsset(evidence,policy);
  must(obj(decision,['proposalId','decision','sourceReviewed','rightsReviewed']) &&
    decision.proposalId===proposal.proposalId &&
    decision.decision==='OFFER_ONLY' &&
    decision.sourceReviewed===true && decision.rightsReviewed===true,
    'human-directed steward review required; no automatic mint or admission');
  inspect(ledger);
  const next=append(ledger,steward,'OFFER',proposal.asset);
  return {ledger:next,proposal};
}

export function regenerativeCut(ledger,options={}) {
  const cut=livingIndex(ledger,options);
  return {
    ...cut,
    label:'NONMONETARY_AVAILABLE_ONLY_AFTER_SEPARATE_SIGNED_RECEIVE',
  };
}
