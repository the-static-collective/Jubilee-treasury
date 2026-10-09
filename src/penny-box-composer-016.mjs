import {createPublicKey,sign,verify} from 'node:crypto';
import {canonical,digest,inspectWorld} from './penny-work-matter-014.mjs';

export const NODE_SCHEMA='jubilee.penny-box-organ/v0.1';
export const FIELD_SCHEMA='jubilee.penny-box-field/v0.1';
const DOMAIN='JUBILEE-BOX-016-NODE\n', PROOF_DOMAIN='JUBILEE-BOX-016-ATTEST\n';
const REF=/^[A-Za-z0-9][A-Za-z0-9:._:-]{2,127}$/,HASH=/^[a-f0-9]{64}$/;
const fail=s=>{throw Error('BOX_016_HOLD: '+s)};
const check=(x,s)=>{if(!x)fail(s)};
const exact=(x,n)=>x&&typeof x==='object'&&!Array.isArray(x)&&
  Object.keys(x).sort().join('|')===n.slice().sort().join('|');
const stamp=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const ref=s=>typeof s==='string'&&REF.test(s),hash=s=>typeof s==='string'&&HASH.test(s);
const nonneg=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000;
const pos=n=>nonneg(n)&&n>0;
const pub=priv=>createPublicKey(priv).export({type:'spki',format:'pem'});
function signed(keys,domain,data){
  check(keys&&pub(keys.privateKey)===keys.publicKey,'private signer mismatch');
  return sign(null,Buffer.from(domain+canonical(data)),keys.privateKey).toString('base64');
}
function verified(key,domain,data,sig){
  if(typeof sig!=='string'||sig.length>128)return false;
  try{
    const b=Buffer.from(sig,'base64');
    return b.length===64&&b.toString('base64')===sig&&
      verify(null,Buffer.from(domain+canonical(data)),key,b);
  }catch{return false}
}
const KIND=new Set(['tool','material_kit','labor_minute']);
const NODES=['box-a','box-b','box-c'];
const RECIPE={
  recipeId:'build-fourth-box-001',newBoxId:'box-d',
  materialsUsed:1,laborMinutesUsed:45,toolsReturned:1,pennyBackingConsumed:0,
  requirements:{
    'box-a':[],
    'box-b':[{kind:'tool',quantity:1},{kind:'material_kit',quantity:1}],
    'box-c':[{kind:'labor_minute',quantity:45}]
  }
};
function validateRoles(roles){
  check(exact(roles,['fabricatorPublicKey','witnessPublicKey','newBoxOwnerPublicKey']),
    'explicit independent completion authorities required');
  const keys=Object.values(roles);
  for(const k of keys)try{createPublicKey(k);}catch{fail('invalid completion role public key')}
  check(new Set(keys).size===keys.length,'completion authorities must be distinct');
}
function validateNode(node){
  check(exact(node,['schema','nodeId','ownerPublicKey','roles','events'])&&
    node.schema===NODE_SCHEMA&&ref(node.nodeId)&&Array.isArray(node.events)&&
    node.events.length<=10000,'node shape or event bound');
  createPublicKey(node.ownerPublicKey);validateRoles(node.roles);
  check(!Object.values(node.roles).includes(node.ownerPublicKey),
    'owner cannot attest own independent completion');
}
export function newNode(nodeId,ownerPublicKey,roles){
  check(ref(nodeId),'node ID');
  const x={schema:NODE_SCHEMA,nodeId,ownerPublicKey,roles:structuredClone(roles),events:[]};
  validateNode(x);return x;
}
export function signCompletion(statement,role,keys){
  check(['fabricator','witness','new_box_owner'].includes(role),'completion role');
  const body={schema:'jubilee.box-completion-proof/v0.1',role,statement:structuredClone(statement)};
  return {...body,signature:signed(keys,PROOF_DOMAIN,body)};
}
export function verifyCompletion(completion,roles,expectedPlan,expectedHash){
  validateRoles(roles);
  check(exact(completion,['statement','proofs']),'completion schema');
  const q=completion.statement;
  check(exact(q,['planId','proposalHash','newBoxId','evidenceHash','completedAt',
    'materialsUsed','laborMinutesUsed','toolsReturned','pennyBackingConsumed'])&&
    q.planId===expectedPlan&&q.proposalHash===expectedHash&&
    q.newBoxId===RECIPE.newBoxId&&hash(q.evidenceHash)&&stamp(q.completedAt)&&
    q.materialsUsed===RECIPE.materialsUsed&&q.laborMinutesUsed===RECIPE.laborMinutesUsed&&
    q.toolsReturned===RECIPE.toolsReturned&&q.pennyBackingConsumed===0,
    'completion changed, invented materials or touched backing');
  check(exact(completion.proofs,['fabricator','witness','new_box_owner']),
    'independent fabrication, inspection and new box owner signoffs required');
  for(const [name,key] of [
    ['fabricator',roles.fabricatorPublicKey],
    ['witness',roles.witnessPublicKey],
    ['new_box_owner',roles.newBoxOwnerPublicKey]
  ]){
    const proof=completion.proofs[name];
    check(exact(proof,['schema','role','statement','signature'])&&
      proof.schema==='jubilee.box-completion-proof/v0.1'&&proof.role===name&&
      canonical(proof.statement)===canonical(q),'nonmatching completion signoff');
    const {signature,...unsigned}=proof;
    check(verified(key,PROOF_DOMAIN,unsigned,signature),'fabrication/witness/owner signature refused');
  }
  return digest(completion);
}
function validateRequirements(req){
  check(Array.isArray(req)&&req.length<=6,'requirements bound');
  const seen=new Set();
  for(const r of req){
    check(exact(r,['kind','quantity'])&&KIND.has(r.kind)&&pos(r.quantity)&&
      !seen.has(r.kind),'bad resource requirements');
    seen.add(r.kind);
  }
}
export function inspectNode(node){
  validateNode(node);
  const declared=new Map(),approvals=new Map(),applied=new Map();
  let previous=null,lastTime=null;
  for(const [i,e] of node.events.entries()){
    check(exact(e,['seq','type','payload','previous','createdAt','signature'])&&
      e.seq===i+1&&e.previous===previous&&stamp(e.createdAt)&&
      (lastTime===null||lastTime<=e.createdAt),'signed node event gap/time rollback');
    const {signature,...unsigned}=e;
    check(verified(node.ownerPublicKey,DOMAIN,unsigned,signature),'forged owner event');
    const p=e.payload;
    if(e.type==='DECLARE'){
      check(exact(p,['lotId','kind','quantity','evidenceHash','termsRef'])&&
        ref(p.lotId)&&KIND.has(p.kind)&&pos(p.quantity)&&hash(p.evidenceHash)&&ref(p.termsRef)&&
        !declared.has(p.lotId),'source lot identity or quantity');
      check(node.nodeId==='box-b'?(p.kind==='tool'||p.kind==='material_kit'):
        node.nodeId==='box-c'?p.kind==='labor_minute':false,
        'material and work must stay at declared sovereign source');
      declared.set(p.lotId,structuredClone(p));
    }else if(e.type==='APPROVE'){
      check(exact(p,['planId','proposalHash','requirements','sourceHead'])&&
        ref(p.planId)&&hash(p.proposalHash)&&
        p.sourceHead===previous&&!approvals.has(p.planId),'stale, duplicate or unpinned node approval');
      validateRequirements(p.requirements);
      check(canonical(p.requirements)===canonical(RECIPE.requirements[node.nodeId]),
        'owner resource requirements are not the declared recipe');
      const s=availability(declared,approvals,applied);
      for(const r of p.requirements)check((s[r.kind]?.free??0)>=r.quantity,
        'independent owner capacity unavailable');
      approvals.set(p.planId,structuredClone(p));
    }else if(e.type==='APPLY'){
      check(exact(p,['planId','proposalHash','completion'])&&
        ref(p.planId)&&hash(p.proposalHash)&&approvals.has(p.planId)&&
        !applied.has(p.planId),'unapproved or duplicate physical composition');
      const a=approvals.get(p.planId);
      check(a.proposalHash===p.proposalHash,'execution disagrees with owner approval');
      verifyCompletion(p.completion,node.roles,p.planId,p.proposalHash);
      applied.set(p.planId,structuredClone(p));
    }else fail('unsupported owner event');
    previous=digest(e);lastTime=e.createdAt;
  }
  const resources=availability(declared,approvals,applied);
  return {
    nodeId:node.nodeId,head:previous,eventCount:node.events.length,
    resources,approvals:[...approvals.values()],
    applied:[...applied.values()].map(x=>({planId:x.planId,
      proposalHash:x.proposalHash,completionHash:digest(x.completion)})),
    ownerPublicKey:node.ownerPublicKey,ownerSourceAuthorityOnly:true
  };
}
function availability(declared,approvals,applied){
  const result={};
  for(const kind of KIND)result[kind]={declared:0,reserved:0,consumed:0,free:0};
  for(const lot of declared.values())result[lot.kind].declared+=lot.quantity;
  for(const a of approvals.values()){
    for(const r of a.requirements){
      if(applied.has(a.planId)){
        if(r.kind!=='tool')result[r.kind].consumed+=r.quantity;
      }else result[r.kind].reserved+=r.quantity;
    }
  }
  for(const item of Object.values(result)){
    item.free=item.declared-item.consumed-item.reserved;
    check(Number.isSafeInteger(item.free)&&item.free>=0,'sovereign inventory overcommitted');
  }
  return result;
}
function appendNode(node,ownerKeys,type,payload,at){
  inspectNode(node);
  check(ownerKeys?.publicKey===node.ownerPublicKey&&
    pub(ownerKeys.privateKey)===node.ownerPublicKey,'wrong sovereign owner');
  check(stamp(at),'signed time required');
  const unsigned={seq:node.events.length+1,type,payload:structuredClone(payload),
    previous:node.events.length?digest(node.events.at(-1)):null,createdAt:at};
  const next={...structuredClone(node),events:[...node.events,
    {...unsigned,signature:signed(ownerKeys,DOMAIN,unsigned)}]};
  inspectNode(next);
  return next;
}
export function declareResource(node,ownerKeys,lot,at){
  return appendNode(node,ownerKeys,'DECLARE',lot,at);
}
export function newField(pennyWorld,boxes){
  inspectWorld(pennyWorld);
  check(exact(boxes,['box-a','box-b','box-c']),'three independently governed nodes');
  const roles=boxes['box-a'].roles;
  const owners=new Set();
  for(const id of NODES){
    const b=boxes[id];check(b.nodeId===id,'node identity swapped');
    inspectNode(b);
    check(canonical(b.roles)===canonical(roles),'all nodes pin identical completion witness roster');
    check(!owners.has(b.ownerPublicKey)&&
      !Object.values(roles).includes(b.ownerPublicKey),
      'source owners must all be independent of witnesses and each other');
    owners.add(b.ownerPublicKey);
  }
  check(pennyWorld.policy.stewardPublicKey===boxes['box-a'].ownerPublicKey,
    'box A must be owner of actual signed PENNY-014 coin source');
  return {schema:FIELD_SCHEMA,pennyWorld:structuredClone(pennyWorld),
    boxes:structuredClone(boxes)};
}
export function inspectField(field){
  check(exact(field,['schema','pennyWorld','boxes'])&&field.schema===FIELD_SCHEMA,'field schema');
  const s=inspectWorld(field.pennyWorld);
  const checkField=newField(field.pennyWorld,field.boxes);
  const states=Object.fromEntries(NODES.map(id=>[id,inspectNode(checkField.boxes[id])]));
  return {
    sourceHeads:{'penny-014':s.sourceHead,...Object.fromEntries(NODES.map(id=>[id,states[id].head]))},
    pennyBookCoins:s.boxBookCoinCount,pennyOutstanding:s.outstandingPennyUnits,
    pennyAuditShortfall:s.auditedPhysicalShortfall,
    pennyPermission:'OBSERVATION_ONLY_NOT_SPEND_OR_TOKEN_ISSUANCE',
    boxes:states
  };
}
export function validateDials(dials){
  check(exact(dials,['exploration','risk','materialAttention','nested'])&&
    [dials.exploration,dials.risk,dials.materialAttention].every(n=>
      Number.isInteger(n)&&n>=1&&n<=11),'1–11 dials required');
  check(Array.isArray(dials.nested)&&dials.nested.length>=1&&
    dials.nested.length<=3&&dials.nested.every(n=>Number.isInteger(n)&&n>=1&&n<=11),
    'nested 1–11 sensitivity only');
}
export function compose(field,dials){
  validateDials(dials);
  const s=inspectField(field);
  const requirements=structuredClone(RECIPE.requirements);
  const missing=[];
  if(s.pennyBookCoins<1||s.pennyAuditShortfall>0)missing.push('box-a:penny-attestation-unavailable');
  for(const id of NODES){
    for(const r of requirements[id]){
      if((s.boxes[id].resources[r.kind]?.free??0)<r.quantity)
        missing.push(id+':'+r.kind+':needs_'+r.quantity);
    }
  }
  // dials influence proposal attention/order, NEVER resource units or authority.
  const attention=dials.exploration*11+dials.materialAttention+
    dials.nested.reduce((sum,x,i)=>sum+(x/(11**(i+1))),0)-dials.risk;
  const proposal={
    schema:'jubilee.penny-composition-proposal/v0.1',
    recipeId:RECIPE.recipeId,newBoxId:RECIPE.newBoxId,
    sourceHeads:s.sourceHeads,requirements,
    pennyBackingMode:'READ_ONLY_SOURCE_REFERENCE_NO_COIN_CONSUMPTION',
    resourceEffects:{materialsUsed:1,laborMinutesUsed:45,toolsReturned:1,pennyBackingConsumed:0},
    purpose:'candidate_build_box_d',role:'PROPOSAL_NOT_AUTHORITY'
  };
  const proposalHash=digest(proposal);
  return {...proposal,proposalHash,planId:'plan-'+proposalHash.slice(0,28),
    dials:structuredClone(dials),attention:Math.round(attention*100000)/100000,
    missing,status:missing.length?'HOLD_MISSING_RESOURCES':'CANDIDATE_UNSELECTED',
    selectionGranted:false,physicalCompleted:false};
}
function coreCandidate(candidate){
  check(candidate?.schema==='jubilee.penny-composition-proposal/v0.1'&&
    hash(candidate.proposalHash)&&ref(candidate.planId),'candidate shape');
  const {
    schema,recipeId,newBoxId,sourceHeads,requirements,pennyBackingMode,resourceEffects,
    purpose,role
  }=candidate;
  const body={schema,recipeId,newBoxId,sourceHeads,requirements,
    pennyBackingMode,resourceEffects,purpose,role};
  check(digest(body)===candidate.proposalHash&&
    candidate.planId==='plan-'+candidate.proposalHash.slice(0,28)&&
    recipeId===RECIPE.recipeId&&newBoxId===RECIPE.newBoxId&&
    canonical(requirements)===canonical(RECIPE.requirements)&&
    resourceEffects.pennyBackingConsumed===0,'tampered proposal or unauthorized recipe');
  return body;
}
function candidateCompatible(field,candidate,ownerNodeId){
  coreCandidate(candidate);
  const s=inspectField(field);
  check(s.sourceHeads['penny-014']===candidate.sourceHeads['penny-014']&&
    s.pennyAuditShortfall===0,'physical penny source moved or became impaired');
  if(ownerNodeId){
    const state=s.boxes[ownerNodeId];
    check(state.head===candidate.sourceHeads[ownerNodeId],
      'owner snapshot stale: independently recompute composition');
  }
}
export function selectAtNode(field,candidate,nodeId,ownerKeys,at){
  check(NODES.includes(nodeId),'unknown owner selection');
  candidateCompatible(field,candidate);
  check(candidate.status==='CANDIDATE_UNSELECTED'&&candidate.missing?.length===0,
    'cannot select proposal with missing material');
  const node=field.boxes[nodeId],state=inspectNode(node);
  const prior=state.approvals.find(x=>x.planId===candidate.planId);
  if(prior){
    check(prior.proposalHash===candidate.proposalHash&&
      canonical(prior.requirements)===canonical(candidate.requirements[nodeId]),
      'conflicting repeated approval');
    return structuredClone(field);
  }
  candidateCompatible(field,candidate,nodeId);
  const payload={planId:candidate.planId,proposalHash:candidate.proposalHash,
    requirements:structuredClone(candidate.requirements[nodeId]),
    sourceHead:state.head};
  const next={...structuredClone(field),
    boxes:{...structuredClone(field.boxes),
      [nodeId]:appendNode(node,ownerKeys,'APPROVE',payload,at)}
  };
  inspectField(next);return next;
}
export function makeCompletion(candidate,{fabricator,witness,newOwner},
  evidenceHash,at){
  coreCandidate(candidate);
  check(hash(evidenceHash)&&stamp(at),'real-evidence reference and observed time required');
  const statement={
    planId:candidate.planId,proposalHash:candidate.proposalHash,
    newBoxId:RECIPE.newBoxId,evidenceHash,completedAt:at,
    ...structuredClone(candidate.resourceEffects)
  };
  return {statement,proofs:{
    fabricator:signCompletion(statement,'fabricator',fabricator),
    witness:signCompletion(statement,'witness',witness),
    new_box_owner:signCompletion(statement,'new_box_owner',newOwner)
  }};
}
export function applyAtNode(field,candidate,nodeId,ownerKeys,completion,at){
  check(NODES.includes(nodeId),'unknown resource owner');
  candidateCompatible(field,candidate);
  const state=inspectNode(field.boxes[nodeId]);
  check(state.approvals.length===1&&state.approvals[0].planId===candidate.planId&&
    state.approvals[0].proposalHash===candidate.proposalHash,
    'no fresh human selection by local owner');
  const approved=NODES.every(id=>inspectNode(field.boxes[id]).approvals.some(x=>
    x.planId===candidate.planId&&x.proposalHash===candidate.proposalHash));
  check(approved,'every source must independently SELECT before physical consequence');
  verifyCompletion(completion,field.boxes[nodeId].roles,candidate.planId,candidate.proposalHash);
  const prior=state.applied.find(x=>x.planId===candidate.planId);
  if(prior){
    check(prior.completionHash===digest(completion),'conflicting repeated composition');
    return structuredClone(field);
  }
  const node=field.boxes[nodeId];
  const next={...structuredClone(field),boxes:{...structuredClone(field.boxes),
    [nodeId]:appendNode(node,ownerKeys,'APPLY',{
      planId:candidate.planId,proposalHash:candidate.proposalHash,
      completion:structuredClone(completion)
    },at)}};
  inspectField(next);return next;
}
export function inspectFourthBox(field,candidate){
  coreCandidate(candidate);
  const s=inspectField(field);
  const approvals=NODES.map(id=>s.boxes[id].approvals.find(x=>
    x.planId===candidate.planId&&x.proposalHash===candidate.proposalHash));
  const applied=NODES.map(id=>s.boxes[id].applied.find(x=>
    x.planId===candidate.planId&&x.proposalHash===candidate.proposalHash));
  const allApprovals=approvals.every(Boolean),allApplied=applied.every(Boolean);
  const uniqueProof=allApplied&&new Set(applied.map(x=>x.completionHash)).size===1;
  const sourceOK=s.sourceHeads['penny-014']===candidate.sourceHeads['penny-014']&&
    s.pennyAuditShortfall===0;
  const status=allApplied&&uniqueProof&&sourceOK?
    'SIGNED_COMPLETION_ATTESTED_NOT_PHYSICALLY_VERIFIED':
    allApplied&&!uniqueProof?'HOLD_CONTRADICTORY_COMPLETION':
    !sourceOK?'HOLD_STALE_OR_IMPAIRED_PENNY_SOURCE':
    allApprovals?'HOLD_AWAITING_INDEPENDENT_APPLY':'HOLD_AWAITING_OWNER_SELECTION';
  return {
    schema:'jubilee.fourth-box-projection/v0.1',newBoxId:RECIPE.newBoxId,
    planId:candidate.planId,proposalHash:candidate.proposalHash,
    status,originatingSourceHeads:candidate.sourceHeads,
    presentHeads:s.sourceHeads,approvals:approvals.map(Boolean),
    independentlyApplied:applied.map(Boolean),
    totalOwnerSelections:approvals.filter(Boolean).length,
    totalSignedApplications:applied.filter(Boolean).length,
    commonCompletionHash:uniqueProof?applied[0].completionHash:null,
    pennyBookCoins:s.pennyBookCoins,pennyOutstanding:s.pennyOutstanding,
    pennySpentByComposition:0,pennyTokensCreated:0,
    materialsConsumedOnlyIfFullyWitnessed:allApplied&&uniqueProof?1:0,
    laborMinutesCompletedOnlyIfFullyWitnessed:allApplied&&uniqueProof?45:0,
    verifiedPhysicalNewBox:false,
    note:'Completion is independently signed local actor assertions. This output is not a physical inspection, mint, bank reserve, new legal owner, token, public deployment or actual hardware count.'
  };
}
export function portableReceipt(field,nodeId,planId){
  check(NODES.includes(nodeId),'unowned receipt request');
  const node=field.boxes[nodeId];inspectNode(node);
  const event=node.events.findLast(e=>e.type==='APPLY'&&e.payload.planId===planId)||
    node.events.findLast(e=>e.type==='APPROVE'&&e.payload.planId===planId);
  check(event,'signed owner event must exist before receipt printing');
  return {
    schema:'jubilee.penny-paper-receipt/v0.1',
    nodeId,ownerPublicKey:node.ownerPublicKey,
    event:structuredClone(event),eventHash:digest(event),
    fieldMode:'OFFLINE_SIGNED_ASSERTION_NOT_FINANCIAL_RECEIPT',
    noBackingTransferred:true
  };
}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function printableReceiptHTML(receipt){
  check(receipt?.schema==='jubilee.penny-paper-receipt/v0.1'&&
    hash(receipt.eventHash)&&digest(receipt.event)===receipt.eventHash,
    'cannot print altered paper receipt');
  const body=canonical(receipt);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
    '<title>Jubilee Box owner receipt</title>'+
    '<style>body{font:14px monospace;max-width:48rem;padding:2rem;margin:auto;overflow-wrap:anywhere}pre{white-space:pre-wrap}'+
    '@media print{body{padding:0}}.rule{border-top:2px solid;margin:1rem 0}</style></head>'+
    '<body><h1>JUBILEE BOX — OWNER-SIGNED RECEIPT</h1>'+
    '<p>Digital event hash: '+esc(receipt.eventHash)+'</p>'+
    '<p>Owner: '+esc(receipt.nodeId)+'</p><div class="rule"></div><pre>'+
    esc(body)+'</pre><div class="rule"></div>'+
    '<strong>NOT a cash receipt, legal title or confirmation of physical construction.</strong>'+
    '<p>Verify the signature against an independently pinned owner key and current source history.</p>'+
    '</body></html>';
}
export function relatteFourthBoxSpec(field,candidate,at){
  check(stamp(at),'reLATTE time');
  const p=inspectFourthBox(field,candidate);
  check(p.status==='SIGNED_COMPLETION_ATTESTED_NOT_PHYSICALLY_VERIFIED',
    'cannot cross a proposed/incomplete fourth box as completed');
  const head=digest({proposalHash:p.proposalHash,sourceHeads:p.presentHeads,
    commonCompletionHash:p.commonCompletionHash});
  return {
    schema:'relatte.opaque-organ-spec/v0',
    family_ref:FIELD_SCHEMA,
    donor_contract_ref:'jubilee.box-016-test-receiver-hold-only/v0.1',
    artifact_kind:'BOX_FOUR_SIGNED_COMPLETION_CANDIDATE_NOT_CUSTODY',
    source_world:'jubilee-boxes:distributed-local-simulator',
    source_particular:'jubilee-boxes:box-d-completion-016',
    source_history_head:'sha256:'+head,
    payload_refs:[{address:'urn:sha256:'+p.commonCompletionHash,
      role:'independently-signed-completion-observation',media_type:'application/json'}],
    donor_claims:{
      planId:p.planId,newBoxId:p.newBoxId,
      pennyBackingChange:0,tokenIssuanceChange:0,
      localSignatureAttestationNotPhysicalVerification:true
    },
    requested_effect:{kind:'HOLD_OBSERVATION_ONLY',permissionGranted:false},
    return_address:null,created_at:at
  };
}
