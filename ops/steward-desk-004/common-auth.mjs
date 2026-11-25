import {identityConfig,beginAuthorization,tokenExchange,verifyJwt,encryptJson,decryptJson,sameString} from './vendor/oidc.mjs';
const FLOW='__Host-common-flow', SESSION='__Host-common-session';
const cookie=(r,n)=>(r.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(n+'='))?.slice(n.length+1)||'';
const set=(n,v,age)=>n+'='+v+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+age;
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Type':'application/json; charset=utf-8'};
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers});
const redirect=(url)=>new Response(null,{status:303,headers:{...headers,Location:url}});
const names=new Set(['list','read','create','write','grant','revoke']);
export async function commonRpc(env,token,op,params,fetcher=fetch){
 if(!names.has(op)||typeof env.JUBILEE_PUBLISHABLE_KEY!=='string'||!env.JUBILEE_PUBLISHABLE_KEY.startsWith('sb_publishable_'))throw Error('configuration');
 const c=identityConfig(env);
 const r=await fetcher(new URL(c.issuer).origin+'/rest/v1/rpc/jubilee_common_'+op+'_v1',{method:'POST',redirect:'manual',headers:{apikey:env.JUBILEE_PUBLISHABLE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(params)});
 if(r.status===401||r.status===403)return json({error:'Case membership required'},403);
 if(!r.ok)return json({error:'Request refused or revision conflict. Preserve draft and refresh.'},409);
 return json(await r.json());
}
export async function commonSession(r,env,fetcher=fetch){
 try{
  const c=identityConfig(env);if(new URL(r.url).origin!==c.origin)return null;
  const s=await decryptJson(cookie(r,SESSION),c,'common-session');
  if(!s||!Number.isFinite(s.expires)||s.expires<=Date.now()||typeof s.accessToken!=='string')return null;
  const claims=await verifyJwt(s.accessToken,{issuer:c.issuer,audience:'authenticated',expectedClientId:c.clientId,fetcher});
  if(claims.is_anonymous===true||claims.exp*1000<s.expires)return null;
  return {token:s.accessToken,sub:claims.sub};
 }catch{return null;}
}
export async function commonIdentity(r,env,fetcher=fetch){
 const u=new URL(r.url),p=u.pathname;
 if(!p.startsWith('/api/common-id/')&&p!=='/api/static-id/callback')return null;
 if(env.JUBILEE_COMMON_ENABLED!=='true')return p.startsWith('/api/common-id/')?json({error:'Common Table held'},503):null;
 try{
  const c=identityConfig(env);if(u.origin!==c.origin)return json({error:'Origin refused'},403);
  if(p==='/api/common-id/login'&&r.method==='GET'){
   const f=await beginAuthorization(c),seal=await encryptJson({state:f.state,nonce:f.nonce,verifier:f.verifier,expires:Date.now()+600000},c,'common-flow');
   const out=redirect(f.url);out.headers.append('Set-Cookie',set(FLOW,seal,600));return out;
  }
  if(p==='/api/static-id/callback'){
   // Same registered callback, distinct sealed flow and exact state. Never consume an owner flow here.
   let flow;try{flow=await decryptJson(cookie(r,FLOW),c,'common-flow')}catch{return null}
   if(!flow||!sameString(flow.state,u.searchParams.get('state')))return null;
   if(r.method!=='GET'||!Number.isFinite(flow.expires)||flow.expires<=Date.now())return json({error:'Flow expired'},401);
   const t=await tokenExchange(c,u.searchParams.get('code')||'',flow.verifier,fetcher);
   const id=await verifyJwt(t.id_token,{issuer:c.issuer,audience:c.clientId,nonce:flow.nonce,fetcher});
   const access=await verifyJwt(t.access_token,{issuer:c.issuer,audience:'authenticated',expectedClientId:c.clientId,fetcher});
   if(id.email_verified!==true||access.is_anonymous===true||!sameString(id.sub,access.sub))throw Error('identity');
   const grant=await commonRpc(env,t.access_token,'list',{},fetcher);
   if(!grant.ok)return json({error:'Common Table membership required'},403);
   const age=Math.min(3600,Math.floor(access.exp-Date.now()/1000));if(age<1)throw Error('expired');
   const seal=await encryptJson({accessToken:t.access_token,expires:Date.now()+age*1000},c,'common-session');
   const out=redirect(c.origin+'/common-table');out.headers.append('Set-Cookie',set(FLOW,'',0));out.headers.append('Set-Cookie',set(SESSION,seal,age));return out;
  }
  if(p==='/api/common-id/logout'&&r.method==='POST'){
   if(r.headers.get('Origin')!==c.origin)return json({error:'Origin refused'},403);
   const out=json({ok:true});out.headers.append('Set-Cookie',set(SESSION,'',0));out.headers.append('Set-Cookie',set(FLOW,'',0));return out;
  }
  if(p==='/api/common-id/status'&&r.method==='GET'){
   const s=await commonSession(r,env,fetcher);
   if(!s)return json({authenticated:false});
   const g=await commonRpc(env,s.token,'list',{},fetcher);return json({authenticated:g.ok});
  }
  return json({error:'Not found'},404);
 }catch{return json({error:'Common Table authentication unavailable'},401)}
}
const exact=(o,ks)=>o&&Object.getPrototypeOf(o)===Object.prototype&&Object.keys(o).sort().join('|')===[...ks].sort().join('|');
const id=x=>typeof x==='string'&&/^[a-f0-9]{32}$/.test(x);
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
const n=x=>Number.isInteger(x)&&x>=1&&x<=100;
const envelope=(e,c,rev)=>exact(e,['schema','caseId','revision','epoch','salt','iv','ciphertext'])&&e.schema==='jubilee.common.encrypted/v1'&&e.caseId===c&&e.revision===rev&&n(e.epoch)&&typeof e.salt==='string'&&/^[a-f0-9]{32}$/.test(e.salt)&&typeof e.iv==='string'&&/^[a-f0-9]{24}$/.test(e.iv)&&typeof e.ciphertext==='string'&&e.ciphertext.length>=32&&e.ciphertext.length<=262144&&e.ciphertext.length%2===0&&/^[a-f0-9]+$/.test(e.ciphertext);
async function parse(r){const reader=r.body?.getReader();if(!reader)throw Error('body');let n=0;const parts=[];while(true){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>270000){await reader.cancel();throw Error('size')}parts.push(value)}const bytes=new Uint8Array(n);let i=0;for(const p of parts){bytes.set(p,i);i+=p.length}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
export async function commonApi(r,env,fetcher=fetch){
 const u=new URL(r.url),op=u.pathname.slice('/api/common/'.length);
 if(env.JUBILEE_COMMON_ENABLED!=='true')return json({error:'Common Table held'},503);
 if(!names.has(op))return json({error:'Not found'},404);
 if(u.origin!==env.STATIC_ID_APP_ORIGIN)return json({error:'Origin refused'},403);
 if(r.method!=='POST')return json({error:'Method not allowed'},405);
 if(r.headers.get('Origin')!==u.origin||!r.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Origin or format refused'},403);
 const s=await commonSession(r,env,fetcher);if(!s)return json({error:'Sign in required'},403);
 let p;try{p=await parse(r)}catch{return json({error:'Invalid request'},400)}
 let ok=false;
 if(op==='list')ok=exact(p,[]);
 if(op==='read')ok=exact(p,['p_case'])&&id(p.p_case);
 if(op==='create')ok=exact(p,['p_case','p_envelope'])&&id(p.p_case)&&envelope(p.p_envelope,p.p_case,1)&&p.p_envelope.epoch===1;
 if(op==='write')ok=exact(p,['p_case','p_expected','p_rotate','p_envelope'])&&id(p.p_case)&&n(p.p_expected)&&p.p_expected<100&&typeof p.p_rotate==='boolean'&&envelope(p.p_envelope,p.p_case,p.p_expected+1);
 if(op==='grant')ok=exact(p,['p_case','p_subject','p_role','p_days'])&&id(p.p_case)&&uuid(p.p_subject)&&['editor','reader'].includes(p.p_role)&&Number.isInteger(p.p_days)&&p.p_days>=1&&p.p_days<=30;
 if(op==='revoke')ok=exact(p,['p_case','p_subject'])&&id(p.p_case)&&uuid(p.p_subject);
 if(!ok)return json({error:'Invalid request'},400);
 try{return await commonRpc(env,s.token,op,p,fetcher)}catch{return json({error:'Common Table unavailable'},503)}
}
