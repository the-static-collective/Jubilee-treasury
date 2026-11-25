import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||'8805');
if(!Number.isSafeInteger(port)||port<1||port>65535)throw new Error('Invalid PORT');
const paths=new Map([
 ['/', ['index.html','text/html; charset=utf-8']],
 ['/ui.mjs',['ui.mjs','text/javascript; charset=utf-8']],
 ['/anchor.mjs',['anchor.mjs','text/javascript; charset=utf-8']],
 ['/mosaic.mjs',['mosaic.mjs','text/javascript; charset=utf-8']],
 ['/satisfaction.mjs',['satisfaction.mjs','text/javascript; charset=utf-8']]
]);
createServer(async(req,res)=>{
 const route=paths.get(new URL(req.url,'http://localhost').pathname);
 if(req.method!=='GET'||!route){
  res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('Not found');return;
 }
 try{
  const bytes=await readFile(join(root,route[0]));
  res.writeHead(200,{
   'content-type':route[1], 'cache-control':'no-store',
   'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; img-src 'none'; base-uri 'none'; frame-ancestors 'none'",
   'referrer-policy':'no-referrer','x-content-type-options':'nosniff'
  });res.end(bytes);
 }catch{
  res.writeHead(500,{'content-type':'text/plain; charset=utf-8'});res.end('Lab file unavailable');
 }
}).listen(port,'127.0.0.1',()=>process.stdout.write('Jubilee ANCHOR-009: http://127.0.0.1:'+port+'/\n'));
