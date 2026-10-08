#!/usr/bin/env node
import {newKeys,createWorld,attest,append,inspectWorld,relatteStateSpec} from './penny-work-matter-014.mjs';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
export const AT='2026-10-08T20:00:00.000Z';
export const evhash='a'.repeat(64);
export function keysForDemo(){
  return {
    treasury:newKeys(),work:newKeys(),custodian:newKeys(),counter:newKeys(),
    maker:newKeys(),org:newKeys(),node:newKeys()
  };
}
export function demoWorld(){
  const keys=keysForDemo();
  const box={boxId:'box-jubilee-001',custodianPublicKey:keys.custodian.publicKey,
    counterPublicKey:keys.counter.publicKey,backingTermsRef:'terms-owner-consent-redeemable-penny-001'};
  const world=createWorld({
    stewardPublicKey:keys.treasury.publicKey,workWitnessPublicKey:keys.work.publicKey,
    boxes:[box],holders:[
      {holderId:'person:maker-001',publicKey:keys.maker.publicKey},
      {holderId:'org:station-001',publicKey:keys.org.publicKey},
      {holderId:'node:workbench-001',publicKey:keys.node.publicKey}
    ]
  });
  return {keys,box,world};
}
const signThree=(q,keys)=>({
  depositor:attest('depositor',q,keys.maker),
  custodian:attest('custodian',q,keys.custodian),
  counter:attest('counter',q,keys.counter)
});
const signTwo=(q,keys)=>({
  custodian:attest('custodian',q,keys.custodian),
  counter:attest('counter',q,keys.counter)
});
export function createScenario(){
  const {keys,box,world}=demoWorld();
  const stage={genesis:world};
  const work={
    workId:'work-verified-100-001',holderId:'person:maker-001',quantity:100,
    termsRef:'terms-explicit-100-pennies-for-work-001',evidenceHash:evhash,completedAt:AT
  };
  stage.work=append(stage.genesis,keys.treasury,'WORK',{
    certificate:attest('work_witness',work,keys.work)
  },AT);
  const original={
    depositId:'deposit-37-001',boxId:box.boxId,depositorId:'person:maker-001',
    quantity:37,evidenceHash:evhash,consentRef:'consent-donate-backing-37-001',
    backingTermsRef:box.backingTermsRef,observedAt:AT
  };
  stage.intake37=append(stage.work,keys.treasury,'DEPOSIT',{claim:original,
    proofs:signThree(original,keys)},AT);
  const release=(id,amount)=>{
    const instruction={
      releaseId:id,workId:work.workId,boxId:box.boxId,holderId:work.holderId,
      quantity:amount,termsRef:work.termsRef
    };
    return {instruction,holderConsent:attest('holder_release',instruction,keys.maker)};
  };
  stage.release37=append(stage.intake37,keys.treasury,'RELEASE',
    release('release-37-001',37),AT);
  const next={...original,depositId:'deposit-63-002',quantity:63,
    consentRef:'consent-donate-backing-63-002'};
  stage.intake100=append(stage.release37,keys.treasury,'DEPOSIT',{claim:next,
    proofs:signThree(next,keys)},AT);
  stage.release100=append(stage.intake100,keys.treasury,'RELEASE',
    release('release-63-002',63),AT);
  const movement={transferId:'transfer-12-to-org-001',workId:work.workId,
    boxId:box.boxId,fromId:'person:maker-001',toId:'org:station-001',quantity:12};
  stage.transferred=append(stage.release100,keys.treasury,'TRANSFER',{
    instruction:movement,proofs:{
      sender:attest('token_sender',movement,keys.maker),
      recipient:attest('token_recipient',movement,keys.org)
    }
  },AT);
  const redemption={withdrawalId:'withdrawal-7-001',workId:work.workId,
    boxId:box.boxId,holderId:'org:station-001',quantity:7,
    evidenceHash:evhash,observedAt:AT};
  stage.redeemed=append(stage.transferred,keys.treasury,'REDEEM',{
    instruction:redemption,proofs:{
      surrender:attest('token_surrender',redemption,keys.org),...signTwo(redemption,keys)
    }
  },AT);
  const audit={auditId:'audit-93-001',boxId:box.boxId,actualCount:93,
    evidenceHash:evhash,observedAt:AT};
  stage.audited=append(stage.redeemed,keys.treasury,'AUDIT',{
    claim:audit,proofs:signTwo(audit,keys)},AT);
  return {keys,box,work,stages:stage};
}
export function demo(){
  const d=createScenario(),stages=d.stages;
  const view=Object.fromEntries(
    ['work','intake37','release37','intake100','release100','transferred','redeemed','audited']
      .map(name=>[name,(()=>{
        const p=inspectWorld(stages[name]);
        return {pending:p.workProducedPending,active:p.outstandingPennyUnits,
          bookCoins:p.boxBookCoinCount,retired:p.retiredByRedemption,
          positions:p.positions,shortfall:p.auditedPhysicalShortfall,status:p.status};
      })()])
  );
  const final=inspectWorld(stages.audited);
  return {schema:'jubilee.penny-014-demo/v0.1',
    stages:view,finalStateHead:final.sourceHead,
    relatteSpec:relatteStateSpec(stages.audited,AT),
    note:'Synthetic signed test witnesses; boxes, pennies, people, authorizations and redemption have not physically occurred. No live token, interest, bank deposit or public transfer.'};
}
export function main(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='demo')return demo();
  if(args.length===2&&args[0]==='inspect'){
    const w=JSON.parse(readFileSync(resolve(args[1]),'utf8'));
    return inspectWorld(w);
  }
  throw Error('Usage: npm run penny014:demo | npm run penny014 -- inspect SIGNED_LOCAL_WORLD.json');
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
