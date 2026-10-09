import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {inspectFourthBox} from '../src/penny-box-composer-016.mjs';
import {createFourBoxScenario,AT} from '../src/penny-box-demo-016.mjs';
import {holdFourthBoxObservation} from '../src/penny-box-relatte-016.mjs';

test('real reLATTE native signed RECEIVE/R3_HOLD for all-three-signed fourth box, no custody or minted penny, stable cold replay', {
  skip:!process.env.RELATTE_ROOT
},()=>{
  const d=createFourBoxScenario();
  const part=inspectFourthBox(d.stages.partialExecution.field,d.proposal);
  assert.equal(part.status,'HOLD_AWAITING_INDEPENDENT_APPLY');
  const dir=mkdtempSync(join(tmpdir(),'penny-box-016-native-'));
  assert.throws(()=>holdFourthBoxObservation(d.stages.partialExecution.field,
    d.proposal,process.env.RELATTE_ROOT,dir,AT),/incomplete fourth box/);
  const a=holdFourthBoxObservation(d.field,d.proposal,process.env.RELATTE_ROOT,dir,AT);
  const b=holdFourthBoxObservation(d.field,d.proposal,process.env.RELATTE_ROOT,dir,AT);
  assert.equal(a.proof,'SIGNED_LOCAL_BOX_COMPOSITION_OBSERVATION_RECEIVED_AND_HELD');
  assert.equal(a.crossingId,b.crossingId);
  assert.equal(a.receiveReceiptId,b.receiveReceiptId);
  assert.equal(a.holdReceiptId,b.holdReceiptId);
  assert.equal(a.receiverDisposition,'R3_HOLD');
  assert.equal(a.physicalBoxVerified,false);
  assert.equal(a.physicalAssetsReceived,false);
  assert.equal(a.coinBackingModified,false);
  assert.equal(a.mintedPennyUnits,0);
});
