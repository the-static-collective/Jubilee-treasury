import {readFileSync} from 'node:fs';
import {generateSteward,newLedger,append} from './asset-treasury-007.mjs';
import {proposalForDesign,stewardOfferDesign,designIndex} from './regenerative-cad-010.mjs';

const path=process.argv[2];
if(!path)throw Error('Usage: node src/regenerative-cad-demo-010.mjs SOURCE_NATIVE_CAD_EXPORT_JSON');
const candidate=JSON.parse(readFileSync(path,'utf8'));
const keys=generateSteward(),purposeId='purpose-workshop-planning-010';
let ledger=newLedger(keys);
const post=(type,payload)=>{ledger=append(ledger,keys,type,payload);};
post('OFFER',{id:'asset-workshop-hour-010',kind:'time',label:'One synthetic workshop planning hour',
  quantity:1,unit:'hour',mode:'service',purposeIds:[purposeId],termsRef:'terms-planner-010'});
post('ACCEPT',{assetId:'asset-workshop-hour-010',termsEvidenceRef:'operator-consent-010'});
post('RECEIVE',{assetId:'asset-workshop-hour-010',evidenceRef:'synthetic-hours-010',
  assertion:'asset_received_attested'});
post('NEED',{id:'need-design-010',title:'One digital-design source reference',
  kind:'digital_design',unit:'design',quantity:1,purposeId});
const recipe={id:'recipe-design-review-010',purposeId,termsRef:'terms-recipe-010',
  inputs:[{kind:'digital_design',unit:'design',quantity:1},{kind:'time',unit:'hour',quantity:1}],
  output:{kind:'service',unit:'planning_session',quantity:1}};
const show=(phase)=>{const p=designIndex(ledger,{recipes:[recipe]});
  return {phase,sourceHead:p.sourceHistoryHead,
    availableDesigns:p.assets.filter(x=>x.kind==='digital_design').reduce((n,x)=>n+x.available,0),
    possibleReviewSessions:p.compositions.length,
    fabricatedMachines:0,spendableCash:false};
};
const steps=[show('BEFORE_CAD_SOURCE_IMPORT')];
const policy={purposeId,termsRef:'terms-cad-source-review-010'};
const proposal=proposalForDesign(candidate,policy);
steps.push(show('VERIFIED_NATIVE_SOURCE_CANDIDATE_HOLD'));
ledger=stewardOfferDesign(ledger,keys,candidate,policy,{
  proposalId:proposal.proposalId,decision:'OFFER_ONLY',sourceNativeReverified:true,
  licenseReviewed:true,humanSelection:true,
}).ledger;
steps.push(show('STEWARD_OFFER_NOT_RECEIVED'));
post('ACCEPT',{assetId:proposal.asset.id,termsEvidenceRef:'separate-human-terms-010'});
steps.push(show('ACCEPTED_NOT_RECEIVED'));
post('RECEIVE',{assetId:proposal.asset.id,evidenceRef:'separate-operator-receipt-010',
  assertion:'asset_received_attested'});
steps.push(show('DIGITAL_DESIGN_RECEIVED'));
console.log(JSON.stringify({
  experiment:'STATIC_OS_CAD_010_X_JUBILEE_010',
  source:proposal.source,steps,
  assertions:{nativeSourceActuallyVerifiedByRunner:'REQUIRES_PRECEDING_STATIC_OS_CLI_SUCCESS',
    independentRightsVerifiedBySoftware:false,
    ownerConsentVerifiedBySoftware:false,
    physicalMachineCreated:false,
    actualPlanningServiceCreated:false,
    externalMoneyHeld:false},
  result:'After separate signed noncash receipt, a reviewed digital design becomes one cataloged local capacity; an otherwise blocked planning recipe becomes possible. Nothing is manufactured or automatically executed.'
},null,2));
