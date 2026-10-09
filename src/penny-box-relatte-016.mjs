#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {relatteFourthBoxSpec,inspectFourthBox} from './penny-box-composer-016.mjs';

export function holdFourthBoxObservation(field,candidate,relatteRoot,workRoot,at){
  const state=inspectFourthBox(field,candidate),
    spec=relatteFourthBoxSpec(field,candidate,at);
  if(state.status!=='SIGNED_COMPLETION_ATTESTED_NOT_PHYSICALLY_VERIFIED'||
    spec.artifact_kind!=='BOX_FOUR_SIGNED_COMPLETION_CANDIDATE_NOT_CUSTODY'||
    spec.requested_effect.permissionGranted!==false)
    throw Error('BOX_016_RELATTE_HOLD: unsigned, partial or authoritative physical claim refused');
  const root=resolve(relatteRoot),work=resolve(workRoot);
  if(!existsSync(join(root,'scripts','opaque-roundtrip.ts')))
    throw Error('BOX_016_RELATTE_HOLD: actual reLATTE checkout required');
  mkdirSync(work,{recursive:true,mode:0o700});
  const pathKey=spec.source_history_head.slice(7,27);
  const request={
    schema:'relatte.opaque-roundtrip-request/v0',spec,
    receiver_root:join(work,'separate-box-observation-receiver'),
    receiver:{
      world_id:'jubilee-box-four:independent-observer',
      receiver_particular:'jubilee-box-four:hold-only',
      contract_ref:'jubilee-box-four:state-observation-no-custody-v0'
    },
    bundle_path:join(work,'bundles',pathKey+'.bundle.json'),
    result_path:join(work,'results',pathKey+'.result.json'),
    disposition:'HOLD',
    transport_created_at:at,received_at:at,disposed_at:at,
    route_note:'Fourth box signed local completion observation only; no physical possession, financial rights, PENNY transfer, new hardware identity or mint'
  };
  const child=spawnSync(process.execPath,['--experimental-strip-types','scripts/opaque-roundtrip.ts'],{
    cwd:root,input:JSON.stringify(request),encoding:'utf8',maxBuffer:8*1024*1024,timeout:30000
  });
  if(child.error)throw child.error;
  if(child.status!==0)throw Error('BOX_016_RELATTE_HOLD: native receiver rejected observation: '+String(child.stderr).slice(0,300));
  let result;try{result=JSON.parse(child.stdout);}catch{
    throw Error('BOX_016_RELATTE_HOLD: native response not JSON');
  }
  if(result?.schema!=='relatte.opaque-roundtrip-result/v0'||
    result.crossing?.declared_kind!=='OPAQUE_ORGAN_ARTIFACT'||
    result.crossing?.source_particular!==spec.source_particular||
    result.crossing?.source_history_head!==spec.source_history_head||
    result.crossing?.extensions?.organ_adapter?.artifact_kind!==spec.artifact_kind||
    result.receive_receipt?.kind!=='RECEIVED'||
    result.disposition_receipt?.kind!=='R3_HOLD'||
    !result.receiver_snapshot?.held?.includes(result.crossing.crossing_id))
    throw Error('BOX_016_RELATTE_HOLD: native signatures and HOLD boundary not proven');
  return {proof:'SIGNED_LOCAL_BOX_COMPOSITION_OBSERVATION_RECEIVED_AND_HELD',
    crossingId:result.crossing.crossing_id,
    receiveReceiptId:result.receive_receipt.receipt_id,
    holdReceiptId:result.disposition_receipt.receipt_id,
    receiverDisposition:'R3_HOLD',
    physicalBoxVerified:false,physicalAssetsReceived:false,coinBackingModified:false,
    mintedPennyUnits:0,nativeResultPath:request.result_path};
}
export function main(args=process.argv.slice(2)){
  if(args.length!==4)throw Error('Usage: penny016:relatte SIGNED_FIELD.json CANDIDATE.json RELATTE_CHECKOUT PRIVATE_WORK_DIR');
  const [fieldFile,candidateFile,repo,work]=args,
    field=JSON.parse(readFileSync(resolve(fieldFile),'utf8')),
    candidate=JSON.parse(readFileSync(resolve(candidateFile),'utf8'));
  const at=field.boxes['box-b'].events.at(-1)?.createdAt;
  return holdFourthBoxObservation(field,candidate,repo,work,at);
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
