import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {keysForSource,policyFor,newInbox,project} from '../src/ambient-trickle-009.mjs';
import {makeKeys,newRegistry,openDoor,recordSourceReport} from '../src/door-registry-012.mjs';
import {runDoorObservationHold} from '../src/door-relatte-hold-012.mjs';

test('37 actual-unit pennies *reported* in local private source -> real signed reLATTE RECEIVE/R3_HOLD and cold replay', {
  skip:!process.env.RELATTE_ROOT
},()=>{
  // No real money, real donors or custody claims. Source is entirely synthetic.
  const signer=makeKeys(),sourceId='demo-physical-source-012',
    purposeId='purpose-neighbor-aid-001',stamp='2026-10-08T18:00:00.000Z';
  let registry=newRegistry(signer);
  registry=openDoor(registry,signer,{
    id:'synthetic-penny-door-012',kind:'physical',purposeId,
    termsRef:'terms-witness-pending-001',
    publicationRef:'synthetic-only-no-public-grant-001',
    target:{assetType:'pennies',unit:'penny'}
  },stamp);
  let inbox=newInbox(policyFor(sourceId,signer.publicKey,['coins'],[purposeId]));
  const result=recordSourceReport(registry,'synthetic-penny-door-012',inbox,signer,sourceId,{
    eventId:'synthetic-jar-count-001',assetId:'synthetic-jar-asset-001',
    quantity:37,evidenceHash:'a'.repeat(64),
    observedAt:stamp,sourceAuthority:'local_operator_claim'
  });
  inbox=result.inbox;
  assert.equal(result.added,1);
  assert.equal(project(inbox).currentSourceReports[0].status,'offer_reported');
  const work=mkdtempSync(join(tmpdir(),'door-native-reLATTE-'));
  const one=runDoorObservationHold(inbox,sourceId,'synthetic-jar-asset-001',process.env.RELATTE_ROOT,work);
  const again=runDoorObservationHold(inbox,sourceId,'synthetic-jar-asset-001',process.env.RELATTE_ROOT,work);
  assert.equal(one.proof,'SIGNED_RELATTE_OBSERVATION_RECEIVED_AND_HELD');
  assert.equal(one.receiverDisposition,'R3_HOLD');
  assert.equal(one.receiveReceiptId,again.receiveReceiptId);
  assert.equal(one.holdReceiptId,again.holdReceiptId);
  assert.equal(one.crossingId,again.crossingId);
  assert.equal(one.paymentConfirmed,false);
  assert.equal(one.ownershipTransferred,false);
  assert.equal(one.assetAdmitted,false);
});
