import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildSyntheticPennyWorld,PURPOSE} from '../src/penny-recursion-cli-013.mjs';
import {pennySource,recursivePennyOptions,defaultPennyRecipes} from '../src/penny-recursion-013.mjs';
import {runRelatteHold} from '../src/relatte-hold-007.mjs';

test('two distinct signed penny assets -> native reLATTE RECEIVE/R3_HOLD, separate receipts and stable replay, then bounded read-only recursion', {
  skip:!process.env.RELATTE_ROOT
},()=>{
  const {withLabor}=buildSyntheticPennyWorld();
  const source=pennySource(withLabor,PURPOSE);
  assert.deepEqual(source.sourceLots.map(x=>x.available),[37,63]);
  const work=mkdtempSync(join(tmpdir(),'penny-r13-native-'));
  const a=runRelatteHold(withLabor,'lot-penny-037-001',process.env.RELATTE_ROOT,work);
  const b=runRelatteHold(withLabor,'lot-penny-063-002',process.env.RELATTE_ROOT,work);
  const replay=runRelatteHold(withLabor,'lot-penny-037-001',process.env.RELATTE_ROOT,work);
  assert.equal(a.proof,'relatte_native_signed_crossing_received_and_held');
  assert.equal(b.proof,'relatte_native_signed_crossing_received_and_held');
  assert.equal(a.receiverDisposition,'HOLD');
  assert.equal(b.receiverDisposition,'HOLD');
  assert.notEqual(a.crossingId,b.crossingId);
  assert.notEqual(a.receiveReceiptId,b.receiveReceiptId);
  assert.notEqual(a.dispositionReceiptId,b.dispositionReceiptId);
  assert.equal(a.crossingId,replay.crossingId);
  assert.equal(a.receiveReceiptId,replay.receiveReceiptId);
  assert.equal(a.dispositionReceiptId,replay.dispositionReceiptId);
  const candidates=recursivePennyOptions(withLabor,{
    purposeId:PURPOSE,
    expectedHead:source.sourceHistoryHead,
    recipes:defaultPennyRecipes(PURPOSE)});
  assert.equal(candidates.rootCoinCount,100);
  assert.ok(candidates.projectedRoutes.some(x=>x.to==='deposit_candidate'));
  assert.ok(candidates.projectedRoutes.some(x=>x.to==='external_gift_request'));
  assert.equal(candidates.earnedInterestMinorUsd,0);
  assert.equal(candidates.newAssetsCreated,0);
  assert.equal(candidates.operatorCashAvailableMinorUsd,0);
});
