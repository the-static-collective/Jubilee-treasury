import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {generateSteward,newLedger,append} from '../src/asset-treasury-007.mjs';
import {runRelatteHold} from '../src/relatte-hold-007.mjs';
const root=process.env.RELATTE_ROOT;
test('native reLATTE opaque-organ round trip signs crossing and distinct RECEIVE/HOLD, and cold replay is idempotent', {skip:!root},()=>{
  const k=generateSteward(), asset={
    id:'asset-wheelchair-001',kind:'goods',label:'One mobility aid',
    quantity:1,unit:'item',mode:'gift',purposeIds:['purpose-access-001'],termsRef:'terms-gift-001'
  };
  let l=newLedger(k);
  l=append(l,k,'OFFER',asset);
  l=append(l,k,'ACCEPT',{assetId:asset.id,termsEvidenceRef:'permission-human-review-001'});
  l=append(l,k,'RECEIVE',{assetId:asset.id,evidenceRef:'receipt-owner-claimed-001',assertion:'asset_received_attested'});
  const runRoot=mkdtempSync(join(tmpdir(),'relatte-treasury-'));
  const first=runRelatteHold(l,asset.id,root,runRoot);
  assert.equal(first.proof,'relatte_native_signed_crossing_received_and_held');
  assert.equal(first.receiverDisposition,'HOLD');
  assert.match(first.receiveReceiptId,/./); assert.match(first.dispositionReceiptId,/./);
  const second=runRelatteHold(l,asset.id,root,runRoot);
  assert.equal(first.crossingId,second.crossingId);
  assert.equal(first.receiveReceiptId,second.receiveReceiptId);
  assert.equal(first.dispositionReceiptId,second.dispositionReceiptId);
});
