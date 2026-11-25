import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('./casework.html',import.meta.url),'utf8');
const core=html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const C=runInNewContext(core+'\nCasework',{crypto:webcrypto,TextEncoder,TextDecoder});
// All JSON records originate in the same VM realm to exercise strict plain-object validation.
const j=x=>runInNewContext('JSON.parse('+JSON.stringify(JSON.stringify(x))+')',realm);
const realm={};
const context={crypto:webcrypto,TextEncoder,TextDecoder};
const api=runInNewContext(core+'\n({C:Casework,parse:s=>JSON.parse(s)})',context);
const a=api.C, data=x=>api.parse(JSON.stringify(x));
function fixture(){let b=a.append(a.blank(),null,'case',data({title:'Fictional case'}));const id=b.events[0].id;b=a.append(b,id,'source',data({text:'Test correspondence',ref:'fixture-source'}));return {b,id,source:b.events[1].id};}
test('evidence must precede a claim; explicit contradictory review retained',()=>{let {b,id,source}=fixture();assert.throws(()=>a.append(b,id,'claim',data({text:'assertion',ref:'missing'})));b=a.append(b,id,'claim',data({text:'assertion',ref:source}));const ref=b.events.at(-1).id;for(const state of ['SUPPORTED','DISPUTED'])b=a.append(b,id,'review',data({ref,state,text:'fixture reason'}));const c=a.projection(b).get(id).claims.get(ref);assert.equal(c.status,'DISPUTED');assert.equal(c.reviews.length,2);});
test('reported stages distinct, receipt cannot precede commitment',()=>{let {b,id,source}=fixture();b=a.append(b,id,'offer',data({text:'fixture offer',ref:source,amountMinor:100000}));const ref=b.events.at(-1).id;assert.throws(()=>a.append(b,id,'offer-status',data({ref,state:'RECEIVED_REPORTED',text:'fixture'})));assert.equal(a.totals(a.projection(b).get(id)).CONDITIONAL,100000);b=a.append(b,id,'offer-status',data({ref,state:'COMMITTED_REPORTED',text:'fixture'}));b=a.append(b,id,'offer-status',data({ref,state:'RECEIVED_REPORTED',text:'fixture'}));assert.equal(a.totals(a.projection(b).get(id)).RECEIVED_REPORTED,100000);assert.equal(a.totals(a.projection(b).get(id)).CONDITIONAL,0);});
test('tasks and case closure retain history and can reopen',()=>{let {b,id}=fixture();b=a.append(b,id,'task',data({text:'check source',due:'2026-11-30'}));const ref=b.events.at(-1).id;b=a.append(b,id,'task-status',data({ref,state:'DONE',text:'checked'}));b=a.append(b,id,'case-status',data({state:'CLOSED',text:'fixture'}));assert.throws(()=>a.append(b,id,'task',data({text:'x',due:''})));b=a.append(b,id,'case-status',data({state:'OPEN',text:'reopen'}));assert.equal(a.projection(b).get(id).tasks.get(ref).status,'DONE');});
test('cross-case references and extra fields refused',()=>{let {b,id,source}=fixture();b=a.append(b,null,'case',data({title:'Other fixture'}));const id2=b.events.at(-1).id;assert.throws(()=>a.append(b,id2,'claim',data({text:'x',ref:source})));assert.throws(()=>a.append(b,id,'source',data({text:'x',ref:'y',extra:'z'})));});
test('encrypted roundtrip, wrong password, tamper and distinct salts',async()=>{const {b}=fixture(),p='fixture-passphrase-only-2026';const s=await a.seal(b,p),t=await a.seal(b,p);assert.notEqual(s.salt,t.salt);assert.ok(!JSON.stringify(s).includes('Fictional case'));assert.equal(JSON.stringify(await a.unseal(s,p)),JSON.stringify(b));await assert.rejects(a.unseal(s,'wrong-passphrase-only'));const bad=data(JSON.parse(JSON.stringify(s)));bad.ciphertext=(bad.ciphertext[0]==='0'?'1':'0')+bad.ciphertext.slice(1);await assert.rejects(a.unseal(bad,p));});
test('document contains no remote assets and no persistent plaintext browser store',()=>{assert.match(html,/connect-src 'none'/);assert.doesNotMatch(html,/localStorage|sessionStorage|indexedDB|<script[^>]+src=/);});
