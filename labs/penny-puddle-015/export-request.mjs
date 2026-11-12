#!/usr/bin/env node
/** Export only the deliberately public, fictitious request. Zero side effects. */
import {makeGraftRequest} from './capability.mjs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const executed=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(executed)process.stdout.write(JSON.stringify(makeGraftRequest(),null,2)+'\n');
