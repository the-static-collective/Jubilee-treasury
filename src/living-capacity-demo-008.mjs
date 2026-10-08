import {generateSteward,newLedger,append} from './asset-treasury-007.mjs';
import {livingIndex} from './living-capacity-index-008.mjs';

// Fully synthetic: no beneficiaries, actual goods, money, or legal title.
const steward=generateSteward();
let ledger=newLedger(steward);
const enter=(type,payload)=>{ledger=append(ledger,steward,type,payload);};
const offer=(a)=>{
  enter('OFFER',a);
  enter('ACCEPT',{assetId:a.id,termsEvidenceRef:'synthetic-consent-008'});
  enter('RECEIVE',{assetId:a.id,evidenceRef:'synthetic-receipt-008',assertion:'asset_received_attested'});
};
offer({id:'asset-repair-hours-008',kind:'time',label:'Repair time',quantity:4,unit:'hour',
  mode:'service',purposeIds:['purpose-repairs-008'],termsRef:'terms-time-008'});
offer({id:'asset-repair-kits-008',kind:'goods',label:'Repair kits',quantity:2,unit:'kit',
  mode:'gift',purposeIds:['purpose-repairs-008'],termsRef:'terms-goods-008'});
enter('NEED',{id:'need-repair-kit-008',title:'Repair kit',kind:'goods',unit:'kit',
  quantity:1,purposeId:'purpose-repairs-008'});
const recipe={id:'recipe-repair-008',purposeId:'purpose-repairs-008',termsRef:'terms-recipe-008',
  inputs:[{kind:'goods',unit:'kit',quantity:1},{kind:'time',unit:'hour',quantity:2}],
  output:{kind:'service',unit:'repair_session',quantity:1}};
const before=livingIndex(ledger,{recipes:[recipe]});
enter('RESERVE',{id:'reservation-one-008',assetId:'asset-repair-kits-008',needId:'need-repair-kit-008',quantity:1});
const afterReservation=livingIndex(ledger,{recipes:[recipe]});
enter('FULFILL',{reservationId:'reservation-one-008',evidenceRef:'synthetic-human-report-008'});
const afterFulfillment=livingIndex(ledger,{recipes:[recipe]});
const report={
  specimen:'JUBILEE ECONOMICS 008 — SYNTHETIC ONLY',
  cuts:[before,afterReservation,afterFulfillment].map((cut,i)=>({
    step:['BEFORE','RESERVED','REPORTED_FULFILLED'][i],
    cutHash:cut.cutHash,sourceHistoryHead:cut.sourceHistoryHead,
    sourceEventCount:cut.sourceEventCount,
    openNeeds:cut.needs.map(n=>({id:n.id,open:n.open,fulfilled:n.fulfilled})),
    possibleRoutes:cut.routes.length,
    compositions:cut.compositions.map(x=>({recipeId:x.recipeId,maximumBatchesIfExclusivelyAllocated:x.maximumBatchesIfExclusivelyAllocated})),
    spendableCash:false
  })),
  limits:'Recipe outputs remain proposals; this simulation does not create repair services, evidence of delivery, insurance, interest, credit or financial value.'
};
console.log(JSON.stringify(report,null,2));
