import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyPrimitiveLaboratory} from './verify.mjs';
export async function verifyFiles(requestPath,outputFolder){
 const request=JSON.parse(await readFile(resolve(requestPath),'utf8'));
 const result=JSON.parse(await readFile(join(resolve(outputFolder),
  'missing-primitive-report.json'),'utf8'));
 return verifyPrimitiveLaboratory(request,result);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const a=process.argv.slice(2);
  if(a.length!==4||a[0]!=='--request'||a[2]!=='--kit')
   throw new Error('Usage: node verify-output.mjs --request /public.json --kit /local-folder');
  const r=await verifyFiles(a[1],a[3]);
  process.stdout.write(JSON.stringify(r,null,2)+'\n');
  if(r.status!=='TESTED-NEW-TO-DSL-PRIMITIVE-PROPOSE-ONLY')process.exitCode=1;
 }catch(error){
  process.stderr.write('HOLD: '+String(error.message||error)+'\n');process.exitCode=1;
 }
}
