#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {newKeys} from './penny-work-matter-014.mjs';
import {createScenario} from './penny-work-matter-demo-014.mjs';
import {
  newNode,newField,declareResource,inspectField,compose,
  selectAtNode,makeCompletion,applyAtNode,inspectFourthBox,
  portableReceipt,printableReceiptHTML,relatteFourthBoxSpec
} from './penny-box-composer-016.mjs';

export const AT='2026-10-08T20:02:00.000Z';
export const HASH='a'.repeat(64);
export const DIALS={exploration:7,risk:9,materialAttention:11,nested:[1,11,5]};
const copy=o=>JSON.parse(JSON.stringify(o));
export function threeBoxFixture(){
  const penny=createScenario();
  const owners={
    'box-a':penny.keys.treasury,'box-b':newKeys(),'box-c':newKeys(),
    fabricator:newKeys(),witness:newKeys(),newBox:newKeys()
  };
  const roles={fabricatorPublicKey:owners.fabricator.publicKey,
    witnessPublicKey:owners.witness.publicKey,
    newBoxOwnerPublicKey:owners.newBox.publicKey};
  const nodes=Object.fromEntries(['box-a','box-b','box-c'].map(id=>
    [id,newNode(id,owners[id].publicKey,roles)]));
  let field=newField(penny.stages.release100,nodes);
  field.boxes['box-b']=declareResource(field.boxes['box-b'],owners['box-b'],{
    lotId:'owned-tools-003-001',kind:'tool',quantity:3,evidenceHash:HASH,
    termsRef:'terms-tools-owner-attested-001'
  },AT);
  field.boxes['box-c']=declareResource(field.boxes['box-c'],owners['box-c'],{
    lotId:'labor-minutes-060-001',kind:'labor_minute',quantity:60,
    evidenceHash:HASH,termsRef:'terms-work-witness-required-001'
  },AT);
  return {owners,field};
}
export function addMaterialKit(field,ownerKeys) {
  const next=copy(field);
  next.boxes['box-b']=declareResource(next.boxes['box-b'],ownerKeys,{
    lotId:'physical-material-kit-001',kind:'material_kit',quantity:1,
    evidenceHash:'b'.repeat(64),termsRef:'terms-material-source-received-001'
  },AT);
  return next;
}
export function signedCompletion(candidate,owners){
  return makeCompletion(candidate,{
    fabricator:owners.fabricator,witness:owners.witness,newOwner:owners.newBox
  },'c'.repeat(64),AT);
}
export function createFourBoxScenario(){
  const {owners,field:initial}=threeBoxFixture(),stages={};
  const p1=compose(initial,DIALS);
  stages.beforeKit={field:initial,proposal:p1};
  let field=addMaterialKit(initial,owners['box-b']);
  const proposal=compose(field,DIALS);
  stages.ready={field,proposal};
  // B disconnects: A may select an observation; C reserves 45 real claimed minutes.
  field=selectAtNode(field,proposal,'box-a',owners['box-a'],AT);
  field=selectAtNode(field,proposal,'box-c',owners['box-c'],AT);
  stages.partitioned={field,projection:inspectFourthBox(field,proposal)};
  // B reappears; exact owner-signed selection can be retried without duplicate inventory.
  field=selectAtNode(field,proposal,'box-b',owners['box-b'],AT);
  const approved=copy(field);
  field=selectAtNode(field,proposal,'box-b',owners['box-b'],AT);
  if(JSON.stringify(field)!==JSON.stringify(approved))throw Error('owner selection was duplicated');
  stages.approved={field,projection:inspectFourthBox(field,proposal)};
  const completion=signedCompletion(proposal,owners);
  // B is absent again during APPLY. Partial signed completion isn't a fourth box.
  field=applyAtNode(field,proposal,'box-a',owners['box-a'],completion,AT);
  field=applyAtNode(field,proposal,'box-c',owners['box-c'],completion,AT);
  stages.partialExecution={field,projection:inspectFourthBox(field,proposal)};
  const afterCrash=copy(field);
  field=applyAtNode(afterCrash,proposal,'box-b',owners['box-b'],completion,AT);
  const committed=copy(field);
  field=applyAtNode(field,proposal,'box-b',owners['box-b'],completion,AT);
  if(JSON.stringify(field)!==JSON.stringify(committed))throw Error('replayed physical effect changed capacity');
  stages.completed={field,projection:inspectFourthBox(field,proposal)};
  const result=inspectFourthBox(field,proposal);
  const receipt=portableReceipt(field,'box-b',proposal.planId);
  return {owners,proposal,completion,stages,field,receipt,boxFour:result};
}
export function demo(){
  const x=createFourBoxScenario();
  const before=inspectField(x.stages.ready.field),after=inspectField(x.field);
  return {
    schema:'jubilee.penny-box-that-asks-demo/v0.1',
    radioDials:DIALS,
    beforeKit:{status:x.stages.beforeKit.proposal.status,
      missing:x.stages.beforeKit.proposal.missing},
    initialAvailable:{pennies:before.pennyBookCoins,
      outstandingPennyClaims:before.pennyOutstanding,
      tools:before.boxes['box-b'].resources.tool.free,
      laborMinutes:before.boxes['box-c'].resources.labor_minute.free},
    afterKit:{status:x.proposal.status,missing:x.proposal.missing},
    duringPartition:x.stages.partitioned.projection.status,
    partialSignedExecution:x.stages.partialExecution.projection.status,
    afterReconnection:x.boxFour,
    resultingCapacity:{toolsAvailable:after.boxes['box-b'].resources.tool.free,
      kitConsumed:after.boxes['box-b'].resources.material_kit.consumed,
      laborCompleted:after.boxes['box-c'].resources.labor_minute.consumed,
      laborRemaining:after.boxes['box-c'].resources.labor_minute.free,
      newBoxAttested:1,
      physicalNewBoxIndependentlyVerifiedBySoftware:false},
    certifiedReceiptHash:x.receipt.eventHash,
    relatteHoldSpec:relatteFourthBoxSpec(x.field,x.proposal,AT),
    noPennyMutation:JSON.stringify(x.field.pennyWorld)===
      JSON.stringify(x.stages.beforeKit.field.pennyWorld),
    notice:'Everything synthetic. Separately signed completion claims are not verification of a built physical object; no currency moved. No real Static OS, Full Measure, hardware/QR, or public crypto network is connected.'
  };
}
export function main(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='demo')return demo();
  if(args.length===2&&args[0]==='print'){
    const x=createFourBoxScenario(),path=resolve(args[1]);
    writeFileSync(path,printableReceiptHTML(x.receipt),{flag:'wx',mode:0o600});
    return {output:path,receiptHash:x.receipt.eventHash,
      note:'Printable owner-signed simulation evidence, not a cash receipt or legal custody claim.'};
  }
  if(args.length===1&&args[0]==='bundle'){
    const x=createFourBoxScenario();
    return {field:x.field,proposal:x.proposal,receipt:x.receipt};
  }
  throw Error('Usage: npm run penny016:demo | npm run penny016 -- print ./private-receipt-016.html | npm run penny016 -- bundle');
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
