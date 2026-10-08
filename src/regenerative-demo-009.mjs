import {readFileSync} from 'node:fs';
import {generateSteward,newLedger,append,inspect} from './asset-treasury-007.mjs';
import {proposeRegenerativeAsset,submitRegenerativeOffer,regenerativeCut} from './regenerative-static-os-009.mjs';

const file=process.argv[2];
if (!file) throw Error('Usage: node src/regenerative-demo-009.mjs PATH_TO_NATIVE_PROOF');
const evidence=JSON.parse(readFileSync(file,'utf8'));
const keys=generateSteward();
let ledger=newLedger(keys);
const add=(type,payload)=>{ledger=append(ledger,keys,type,payload);};
const purposeId='purpose-open-education-009';
add('OFFER',{id:'asset-human-hour-009',kind:'time',label:'One volunteer teaching hour',
  quantity:1,unit:'hour',mode:'service',purposeIds:[purposeId],termsRef:'terms-hour-009'});
add('ACCEPT',{assetId:'asset-human-hour-009',termsEvidenceRef:'synthetic-human-agreement-009'});
add('RECEIVE',{assetId:'asset-human-hour-009',evidenceRef:'synthetic-hour-attestation-009',assertion:'asset_received_attested'});
add('NEED',{id:'need-educational-asset-009',title:'One reusable education artifact',
  kind:'digital_artifact',unit:'artifact',quantity:1,purposeId});
const recipe={
  id:'recipe-teaching-packet-009',purposeId,termsRef:'terms-recipe-009',
  inputs:[{kind:'time',unit:'hour',quantity:1},{kind:'digital_artifact',unit:'artifact',quantity:1}],
  output:{kind:'educational_material',unit:'packet',quantity:1},
};
const cut=()=>regenerativeCut(ledger,{recipes:[recipe]});
const summary=(phase,index)=>({
  phase,indexHash:index.cutHash,sourceHead:index.sourceHistoryHead,
  availableArtifactUnits:index.assets.filter(x=>x.kind==='digital_artifact').reduce((a,x)=>a+x.available,0),
  openNeed:index.needs[0]?.open??0,
  routeCount:index.routes.length,
  recipeCandidates:index.compositions.length,
  cashAvailable:false
});
const history=[summary('BEFORE_NATIVE_OUTPUT',cut())];
const policy={purposeId,termsRef:'rights-source-review-009'};
const candidate=proposeRegenerativeAsset(evidence,policy);
history.push(summary('CANDIDATE_ON_HOLD',cut()));
const applied=submitRegenerativeOffer(ledger,keys,evidence,policy,{
  proposalId:candidate.proposalId,decision:'OFFER_ONLY',sourceReviewed:true,rightsReviewed:true,
});
ledger=applied.ledger;
history.push(summary('STEWARD_OFFER_ONLY',cut()));
add('ACCEPT',{assetId:candidate.asset.id,termsEvidenceRef:'manual-license-review-009'});
history.push(summary('OWNER_ACCEPTED_NOT_RECEIVED',cut()));
add('RECEIVE',{assetId:candidate.asset.id,evidenceRef:'manual-artifact-review-009',assertion:'asset_received_attested'});
history.push(summary('SEPARATELY_RECEIVED',cut()));
const result={
  specimen:'REGENERATIVE_CAPACITY_STATIC_OS_009',
  donor:'PINNED_STATIC_OS_CRANK_NODE_ONE_TURN',
  sourceReceiptSignature:'NONE',
  proposalId:candidate.proposalId,
  sourceOutputDigest:candidate.source.privateOutputDigest,
  history,
  result:'A native digital work result became one steward-attested digital capacity unit only after separate OFFER/ACCEPT/RECEIVE. New potential recipes are still proposals.',
  legalRightsEstablished:false,realWorldImpactEstablished:false,financialReturnEstablished:false,
};
console.log(JSON.stringify(result,null,2));
