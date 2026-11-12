#!/usr/bin/env node
/**
 * Verify local GRAFT bytes in the receiving Jubilee project, without
 * treating the proof as title, a commitment, public deployment or real aid.
 */
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyGraftLocalProof,composeWithGraftProof} from './capability.mjs';
export async function verifyLocalKit(requestPath,kitPath){
 const req=JSON.parse(await readFile(resolve(requestPath),'utf8'));
 const receipt=JSON.parse(await readFile(join(resolve(kitPath),'capability-receipt.json'),'utf8'));
 const html=await readFile(join(resolve(kitPath),'offline-story-card.html'),'utf8');
 const v=verifyGraftLocalProof(req,{receipt,html});
 if(!v.canProposeTechnique)throw new Error('HOLD: '+v.reason);
 return composeWithGraftProof(req,{receipt,html});
}
const executed=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(executed){
 try{
  const a=process.argv.slice(2);
  if(a.length!==4||a[0]!=='--request'||a[2]!=='--kit')
   throw new Error('Usage: node verify-output.mjs --request /path/request.json --kit /path/graft-kit');
  const result=await verifyLocalKit(a[1],a[3]);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
 }catch(e){
  process.stderr.write('HOLD: '+String(e.message||e)+'\n');
  process.exitCode=1;
 }
}
