import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyConstruction} from './verify.mjs';
export async function verifyFiles(requestFile,kitDirectory){
 const spec=JSON.parse(await readFile(resolve(requestFile),'utf8'));
 const r=JSON.parse(await readFile(join(resolve(kitDirectory),
  'constructed-primitive-report.json'),'utf8'));
 return verifyConstruction(spec,r);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const a=process.argv.slice(2);
  if(a.length!==4||a[0]!=='--request'||a[2]!=='--kit')
   throw new Error('Usage: node verify-output.mjs --request /public.json --kit /new-local-dir');
  const report=await verifyFiles(a[1],a[3]);
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if(report.status!=='TESTED-COMPOSED-RLE-PRIMITIVE-PROPOSE-ONLY')process.exitCode=1;
 }catch(e){process.stderr.write('HOLD: '+String(e.message||e)+'\n');process.exitCode=1;}
}
