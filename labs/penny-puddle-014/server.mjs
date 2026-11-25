import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||'8810');
if(!Number.isSafeInteger(port)||port<1||port>65535)throw new TypeError('Invalid local port');
const allowed=new Map([
 ['/',['index.html','text/html; charset=utf-8']],
 ['/ui.mjs',['ui.mjs','text/javascript; charset=utf-8']],
 ['/composer.mjs',['composer.mjs','text/javascript; charset=utf-8']],
 ['/planner.mjs',['planner.mjs','text/javascript; charset=utf-8']],
 ['/penny-puddle-010/relay.mjs',['../penny-puddle-010/relay.mjs','text/javascript; charset=utf-8']],
 ['/penny-puddle-012/question-value.mjs',['../penny-puddle-012/question-value.mjs','text/javascript; charset=utf-8']],
 ['/penny-puddle-009/satisfaction.mjs',['../penny-puddle-009/satisfaction.mjs','text/javascript; charset=utf-8']]
]);
createServer(async(req,res)=>{
 let route;try{route=allowed.get(new URL(req.url,'http://localhost').pathname);}
 catch{route=null;}
 if(req.method!=='GET'||!route){
  res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});
  res.end('Not found');return;
 }
 try{
  const bytes=await readFile(join(root,route[0]));
  res.writeHead(200,{
   'content-type':route[1],
   'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; img-src 'none'; base-uri 'none'; frame-ancestors 'none'",
   'referrer-policy':'no-referrer','x-content-type-options':'nosniff',
   'cache-control':'no-store'
  });res.end(bytes);
 }catch{
  res.writeHead(500,{'content-type':'text/plain; charset=utf-8'});
  res.end('Local experiment file unavailable');
 }
}).listen(port,'127.0.0.1',()=>{
 process.stdout.write('Jubilee CONCORD-014: http://127.0.0.1:'+port+'/\n');
});
