#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {project,relatteObservationSpec} from './ambient-trickle-009.mjs';

// NOTE: This holds an OBSERVATION, not a software license, repo ownership,
// transferable inventory or an actual contribution accepted by a recipient.
export function runObservationHold(inbox,sourceId,assetId,relatteRoot,workRoot) {
  const view=project(inbox);
  const signal=inbox.signals.findLast(s=>s.sourceId===sourceId && s.payload.assetId===assetId);
  if(!signal || signal.payload.status==='revoked')throw Error('Only current source observations may cross');
  if(!view.currentSourceReports.some(x=>x.sourceId===sourceId && x.assetId===assetId))throw Error('Current observation missing');
  const stamp=signal.payload.observedAt;
  const spec=relatteObservationSpec(inbox,sourceId,assetId,stamp);
  const repo=resolve(relatteRoot),work=resolve(workRoot);
  if(!existsSync(join(repo,'scripts','opaque-roundtrip.ts')))throw Error('Native reLATTE checkout required');
  const prefix=assetId.replace(/[^A-Za-z0-9._-]/g,'_')+'-'+view.head.slice(0,16);
  const req={
    schema:'relatte.opaque-roundtrip-request/v0',
    spec,
    receiver_root:join(work,'receiver'),
    receiver:{world_id:'jubilee-trickle:independent-example-receiver',
      receiver_particular:'jubilee-trickle:observation-hold',
      contract_ref:'jubilee-trickle:hold-observation-only-v0'},
    bundle_path:join(work,'bundles',prefix+'.json'),
    result_path:join(work,'results',prefix+'.json'),
    disposition:'HOLD',
    transport_created_at:stamp,received_at:stamp,disposed_at:stamp,
    route_note:'source-signed GitHub merge observation into independent HOLD; no asset, payment or economic entitlement'
  };
  const child=spawnSync(process.execPath,['--experimental-strip-types','scripts/opaque-roundtrip.ts'],{
    cwd:repo,encoding:'utf8',input:JSON.stringify(req),timeout:30000,maxBuffer:8*1024*1024
  });
  if(child.error)throw child.error;
  if(child.status!==0)throw Error('reLATTE refusal: '+child.stderr.slice(0,500));
  let result;
  try{result=JSON.parse(child.stdout);}catch{throw Error('Invalid reLATTE native result');}
  if(result?.schema!=='relatte.opaque-roundtrip-result/v0'||
    result.crossing?.declared_kind!=='OPAQUE_ORGAN_ARTIFACT'||
    result.receive_receipt?.kind!=='RECEIVED'||result.disposition_receipt?.kind!=='R3_HOLD'||
    result.crossing?.source_history_head!==spec.source_history_head||
    result.crossing?.source_particular!==spec.source_particular||
    result.crossing?.extensions?.organ_adapter?.artifact_kind!=='OBSERVATION_NOT_ASSET'||
    !result.receiver_snapshot?.held?.includes(result.crossing.crossing_id))
    throw Error('Native crossing does not preserve HOLD-only observation boundary');
  return {
    status:'NATIVE_RELATTE_RECEIVED_AND_HELD_OBSERVATION',
    assetAdmitted:false,sourceClaimOnly:true,
    sourceRepositoryObservation:spec.source_particular,
    crossingId:result.crossing.crossing_id,
    receiveReceiptId:result.receive_receipt.receipt_id,
    holdReceiptId:result.disposition_receipt.receipt_id,
    receiverDisposition:'R3_HOLD',
    resultPath:req.result_path
  };
}
export function main(args=process.argv.slice(2)){
  if(args.length!==5)throw Error('Usage: github:hold PRIVATE_DIR SOURCE_ID ASSET_ID RELATTE_ROOT OUTPUT_DIR');
  const [dir,sourceId,assetId,repo,work]=args;
  const inbox=JSON.parse(readFileSync(join(resolve(dir),'inbox.json'),'utf8'));
  mkdirSync(resolve(work),{recursive:true,mode:0o700});
  return runObservationHold(inbox,sourceId,assetId,repo,work);
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
