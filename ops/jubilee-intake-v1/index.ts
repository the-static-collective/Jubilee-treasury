const origin="https://jubilee.abundent.org";
const headers={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"content-type","Cache-Control":"no-store","Content-Type":"application/json","Vary":"Origin"};
const response=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
const lanes=["individual","church","partner","expert","introduction","update","signal"];
Deno.serve(async(req)=>{
 if(req.headers.get("origin")!==origin)return response(403,{error:"origin"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return response(405,{error:"method"});
 if(!req.headers.get("content-type")?.startsWith("application/json"))return response(415,{error:"format"});
 try{
 const reader=req.body?.getReader(); if(!reader)return response(400,{error:"body"});
 let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();return response(413,{error:"size"});}chunks.push(value);}
 const raw=new Uint8Array(size);let offset=0;for(const c of chunks){raw.set(c,offset);offset+=c.length;}
 const d=JSON.parse(new TextDecoder().decode(raw));
 if(!d||typeof d!=="object"||Array.isArray(d)||d.consent!==true||d.trap||!lanes.includes(d.lane)||typeof d.id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.id))return response(400,{error:"invalid"});
 const val=(k:string,n:number)=>{const v=d[k]??"";if(typeof v!=="string"||v.length>n)throw Error("invalid");return v.trim();};
 const signal=d.lane==="signal";const amount=signal?null:(d.amount===null||d.amount===undefined||d.amount===""?null:Number(d.amount));
 const currency=amount===null?null:val("currency",5);
 if(amount!==null&&(!["individual","church"].includes(d.lane)||!Number.isFinite(amount)||amount<=0||amount>1000000||!["USD","EUR","GBP","CAD","AUD","PKR","NOK","OTHER"].includes(currency!)))return response(400,{error:"amount"});
 const sig=signal?val("signal",20):null;
 if(signal&&!["deadline","pressure","discrepancy","safety","other"].includes(sig!))return response(400,{error:"signal"});
 const contact=signal?"":val("contact",254);
 if(d.lane==="update"&&!contact)return response(400,{error:"contact"});
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 const url=Deno.env.get("SUPABASE_URL");
 if(!key||!url)return response(503,{error:"unavailable"});
 const r=await fetch(url+"/rest/v1/rpc/jubilee_submit_v1",{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({p_id:d.id,p_lane:d.lane,p_country:signal?"":val("country",80),p_contact:contact,p_organization:signal?"":val("organization",100),p_amount:amount,p_currency:currency,p_note:signal?"":val("note",1200),p_signal:sig})});
 if(!r.ok)return response(503,{error:"unavailable"});const result=await r.json();
 if(result==="limited")return response(429,{error:"busy"});
 if(result!=="accepted"&&result!=="duplicate")return response(503,{error:"unavailable"});
 return response(200,{accepted:true,receipt:d.id});
 }catch{return response(400,{error:"invalid"});}
});