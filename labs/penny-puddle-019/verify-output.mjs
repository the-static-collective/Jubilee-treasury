import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyGateLaboratory} from './verify.mjs';
export async function verifyLocalReport(specPath,outputFolder){
 const spec=JSON.parse(await readFile(resolve(specPath),'utf8'));
 const report=JSON.parse(await readFile(join(resolve(outputFolder),
  'gate-research-report.json'),'utf8'));
 return verifyGateLaboratory(spec,report);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2);
  if(args.length!==4||args[0]!=='--request'||args[2]!=='--kit')
   throw new Error('Usage: node verify-output.mjs --request /path/spec.json --kit /local-output-dir');
  const v=await verifyLocalReport(args[1],args[3]);
  process.stdout.write(JSON.stringify(v,null,2)+'\n');
  if(v.status!=='TESTED-NAND-ONLY-DERIVED-MACRO-PROPOSE-ONLY')
   process.exitCode=1;
 }catch(e){
  process.stderr.write('HOLD: '+String(e.message||e)+'\n');
  process.exitCode=1;
 }
}
