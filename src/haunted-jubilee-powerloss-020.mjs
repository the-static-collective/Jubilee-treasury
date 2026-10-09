// PENNY-020: hardware-edge-compatible, crash-conservative postcard instrument.
// Offline. The underlying CRANKNODE-003 physical serial gate remains source-owned by Static OS.
// Files are immutable, locally fsynced. No automatic retry, mint, airplay or print-on-boot.
import { createHash } from 'node:crypto';
import { promises as fs, constants as C } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const HASH = value => createHash('sha256').update(value).digest('hex');
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const requireThat = (condition, text) => { if (!condition) throw new Error(text); };
const keys = (v, required, label) => {
  requireThat(plain(v) && Object.keys(v).sort().join('|') === [...required].sort().join('|'), label + ': unknown or missing fields');
};
const sorted = v => Array.isArray(v) ? '[' + v.map(sorted).join(',') + ']' :
  plain(v) ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + sorted(v[k])).join(',') + '}' : JSON.stringify(v);
const shaObject = v => HASH(sorted(v));
const slug = v => { requireThat(typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(v), 'invalid identifier'); return v; };
const edgeFields = ['schema', 'device_id', 'session_id', 'sequence', 'direction', 'ticks'];
const idFields = ['schema', 'source', 'edge', 'gate_receipt'];
const sourceReceiptFields = ['schema','edge_id','edge','consumed','authorizes','semantic_authority','admission_authority','automatic_retry','automatic_next_turn','laws','gate_receipt_sha256'];
const sha64 = v => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);

export function validatePacket(packet) {
  keys(packet, idFields, 'edge packet');
  requireThat(packet.schema === 'haunted-jubilee.edge-packet-020/v0', 'edge packet schema mismatch');
  keys(packet.edge, edgeFields, 'physical edge');
  const e=packet.edge;
  requireThat(e.schema === 'static-os.crank-physical-edge/v0', 'edge schema mismatch');
  slug(e.device_id); slug(e.session_id);
  requireThat(Number.isSafeInteger(e.sequence) && e.sequence >= 0, 'invalid edge sequence');
  requireThat(e.ticks === 1 && ['CW','CCW'].includes(e.direction), 'invalid edge ticks or direction');
  const nativeId = 'static-os-crank-edge-v0:' + shaObject(e);
  if (packet.source === 'STATIC_OS_CRANKNODE_003') {
    const r = packet.gate_receipt;
    keys(r, sourceReceiptFields, 'native gate receipt');
    requireThat(r.schema === 'static-os.crank-edge-gate-receipt/v0' &&
      r.edge_id === nativeId && sorted(r.edge) === sorted(e) &&
      r.consumed === true && r.authorizes === 'one-turn-attempt-only' &&
      r.semantic_authority === 'none' && r.admission_authority === 'none' &&
      r.automatic_retry === false && r.automatic_next_turn === false &&
      Array.isArray(r.laws) && r.laws.every(s => typeof s === 'string') &&
      r.gate_receipt_sha256 === shaObject(Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'gate_receipt_sha256'))),
      'native receipt content mismatch');
  } else {
    requireThat(packet.source === 'SIMULATED_TEST_ONLY' && packet.gate_receipt === null, 'source mode must be explicitly synthetic or native');
  }
  // A digest of a source-owned receipt is NOT a signature, device attestation, or live hardware proof.
  return { key: shaObject(e), source: packet.source, edge: e, gateReceiptDigest: packet.gate_receipt?.gate_receipt_sha256 ?? null };
}

const stem = key => { requireThat(sha64(key), 'invalid durable key'); return key; };
const child = (root, kind, key, ext='json') => path.join(root, kind, stem(key) + '.' + ext);
const jsonBytes = v => Buffer.from(JSON.stringify(v, null, 2) + '\n', 'utf8');

async function syncDirectory(folder) {
  const d=await fs.open(folder, C.O_RDONLY | (C.O_DIRECTORY ?? 0));
  try { await d.sync(); } finally { await d.close(); }
}
async function privateDir(dir) {
  const absolute=path.resolve(dir);
  await fs.mkdir(absolute, { recursive:true, mode:0o700 });
  const stat=await fs.lstat(absolute);
  requireThat(stat.isDirectory() && !stat.isSymbolicLink(), 'private state directory invalid');
  return absolute;
}
async function immutablyWrite(root, kind, key, bytes, ext='json') {
  const directory=path.join(root,kind);
  await fs.mkdir(directory, { mode:0o700 });
  const file=child(root,kind,key,ext);
  const h=await fs.open(file, C.O_WRONLY | C.O_CREAT | C.O_EXCL | (C.O_NOFOLLOW ?? 0), 0o600);
  try { await h.writeFile(bytes); await h.sync(); } finally { await h.close(); }
  await syncDirectory(directory);
  return file;
}
async function privateRead(file, max=32_000) {
  const st=await fs.lstat(file);
  requireThat(st.isFile() && !st.isSymbolicLink() && st.size <= max, 'untrusted state file');
  return await fs.readFile(file);
}
async function optionalRead(file,max=32_000) {
  try { return await privateRead(file,max); } catch(err) { if(err.code==='ENOENT')return null; throw err; }
}
async function optionalJson(file) {
  const bytes=await optionalRead(file);
  if(bytes===null) return null;
  return JSON.parse(bytes.toString('utf8'));
}
function assertSealed(item) {
  keys(item, ['body', 'sha256'], 'sealed record');
  requireThat(item.sha256 === shaObject(item.body), 'corrupted sealed record');
  return item.body;
}
const seal = body => jsonBytes({body,sha256:shaObject(body)});
function makePaper(record,text) {
  requireThat(typeof text === 'string' && text.length > 0 && Buffer.byteLength(text) <= 5000 &&
    !/[\u0000-\u0008\u000b-\u001f\u007f]/.test(text), 'paper source must be bounded UTF-8 text');
  return Buffer.from([
    '== THE HAUNTED JUBILEE ARCADE :: PENNY-020 ==',
    'UNVERIFIED HARDWARE-EDGE-COMPATIBLE POSTCARD',
    'CRANK ID : ' + record.edgeKey,
    'SOURCE   : ' + record.source,
    'CARD SHA : ' + record.cardSha256,
    '----- OFFERED POSTCARD -----',
    text.trimEnd(),
    '----- END -----',
    'PROVENANCE IS NOT CUSTODY / MAIL / PAYMENT / AIRPLAY',
    'PRINT FILE IS NOT PROOF OF PRINTED PAPER',
    ''
  ].join('\n'),'utf8');
}
function faultAt(hook, target) { if(hook === target) throw new Error('INJECTED_POWER_LOSS_AFTER_DURABLE_' + hook); }

export async function submit(rootPath, packet, cardText, {fault=null}={}) {
  const root=await privateDir(rootPath);
  const info=validatePacket(packet);
  requireThat(typeof cardText === 'string' && Buffer.byteLength(cardText)<=5000, 'unbounded card text');
  const cardSha256=HASH(Buffer.from(cardText,'utf8'));
  const claim={schema:'haunted-jubilee.edge-claim-020/v0',edgeKey:info.key,edge:info.edge,source:info.source,
    nativeGateReceiptDigest:info.gateReceiptDigest,cardSha256,claim:'ONE_EDGE_CONSUMED_BEFORE_WORK',automaticRetry:false,
    authority:'NONE',realPaperObserved:false,coinBacking:0,issuedPennyUnits:0};
  // A claim file is created exclusively before any output; incomplete/torn files permanently HOLD the edge.
  // On actual power loss, durability is guaranteed only after both file and parent directory sync complete.
  await immutablyWrite(root,'claims',info.key,seal(claim));
  faultAt(fault,'CLAIM');
  const paper=makePaper({edgeKey:info.key,source:info.source,cardSha256},cardText);
  await immutablyWrite(root,'spool',info.key,paper,'txt');
  faultAt(fault,'SPOOL');
  const prepared={schema:'haunted-jubilee.paper-prepared-020/v0',edgeKey:info.key,claimSha256:shaObject(claim),
    bytes:paper.length,paperSha256:HASH(paper),status:'DURABLE_TEXT_FILE_ONLY',printedPhysically:false,
    printerCommandIssued:false,automaticDispatch:false};
  await immutablyWrite(root,'prepared',info.key,seal(prepared));
  faultAt(fault,'PREPARED');
  return await inspect(root,info.key);
}

export async function inspect(rootPath,key) {
  const root=await privateDir(rootPath);
  stem(key);
  const claimRecord=await optionalJson(child(root,'claims',key));
  if (!claimRecord) return {key,status:'NO_CLAIM',printedPhysically:false,issuedPennyUnits:0};
  const claim=assertSealed(claimRecord);
  requireThat(claim.schema==='haunted-jubilee.edge-claim-020/v0' && claim.edgeKey===key &&
    claim.issuedPennyUnits===0 && claim.coinBacking===0 && claim.automaticRetry===false, 'invalid edge claim');
  const spool=await optionalRead(child(root,'spool',key,'txt'),8000);
  const prepRecord=await optionalJson(child(root,'prepared',key));
  let status='TURN_CONSUMED_NO_ARTIFACT';
  if (spool!==null) status='UNRECONCILED_SPOOL_FILE_HOLD';
  if (prepRecord!==null) {
    const prep=assertSealed(prepRecord);
    requireThat(prep.schema==='haunted-jubilee.paper-prepared-020/v0' && prep.edgeKey===key &&
      prep.claimSha256===shaObject(claim) && spool!==null && prep.paperSha256===HASH(spool) &&
      prep.bytes===spool.length && prep.printedPhysically===false && prep.printerCommandIssued===false,
      'prepared file/source tampering or interrupted spool');
    status='PREPARED_FILE_NOT_PRINTED';
  }
  const intentRecord=await optionalJson(child(root,'dispatch',key));
  let outcome=null;
  if (intentRecord!==null) {
    const intent=assertSealed(intentRecord);
    requireThat(prepRecord!==null && intent.edgeKey===key && intent.paperSha256===assertSealed(prepRecord).paperSha256 &&
      intent.status==='DISPATCH_INTENT_DURABLY_RECORDED', 'dispatch origin invalid');
    status='PRINT_ATTEMPT_STATUS_UNKNOWN_NO_RETRY';
    const outcomeRecord=await optionalJson(child(root,'outcomes',key));
    if (outcomeRecord!==null) {
      outcome=assertSealed(outcomeRecord);
      requireThat(outcome.edgeKey===key && outcome.intentSha256===shaObject(intent) && typeof outcome.spoolerExitCode==='number', 'print outcome invalid');
      status=outcome.spoolerExitCode===0?'SPOOLER_ACCEPTED_NOT_PAPER_PROOF':'SPOOLER_REFUSED_NO_RETRY';
    }
  } else {
    requireThat(await optionalRead(child(root,'outcomes',key))===null,'orphaned printer outcome');
  }
  const observation=await optionalJson(child(root,'observations',key));
  let reportedPaper=false;
  if (observation!==null) {
    const r=assertSealed(observation);
    requireThat(r.edgeKey===key && r.paperSha256===assertSealed(prepRecord).paperSha256 &&
      r.status==='TWO_HUMANS_REPORT_OBSERVATION_NOT_INDEPENDENTLY_VERIFIED' && r.operator!==r.witness,
      'observation artifact inconsistent');
    reportedPaper=true;
  }
  return {key,status,source:claim.source,cardSha256:claim.cardSha256,
    fileExists:spool!==null,reportedPaper,printedPhysically:false,
    automaticRetry:false,coinBacking:0,issuedPennyUnits:0,stationPublications:0,
    spoolerExitCode:outcome?.spoolerExitCode??null,sourceTrust:'SOURCE_LOCAL_HASHES_UNSIGNED'};
}

export async function dispatch(rootPath,key,operator,{printer=null,spooler=spawnSync,fault=null}={}) {
  slug(operator);
  if (printer!==null) slug(printer);
  const root=await privateDir(rootPath);
  const state=await inspect(root,key);
  requireThat(state.status==='PREPARED_FILE_NOT_PRINTED','no clean prepared artifact for first print attempt');
  const spool=child(root,'spool',key,'txt');
  const bytes=await privateRead(spool,8000);
  const intent={schema:'haunted-jubilee.print-dispatch-020/v0',edgeKey:key,paperSha256:HASH(bytes),
    operator,printer:printer??'system-default',status:'DISPATCH_INTENT_DURABLY_RECORDED',
    automaticRetry:false,printedPhysically:false};
  await immutablyWrite(root,'dispatch',key,seal(intent));
  faultAt(fault,'DISPATCH');
  // One opt-in, foreground attempt via CUPS: never used by submit, recovery or inspect.
  // lp accepting a job never establishes successful physical printing.
  const args=[...(printer?['-d',printer]:[]),'--',spool];
  let result;
  try { result=spooler('lp',args,{encoding:'utf8',shell:false,timeout:10_000,maxBuffer:4096}); }
  catch(err) { result={status:127,error:err}; }
  const code=Number.isInteger(result?.status)?result.status:127;
  const outcome={schema:'haunted-jubilee.spooler-result-020/v0',edgeKey:key,intentSha256:shaObject(intent),
    spoolerExitCode:code,status:code===0?'SPOOLER_ACCEPTED_JOB_PAPER_UNVERIFIED':'SPOOLER_NOT_ACCEPTED_OR_UNKNOWN',
    physicalPaperProven:false};
  await immutablyWrite(root,'outcomes',key,seal(outcome));
  return await inspect(root,key);
}

export async function observe(rootPath,key,{operator,witness,notesRef}) {
  slug(operator);slug(witness);slug(notesRef);
  requireThat(operator!==witness,'distinct human witness required');
  const root=await privateDir(rootPath);
  const state=await inspect(root,key);
  requireThat(state.status !== 'NO_CLAIM' && state.status !== 'TURN_CONSUMED_NO_ARTIFACT' &&
    state.status !== 'UNRECONCILED_SPOOL_FILE_HOLD','no verified print projection to observe');
  const bytes=await privateRead(child(root,'spool',key,'txt'),8000);
  const observation={schema:'haunted-jubilee.paper-observation-020/v0',edgeKey:key,
    paperSha256:HASH(bytes),operator,witness,notesRef,
    status:'TWO_HUMANS_REPORT_OBSERVATION_NOT_INDEPENDENTLY_VERIFIED',
    rawPaperBytesVerifiedBySystem:false,paperOwnershipNotAsserted:true};
  await immutablyWrite(root,'observations',key,seal(observation));
  return await inspect(root,key);
}

export const makeSimulatedPacket = (device='test-crank',sequence=1) =>
  ({schema:'haunted-jubilee.edge-packet-020/v0',source:'SIMULATED_TEST_ONLY',
    edge:{schema:'static-os.crank-physical-edge/v0',device_id:device,
      session_id:'offline-demo',sequence,direction:'CW',ticks:1},gate_receipt:null});

// CLI: operator supplied external inputs; never automatically reads arbitrary spool files or handles donor data.
async function main(args) {
  const [command,root,p1,p2,p3,p4]=args;
  if (command==='demo') {
    requireThat(root,'private state directory required');
    const packet=makeSimulatedPacket();
    console.log(JSON.stringify(await submit(root,packet,'I can repair bicycles.\nA stranger may choose another future.'),null,2));
  } else if (command==='submit') {
    requireThat(root && p1 && p2,'submit STATE_DIR EDGE_PACKET_JSON POSTCARD_TXT');
    const packet=JSON.parse(await fs.readFile(p1,'utf8'));
    const card=await fs.readFile(p2,'utf8');
    console.log(JSON.stringify(await submit(root,packet,card),null,2));
  } else if (command==='inspect') {
    requireThat(root&&p1,'inspect STATE_DIR EDGE_KEY');
    console.log(JSON.stringify(await inspect(root,p1),null,2));
  } else if (command==='dispatch') {
    requireThat(root&&p1&&p2,'dispatch STATE_DIR EDGE_KEY OPERATOR [PRINTER_NAME]');
    console.log(JSON.stringify(await dispatch(root,p1,p2,{printer:p3??null}),null,2));
  } else if (command==='observe') {
    requireThat(root&&p1&&p2&&p3&&p4,'observe STATE_DIR EDGE_KEY OPERATOR WITNESS NOTES_REF');
    console.log(JSON.stringify(await observe(root,p1,{operator:p2,witness:p3,notesRef:p4}),null,2));
  } else throw Error('commands: demo, submit, inspect, dispatch, observe');
}
if (process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)
  main(process.argv.slice(2)).catch(err=>{console.error('HOLD / '+err.message);process.exitCode=2;});
