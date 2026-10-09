import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {auditPair} from '../src/penny-two-node-015.mjs';
import {createTwoNodeScenario} from '../src/penny-two-node-demo-015.mjs';
import {holdPennyState} from '../src/penny-work-matter-relatte-014.mjs';
test('A producer and B physical sovereign histories remain separately verifiable while B crosses native reLATTE HOLD after split/partition/loss/recovery', {
  skip:!process.env.RELATTE_ROOT
},()=>{
  const d=createTwoNodeScenario(),work=mkdtempSync(join(tmpdir(),'penny-015-native-'));
  const prior=auditPair(d.stages.resumed.source,d.stages.resumed.boxNode);
  const funded=auditPair(d.stages.released100.source,d.stages.released100.boxNode);
  const missing=auditPair(d.stages.missing12.source,d.stages.missing12.boxNode);
  const recovered=auditPair(d.stages.restored.source,d.stages.restored.boxNode);
  assert.equal(prior.pendingUnits,100);
  assert.equal(prior.activeUnits,0);
  assert.equal(funded.activeUnits,100);
  assert.equal(missing.shortfall,12);
  assert.equal(recovered.shortfall,0);
  assert.equal(recovered.activeUnits,93);
  const p=holdPennyState(d.stages.resumed.boxNode.world,process.env.RELATTE_ROOT,work);
  const f=holdPennyState(d.stages.released100.boxNode.world,process.env.RELATTE_ROOT,work);
  const l=holdPennyState(d.stages.missing12.boxNode.world,process.env.RELATTE_ROOT,work);
  const r=holdPennyState(d.stages.restored.boxNode.world,process.env.RELATTE_ROOT,work);
  const repeat=holdPennyState(d.stages.restored.boxNode.world,process.env.RELATTE_ROOT,work);
  assert.notEqual(p.crossingId,f.crossingId);
  assert.notEqual(f.crossingId,l.crossingId);
  assert.notEqual(l.crossingId,r.crossingId);
  assert.equal(r.crossingId,repeat.crossingId);
  assert.equal(r.receiveReceiptId,repeat.receiveReceiptId);
  assert.equal(r.holdReceiptId,repeat.holdReceiptId);
  assert.equal(r.receiverDisposition,'R3_HOLD');
  assert.equal(r.paymentConfirmed,false);
  assert.equal(r.redeemableAssetAdmitted,false);
});
