#!/usr/bin/env node
import {makeCapabilityExperiment} from './laboratory.mjs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 process.stdout.write(JSON.stringify(makeCapabilityExperiment(),null,2)+'\n');
