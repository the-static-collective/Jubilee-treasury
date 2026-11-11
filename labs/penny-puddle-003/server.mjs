import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT || '8799');
if(!Number.isSafeInteger(port) || port<1 || port>65535) throw new Error('Bad PORT');
const routes=new Map([
  ['/', ['index.html','text/html; charset=utf-8']],
  ['/ui.mjs',['ui.mjs','text/javascript; charset=utf-8']],
  ['/weave.mjs',['weave.mjs','text/javascript; charset=utf-8']],
  ['/penny-bank.mjs',['penny-bank.mjs','text/javascript; charset=utf-8']],
  ['/batch-net.mjs',['batch-net.mjs','text/javascript; charset=utf-8']],
  ['/demo.mjs',['demo.mjs','text/javascript; charset=utf-8']],
  ['/puddle-001/penny-campaign.mjs',['../puddle-001/penny-campaign.mjs','text/javascript; charset=utf-8']],
]);
createServer(async(request,response)=>{
  const route=routes.get(new URL(request.url,'http://localhost').pathname);
  if(request.method!=='GET'||!route) {
    response.writeHead(404,{'content-type':'text/plain; charset=utf-8'});
    response.end('Not found');return;
  }
  try{
    const buffer=await readFile(join(root,route[0]));
    response.writeHead(200,{
      'content-type':route[1],
      'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
      'cache-control':'no-store',
      'x-content-type-options':'nosniff',
      'referrer-policy':'no-referrer'
    });
    response.end(buffer);
  }catch{
    response.writeHead(500,{'content-type':'text/plain; charset=utf-8'});
    response.end('Could not serve lab file');
  }
}).listen(port,'127.0.0.1',()=>process.stdout.write('PENNY × PUDDLE mock laboratory: http://127.0.0.1:'+port+'/\n'));
