import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {keysForSource,policyFor,newInbox,project} from '../src/ambient-trickle-009.mjs';
import {configureBandcamp,importApiV4} from '../src/bandcamp-source-011.mjs';
import {runBandcampObservationHold} from '../src/bandcamp-relatte-hold-011.mjs';

test('synthetic private Bandcamp source report -> real reLATTE signed RECEIVE then R3_HOLD, replays exact receipt IDs', {
  skip:!process.env.RELATTE_ROOT
},()=>{
 const keys=keysForSource();
 const cfg=configureBandcamp({bandId:123456,sourceId:'synthetic-bandcamp-owner-001',purposeId:'purpose-music-royalties-001'});
 let inbox=newInbox(policyFor(cfg.sourceId,keys.publicKey,['money'],[cfg.purposeId]));
 const fake={report:[{
   bandcamp_transaction_id:100012,bandcamp_transaction_item_id:200021,
   bandcamp_related_transaction_id:null,item_type:'album',date:'04 Jan 2026 23:22:11 GMT',
   currency:'USD',sub_total:'6.00',additional_fan_contribution:'2.00',item_total:'8.00',
   quantity:1,item_name:'Private source title',buyer_name:'NEVER LEAK THIS NAME',
   buyer_email:'NEVER_LEAK@example.net',ship_to_street:'PRIVATE LOCATION',
   item_url:'https://example.bandcamp.com/album/irrelevant'
 }]};
 const r=importApiV4(inbox,cfg,keys,fake);
 assert.equal(r.added,1);
 inbox=r.inbox;
 assert.equal(project(inbox).fundsTransferred,false);
 const assetId=project(inbox).currentSourceReports[0].assetId;
 const root=mkdtempSync(join(tmpdir(),'bandcamp-native-relatte-'));
 const first=runBandcampObservationHold(inbox,cfg.sourceId,assetId,process.env.RELATTE_ROOT,root);
 const replay=runBandcampObservationHold(inbox,cfg.sourceId,assetId,process.env.RELATTE_ROOT,root);
 assert.equal(first.proof,'NATIVE_RELATTE_SIGNED_BANDCAMP_OBSERVATION_RECEIVED_AND_HELD');
 assert.equal(first.recipientDisposition,'R3_HOLD');
 assert.equal(first.crossingId,replay.crossingId);
 assert.equal(first.receiveReceiptId,replay.receiveReceiptId);
 assert.equal(first.holdReceiptId,replay.holdReceiptId);
 assert.equal(first.fundsTransferred,false);
 assert.equal(first.assetsAdmitted,false);
});
