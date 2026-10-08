#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {project,relatteObservationSpec} from './ambient-trickle-009.mjs';

export function runDoorObservationHold(inbox,sourceId,assetId,relatteRoot,workRoot){
  const p=project(inbox),claim=p.currentSourceReports.find(x=>x.sourceId===sourceId&&x.assetId===assetId);
  if(!claim)throw Error('DOOR_RELATTE_HOLD: current active signed observation required');
  const last=inbox.signals.findLast(x=>x.sourceId===sourceId&&x.payload.assetId===assetId);
  const stamp=last.payload.observedAt,spec=relatteObservationSpec(inbox,sourceId,assetId,stamp);
  if(spec.artifact_kind!=='OBSERVATION_NOT_ASSET'||spec.requested_effect.permissionGranted!==false)
    throw Error('DOOR_RELATTE_HOLD: only inert observation candidate allowed');
  const repo=resolve(relatteRoot),root=resolve(workRoot);
  if(!existsSync(join(repo,'scripts','opaque-roundtrip.ts')))
    throw Error('DOOR_RELATTE_HOLD: public native reLATTE checkout missing');
  const prefix=assetId.replace(/[^A-Za-z0-9._-]/g,'_')+'-'+p.head.slice(0,20);
  const request={
    schema:'relatte.opaque-roundtrip-request/v0',
    spec,
    receiver_root:join(root,'private-independent-receiver'),
    receiver:{
      world_id:'jubilee-doors:independent-observation-receiver',
      receiver_particular:'jubilee-doors:unaccepted-observation-hold',
      contract_ref:'jubilee-doors:hold-only-v0'
    },
    bundle_path:join(root,'bundles',prefix+'.bundle.json'),
    result_path:join(root,'results',prefix+'.result.json'),
    disposition:'HOLD',
    transport_created_at:stamp,received_at:stamp,disposed_at:stamp,
    route_note:'manual source observation only; link click != giving; no payment settlement, chain finality, assayed gold, counted physical custody, or service acceptance'
  };
  const child=spawnSync(process.execPath,['--experimental-strip-types','scripts/opaque-roundtrip.ts'],{
    cwd:repo,input:JSON.stringify(request),encoding:'utf8',maxBuffer:8*1024*1024,timeout:30000
  });
  if(child.error)throw child.error;
  if(child.status!==0)throw Error('DOOR_RELATTE_HOLD: native receiver rejected the observation');
  let result;try{result=JSON.parse(child.stdout);}catch{throw Error('DOOR_RELATTE_HOLD: native reply malformed');}
  if(result?.schema!=='relatte.opaque-roundtrip-result/v0'||
    result.crossing?.declared_kind!=='OPAQUE_ORGAN_ARTIFACT'||
    result.crossing?.source_particular!==spec.source_particular||
    result.crossing?.source_history_head!==spec.source_history_head||
    result.crossing?.extensions?.organ_adapter?.artifact_kind!=='OBSERVATION_NOT_ASSET'||
    result.receive_receipt?.kind!=='RECEIVED'||result.disposition_receipt?.kind!=='R3_HOLD'||
    !result.receiver_snapshot?.held?.includes(result.crossing.crossing_id))
    throw Error('DOOR_RELATTE_HOLD: missing signed RECEIVE/R3_HOLD or contradictory asset authority');
  return {
    proof:'SIGNED_RELATTE_OBSERVATION_RECEIVED_AND_HELD',
    sourceParticular:spec.source_particular,crossingId:result.crossing.crossing_id,
    receiveReceiptId:result.receive_receipt.receipt_id,
    holdReceiptId:result.disposition_receipt.receipt_id,
    receiverDisposition:'R3_HOLD',
    paymentConfirmed:false,ownershipTransferred:false,assetAdmitted:false,
    nativeResultPath:request.result_path
  };
}
export function main(args=process.argv.slice(2)){
  if(args.length!==4)throw Error('Usage: door:relatte PRIVATE_DIR ASSET_ID RELATTE_CHECKOUT WORK_DIR');
  const [dir,assetId,repo,work]=args,r=resolve(dir);
  const conf=JSON.parse(readFileSync(join(r,'door-config.json'),'utf8')),
    inbox=JSON.parse(readFileSync(join(r,'inbox.json'),'utf8'));
  mkdirSync(resolve(work),{recursive:true,mode:0o700});
  return runDoorObservationHold(inbox,conf.sourceId,assetId,repo,work);
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
