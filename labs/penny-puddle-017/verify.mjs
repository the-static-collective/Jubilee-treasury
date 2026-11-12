import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyUnwrittenLaboratory} from './evaluation.mjs';
export async function verifyLabFiles(specFile,folder){
 const spec=JSON.parse(await readFile(resolve(specFile),'utf8'));
 const report=JSON.parse(await readFile(join(resolve(folder),'generated-method-report.json'),'utf8'));
 return verifyUnwrittenLaboratory(spec,report);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const a=process.argv.slice(2);
  if(a.length!==4||a[0]!=='--request'||a[2]!=='--kit')
   throw new Error('Usage: node verify.mjs --request /path/spec.json --kit /path/new-local-output-dir');
  const result=await verifyLabFiles(a[1],a[3]);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if(result.status!=='TESTED-SYNTHESIZED-METHOD-PROPOSE-ONLY')process.exitCode=1;
 }catch(e){
  process.stderr.write('HOLD: '+String(e.message||e)+'\n');process.exitCode=1;
 }
}
