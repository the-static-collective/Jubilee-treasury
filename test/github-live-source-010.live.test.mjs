import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {keysForSource,policyFor,newInbox,project} from '../src/ambient-trickle-009.mjs';
import {configureRepo,observeMergedPull} from '../src/github-source-010.mjs';
import {runObservationHold} from '../src/github-relatte-hold-010.mjs';

const active=process.env.JUBILEE_GITHUB_LIVE_TEST==='1' && !!process.env.RELATTE_ROOT;

test('LIVE GitHub merged reLATTE PR -> signed private Trickle observation -> native signed reLATTE RECEIVE/R3_HOLD and cold replay', {skip:!active},async()=>{
  // Real, publicly merged reLATTE PR #64; no source code copyright assignment inferred.
  const repo='the-static-collective/reLATTE',sourceId='github-relatte-verified-010',purpose='purpose-open-source-observation-001';
  const config=configureRepo(repo,purpose,sourceId,{baseBranch:'main'});
  const keys=keysForSource();
  const inbox=newInbox(policyFor(sourceId,keys.publicKey,['software'],[purpose]));
  const live=await observeMergedPull(inbox,config,keys,64);
  assert.equal(live.added,1);
  assert.equal(live.source.mergeCommit,'dcc8cdca84c440aa4294134f020fb7095bf87f24');
  assert.equal(live.source.repository,repo);
  assert.equal(live.projection.noncashOffers[0].status,'delivery_reported');
  assert.equal(live.projection.assetsAdmitted,false);
  const reread=await observeMergedPull(live.inbox,config,keys,64);
  assert.equal(reread.added,0);
  assert.deepEqual(project(reread.inbox),project(live.inbox));
  const output=mkdtempSync(join(tmpdir(),'github-native-relatte-'));
  const one=runObservationHold(live.inbox,sourceId,'ghpr-64',process.env.RELATTE_ROOT,output);
  const again=runObservationHold(live.inbox,sourceId,'ghpr-64',process.env.RELATTE_ROOT,output);
  assert.equal(one.status,'NATIVE_RELATTE_RECEIVED_AND_HELD_OBSERVATION');
  assert.equal(one.crossingId,again.crossingId);
  assert.equal(one.receiveReceiptId,again.receiveReceiptId);
  assert.equal(one.holdReceiptId,again.holdReceiptId);
  assert.equal(one.assetAdmitted,false);
  assert.equal(one.receiverDisposition,'R3_HOLD');
});
