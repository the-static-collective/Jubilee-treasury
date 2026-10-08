#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {project,relatteObservationSpec} from './ambient-trickle-009.mjs';

export function runBandcampObservationHold(inbox,sourceId,assetId,relatteRoot,workRoot) {
  const view=project(inbox);
  const claim=view.currentSourceReports.find(c=>c.sourceId===sourceId&&c.assetId===assetId);
  if(!claim || claim.kind!=='money')throw Error('BANDCAMP_HOLD_REFUSED: current source money observation required');
  const sourceEvent=inbox.signals.findLast(x=>x.sourceId===sourceId&&x.payload.assetId===assetId);
  if(!sourceEvent)throw Error('BANDCAMP_HOLD_REFUSED: signed source event missing');
  const spec=relatteObservationSpec(inbox,sourceId,assetId,sourceEvent.payload.observedAt);
  if(spec.artifact_kind!=='OBSERVATION_NOT_ASSET'||spec.requested_effect.permissionGranted!==false)
    throw Error('BANDCAMP_HOLD_REFUSED: only observation without permission allowed');
  const repo=resolve(relatteRoot),root=resolve(workRoot);
  if(!existsSync(join(repo,'scripts','opaque-roundtrip.ts')))throw Error('BANDCAMP_HOLD_REFUSED: native reLATTE checkout required');
  const part=assetId.replace(/[^A-Za-z0-9._-]/g,'_')+'-'+view.head.slice(0,20);
  const request={
    schema:'relatte.opaque-roundtrip-request/v0',spec,
    receiver_root:join(root,'private-local-receiver'),
    receiver:{
      world_id:'jubilee:bandcamp-independent-observation-receiver',
      receiver_particular:'jubilee:bandcamp-observation-hold',
      contract_ref:'jubilee:bandcamp-hold-only-v0'
    },
    bundle_path:join(root,'bundles',part+'.bundle.json'),
    result_path:join(root,'results',part+'.result.json'),
    disposition:'HOLD',
    transport_created_at:sourceEvent.payload.observedAt,
    received_at:sourceEvent.payload.observedAt,
    disposed_at:sourceEvent.payload.observedAt,
    route_note:'Bandcamp artist-owned source report observation only; no sale income custody, account permissions or rights transfer'
  };
  const child=spawnSync(process.execPath,['--experimental-strip-types','scripts/opaque-roundtrip.ts'],{
    cwd:repo,input:JSON.stringify(request),encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024
  });
  if(child.error)throw child.error;
  if(child.status!==0)throw Error('BANDCAMP_HOLD_REFUSED: native receiver refused (see private operator runtime)');
  let result;try{result=JSON.parse(child.stdout);}catch{throw Error('BANDCAMP_HOLD_REFUSED: invalid native result');}
  if(result?.schema!=='relatte.opaque-roundtrip-result/v0'||
     result.crossing?.declared_kind!=='OPAQUE_ORGAN_ARTIFACT'||
     result.crossing?.source_particular!==spec.source_particular||
     result.crossing?.source_history_head!==spec.source_history_head||
     result.crossing?.extensions?.organ_adapter?.artifact_kind!=='OBSERVATION_NOT_ASSET'||
     result.receive_receipt?.kind!=='RECEIVED'||
     result.disposition_receipt?.kind!=='R3_HOLD'||
     !result.receiver_snapshot?.held?.includes(result.crossing.crossing_id))
    throw Error('BANDCAMP_HOLD_REFUSED: real reLATTE receipt/HOLD boundary not established');
  return {
    proof:'NATIVE_RELATTE_SIGNED_BANDCAMP_OBSERVATION_RECEIVED_AND_HELD',
    crossingId:result.crossing.crossing_id,
    receiveReceiptId:result.receive_receipt.receipt_id,
    holdReceiptId:result.disposition_receipt.receipt_id,
    recipientDisposition:'R3_HOLD',
    fundsTransferred:false,assetsAdmitted:false,
    resultPath:request.result_path,
    note:'Independent test receiver; retained source observation, not money, legal settlement, gift rights or donor information'
  };
}
export function main(args=process.argv.slice(2)){
  if(args.length!==4)throw Error('Usage: node src/bandcamp-relatte-hold-011.mjs PRIVATE_DIR ASSET_ID RELATTE_CHECKOUT WORK_DIR');
  const [dir,assetId,repo,work]=args;
  const root=resolve(dir);
  const config=JSON.parse(readFileSync(join(root,'bandcamp-adapter.json'),'utf8'));
  const privateState=JSON.parse(readFileSync(join(root,'bandcamp-state.json'),'utf8'));
  mkdirSync(resolve(work),{recursive:true,mode:0o700});
  return runBandcampObservationHold(privateState.inbox,config.sourceId,assetId,repo,work);
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
