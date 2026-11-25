import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {compose} from './adapter.mjs';
import {synthesizeAgreements,makeAgreementFixture,applyFirstPersonOfferAnswer} from './vendor/composer.mjs';
const now=Date.parse('2026-11-25T00:00:00Z');
const keys=['deadline_confirmed','beneficiary_authority','seller_title','closing_terms','lawful_transfer','extension_agreed','local_bridge_agreed','guarantee_agreed','creditor_consent','independent_confirmation','case_verified','church_held_capacity'];
const fixture=(state='unknown')=>({schema:'jubilee.concord.snapshot/v1',caseKey:'JUB-HON-001',asOf:new Date(now).toISOString(),facts:Object.fromEntries(keys.map(k=>[k,state]))});
const run=s=>compose(s,{now});
test('vendored sources are identical to the recovered git blobs',()=>{
 for(const [path,expected] of [['composer.mjs','61dafee54a5a0b615e7969ff768a01fba140f577'],['plenty/index.ts','0c4c8bd6c62d279cdc21101d067105f341dc9099'],['plenty/types.ts','e076a13266d518912faeddf53a6f6ec153b0da47']]){
  const b=readFileSync(new URL('./vendor/'+path,import.meta.url));assert.equal(createHash('sha1').update(Buffer.from('blob '+b.length+'\u0000')).update(b).digest('hex'),expected);
 }
});
test('native original fixture composes three alternatives and survives refusal',()=>{const f=makeAgreementFixture();assert.equal(synthesizeAgreements(f).plans.length,3);assert.equal(synthesizeAgreements(applyFirstPersonOfferAnswer(f,'L-considers-repair','L','no')).plans.length,2);});
test('unknown live-shaped snapshot generates four checked possibilities, never viability',()=>{const r=run(fixture());assert.equal(r.paths.length,4);assert.equal(r.plenty.structurallyComplete,4);assert.equal(r.plenty.viable,0);assert.ok(r.paths.every(p=>p.disposition==='HOLD'&&!p.executionAllowed));assert.equal(r.nextQuestions[0].affectedPaths,4);});
test('one blocked bridge preserves three alternatives',()=>{const s=fixture();s.facts.local_bridge_agreed='blocked';const r=run(s);assert.equal(r.paths.length,3);assert.ok(r.paths.every(p=>!p.gates.includes('local_bridge_agreed')));});
test('common blocked dependency stops all routes',()=>{const s=fixture();s.facts.beneficiary_authority='blocked';assert.equal(run(s).paths.length,0);});
test('fully satisfied snapshot remains review-only',()=>{const r=run(fixture('satisfied'));assert.equal(r.paths.length,4);assert.ok(r.paths.every(p=>p.disposition==='REVIEW_READY'&&!p.executionAllowed));assert.equal(r.plenty.viable,0);assert.equal(r.authority,'none');assert.equal(r.workPacket.status,'PREPARE_ONLY');});
test('stale or future snapshot denied',()=>{for(const delta of [-900001,6000]){const s=fixture();s.asOf=new Date(now+delta).toISOString();assert.throws(()=>run(s),/stale snapshot/);}});
test('raw contact or arbitrary metadata rejected',()=>{const s=fixture();s.contact='synthetic@example.invalid';assert.throws(()=>run(s),/invalid or stale/);const t=fixture();t.facts.deadline_confirmed='do this now';assert.throws(()=>run(t),/fact vocabulary/);});
test('same snapshot yields identical proposals',()=>assert.deepEqual(run(fixture()),run(fixture())));
