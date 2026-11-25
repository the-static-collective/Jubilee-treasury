import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {recomposeAfterLaboratory} from './laboratory.mjs';
export async function verifyFilePair(specPath,reportDir){
 const spec=JSON.parse(await readFile(resolve(specPath),'utf8'));
 const report=JSON.parse(await readFile(join(resolve(reportDir),'method-evidence.json'),'utf8'));
 const result=recomposeAfterLaboratory(spec,report);
 if(result.status!=='PROPOSE_TESTED_TECHNIQUE_ONLY')
  throw new Error(result.reason||'No independently passing candidate');
 return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const a=process.argv.slice(2);
  if(a.length!==4||a[0]!=='--request'||a[2]!=='--kit')
   throw new Error('Usage: node verify.mjs --request /path/spec.json --kit /path/output-folder');
  process.stdout.write(JSON.stringify(await verifyFilePair(a[1],a[3]),null,2)+'\n');
 }catch(e){process.stderr.write('HOLD: '+String(e.message||e)+'\n');process.exitCode=1;}
}