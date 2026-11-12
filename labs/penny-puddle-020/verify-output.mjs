import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyArchitecture} from './verify.mjs';
export async function inspectFrozen(requestFile,kitDirectory){
 const source=JSON.parse(await readFile(resolve(requestFile),'utf8'));
 const report=JSON.parse(await readFile(join(resolve(kitDirectory),'structure-report.json'),'utf8'));
 return verifyArchitecture(source,report);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const a=process.argv.slice(2);
  if(a.length!==4||a[0]!=='--request'||a[2]!=='--kit')
   throw new Error('Usage: node verify-output.mjs --request /public.json --kit /local-folder');
  const result=await inspectFrozen(a[1],a[3]);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if(result.status!=='TESTED-NEW-TO-LIBRARY-MEMORY-ARCHITECTURE-PROPOSE-ONLY')process.exitCode=1;
 }catch(e){process.stderr.write('HOLD: '+String(e.message||e)+'\n');process.exitCode=1;}
}
