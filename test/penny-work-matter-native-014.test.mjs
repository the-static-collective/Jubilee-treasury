import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createScenario} from '../src/penny-work-matter-demo-014.mjs';
import {inspectWorld} from '../src/penny-work-matter-014.mjs';
import {holdPennyState} from '../src/penny-work-matter-relatte-014.mjs';
test('signed work→custody→release→transfer→surrender/physical redemption survives native reLATTE R3_HOLD and cold replay', {
  skip:!process.env.RELATTE_ROOT
},()=>{
  const {stages}=createScenario(),root=mkdtempSync(join(tmpdir(),'penny-014-native-'));
  const a=inspectWorld(stages.release37),b=inspectWorld(stages.audited);
  assert.equal(a.workProducedPending,63);
  assert.equal(a.outstandingPennyUnits,37);
  assert.equal(b.workProducedPending,0);
  assert.equal(b.workFundedReleased,100);
  assert.equal(b.retiredByRedemption,7);
  assert.equal(b.boxBookCoinCount,93);
  assert.equal(b.outstandingPennyUnits,93);
  const previous=holdPennyState(stages.release37,process.env.RELATTE_ROOT,root);
  const latest=holdPennyState(stages.audited,process.env.RELATTE_ROOT,root);
  const replay=holdPennyState(stages.audited,process.env.RELATTE_ROOT,root);
  assert.equal(latest.proof,'SIGNED_PENNY_STATE_OBSERVATION_RECEIVED_AND_HELD');
  assert.notEqual(previous.sourceHistoryHead,latest.sourceHistoryHead);
  assert.notEqual(previous.crossingId,latest.crossingId);
  assert.equal(latest.crossingId,replay.crossingId);
  assert.equal(latest.receiveReceiptId,replay.receiveReceiptId);
  assert.equal(latest.holdReceiptId,replay.holdReceiptId);
  assert.equal(latest.receiverDisposition,'R3_HOLD');
  assert.equal(latest.paymentConfirmed,false);
  assert.equal(latest.redeemableAssetAdmitted,false);
});
