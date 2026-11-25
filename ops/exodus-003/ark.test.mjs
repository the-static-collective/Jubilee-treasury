import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {GATES} from '../exodus-002/returning-node.mjs';
import {init,load,append,prepareBridge} from './ark.mjs';
import {sealFixture,readFixture} from './vault.mjs';
import {render} from './one-door.mjs';
function sandbox(t){const dir=mkdtempSync(join(tmpdir(),'ark-test-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const root=join(dir,'node');init(root);return root;}
const seed=root=>{for(const e of [{kind:'need'},{kind:'offer',slot:1},{kind:'proposal'}])append(root,e);};
test('restart preserves exact record bytes and marked reconstruction',t=>{const r=sandbox(t);append(r,{kind:'need'},{origin:'RECONSTRUCTED_PAPER'});const file=join(r,'node','0001.json'),bytes=readFileSync(file);assert.equal(load(r).records[0].origin,'RECONSTRUCTED_PAPER');assert.throws(()=>append(r,{kind:'need'}));assert.deepEqual(readFileSync(file),bytes);assert.throws(()=>init(r));});
test('tamper and missing sequence stop replay',t=>{const r=sandbox(t);seed(r);const p=join(r,'node','0002.json'),original=readFileSync(p,'utf8');writeFileSync(p,original.replace('"slot":1','"slot":2'));assert.throws(()=>load(r),/integrity/);writeFileSync(p,original);rmSync(p);assert.throws(()=>load(r),/missing/);});
test('orphan pending record and concurrent writer fail visibly',t=>{const r=sandbox(t);mkdirSync(join(r,'writer.lock'));assert.throws(()=>append(r,{kind:'need'}));rmSync(join(r,'writer.lock'),{recursive:true});writeFileSync(join(r,'node','.pending-fixture'),'bad',{mode:0o600});assert.throws(()=>load(r),/unexpected/);});
test('private vault is separate, encrypted, exclusive, and loss leaves ledger intact',t=>{const r=sandbox(t),k=randomBytes(32);append(r,{kind:'need'});sealFixture(r,1,k);assert.equal(readFixture(r,1,k),'SYNTHETIC-IDENTITY-1');assert.throws(()=>readFixture(r,1,randomBytes(32)));assert.throws(()=>sealFixture(r,1,k));assert.ok(!readFileSync(join(r,'private','fixture-1.json'),'utf8').includes('SYNTHETIC-IDENTITY'));assert.ok(!JSON.stringify(load(r)).includes('SYNTHETIC-IDENTITY'));rmSync(join(r,'private'),{recursive:true});assert.equal(load(r).records.length,1);});
test('bridge needs separate explicit preparation, fixture admission and reconciliation',t=>{const r=sandbox(t);seed(r);const o={decision:'PREPARE_SYNTHETIC_RETURN'};assert.throws(()=>prepareBridge(r,o));for(const gate of GATES)append(r,{kind:'review',gate});append(r,{kind:'admission',decision:'ADMIT'});append(r,{kind:'movement',amountMinor:100000});assert.throws(()=>prepareBridge(r,o));append(r,{kind:'receipt',movementIndex:1});assert.throws(()=>prepareBridge(r));const b=prepareBridge(r,o);assert.equal(b.actualMovementMinor,0);assert.equal(b.status,'HOLD');assert.equal(b.publicationAllowed,false);assert.equal(b.fixture.simulatedReceiptMinor,100000);assert.ok(!('records' in b));});
test('paper kit and offline view contain no external assets or vault bytes',t=>{const r=sandbox(t);seed(r);sealFixture(r,1,randomBytes(32));const h=render(r);assert.match(h,/RECONSTRUCTED_PAPER/);assert.match(h,/Actual commitments and movements: \$0/);assert.doesNotMatch(h,/SYNTHETIC-IDENTITY|<script|https?:\/\//);});
