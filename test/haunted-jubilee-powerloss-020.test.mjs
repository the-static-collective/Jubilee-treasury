import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { submit, inspect, dispatch, observe, validatePacket, makeSimulatedPacket } from '../src/haunted-jubilee-powerloss-020.mjs';

const dir = () => mkdtemp(path.join(os.tmpdir(),'penny-020-'));
const card = 'Offer: I can repair a bicycle.\nLegacy: future receiver may decline the quest.';
const hash = x => createHash('sha256').update(x).digest('hex');
const stable = x => Array.isArray(x) ? '['+x.map(stable).join(',')+']' :
  x && typeof x==='object' ? '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}' : JSON.stringify(x);
const sealed = x => ({body:x,sha256:hash(stable(x))});
const key = () => validatePacket(makeSimulatedPacket()).key;
const asset = (root,kind,k,ext='json') => path.join(root,kind,k+'.'+ext);

test('claim, fsynced source-addressed postcard and clean inspect across restart',async()=>{
  const root=await dir();
  const first=await submit(root,makeSimulatedPacket(),card);
  assert.equal(first.status,'PREPARED_FILE_NOT_PRINTED');
  assert.equal(first.coinBacking,0);
  assert.equal(first.issuedPennyUnits,0);
  assert.equal(first.printedPhysically,false);
  assert.equal(first.automaticRetry,false);
  const actual=await readFile(asset(root,'spool',first.key,'txt'),'utf8');
  assert.match(actual,/CRANK ID : /);
  assert.match(actual,/I can repair a bicycle/);
  assert.match(actual,/PRINT FILE IS NOT PROOF OF PRINTED PAPER/);
  assert.equal((await inspect(root,first.key)).status,'PREPARED_FILE_NOT_PRINTED');
  await assert.rejects(()=>submit(root,makeSimulatedPacket(),card),/EEXIST/);
  assert.equal((await readdir(path.join(root,'claims'))).length,1);
});

test('power-loss after CLAIM permanently consumes edge, no artifactual work',async()=>{
  const root=await dir();
  await assert.rejects(()=>submit(root,makeSimulatedPacket(),card,{fault:'CLAIM'}),/INJECTED_POWER_LOSS/);
  const state=await inspect(root,key());
  assert.equal(state.status,'TURN_CONSUMED_NO_ARTIFACT');
  assert.equal(state.fileExists,false);
  await assert.rejects(()=>submit(root,makeSimulatedPacket(),card),/EEXIST/);
});

test('power-loss after spool is uncertain, does not promote file into a printing receipt',async()=>{
  const root=await dir();
  await assert.rejects(()=>submit(root,makeSimulatedPacket(),card,{fault:'SPOOL'}),/INJECTED_POWER_LOSS/);
  const state=await inspect(root,key());
  assert.equal(state.status,'UNRECONCILED_SPOOL_FILE_HOLD');
  assert.equal(state.fileExists,true);
  await assert.rejects(()=>dispatch(root,key(),'Operator',{spooler:()=>({status:0})}),/no clean prepared/);
  await assert.rejects(()=>submit(root,makeSimulatedPacket(),card),/EEXIST/);
});

test('power-loss after PREPARED can be verified cold, never automatically dispatches',async()=>{
  const root=await dir();
  await assert.rejects(()=>submit(root,makeSimulatedPacket(),card,{fault:'PREPARED'}),/INJECTED_POWER_LOSS/);
  assert.equal((await inspect(root,key())).status,'PREPARED_FILE_NOT_PRINTED');
  assert.equal((await readdir(root)).includes('dispatch'),false);
});

test('operator-approved spool attempt is irrevocably claimed before handing bytes to printer',async()=>{
  const root=await dir();
  const k=(await submit(root,makeSimulatedPacket(),card)).key;
  let calls=0;
  await assert.rejects(()=>dispatch(root,k,'Operator',{fault:'DISPATCH',spooler:()=>{calls++;return {status:0}}}),/INJECTED_POWER_LOSS/);
  assert.equal(calls,0);
  assert.equal((await inspect(root,k)).status,'PRINT_ATTEMPT_STATUS_UNKNOWN_NO_RETRY');
  await assert.rejects(()=>dispatch(root,k,'Operator',{spooler:()=>{calls++;return {status:0}}}),/no clean prepared/);
  assert.equal(calls,0);
});

test('spooler ACCEPTED does not prove paper and never issues a second attempt',async()=>{
  const root=await dir();
  const k=(await submit(root,makeSimulatedPacket(),card)).key;
  let calls=0;
  const state=await dispatch(root,k,'Operator',{spooler:(cmd,args,config)=>{
    calls++;
    assert.equal(cmd,'lp');assert.equal(config.shell,false);
    assert.deepEqual(args.slice(0,1),['--']);
    assert.equal(args.at(-1),asset(root,'spool',k,'txt'));
    return {status:0};
  }});
  assert.equal(calls,1);
  assert.equal(state.status,'SPOOLER_ACCEPTED_NOT_PAPER_PROOF');
  assert.equal(state.printedPhysically,false);
  assert.equal(state.reportedPaper,false);
  await assert.rejects(()=>dispatch(root,k,'Operator',{spooler:()=>{calls++;return {status:0}}}),/no clean prepared/);
  assert.equal(calls,1);
});

test('failed CUPS attempt is preserved as denied, never auto-requeued',async()=>{
  const root=await dir();
  const k=(await submit(root,makeSimulatedPacket(),card)).key;
  const state=await dispatch(root,k,'Operator',{printer:'LocalPrinter',spooler:()=>({status:1})});
  assert.equal(state.status,'SPOOLER_REFUSED_NO_RETRY');
  await assert.rejects(()=>dispatch(root,k,'Operator'),/no clean prepared/);
});

test('two independently named humans can add one review-only report, no claimed machine proof',async()=>{
  const root=await dir();
  const k=(await submit(root,makeSimulatedPacket(),card)).key;
  await assert.rejects(()=>observe(root,k,{operator:'Same',witness:'Same',notesRef:'local-notes'}),/distinct/);
  const report=await observe(root,k,{operator:'Operator',witness:'Witness',notesRef:'physical-notes-1'});
  assert.equal(report.reportedPaper,true);
  assert.equal(report.printedPhysically,false);
  assert.equal(report.coinBacking,0);
  await assert.rejects(()=>observe(root,k,{operator:'Operator',witness:'Witness',notesRef:'physical-notes-1'}),/EEXIST/);
});

test('tampered spool bytes fail closed without silently regenerating',async()=>{
  const root=await dir();
  const k=(await submit(root,makeSimulatedPacket(),card)).key;
  await writeFile(asset(root,'spool',k,'txt'),'modified print contents');
  await assert.rejects(()=>inspect(root,k),/tampering|interrupted spool/);
  await assert.rejects(()=>dispatch(root,k,'Operator',{spooler:()=>({status:0})}),/tampering|interrupted spool/);
});

test('torn claim is an error, not a free new turn',async()=>{
  const root=await dir();
  const k=(await submit(root,makeSimulatedPacket(),card)).key;
  await writeFile(asset(root,'claims',k),'');
  await assert.rejects(()=>inspect(root,k),/Unexpected end of JSON/);
  await assert.rejects(()=>submit(root,makeSimulatedPacket(),card),/EEXIST/);
});

test('one edge cannot be used with a revised offer, another card, or repeated physical claim',async()=>{
  const root=await dir();
  await submit(root,makeSimulatedPacket(),card);
  await assert.rejects(()=>submit(root,makeSimulatedPacket(),'Different offer!'),/EEXIST/);
});

test('synthetic and CRANKNODE-source receipt profiles cannot be silently mixed',()=>{
  const synthetic=makeSimulatedPacket('encoder:esp32-reference-001');
  assert.equal(validatePacket(synthetic).source,'SIMULATED_TEST_ONLY');
  assert.throws(()=>validatePacket({...synthetic,source:'STATIC_OS_CRANKNODE_003'}),/native gate receipt/);
  assert.throws(()=>validatePacket({...synthetic,edge:{...synthetic.edge,ticks:2}}),/edge ticks/);
  assert.throws(()=>validatePacket({...synthetic,edge:{...synthetic.edge,airplay:true}}),/unknown or missing fields/);
});

test('exact source-owned CRANKNODE-003 gate receipt shape is accepted as assertion, never authenticity proof',()=>{
  const packet=makeSimulatedPacket('encoder:esp32-reference-001');
  const id='static-os-crank-edge-v0:'+hash(stable(packet.edge));
  const gate={ schema:'static-os.crank-edge-gate-receipt/v0',edge_id:id,edge:packet.edge,
    consumed:true,authorizes:'one-turn-attempt-only',semantic_authority:'none',
    admission_authority:'none',automatic_retry:false,automatic_next_turn:false,
    laws:['ONE EDGE = AT MOST ONE TURN ATTEMPT']};
  gate.gate_receipt_sha256=hash(stable(gate));
  const native={...packet,source:'STATIC_OS_CRANKNODE_003',gate_receipt:gate};
  assert.equal(validatePacket(native).source,'STATIC_OS_CRANKNODE_003');
  assert.throws(()=>validatePacket({...native,gate_receipt:{...gate,consumed:false}}),/native receipt content mismatch/);
  assert.throws(()=>validatePacket({...native,edge:{...packet.edge,sequence:2}}),/native receipt content mismatch/);
});

test('real CUPS dispatch remains absent from ordinary program operation',async()=>{
  const root=await dir();
  const k=(await submit(root,makeSimulatedPacket(),card)).key;
  assert.equal((await inspect(root,k)).status,'PREPARED_FILE_NOT_PRINTED');
  assert.equal((await readdir(root)).includes('dispatch'),false);
});
