import {field} from '../concord-live-003/field.mjs';
import {firstNeed, Mirror, makeOffer, proposeMatches} from './vendor/portable-protocol.mjs';

export const CASE='EXODUS-FIXTURE-001';
const KIND_TO_RESOURCE={'document-access':'document_access','translation':'translation','interpretation':'interpretation','property-counsel':'property_counsel','bilingual-property-counsel':'bilingual_property_counsel','independent-review':'independent_review'};
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===[...keys].sort().join('|');
function hold(message){throw Error('EXODUS HOLD: '+message);}

// No data access, network, outreach, grant, publication, or settlement. Fixed synthetic scope.
export function prepare(snapshot,{mode,now=Date.now()}={}){
 if(mode!=='SYNTHETIC_ONLY'||snapshot?.caseKey!==CASE)hold('synthetic case only');
 const proposal=field(snapshot,{now,expectedCaseKey:CASE});
 return {
  schema:'jubilee.exodus.review/v1',caseKey:CASE,mode,status:'HOLD',authority:'none',
  capabilityProposal:proposal,
  reviewGates:['local-owner-consent','independent-counsel','document-verification','safe-disclosure-review','separate-action-approval'].map(id=>({id,state:'UNVERIFIED'})),
  publicDraft:{id:CASE,title:'Synthetic property review exercise',summary:'Fictional verification-preparation exercise. Not an appeal or live assistance request.',region:'remote',
    requirements:proposal.quests.map(q=>({id:'req-'+KIND_TO_RESOURCE[q.kind],resource:KIND_TO_RESOURCE[q.kind],quantity:1,unit:'review',kind:'service'}))},
  contactAllowed:false,publicationAllowed:false,executionAllowed:false,settlementAllowed:false
 };
}

// Deliberately restricted to synthetic fixture keys and the internally generated draft.
// A signature is a key attestation, not evidence of need, identity or consent.
export function rehearse(snapshot,keys,helperKeys,{mode,now=Date.now()}={}){
 const result=prepare(snapshot,{mode,now});
 if(result.publicDraft.requirements.length===0)return {...result,portable:null};
 const need=firstNeed(keys,result.publicDraft);
 const origin=new Mirror('fixture-origin'),mirror=new Mirror('fixture-mirror');
 origin.receive(need);mirror.import(origin.export(CASE));
 const req=result.publicDraft.requirements[0];
 const offer=makeOffer(helperKeys,{id:'fixture-offer-001',need,requirementId:req.id,region:'remote',quantity:1,unit:req.unit,kind:req.kind});
 return {...result,portable:{signedFixture:mirror.latest(CASE),matches:proposeMatches(need,[offer]),status:'SYNTHETIC_ONLY_NOT_PUBLIC'}};
}
