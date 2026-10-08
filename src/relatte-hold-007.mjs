#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { inspect, relatteSpec } from './asset-treasury-007.mjs';

// Explicitly use reLATTE's own, replaceable signed source crossing and receiver.
// Do not sign a fake CrossingEnvelope, decide downstream admission or infer Kinship approval.
export function runRelatteHold(ledger, assetId, relatteRoot, workRoot) {
  const state=inspect(ledger), asset=state.assets.find(a=>a.id===assetId);
  if(!asset||asset.state!=='received')throw Error('only received asset claims may be transported');
  const here=resolve(relatteRoot),runRoot=resolve(workRoot);
  if(!existsSync(join(here,'scripts','opaque-roundtrip.ts')))throw Error('local reLATTE checkout required');
  const stamp=ledger.events.at(-1).createdAt;
  const prefix=assetId.replace(/[^a-zA-Z0-9._-]/g,'_')+'-'+state.head.slice(0,18);
  const spec=relatteSpec(ledger,assetId,stamp);
  const request={
    schema:'relatte.opaque-roundtrip-request/v0',
    spec,
    receiver_root:join(runRoot,'local-receiver'),
    receiver:{
      world_id:'jubilee-treasury:independent-simulated-receiver',
      receiver_particular:'jubilee-treasury:asset-proposal-hold',
      contract_ref:'jubilee-treasury:hold-only-v0'
    },
    bundle_path:join(runRoot,'bundles',prefix+'.bundle.json'),
    result_path:join(runRoot,'results',prefix+'.result.json'),
    disposition:'HOLD',
    transport_created_at:stamp,
    received_at:stamp,
    disposed_at:stamp,
    route_note:'owner-local HOLD of steward-attested asset; no ownership transfer, station mandate, or automated service execution'
  };
  const child=spawnSync(process.execPath,['--experimental-strip-types','scripts/opaque-roundtrip.ts'],{
    cwd:here,input:JSON.stringify(request),encoding:'utf8',maxBuffer:8*1024*1024,timeout:30000
  });
  if(child.error)throw child.error;
  if(child.status!==0)throw Error('reLATTE refused: '+child.stderr.slice(0,1200));
  let result;try{result=JSON.parse(child.stdout);}catch{throw Error('reLATTE returned non-JSON result');}
  if(result?.schema!=='relatte.opaque-roundtrip-result/v0'||
     result.receive_receipt?.kind!=='RECEIVED'||result.disposition_receipt?.kind!=='R3_HOLD'||
     result.crossing?.declared_kind!=='OPAQUE_ORGAN_ARTIFACT')
     throw Error('missing signed RECEIVE / HELD reLATTE proof');
  if(result.crossing.source_history_head!==spec.source_history_head||result.crossing.source_particular!==assetId)
    throw Error('reLATTE crossing mismatch');
  if(!result.receiver_snapshot?.held?.includes(result.crossing.crossing_id))throw Error('receiver failed to hold');
  return {
    proof:'relatte_native_signed_crossing_received_and_held',
    crossingId:result.crossing.crossing_id,
    receiveReceiptId:result.receive_receipt.receipt_id,
    dispositionReceiptId:result.disposition_receipt.receipt_id,
    verifiedSourceLedgerHead:spec.source_history_head,
    receiverDisposition:'HOLD',
    resultsAt:request.result_path,
    note:'Simulated independent receiver; only an owner-local HOLD, not asset custody, ownership, charity accounting, or recipient consent.'
  };
}
export function main(args=process.argv.slice(2)) {
  if(args.length!==4)throw Error('Usage: node src/relatte-hold-007.mjs TREASURY_DIR ASSET_ID RELATTE_CHECKOUT WORK_DIR');
  const [ledgerDir,assetId,relatteRoot,workRoot]=args;
  const ledger=JSON.parse(readFileSync(join(resolve(ledgerDir),'ledger.json'),'utf8'));
  mkdirSync(resolve(workRoot),{recursive:true,mode:0o700});
  return runRelatteHold(ledger,assetId,relatteRoot,workRoot);
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href) {
  try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
