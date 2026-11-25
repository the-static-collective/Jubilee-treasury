import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';
import {plan,GATES} from './workbench.mjs';
import {synthesizeAgreements} from '../labs/penny-puddle-014/composer.mjs';
const h=readFileSync(new URL('../ops/exodus-004/casework.html',import.meta.url),'utf8');
const core=h.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const {C,parse}=runInNewContext(core+'\n({C:Casework,parse:s=>JSON.parse(s)})',{crypto:webcrypto,TextEncoder,TextDecoder});
const d=x=>parse(JSON.stringify(x));
function fixture(){
 let b=C.append(C.blank(),null,'case',d({title:'Fictional rehearsal'}));const id=b.events[0].id;
 const add=(kind,data)=>{b=C.append(b,id,kind,d(data));return b.events.at(-1).id;};
 const s1=add('source',{text:'Fictional source A',ref:'fixture-a'}),s2=add('source',{text:'Fictional source B',ref:'fixture-b'});
 const claim=add('claim',{text:'Fictional supported claim',ref:s1});add('review',{ref:claim,state:'SUPPORTED',text:'Fixture review'});
 const a=add('offer',{text:'Fictional offer A',amountMinor:600000,ref:s1}),z=add('offer',{text:'Fictional offer B',amountMinor:200000,ref:s2});
 const input={targetMinor:800000,gateClaims:Object.fromEntries(Object.keys(GATES).map(g=>[g,{state:'unknown',claimId:''}])),offerIds:[a,z]};
 return {get b(){return b},id,claim,a,z,s1,s2,input,add};
}
const run=(f,over={})=>plan(C,synthesizeAgreements,f.b,f.id,{...f.input,...over});
test('native composition: four held alternatives, ranked questions and exact conditional arithmetic',()=>{const f=fixture(),p=run(f);assert.deepEqual(p.paths.map(x=>x.route).sort(),['bridge','extension','guarantee','sponsor']);assert.equal(p.funds.candidate.reportedMinor,800000);assert.equal(p.funds.verifiedFundsMinor,0);assert.equal(p.actualPaymentsMinor,0);assert.equal(p.questions[0].affectedRoutes,4);assert.ok(p.paths.every(x=>x.status==='HOLD'&&!x.executionAllowed));});
test('explicit source-linked block prunes one route; unknown does not imply willingness',()=>{const f=fixture();f.input.gateClaims.extension={state:'blocked',claimId:f.claim};assert.ok(!run(f).paths.some(p=>p.route==='extension'));f.input.gateClaims.authority={state:'blocked',claimId:f.claim};assert.equal(run(f).paths.length,0);});
test('unsupported and withdrawn reviews cannot be used',()=>{const f=fixture();f.input.gateClaims.authority={state:'reviewed',claimId:f.claim};assert.equal(run(f).gateState.authority.state,'reviewed');f.add('review',{ref:f.claim,state:'DISPUTED',text:'new evidence'});assert.throws(()=>run(f),/currently supported/);});
test('withdrawn offers and duplicate sources cannot inflate candidate amount',()=>{const f=fixture();const same=f.add('offer',{text:'Duplicate source',amountMinor:300000,ref:f.s1});assert.throws(()=>run(f,{offerIds:[f.a,same]}),/Duplicate source/);f.add('offer-status',{ref:f.a,state:'WITHDRAWN',text:'fixture'});assert.throws(()=>run(f),/current conditional/);});
test('no combination, no inferred funding; closed cases refused',()=>{const f=fixture();assert.equal(run(f,{targetMinor:900000}).funds.candidate,null);f.add('case-status',{state:'CLOSED',text:'fixture'});assert.throws(()=>run(f),/Open or held/);});
test('all annotations reviewed still cannot authorize contact, payment or publication',()=>{const f=fixture();for(const g of Object.keys(GATES))f.input.gateClaims[g]={state:'reviewed',claimId:f.claim};const p=run(f);assert.ok(p.paths.every(x=>x.status==='HOLD'));assert.equal(p.contactAllowed,false);assert.equal(p.publicationAllowed,false);assert.equal(p.executionAllowed,false);});
