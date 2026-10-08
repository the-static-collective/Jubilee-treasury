#!/usr/bin/env node
import {generateSteward,newLedger,append,inspect} from './asset-treasury-007.mjs';
import {pennySource,recursivePennyOptions,hypotheticalInterest,defaultPennyRecipes} from './penny-recursion-013.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
export const PURPOSE='purpose-neighbor-support-001';
const AT='2026-10-08T20:00:00.000Z';
function addAsset(ledger,keys,id,kind,unit,mode,amount){
  const offer={
    id,kind,label:kind==='coins'?'Synthetic penny lot':kind==='labor'?'Synthetic human work minutes':'Synthetic offer',
    quantity:amount,unit,mode,purposeIds:[PURPOSE],termsRef:'terms-explicit-local-claim-001'
  };
  let state=append(ledger,keys,'OFFER',offer,AT);
  state=append(state,keys,'ACCEPT',{assetId:id,termsEvidenceRef:'synthetic-acceptance-001'},AT);
  state=append(state,keys,'RECEIVE',{
    assetId:id,evidenceRef:'synthetic-received-claim-001',
    assertion:'asset_received_attested'
  },AT);
  return state;
}
export function buildSyntheticPennyWorld(){
  const keys=generateSteward();
  const first=addAsset(newLedger(keys),keys,'lot-penny-037-001','coins','penny','gift',37);
  const withMore=addAsset(first,keys,'lot-penny-063-002','coins','penny','gift',63);
  const withLabor=addAsset(withMore,keys,'lot-human-work-015-001','labor','minute','service',15);
  return {keys,after37:first,after100:withMore,withLabor};
}
export function demo(){
  const {after37,withLabor}=buildSyntheticPennyWorld(),recipes=defaultPennyRecipes(PURPOSE);
  const thirtySeven=recursivePennyOptions(after37,{purposeId:PURPOSE,recipes});
  const oneHundred=recursivePennyOptions(withLabor,{purposeId:PURPOSE,recipes});
  const fantasy=hypotheticalInterest(withLabor,{
    purposeId:PURPOSE,aprBasisPoints:500,months:12,monthlyFutureContributionPennies:0
  });
  return {
    schema:'jubilee.penny-recursion-demo/v0.1',
    staticSource37:pennySource(after37,PURPOSE),
    signedAccumulation:pennySource(withLabor,PURPOSE),
    before:{coins:thirtySeven.rootCoinCount,scenarios:thirtySeven.projectedRoutes.length,
      availableScenarios:thirtySeven.projectedRoutes.map(x=>x.to)},
    after:{coins:oneHundred.rootCoinCount,scenarios:oneHundred.projectedRoutes.length,
      candidateDestinations:oneHundred.projectedRoutes.map(x=>x.to),
      sourceHistoryHead:oneHundred.source.sourceHistoryHead,
      indexHash:oneHundred.indexHash},
    hypotheticalOnly:{
      inputRateBasisPoints:fantasy.scenario.aprBasisPoints,
      imaginedInterestCents:fantasy.imaginedInterestTotalCents,
      actuallyEarnedInterestCents:fantasy.actuallyEarnedInterestCents,
      actualFundsDepositedCents:fantasy.actualFundsDepositedCents,
      hypotheticalOnly:true
    },
    separateOutcomes:{
      realNewCoinsInSyntheticSignedFixture:63,
      optionsAreNotAdditive:true,
      newAssetsFromRecursion:oneHundred.newAssetsCreated,
      moneyFromRecursionCents:oneHundred.earnedInterestMinorUsd,
      sourceClaimsAreNotIndependentlyVerifiedCash:true
    },
    notice:'Synthetic illustrative signed ledger only. Two local steward-attested penny lots (37 then 63) and a separate 15-minute labor lot. No real coin count, deposit, matching gift, collector appraisal, contract interest or funds are independently verified.'
  };
}
export function main(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='demo')return demo();
  if(args.length>=3&&args.length<=6&&args[0]==='inspect'){
    const [,path,purpose,depthRaw='4',bpsRaw='0',monthsRaw='12']=args;
    const ledger=JSON.parse(readFileSync(resolve(path),'utf8'));
    const depth=Number(depthRaw),bps=Number(bpsRaw),months=Number(monthsRaw);
    const source=inspect(ledger);
    return {sourceHead:source.head,
      options:recursivePennyOptions(ledger,{purposeId:purpose,
        recipes:defaultPennyRecipes(purpose),maxDepth:depth,expectedHead:source.head}),
      counterfactual:hypotheticalInterest(ledger,{
        purposeId:purpose,aprBasisPoints:bps,months,expectedHead:source.head})};
  }
  throw Error('Usage: npm run pennies:demo | npm run pennies -- inspect SIGNED_TREASURY_LEDGER.json PURPOSE_ID [MAX_DEPTH] [ILLUSTRATIVE_APR_BPS] [MONTHS]');
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
