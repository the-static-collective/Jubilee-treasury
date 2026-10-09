import test from 'node:test';
import assert from 'node:assert/strict';
import {newKeys,inspectWorld} from '../src/penny-work-matter-014.mjs';
import {
 newNode,inspectNode,inspectField,declareResource,compose,validateDials,
 selectAtNode,makeCompletion,applyAtNode,inspectFourthBox,
 portableReceipt,printableReceiptHTML,relatteFourthBoxSpec
} from '../src/penny-box-composer-016.mjs';
import {AT,HASH,DIALS,threeBoxFixture,addMaterialKit,
 signedCompletion,createFourBoxScenario,demo} from '../src/penny-box-demo-016.mjs';
const reject=(f,p=/BOX_016_HOLD/)=>assert.throws(f,p);
const copy=x=>structuredClone(x);
function ready(){const f=threeBoxFixture();const field=addMaterialKit(f.field,f.owners['box-b']);
 return {...f,field,proposal:compose(field,DIALS)};}
function approved(){
 const s=ready();let field=s.field;
 for(const id of ['box-a','box-b','box-c']){
  field=selectAtNode(field,s.proposal,id,s.owners[id],AT);
 }
 return {...s,field,completion:signedCompletion(s.proposal,s.owners)};
}
test('three boxes have independent owner keys; A source anchored to signed PENNY-014 world',()=>{
 const {field,owners}=threeBoxFixture(),s=inspectField(field);
 assert.equal(new Set(['box-a','box-b','box-c'].map(id=>field.boxes[id].ownerPublicKey)).size,3);
 assert.equal(field.boxes['box-a'].ownerPublicKey,field.pennyWorld.policy.stewardPublicKey);
 assert.equal(s.pennyBookCoins,100);assert.equal(s.pennyOutstanding,100);
 assert.equal(s.boxes['box-b'].resources.tool.free,3);
 assert.equal(s.boxes['box-c'].resources.labor_minute.free,60);
 assert.equal(s.boxes['box-b'].resources.material_kit.free,0);
});
test('a recipe cannot fabricate an absent material kit',()=>{
 const {field}=threeBoxFixture(),p=compose(field,DIALS);
 assert.equal(p.status,'HOLD_MISSING_RESOURCES');
 assert.ok(p.missing.includes('box-b:material_kit:needs_1'));
 assert.equal(p.selectionGranted,false);
});
test('physical kit must be independently owner-attested; new source head changes proposal',()=>{
 const f=threeBoxFixture(),early=compose(f.field,DIALS);
 const newField=addMaterialKit(f.field,f.owners['box-b']);
 const p=compose(newField,DIALS);
 assert.equal(p.status,'CANDIDATE_UNSELECTED');
 assert.equal(p.missing.length,0);
 assert.notEqual(early.proposalHash,p.proposalHash);
 reject(()=>selectAtNode(newField,early,'box-b',f.owners['box-b'],AT),/missing material/);
});
test('dials 1–11 and nested PSI change attention only, never grants or recipe',()=>{
 const f=ready(),p=compose(f.field,{exploration:1,risk:1,materialAttention:1,nested:[1]});
 const q=compose(f.field,{exploration:11,risk:11,materialAttention:11,nested:[11,11,11]});
 assert.equal(p.proposalHash,q.proposalHash);
 assert.notEqual(p.attention,q.attention);
 assert.deepEqual(p.requirements,q.requirements);
 assert.equal(p.selectionGranted,false);assert.equal(q.selectionGranted,false);
 assert.equal(p.pennyBackingMode,'READ_ONLY_SOURCE_REFERENCE_NO_COIN_CONSUMPTION');
});
test('dial underflow, nested beyond max and oversized levels refuse',()=>{
 const {field}=ready();
 for(const bad of [
  {exploration:0,risk:1,materialAttention:1,nested:[1]},
  {exploration:12,risk:1,materialAttention:1,nested:[1]},
  {exploration:1,risk:1,materialAttention:1,nested:[]},
  {exploration:1,risk:1,materialAttention:1,nested:[1,2,3,4]},
  {exploration:1,risk:1,materialAttention:1,nested:[0]},
  {exploration:1,risk:1,materialAttention:1,nested:[1],admin:true}
 ])reject(()=>compose(field,bad));
});
test('missing B approval under partition yields HOLD not fabricated completion',()=>{
 const s=ready();
 let field=selectAtNode(s.field,s.proposal,'box-a',s.owners['box-a'],AT);
 field=selectAtNode(field,s.proposal,'box-c',s.owners['box-c'],AT);
 const p=inspectFourthBox(field,s.proposal);
 assert.equal(p.totalOwnerSelections,2);
 assert.equal(p.totalSignedApplications,0);
 assert.equal(p.status,'HOLD_AWAITING_OWNER_SELECTION');
});
test('wrong owner cannot select B tools, nor inspect forged node history',()=>{
 const s=ready(),unauthorized=newKeys();
 reject(()=>selectAtNode(s.field,s.proposal,'box-b',unauthorized,AT),/wrong sovereign owner/);
 const forged=copy(s.field);forged.boxes['box-b'].events[0].payload.quantity=1000;
 reject(()=>inspectField(forged),/forged owner event/);
});
test('node cannot consume resources by APPROVE alone; consumption requires verified APPLY',()=>{
 const s=approved(),i=inspectField(s.field);
 assert.equal(i.boxes['box-b'].resources.tool.reserved,1);
 assert.equal(i.boxes['box-b'].resources.material_kit.reserved,1);
 assert.equal(i.boxes['box-c'].resources.labor_minute.reserved,45);
 assert.equal(i.boxes['box-b'].resources.material_kit.consumed,0);
 assert.equal(i.boxes['box-c'].resources.labor_minute.consumed,0);
 assert.equal(inspectFourthBox(s.field,s.proposal).status,'HOLD_AWAITING_INDEPENDENT_APPLY');
});
test('a duplicated signed owner selection is strictly idempotent, never double-reserves',()=>{
 const s=ready(),a=selectAtNode(s.field,s.proposal,'box-b',s.owners['box-b'],AT);
 const again=selectAtNode(a,s.proposal,'box-b',s.owners['box-b'],AT);
 assert.deepEqual(a,again);
 assert.equal(inspectNode(a.boxes['box-b']).resources.material_kit.reserved,1);
});
test('single node cannot fabricate fourth box from its own APPLY',()=>{
 const s=approved();
 const a=applyAtNode(s.field,s.proposal,'box-a',s.owners['box-a'],s.completion,AT);
 const p=inspectFourthBox(a,s.proposal);
 assert.equal(p.totalSignedApplications,1);
 assert.equal(p.status,'HOLD_AWAITING_INDEPENDENT_APPLY');
 assert.equal(p.verifiedPhysicalNewBox,false);
});
test('fabricator, inspector and new box owner must independently sign exactly same completion',()=>{
 const s=approved();
 for(const role of ['fabricator','witness','new_box_owner']){
  const corrupted=copy(s.completion);
  corrupted.proofs[role].signature='broken';
  reject(()=>applyAtNode(s.field,s.proposal,'box-b',s.owners['box-b'],corrupted,AT),/signature/);
 }
 const fake=copy(s.completion);fake.statement.evidenceHash='e'.repeat(64);
 reject(()=>applyAtNode(s.field,s.proposal,'box-b',s.owners['box-b'],fake,AT),/signoff/);
});
test('claims of extra construction outputs or spending penny backing are rejected',()=>{
 const s=approved();
 for(const prop of ['pennyBackingConsumed','materialsUsed','toolsReturned','laborMinutesUsed']){
  const hacked=copy(s.completion);hacked.statement[prop]+=1;
  reject(()=>applyAtNode(s.field,s.proposal,'box-b',s.owners['box-b'],hacked,AT));
 }
});
test('full witnessed composition consumes 1 kit + 45 minutes, returns tool, spends no pennies',()=>{
 const d=createFourBoxScenario(),out=d.boxFour,from=inspectField(d.stages.ready.field),
  to=inspectField(d.field);
 assert.equal(out.status,'SIGNED_COMPLETION_ATTESTED_NOT_PHYSICALLY_VERIFIED');
 assert.equal(out.totalOwnerSelections,3);
 assert.equal(out.totalSignedApplications,3);
 assert.equal(out.verifiedPhysicalNewBox,false);
 assert.equal(out.pennySpentByComposition,0);
 assert.equal(out.pennyTokensCreated,0);
 assert.equal(from.pennyBookCoins,to.pennyBookCoins);
 assert.equal(from.pennyOutstanding,to.pennyOutstanding);
 assert.equal(to.boxes['box-b'].resources.tool.free,3);
 assert.equal(to.boxes['box-b'].resources.material_kit.consumed,1);
 assert.equal(to.boxes['box-c'].resources.labor_minute.consumed,45);
 assert.equal(to.boxes['box-c'].resources.labor_minute.free,15);
});
test('crashed node snapshots cold replay exact signed completion without consuming twice',()=>{
 const d=createFourBoxScenario(),recovered=JSON.parse(JSON.stringify(d.field));
 const original=inspectFourthBox(d.field,d.proposal),again=inspectFourthBox(recovered,d.proposal);
 assert.deepEqual(original,again);
 const retry=applyAtNode(recovered,d.proposal,'box-b',d.owners['box-b'],d.completion,AT);
 assert.deepEqual(retry,recovered);
});
test('without independent C work ownership, B cannot create the fourth box',()=>{
 const s=approved(),bad=copy(s.field);
 bad.boxes['box-c'].events[0].signature='forgery';
 reject(()=>inspectFourthBox(bad,s.proposal),/forged owner event/);
});
test('tampered accepted plan or stale A coin source is denied',()=>{
 const s=approved(),bad=copy(s.proposal);
 bad.requirements['box-c'][0].quantity=1;
 reject(()=>applyAtNode(s.field,bad,'box-a',s.owners['box-a'],s.completion,AT),/tampered proposal/);
 const shifted=copy(s.field);
 shifted.pennyWorld.events[0].signature='forged';
 reject(()=>applyAtNode(shifted,s.proposal,'box-a',s.owners['box-a'],s.completion,AT));
});
test('no double allocation of a single material kit to a second plan while reserved',()=>{
 const s=approved(),b=inspectNode(s.field.boxes['box-b']);
 assert.equal(b.resources.material_kit.free,0);
 const p2=compose(s.field,DIALS);
 assert.ok(p2.missing.includes('box-b:material_kit:needs_1'));
 assert.equal(p2.status,'HOLD_MISSING_RESOURCES');
});
test('approval and completion event receipts preserve exact signed provenance',()=>{
 const d=createFourBoxScenario(),r=portableReceipt(d.field,'box-b',d.proposal.planId);
 assert.equal(r.event.type,'APPLY');
 assert.equal(r.event.payload.planId,d.proposal.planId);
 assert.equal(r.noBackingTransferred,true);
 const html=printableReceiptHTML(r);
 assert.match(html,/JUBILEE BOX/);
 assert.match(html,/NOT a cash receipt/);
 assert.match(html,/signature/);
 assert.doesNotMatch(html,/<script|<iframe|fetch\(|<form/i);
 const bad=copy(r);bad.eventHash='0'.repeat(64);
 reject(()=>printableReceiptHTML(bad),/altered paper receipt/);
});
test('untrusted user-supplied HTML cannot pass owner-signed inventory event',()=>{
 const s=ready(),node=s.field.boxes['box-b'];
 reject(()=>declareResource(node,s.owners['box-b'],{
  lotId:'<img src=x onerror=alert(1)>',kind:'material_kit',quantity:1,
  evidenceHash:HASH,termsRef:'terms-real-001'
 },AT),/source lot identity/);
});
test('native reLATTE descriptor refuses partial fourth box and only carries inert completed observation',()=>{
 const d=createFourBoxScenario();
 reject(()=>relatteFourthBoxSpec(d.stages.partialExecution.field,d.proposal,AT),
   /proposed\/incomplete/);
 const spec=relatteFourthBoxSpec(d.field,d.proposal,AT);
 assert.equal(spec.schema,'relatte.opaque-organ-spec/v0');
 assert.equal(spec.artifact_kind,'BOX_FOUR_SIGNED_COMPLETION_CANDIDATE_NOT_CUSTODY');
 assert.equal(spec.requested_effect.permissionGranted,false);
 assert.equal(spec.donor_claims.pennyBackingChange,0);
 assert.equal(spec.donor_claims.tokenIssuanceChange,0);
});
test('synthetic user-facing demo records genuine missing materials and strict held capacity',()=>{
 const d=demo();
 assert.equal(d.beforeKit.status,'HOLD_MISSING_RESOURCES');
 assert.equal(d.afterKit.status,'CANDIDATE_UNSELECTED');
 assert.equal(d.initialAvailable.pennies,100);
 assert.equal(d.initialAvailable.outstandingPennyClaims,100);
 assert.equal(d.initialAvailable.tools,3);
 assert.equal(d.initialAvailable.laborMinutes,60);
 assert.equal(d.duringPartition,'HOLD_AWAITING_OWNER_SELECTION');
 assert.equal(d.partialSignedExecution,'HOLD_AWAITING_INDEPENDENT_APPLY');
 assert.equal(d.resultingCapacity.kitConsumed,1);
 assert.equal(d.resultingCapacity.laborCompleted,45);
 assert.equal(d.noPennyMutation,true);
});
