#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {inspectFourthBox,compose,selectAtNode} from './penny-box-composer-016.mjs';
import {AT,DIALS,threeBoxFixture,addMaterialKit} from './penny-box-demo-016.mjs';
import {
  observeOctoPrint,fingerprintGcode,fingerprintPhoto,createEvidence,
  signEvidence,applyHardwareEvidence,reportHold
} from './penny-hardware-witness-017.mjs';

export const SIM_GCODE=Buffer.from('; synthetic fourth-box print specimen\nG21\nG90\nG1 X20 Y20 F1200\nG1 X40 Y20 E0.5\n');
export const SIM_PHOTO=Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from('SIMULATED_IMAGE_NOT_CAMERA_DATA')
]);
const datetime='2026-10-08T21:17:00.000Z';
export function approvedFabricationFixture(){
  const f=threeBoxFixture();
  let field=addMaterialKit(f.field,f.owners['box-b']);
  const candidate=compose(field,DIALS);
  for(const id of ['box-a','box-b','box-c']){
    field=selectAtNode(field,candidate,id,f.owners[id],AT);
  }
  return {...f,field,candidate};
}
export function mockReadOnlyDevice({name='box-d-part.gcode',state='Printing',completion=54}={}){
  const requests=[];
  async function fetchImpl(url,options){
    requests.push({url,method:options.method,redirect:options.redirect,
      headerNames:Object.keys(options.headers)});
    const isConnection=url.endsWith('/api/connection');
    const response=isConnection?{
      current:{state:'Operational',printerProfile:'local-demo-profile'}
    }:{
      state,job:{file:{name}},progress:{completion}
    };
    return {ok:true,json:async()=>response};
  }
  return {fetchImpl,requests};
}
export async function syntheticMachineTrace(){
  const first=mockReadOnlyDevice();
  const second=mockReadOnlyDevice({state:'Operational',completion:100});
  const params={baseUrl:'http://127.0.0.1:5000',apiKey:'synthetic-status-only'};
  const during=await observeOctoPrint({...params,fetchImpl:first.fetchImpl});
  const after=await observeOctoPrint({...params,fetchImpl:second.fetchImpl});
  return {
    trace:{during,after,
      duringAt:'2026-10-08T21:17:01.000Z',
      afterAt:'2026-10-08T21:17:02.000Z'},
    requests:[...first.requests,...second.requests]
  };
}
export async function createHardwareFixture(){
  const x=approvedFabricationFixture();
  const {trace,requests}=await syntheticMachineTrace();
  const inspection={
    newBoxId:'box-d',inspectedAt:'2026-10-08T21:17:03.000Z',
    widthMm:125,heightMm:130,depthMm:95,
    assembled:true,looksSafeForUse:true,
    inspectionNotesHash:'b'.repeat(64)
  };
  const evidence=createEvidence(x.field,x.candidate,{
    gcodeBytes:SIM_GCODE,gcodeFileName:'box-d-part.gcode',
    photoBytes:SIM_PHOTO,trace,inspection});
  const proofs=Object.fromEntries([
    ['fabricator',x.owners.fabricator],
    ['witness',x.owners.witness],
    ['new_box_owner',x.owners.newBox]
  ].map(([name,keys])=>[name,signEvidence(evidence,name,keys)]));
  return {...x,evidence,proofs,trace,requests};
}
export async function demo(){
  const x=await createHardwareFixture();
  const pre=reportHold(x.field,x.candidate,{gcode:true,twoMachineSnapshots:true,
    photo:true,inspection:true,witnesses:false});
  const completed=applyHardwareEvidence(x.field,x.candidate,x.evidence,x.proofs,x.owners,AT);
  const final=inspectFourthBox(completed.field,x.candidate);
  return {
    schema:'jubilee.penny-hardware-017-demo/v0.1',
    planId:x.candidate.planId,
    initialStatus:'SELECTED_NOT_PHYSICALLY_BUILT',
    withoutWitnesses:pre,
    rawGcodeHash:fingerprintGcode(SIM_GCODE,'box-d-part.gcode').sha256,
    rawPhotoHash:fingerprintPhoto(SIM_PHOTO).sha256,
    readOnlyOctoPrintRequests:x.requests,
    machineReportedCompletion:x.evidence.machine.reportedJobCompletion,
    witnessAttested:completed.result.status,
    underlyingPennyCoins:final.pennyBookCoins,
    outstandingPennyClaims:final.pennyOutstanding,
    consumedKit:final.materialsConsumedOnlyIfFullyWitnessed,
    witnessedLaborMinutes:final.laborMinutesCompletedOnlyIfFullyWitnessed,
    outcome:completed.result,
    notice:'All machine replies, visual bytes, human inspections, fabrication and keys are synthetic fixtures. Read-only OctoPrint adapter is implemented but no real device was accessed. Never interpret the simulated witness signatures as actual fabricated hardware.'
  };
}
export async function main(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='demo')return demo();
  if(args.length===2&&args[0]==='probe'){
    const baseUrl=args[1],apiKey=process.env.OCTOPRINT_API_KEY;
    const s=await observeOctoPrint({baseUrl,apiKey});
    return {observation:s,mode:'READ_ONLY_STATUS_NO_PRINT_COMMANDS',
      note:'Local machine data is a status claim; no print execution, physical completion or owner admission.'};
  }
  if(args.length===3&&args[0]==='fingerprint'){
    return {gcode:fingerprintGcode(readFileSync(resolve(args[1])),args[1].split('/').at(-1)),
      photo:fingerprintPhoto(readFileSync(resolve(args[2]))),
      note:'File hashes do not independently establish scene authenticity or actual physical object.'};
  }
  throw Error('Usage: npm run penny017:demo | npm run penny017 -- probe http://127.0.0.1:5000 (env OCTOPRINT_API_KEY) | npm run penny017 -- fingerprint actual.gcode evidence.jpg');
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  main().then(v=>console.log(JSON.stringify(v,null,2))).catch(e=>{
    console.error(e.message);process.exitCode=1;
  });
}
