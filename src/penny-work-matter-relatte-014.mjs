#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {inspectWorld,relatteStateSpec} from './penny-work-matter-014.mjs';
export function holdPennyState(world,relatteRoot,workRoot){
  const source=inspectWorld(world),root=resolve(relatteRoot),work=resolve(workRoot);
  if(!existsSync(join(root,'scripts','opaque-roundtrip.ts')))
    throw Error('PENNY_014_RELATTE_HOLD: local reLATTE runtime missing');
  const stamp=world.events.at(-1)?.createdAt;
  if(!stamp)throw Error('PENNY_014_RELATTE_HOLD: signed world required');
  const spec=relatteStateSpec(world,stamp);
  if(spec.artifact_kind!=='PENNY_STATE_OBSERVATION_NOT_SPENDABLE_TOKEN'||
     spec.requested_effect.permissionGranted!==false)
    throw Error('PENNY_014_RELATTE_HOLD: only inert summary allowed');
  const prefix=source.sourceHead.slice(0,20);
  const request={
    schema:'relatte.opaque-roundtrip-request/v0',spec,
    receiver_root:join(work,'independent-penny-state-receiver'),
    receiver:{
      world_id:'jubilee-penny:independent-observation-test-receiver',
      receiver_particular:'jubilee-penny:owner-local-hold-of-steward-ledger',
      contract_ref:'jubilee-penny:hold-state-only-014'
    },
    bundle_path:join(work,'bundles',prefix+'.bundle.json'),
    result_path:join(work,'results',prefix+'.result.json'),
    disposition:'HOLD',
    transport_created_at:stamp,received_at:stamp,disposed_at:stamp,
    route_note:'PENNY-014 signed local simulation projection; no token admitted, redemption duty accepted, legal title or cash received'
  };
  const child=spawnSync(process.execPath,['--experimental-strip-types','scripts/opaque-roundtrip.ts'],{
    cwd:root,input:JSON.stringify(request),encoding:'utf8',maxBuffer:8*1024*1024,timeout:30000
  });
  if(child.error)throw child.error;
  if(child.status!==0)throw Error('PENNY_014_RELATTE_HOLD: native receiver refused: '+child.stderr.slice(0,350));
  let result;
  try{result=JSON.parse(child.stdout);}catch{throw Error('PENNY_014_RELATTE_HOLD: non-JSON native response');}
  if(result?.schema!=='relatte.opaque-roundtrip-result/v0'||
    result.crossing?.declared_kind!=='OPAQUE_ORGAN_ARTIFACT'||
    result.crossing?.source_particular!==spec.source_particular||
    result.crossing?.source_history_head!==spec.source_history_head||
    result.crossing?.extensions?.organ_adapter?.artifact_kind!==spec.artifact_kind||
    result.receive_receipt?.kind!=='RECEIVED'||
    result.disposition_receipt?.kind!=='R3_HOLD'||
    !result.receiver_snapshot?.held?.includes(result.crossing.crossing_id))
    throw Error('PENNY_014_RELATTE_HOLD: native crossing DID NOT preserve observation-only HOLD');
  return {
    proof:'SIGNED_PENNY_STATE_OBSERVATION_RECEIVED_AND_HELD',
    sourceHistoryHead:spec.source_history_head,crossingId:result.crossing.crossing_id,
    receiveReceiptId:result.receive_receipt.receipt_id,
    holdReceiptId:result.disposition_receipt.receipt_id,
    receiverDisposition:'R3_HOLD',
    paymentConfirmed:false,redeemableAssetAdmitted:false,physicalTransferOccurred:false,
    nativeResultPath:request.result_path
  };
}
export function main(args=process.argv.slice(2)){
  if(args.length!==3)
    throw Error('Usage: penny014:relatte SIGNED_LOCAL_WORLD.json RELATTE_CHECKOUT PRIVATE_WORK_DIR');
  const [worldFile,relatteRoot,workRoot]=args;
  const world=JSON.parse(readFileSync(resolve(worldFile),'utf8'));
  mkdirSync(resolve(workRoot),{recursive:true,mode:0o700});
  return holdPennyState(world,relatteRoot,workRoot);
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
