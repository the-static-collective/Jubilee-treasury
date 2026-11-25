import test from 'node:test';import assert from 'node:assert/strict';
import {handle} from './worker.mjs';import {b64url,randomSecret,identityConfig,encryptJson} from './vendor/oidc.mjs';
const owner='17f57734-5420-4faf-ab5c-d2c7f95beac2',origin='https://steward.example.invalid',issuer='https://example.supabase.co/auth/v1';
const cfg=()=>({STATIC_ID_ISSUER:issuer,STATIC_ID_APP_ORIGIN:origin,STATIC_ID_CLIENT_ID:'jubilee-test-client',STATIC_ID_CLIENT_SECRET:'synthetic-confidential-secret',STATIC_ID_OWNER_SUB:owner,STATIC_ID_COOKIE_KEY:randomSecret(),JUBILEE_PUBLISHABLE_KEY:'sb_publishable_synthetic'});
const req=(p,opts)=>new Request(origin+p,opts);
async function fixture({sub=owner,client='jubilee-test-client',expired=false}={}){
 const env=cfg(),c=identityConfig(env);const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);const key=await crypto.subtle.exportKey('jwk',pair.publicKey);Object.assign(key,{kid:'test-key',alg:'ES256',use:'sig'});
 const enc=x=>b64url(new TextEncoder().encode(JSON.stringify(x))),now=Math.floor(Date.now()/1000),h=enc({typ:'JWT',alg:'ES256',kid:'test-key'}),b=enc({iss:issuer,aud:'authenticated',sub,client_id:client,exp:now+(expired?-20:600),iat:now-30});
 const sig=b64url(new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,new TextEncoder().encode(h+'.'+b))));const token=h+'.'+b+'.'+sig;
 const sealed=await encryptJson({accessToken:token,expires:Date.now()+120000},c,'session');const cookie='__Host-staticid-session='+sealed;
 const calls=[];let deny=false;const fetcher=async(url,options={})=>{calls.push({url,options});if(url.endsWith('/.well-known/jwks.json'))return Response.json({keys:[key]});if(url.includes('/rest/v1/rpc/'))return deny?Response.json({}, {status:403}):Response.json({queue:[],pending_count:0,routes:[],questions:[],totals:[],reviewed:true});throw Error('unexpected target')};
 return {env,cookie,token,calls,fetcher,deny:()=>{deny=true}};
}
test('public shell contains no private data; no-store and CSP',async()=>{const r=await handle(req('/'),cfg());assert.equal(r.status,200);assert.match(await r.text(),/Steward Desk/);assert.match(r.headers.get('Cache-Control'),/no-store/);assert.match(r.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);});
test('anonymous read and mutation fail without upstream access',async()=>{const env=cfg();let calls=0;const f=async()=>{calls++;throw Error('unexpected')};assert.equal((await handle(req('/api/desk/read'),env,f)).status,403);assert.equal((await handle(req('/api/desk/review',{method:'POST'}),env,f)).status,403);assert.equal(calls,0);});
test('valid app-bound owner session uses only scoped RPC, no service key',async()=>{const f=await fixture();const r=await handle(req('/api/desk/read',{headers:{Cookie:f.cookie}}),f.env,f.fetcher);assert.equal(r.status,200);const rpc=f.calls.find(c=>c.url.includes('/rpc/'));assert.equal(rpc.url,'https://example.supabase.co/rest/v1/rpc/jubilee_desk_read_v1');assert.equal(rpc.options.headers.Authorization,'Bearer '+f.token);assert.equal(rpc.options.headers.apikey,'sb_publishable_synthetic');assert.equal(rpc.options.redirect,'manual');assert.equal(await r.text().then(x=>x.includes(f.token)),false);});
test('wrong owner, wrong OAuth client and expired JWT blocked',async()=>{for(const x of [{sub:'0bdcd8ce-13f3-4417-8a5b-324ad69148c3'},{client:'other-app'},{expired:true}]){const f=await fixture(x);assert.equal((await handle(req('/api/desk/read',{headers:{Cookie:f.cookie}}),f.env,f.fetcher)).status,403);assert.ok(f.calls.every(c=>!c.url.includes('/rpc/')));}});
test('Jubilee database denial overrides successful login',async()=>{const f=await fixture();f.deny();assert.equal((await handle(req('/api/desk/read',{headers:{Cookie:f.cookie}}),f.env,f.fetcher)).status,403);});
test('foreign origin and CSRF mutation denied',async()=>{const f=await fixture();assert.equal((await handle(new Request('https://other.example.invalid/api/desk/read'),f.env,f.fetcher)).status,403);assert.equal((await handle(req('/api/desk/review',{method:'POST',headers:{Cookie:f.cookie,Origin:'https://other.example.invalid','Content-Type':'application/json'},body:'{}'}),f.env,f.fetcher)).status,403);assert.ok(f.calls.every(c=>!c.url.includes('/rpc/')));});
test('review accepts only fixed action and basis; rejects extraneous data',async()=>{const f=await fixture();const base={id:owner,disposition:'hold',basis:'Needs human verification'},opts=p=>({method:'POST',headers:{Cookie:f.cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(p)});for(const p of [{...base,disposition:'pay'},{...base,basis:'arbitrary note'},{...base,email:'synthetic@example.invalid'}])assert.equal((await handle(req('/api/desk/review',opts(p)),f.env,f.fetcher)).status,400);assert.equal((await handle(req('/api/desk/review',opts(base)),f.env,f.fetcher)).status,200);assert.deepEqual(JSON.parse(f.calls.find(c=>c.url.endsWith('jubilee_desk_review_v1')).options.body),{p_id:owner,p_disposition:'hold',p_basis:'Needs human verification'});});
test('unknown routes have no generic proxy',async()=>{const f=await fixture();assert.equal((await handle(req('/api/desk/arbitrary',{headers:{Cookie:f.cookie}}),f.env,f.fetcher)).status,404);assert.equal(f.calls.length,0);});

import {reviewLens} from './exodus-lens.mjs';
import {PAGE,SCRIPT} from './ui.mjs';
const route=(path,missing_gates,disposition='HOLD')=>({path,missing_gates,disposition,execution_allowed:false});
const question=(gate,paths_unlocked_by_answer)=>({gate,question:'Fixture question for '+gate,paths_unlocked_by_answer});
test('EXODUS projects shared gates and preserves source question ordering without permission',()=>{const r=reviewLens([route('a',['counsel','document','document']),route('b',['document']),route('c',[],'REVIEW_READY')],[question('counsel',1),question('document',2)]);assert.equal(r.available,true);assert.deepEqual(r.shared,[{gate:'document',affectedRoutes:2}]);assert.equal(r.next[0].question,'Fixture question for counsel');assert.equal(r.readyCount,1);assert.equal(r.status,'HOLD');assert.equal(r.executionAllowed,false);assert.equal(r.authority,'none');});
test('EXODUS rejects unexpected execution permission or malformed source',()=>{for(const r of [reviewLens([{...route('a',[]),execution_allowed:true}],[]),reviewLens([route('a',[]),route('a',[])],[]),reviewLens([route('a',[])],[question('counsel',2)]),reviewLens(null,[])]){assert.equal(r.available,false);assert.equal(r.executionAllowed,false);assert.deepEqual(r.shared,[]);}});
test('EXODUS no source results never infer safety',()=>{const r=reviewLens([],[]);assert.equal(r.status,'HOLD');assert.deepEqual(r.shared,[]);assert.equal(r.authority,'none');});
test('EXODUS client script parses and lens is within authenticated hidden desk',()=>{assert.doesNotThrow(()=>new Function(SCRIPT));assert.match(PAGE,/<div id="desk" hidden>/);assert.match(PAGE,/id="exodus"/);assert.match(SCRIPT,/const lens=reviewLens\(d.routes,d.questions\)/);assert.match(SCRIPT,/\x27questions\x27,\x27exodus\x27,\x27totals\x27/);assert.doesNotMatch(SCRIPT,/https?:\/\//);});

import {PAGE as CASE_PAGE,SCRIPT as CASE_SCRIPT,BRIDGE as CASE_BRIDGE} from './casework-assets.mjs';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
test('casework shell and scripts require owner and fresh Jubilee grant',async()=>{
 for(const p of ['/casework','/casework.js','/casework-bridge.js']){
  const f=await fixture();assert.equal((await handle(req(p),f.env,f.fetcher)).status,403);
  const r=await handle(req(p,{headers:{Cookie:f.cookie}}),f.env,f.fetcher);assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/no-store/);
  f.deny();assert.equal((await handle(req(p,{headers:{Cookie:f.cookie}}),f.env,f.fetcher)).status,403);
 }
 const f=await fixture({sub:'0bdcd8ce-13f3-4417-8a5b-324ad69148c3'});assert.equal((await handle(req('/casework',{headers:{Cookie:f.cookie}}),f.env,f.fetcher)).status,403);
});
test('hosted assets preserve exact offline core and app; scripts parse and CSP remains external',()=>{
 const h=readFileSync(new URL('../exodus-004/casework.html',import.meta.url),'utf8');
 const scripts=[...h.matchAll(/<script(?: id="core")?>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
 assert.equal(CASE_SCRIPT,scripts.join('\n'));assert.doesNotThrow(()=>new Function(CASE_SCRIPT));assert.doesNotThrow(()=>new Function(CASE_BRIDGE));
 assert.match(CASE_PAGE,/<script src="\/casework.js"><\/script>/);assert.match(CASE_PAGE,/<script src="\/casework-bridge.js"><\/script>/);assert.doesNotMatch(CASE_PAGE,/<script(?: id="core")?>/);
});
test('explicit metadata review imports source and open task only; duplicates refused',()=>{
 const core=CASE_SCRIPT.split('const $=')[0];
 const bridge=CASE_BRIDGE.split('\n(function(){')[0];
 const x=runInNewContext(core+'\n'+bridge+'\n({C:Casework,mailCandidates,deskCandidates,addCandidate,parse:s=>JSON.parse(s)})',{crypto,TextEncoder,TextDecoder});
 const data=v=>x.parse(JSON.stringify(v));let b=x.C.append(x.C.blank(),null,'case',data({title:'Fixture'}));const id=b.events[0].id;
 const packet=data({schema:'jubilee.correspondence-candidates/v1',items:[{ref:'gmail:123456789abcdef0',category:'reply'}]});
 const [c]=x.mailCandidates(packet);assert.equal(c.authority,'none');b=x.addCandidate(x.C,b,id,c);const view=x.C.projection(b).get(id);assert.equal(view.sources.size,1);assert.equal(view.tasks.size,1);assert.equal(view.offers.size,0);assert.equal(view.claims.size,0);
 assert.throws(()=>x.addCandidate(x.C,b,id,c),/already/);assert.throws(()=>x.mailCandidates(data({schema:packet.schema,items:[{ref:'gmail:123456789abcdef0',category:'reply',body:'private'}]})));
 const d=x.deskCandidates(data({queue:[],questions:[{gate:'document',question:'Review document'}]}));assert.equal(d[0].status,'REVIEW_ONLY');assert.equal(d[0].ref,'concord-gate:document');
});

import {commonApi,commonIdentity} from './common-auth.mjs';
import {PAGE as COMMON_PAGE,SCRIPT as COMMON_SCRIPT,SYNC as COMMON_SYNC} from './common-assets.mjs';
test('PENTECOST is held by default; inert login shell only on opt-in',async()=>{
 const env=cfg();assert.equal((await handle(req('/common-table'),env)).status,503);
 env.JUBILEE_COMMON_ENABLED='true';const page=await handle(req('/common-table'),env);assert.equal(page.status,200);assert.match(await page.text(),/PENTECOST/);
 assert.equal((await handle(req('/api/common/list',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'}),env)).status,403);
 assert.equal((await handle(req('/api/common/anything',{method:'POST'}),env)).status,404);
});
async function commonFixture(opts={}){
 const f=await fixture(opts);f.env.JUBILEE_COMMON_ENABLED='true';
 const seal=await encryptJson({accessToken:f.token,expires:Date.now()+120000},identityConfig(f.env),'common-session');f.commonCookie='__Host-common-session='+seal;return f;
}
const commonReq=(f,p,data,originValue=origin)=>req('/api/common/'+p,{method:'POST',headers:{Origin:originValue,Cookie:f.commonCookie,'Content-Type':'application/json'},body:JSON.stringify(data)});
test('separate member session never authorizes private owner desk; RPC denial still decisive',async()=>{
 const f=await commonFixture({sub:'0bdcd8ce-13f3-4417-8a5b-324ad69148c3'});
 assert.equal((await handle(commonReq(f,'list',{}),f.env,f.fetcher)).status,200);
 assert.ok(f.calls.some(x=>x.url.endsWith('jubilee_common_list_v1')));
 assert.equal((await handle(req('/api/desk/read',{headers:{Cookie:f.commonCookie}}),f.env,f.fetcher)).status,403);
 assert.equal((await handle(req('/casework',{headers:{Cookie:f.commonCookie}}),f.env,f.fetcher)).status,403);
 f.deny();assert.equal((await handle(commonReq(f,'list',{}),f.env,f.fetcher)).status,403);
});
test('common API rejects wrong client, owner cookie, CSRF, extra fields and raw plaintext',async()=>{
 const f=await commonFixture();
 assert.equal((await handle(commonReq(f,'list',{},'https://foreign.invalid'),f.env,f.fetcher)).status,403);
 assert.equal((await handle(req('/api/common/list',{method:'POST',headers:{Origin:origin,Cookie:f.cookie,'Content-Type':'application/json'},body:'{}'}),f.env,f.fetcher)).status,403);
 const c='a'.repeat(32);
 assert.equal((await handle(commonReq(f,'create',{p_case:c,p_envelope:{plaintext:'private'}}),f.env,f.fetcher)).status,400);
 assert.equal((await handle(commonReq(f,'read',{p_case:c,role:'owner'}),f.env,f.fetcher)).status,400);
 const wrong=await commonFixture({client:'other-app'});assert.equal((await handle(commonReq(wrong,'list',{}),wrong.env,wrong.fetcher)).status,403);
 assert.ok(f.calls.every(x=>!x.url.includes('/rpc/')));
});
test('common identity uses distinct flow cookie and preserves owner callback fallback',async()=>{
 const env={...cfg(),JUBILEE_COMMON_ENABLED:'true'};
 const r=await commonIdentity(req('/api/common-id/login'),env);
 assert.equal(r.status,303);assert.match(r.headers.get('Set-Cookie'),/__Host-common-flow=/);assert.match(r.headers.get('Location'),/redirect_uri=/);
 assert.equal(await commonIdentity(req('/api/static-id/callback?state=unrelated'),env),null);
});
const vm=()=>runInNewContext(COMMON_SCRIPT.split('const $=')[0]+'\n'+COMMON_SYNC.split('\n(function(){')[0]+'\n({C:Casework,S:Common,parse:s=>JSON.parse(s)})',{crypto,TextEncoder,TextDecoder});
test('shared crypto roundtrip binds case, revision and epoch; rejects key and ciphertext substitution',async()=>{
 const {C,S,parse}=vm();const d=x=>parse(JSON.stringify(x));const b=C.append(C.blank(),null,'case',d({title:'Fixture only'})),c=b.events[0].id,k=S.generate();
 const e=await S.seal(C,b,k,c,1,1);assert.ok(!JSON.stringify(e).includes('Fixture only'));assert.equal(JSON.stringify(await S.unseal(C,e,k,c,1,1)),JSON.stringify(b));
 await assert.rejects(S.unseal(C,e,S.generate(),c,1,1));await assert.rejects(S.unseal(C,e,k,c,2,1));await assert.rejects(S.unseal(C,e,k,c,1,2));
 const tamper=d({...e,ciphertext:(e.ciphertext[0]==='0'?'1':'0')+e.ciphertext.slice(1)});await assert.rejects(S.unseal(C,tamper,k,c,1,1));
});
test('only independent additive edits rebase; competing decisions and unrelated cases stay held',()=>{
 const {C,S,parse}=vm();const d=x=>parse(JSON.stringify(x));let base=C.append(C.blank(),null,'case',d({title:'Fixture'})),c=base.events[0].id;
 const l=C.append(base,c,'task',d({text:'Local task',due:''})),r=C.append(base,c,'task',d({text:'Remote task',due:'2026-11-30'}));
 const b=S.rebase(C,base,l,r,c);assert.equal(b.events.length,3);assert.equal(S.brief(C,b,c,1).changes,2);assert.equal(S.brief(C,b,c,1).next[0].text,'Remote task');
 const decision=C.append(base,c,'case-status',d({state:'HOLD',text:'review'}));assert.throws(()=>S.rebase(C,base,l,decision,c),/manual review/);
 const other=C.append(base,null,'case',d({title:'Unrelated'}));assert.throws(()=>S.single(C,other,c));
});
test('shared UI reuses canonical casework and excludes owner intake bridge',()=>{
 assert.equal(COMMON_SCRIPT,CASE_SCRIPT);assert.doesNotThrow(()=>new Function(COMMON_SYNC));assert.match(COMMON_PAGE,/common-table.js/);assert.doesNotMatch(COMMON_PAGE,/id="shepherd"|casework-bridge.js/);assert.doesNotMatch(COMMON_SYNC,/localStorage|sessionStorage|indexedDB/);
});
