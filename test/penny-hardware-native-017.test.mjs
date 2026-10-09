import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHardwareFixture,APPLY_AT} from '../src/penny-hardware-demo-017.mjs';
import {applyHardwareEvidence} from '../src/penny-hardware-witness-017.mjs';
import {holdFourthBoxObservation} from '../src/penny-box-relatte-016.mjs';
test('real reLATTE native signed R3_HOLD of hardware-evidence-bound independent completion, no physical ownership or token mint', {
  skip:!process.env.RELATTE_ROOT
},async()=>{
  const x=await createHardwareFixture();
  const complete=applyHardwareEvidence(x.field,x.candidate,x.evidence,x.proofs,x.owners,APPLY_AT);
  const work=mkdtempSync(join(tmpdir(),'penny-017-native-'));
  const r=holdFourthBoxObservation(complete.field,x.candidate,process.env.RELATTE_ROOT,work,APPLY_AT);
  const again=holdFourthBoxObservation(complete.field,x.candidate,process.env.RELATTE_ROOT,work,APPLY_AT);
  assert.equal(r.proof,'SIGNED_LOCAL_BOX_COMPOSITION_OBSERVATION_RECEIVED_AND_HELD');
  assert.equal(r.crossingId,again.crossingId);
  assert.equal(r.receiveReceiptId,again.receiveReceiptId);
  assert.equal(r.holdReceiptId,again.holdReceiptId);
  assert.equal(r.receiverDisposition,'R3_HOLD');
  assert.equal(r.physicalBoxVerified,false);
  assert.equal(r.physicalAssetsReceived,false);
  assert.equal(r.mintedPennyUnits,0);
});
