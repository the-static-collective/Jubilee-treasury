import {readFileSync} from 'node:fs';import {compose} from './adapter.mjs';
try{const path=process.argv[2];if(!path)throw Error('Provide a private snapshot JSON file');const b=readFileSync(path);if(b.length>8192)throw Error('Snapshot too large');process.stdout.write(JSON.stringify(compose(JSON.parse(b)),null,2)+'\n');}catch(e){console.error('HOLD: '+e.message);process.exitCode=1;}
