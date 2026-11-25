import {makeUnwrittenSpec} from './contract.mjs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 process.stdout.write(JSON.stringify(makeUnwrittenSpec(),null,2)+'\n');
