import {createHash} from 'node:crypto';
import {CASE,prepare} from '../exodus-001/exodus.mjs';

// Reconstructed from the September 29 HON contract; not recovered original code.
// Closed synthetic fixture only. No filesystem, network, real identities or payment APIs.
export const MODE='SYNTHETIC_ONLY';
export const GATES=Object.freeze(['local-owner-consent','independent-counsel','document-verification','safe-disclosure-review','separate-action-approval']);
const TARGET=800000, SHARE=100000;
const now=Date.parse('2026-11-24T00:00:00Z');
const halt=m=>{throw Error('RETURNING NODE HOLD: '+m)};
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function exact(x,keys){
 if(!x||Object.getPrototypeOf(x)!==Object.prototype)return false;
 const ds=Object.getOwnPropertyDescriptors(x), ks=Reflect.ownKeys(ds);
 return ks.length===keys.length&&keys.every(k=>Object.hasOwn(ds,k)&&Object.hasOwn(ds[k],'value')&&ds[k].enumerable);
}
const cap=kind=>({id:'cap-'+kind,actor:'operator',kind,purpose:'verification-preparation',state:'offered',sourceRef:'src-'+kind,consentRef:'consent-'+kind,expiresAt:new Date(now+3600000).toISOString()});
export function fixtureSnapshot(complete=true){
 return {schema:'jubilee.capability-field/v1',caseKey:CASE,asOf:new Date(now).toISOString(),cards:(complete?['document-access','translation','property-counsel','independent-review']:[]).map(cap),links:[]};
}
const shapes={need:['kind'],offer:['kind','slot'],proposal:['kind'],review:['kind','gate'],admission:['kind','decision'],movement:['kind','amountMinor'],receipt:['kind','movementIndex']};
export function replay(events,{mode,complete=true}={}){
 if(mode!==MODE||typeof complete!=='boolean'||!Array.isArray(events)||events.length>64)halt('synthetic events only');
 const held=prepare(fixtureSnapshot(complete),{mode:MODE,now});
 let need=false,proposal=false,admission='NONE',total=0;
 const offers=new Set(),reviews=new Set(),movements=[],receipts=new Set(),records=[];
 for(const e of events){
  const kind=Object.getOwnPropertyDescriptor(e??{},'kind')?.value;
  if(!Object.hasOwn(shapes,kind)||!exact(e,shapes[kind]))halt('closed event shape');
  switch(kind){
   case 'need': if(need)halt('duplicate need');need=true;break;
   case 'offer': if(!need||proposal||!Number.isInteger(e.slot)||e.slot<1||e.slot>8||offers.has(e.slot))halt('invalid offer');offers.add(e.slot);break;
   case 'proposal': if(!need||proposal||!offers.size||!held.capabilityProposal.paths.some(p=>p.relationshipHolds.length===0))halt('no review route');proposal=true;break;
   case 'review': if(!proposal||admission==='ADMIT'||admission==='REFUSE'||!GATES.includes(e.gate)||reviews.has(e.gate))halt('invalid fixture review');reviews.add(e.gate);break;
   case 'admission':
    if(!proposal||!['HOLD','REFUSE','ADMIT'].includes(e.decision)||admission==='ADMIT'||admission==='REFUSE'||(admission==='HOLD'&&e.decision==='HOLD'))halt('invalid admission');
    if(e.decision==='ADMIT'&&reviews.size!==GATES.length)halt('missing fixture reviews');
    admission=e.decision;break;
   case 'movement':
    if(admission!=='ADMIT'||!Number.isSafeInteger(e.amountMinor)||e.amountMinor<=0||e.amountMinor>offers.size*SHARE-total)halt('movement not admitted or exceeds fixture limit');
    total+=e.amountMinor;movements.push(e.amountMinor);break;
   case 'receipt':
    if(!Number.isInteger(e.movementIndex)||e.movementIndex<1||e.movementIndex>movements.length||receipts.has(e.movementIndex))halt('missing or duplicate movement receipt');
    receipts.add(e.movementIndex);break;
  }
  records.push({...e});
 }
 const receiptTotal=[...receipts].reduce((sum,i)=>sum+movements[i-1],0);
 return {schema:'jubilee.returning-node.rehearsal/v1',mode:MODE,status:'HOLD',authority:'none',actualMovementMinor:0,actualCommitmentMinor:0,publicationAllowed:false,contactAllowed:false,executionAllowed:false,settlementAllowed:false,
  fixture:{needMinor:need?TARGET:0,offeredMinor:offers.size*SHARE,proposed:proposal,admission,reviewCount:reviews.size,simulatedMovementMinor:total,simulatedReceiptMinor:receiptTotal,remainingMinor:need?TARGET-total:0},
  recoveryDigest:hash({complete,records})};
}
// Digest checks accidental corruption, not origin, consent or authenticity.
export function recoveryPacket(events,options){
 const result=replay(events,options);
 return {schema:'jubilee.returning-node.recovery/v1',mode:MODE,complete:options.complete??true,events:structuredClone(events),digest:result.recoveryDigest};
}
export function restore(packet,{mode}={}){
 if(mode!==MODE||!exact(packet,['schema','mode','complete','events','digest'])||packet.schema!=='jubilee.returning-node.recovery/v1'||packet.mode!==MODE||typeof packet.complete!=='boolean')halt('invalid recovery packet');
 const result=replay(packet.events,{mode,complete:packet.complete});
 if(result.recoveryDigest!==packet.digest)halt('recovery digest mismatch');
 return result;
}
