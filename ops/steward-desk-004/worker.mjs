import {handleStaticIdRequest,requireStaticIdOwner,SESSION_COOKIE} from './vendor/cloudflare.mjs';
import {identityConfig,decryptJson} from './vendor/oidc.mjs';
import {PAGE,SCRIPT} from './ui.mjs';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'"};
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{...headers,'Content-Type':'application/json'}});
const text=(x,type)=>new Response(x,{headers:{...headers,'Content-Type':type}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dispositions=new Set(['hold','contact_candidate','no_action']);
const bases=new Set(['Needs human verification','Potential follow-up for separate approval','No actionable information']);
async function body(request){const reader=request.body?.getReader();if(!reader)throw Error('body');let n=0;const chunks=[];while(true){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>2048){await reader.cancel();throw Error('size')}chunks.push(value)}const data=new Uint8Array(n);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length}return JSON.parse(new TextDecoder().decode(data));}
async function rpc(request,env,name,params,fetcher){
 const c=identityConfig(env);
 // Keep tokens on the server. Only the exact same-project RPC endpoints are permitted.
 if(!['jubilee_desk_read_v1','jubilee_desk_review_v1'].includes(name)||typeof env.JUBILEE_PUBLISHABLE_KEY!=='string'||!env.JUBILEE_PUBLISHABLE_KEY.startsWith('sb_publishable_'))throw Error('configuration');
 const cookie=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(SESSION_COOKIE+'='));
 const session=await decryptJson(cookie.slice(SESSION_COOKIE.length+1),c,'session');
 const url=new URL(c.issuer).origin+'/rest/v1/rpc/'+name;
 const r=await fetcher(url,{method:'POST',redirect:'manual',headers:{apikey:env.JUBILEE_PUBLISHABLE_KEY,Authorization:'Bearer '+session.accessToken,'Content-Type':'application/json'},body:JSON.stringify(params)});
 if(r.status===401||r.status===403)return json({error:'Jubilee grant required'},403);
 if(!r.ok)return json({error:'Review unavailable or stale'},409);
 return json(await r.json());
}
export async function handle(request,env,fetcher=fetch){
 const u=new URL(request.url);
 if(u.origin!==env.STATIC_ID_APP_ORIGIN)return json({error:'Unknown origin'},403);
 if(u.pathname.startsWith('/api/static-id/'))return handleStaticIdRequest(request,env,fetcher);
 if(request.method==='GET'&&u.pathname==='/')return text(PAGE,'text/html; charset=utf-8');
 if(request.method==='GET'&&u.pathname==='/desk.js')return text(SCRIPT,'application/javascript; charset=utf-8');
 if(!['/api/desk/read','/api/desk/review'].includes(u.pathname))return json({error:'Not found'},404);
 if(!await requireStaticIdOwner(request,env,fetcher))return json({error:'Sign in required'},403);
 try{
  if(u.pathname==='/api/desk/read'&&request.method==='GET')return await rpc(request,env,'jubilee_desk_read_v1',{},fetcher);
  if(u.pathname==='/api/desk/review'&&request.method==='POST'){
    if(request.headers.get('Origin')!==u.origin||!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Invalid origin or format'},403);
    let p;try{p=await body(request)}catch{return json({error:'Invalid request'},400)}
    if(!p||Object.keys(p).sort().join('|')!=='basis|disposition|id'||typeof p.id!=='string'||!uuid.test(p.id)||!dispositions.has(p.disposition)||!bases.has(p.basis))return json({error:'Invalid review'},400);
    return await rpc(request,env,'jubilee_desk_review_v1',{p_id:p.id,p_disposition:p.disposition,p_basis:p.basis},fetcher);
  }
  return json({error:'Method not allowed'},405);
 }catch{return json({error:'Desk unavailable'},503)}
}
// Workers pass an ExecutionContext as argument three, not a fetch implementation.
export default {fetch(request,env,ctx){return handle(request,env,fetch);}};
