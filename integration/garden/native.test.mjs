import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { identity, hash } from '../../src/protocol.mjs';
import { GARDEN_COMMIT, selectedGardenNeed, GardenAdmissionAdapter } from '../../src/routing/garden-adapter.mjs';
import { sealRouting, reviseRouting, RoutingMirror } from '../../src/routing/envelopes.mjs';
import { routeCapacity, publicRoutingPage } from '../../src/routing/router.mjs';
import { nativePrivateIntroduction } from '../../src/routing/private-contact.mjs';

assert(process.env.GARDEN_SOURCE && process.env.GARDEN_DATABASE_CONTAINER, 'Run npm run test:native; no simulated fallback');
const { buildCampfirePourPreview, pourHeldRequirement } = await import(`${process.env.GARDEN_SOURCE}/src/domain/help-slip/pour.ts`);
const container = process.env.GARDEN_DATABASE_CONTAINER;
const owner = '10000000-0000-4000-8000-000000000001';
const helper = '10000000-0000-4000-8000-000000000002';
const outsider = '10000000-0000-4000-8000-000000000003';
const pgArgs = ['exec', '-i', container, 'psql', '-U', 'postgres', '-Atq', '-v', 'ON_ERROR_STOP=1'];
const execute = promisify(execFile);
function sqlLiteral(v) {
  if (v === null) return 'NULL';
  if (Array.isArray(v)) return `ARRAY[${v.map(sqlLiteral).join(',')}]::text[]`;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') { assert(Number.isSafeInteger(v)); return String(v); }
  assert.equal(typeof v, 'string'); return `'${v.replaceAll("'", "''")}'`;
}
function rpcSql(actor, fn, args) {
  assert(/^rpc_[a-z_]+$/.test(fn));
  assert(Object.keys(args).every(k => /^_[a-z_]+$/.test(k)));
  return `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub',${sqlLiteral(actor ?? '')},false); SELECT to_jsonb(public.${fn}(${Object.entries(args).map(([k,v]) => `${k} => ${sqlLiteral(v)}`).join(',')}))::text;`;
}
function rpc(actor, fn, args) {
  const raw = execFileSync('docker', pgArgs, { input: rpcSql(actor, fn, args), encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim().split('\n').at(-1);
  return raw && raw !== actor ? JSON.parse(raw) : null;
}
async function rpcAsync(actor, fn, args) {
  // psql -c avoids stdin machinery and launches two independent database sessions.
  const { stdout } = await execute('docker', [...pgArgs.filter(x => x !== '-i'), '-c', rpcSql(actor, fn, args)]);
  return JSON.parse(stdout.trim().split('\n').at(-1));
}
function admin(sql) { return execFileSync('docker', pgArgs, { input: sql, encoding: 'utf8', stdio:['pipe','pipe','pipe'] }).trim(); }
admin(`INSERT INTO auth.users VALUES (${sqlLiteral(owner)},'owner@example.invalid'),(${sqlLiteral(helper)},'helper@example.invalid'),(${sqlLiteral(outsider)},'outsider@example.invalid');`);
const evidence = { source: GARDEN_COMMIT, authentication: 'local role/JWT-claim fixture; Supabase token verification untested',
  physicalDelivery: 'synthetic human claims; no external delivery proof', receipts: [], tests: [] };
function head(circle) { return admin(`SELECT head_hash FROM public.ledger_heads WHERE circle_id=${sqlLiteral(circle)};`); }
const clock = () => new Date().toISOString();
function dates() { return { validFrom: new Date(Date.now()-3600000).toISOString(), expiresAt: new Date(Date.now()+3600000).toISOString() }; }

async function makeNeed({ resource = 'wheelchair', unit = 'item', quantity = 1, publication = true } = {}) {
  const created = rpc(owner, 'rpc_create_household_and_circle', { _household_label: 'PRIVATE HOUSEHOLD', _circle_label: 'PRIVATE CIRCLE', _idempotency_key: randomUUID() });
  const circle = created.receipt.circle_id;
  assert(circle, JSON.stringify(created));
  admin(`INSERT INTO public.circle_memberships(circle_id,user_id,role) VALUES(${sqlLiteral(circle)},${sqlLiteral(helper)},'neighbor');`);
  const keys = identity(); let receipt;
  const held = { localCaseId: randomUUID(), payloadHash: 'private-device-hash', status: 'held',
    requirementLinks: [], payload: { purpose: 'PRIVATE MEDICAL CONTEXT', requirements: [
      { id: 'selected-001', kind: 'goods', description: resource, quantity, unit },
      { id: 'private-002', kind: 'goods', description: 'PRIVATE UNSELECTED', quantity: 7, unit: 'item' }] } };
  const preview = buildCampfirePourPreview(held, 'selected-001', { circleId: circle, circleLabel: 'PRIVATE CIRCLE' });
  const pour = await pourHeldRequirement({ heldCase: held, preview,
    openSharedNeed: async command => {
      receipt = rpc(owner, 'rpc_open_need', { _circle_id: circle, _expected_head: head(circle), _idempotency_key: randomUUID(),
        _title: command.title, _summary: command.summary, _requested_items: command.requestedItems,
        _unit_label: command.unitLabel, _target_units: command.targetUnits, _visibility: command.visibility });
      return { success: true, data: { authorityNeedId: receipt.event.aggregateId }, witnessReceipt: { id: receipt.event.eventId } };
    }, addRequirementLink: link => held.requirementLinks.push(link), refreshSharedState: async () => {}, now: clock });
  assert.equal(pour.status, 'shared');
  assert.equal(held.requirementLinks.length, 1);
  assert(!JSON.stringify(receipt).includes('PRIVATE UNSELECTED'));
  const source = { system: 'garden-campfire', version: GARDEN_COMMIT, authority: circle, object: receipt.event.aggregateId, revision: 1 };
  const fields = { resource, unit, quantity, kind: 'goods', region: 'north-county', boundaries: ['pickup'], ...dates() };
  if (!publication) return { circle, receipt, keys, source, fields, held };
  const need = selectedGardenNeed({ receipt, selected: true, publicationApproved: true, publicFields: fields, source, keys });
  selectNeed(need, true);
  return { circle, receipt, keys, source, fields, need, held };
}
function selectNeed(need, allowed) {
  const p = need.payload;
  return rpc(owner, 'rpc_select_public_need', { _circle_id: p.source.authority, _need_id: p.source.object,
    _manifest_hash: hash(need), _revision: p.revision, _resource: p.resource, _kind: p.kind,
    _region: p.region, _boundaries: p.boundaries, _publication_allowed: allowed,
    _valid_from: p.validFrom, _expires_at: p.expiresAt });
}
function assertCapacity(capacity) {
  const p = capacity.payload;
  return rpc(helper, 'rpc_assert_capacity', { _id: p.id, _manifest_hash: hash(capacity), _revision: p.revision,
    _resource: p.resource, _kind: p.kind, _unit: p.unit, _quantity: p.quantity, _region: p.region,
    _boundaries: p.boundaries, _valid_from: p.validFrom, _expires_at: p.expiresAt, _status: p.status });
}
function makeCapacity(changes = {}) {
  const keys = identity(), id = randomUUID();
  const capacity = sealRouting('capacity', { id, revision: 1, previousHash: null, status: 'available',
    source: { system: 'garden-campfire', version: GARDEN_COMMIT, authority: 'garden-capacity-rpc', object: id, revision: 1 },
    resource: 'wheelchair', kind: 'goods', unit: 'item', quantity: 1, region: 'north-county', boundaries: ['pickup'], ...dates(), ...changes }, keys);
  assertCapacity(capacity); return { capacity, keys };
}
async function pledge(n, capacity) {
  const proposal = routeCapacity(n.need, [capacity], clock())[0]; assert(proposal);
  const expectedHead = head(n.circle);
  const adapter = new GardenAdmissionAdapter((fn,args) => rpc(helper,fn,args));
  const receipt = await adapter.propose({ need: n.need, capacity, proposal, now: clock(), expectedHead });
  return { receipt, proposal, expectedHead };
}
function acceptanceArgs(n, pledgeReceipt) { return { _circle_id: n.circle, _expected_head: head(n.circle),
  _idempotency_key: randomUUID(), _offer_id: pledgeReceipt.event.aggregateId }; }
function publicHash(n) { return rpc(null, 'rpc_public_need_hash', { _circle_id: n.circle, _need_id: n.source.object }); }

test('native Garden selected POUR → independent capacity → source owner accept → report → confirm, with no funds', async () => {
  const supply = makeCapacity(); // Supply exists before any request.
  const n = await makeNeed(); const p = await pledge(n, supply.capacity);
  const args = acceptanceArgs(n,p.receipt);
  assert.throws(() => rpc(helper,'rpc_accept_offer',args), /cannot accept own|household/);
  assert.throws(() => rpc(outsider,'rpc_accept_offer',args), /household/);
  const accepted = await new GardenAdmissionAdapter((fn,inputs)=>rpc(owner,fn,inputs)).accept({
    circleId:n.circle,offerId:args._offer_id,expectedHead:args._expected_head,idempotencyKey:args._idempotency_key });
  assert.equal(accepted.event.kind,'offer.accepted');
  assert.equal(rpc(owner,'rpc_accept_offer',args).replayed,true);
  assert.throws(() => rpc(owner,'rpc_confirm_fulfillment',{ ...args,_expected_head: head(n.circle),_idempotency_key: randomUUID(),_confirmed_units: 1 }), /reported first/);
  const reported = rpc(helper,'rpc_report_fulfillment',{ _circle_id:n.circle,_expected_head:head(n.circle),_idempotency_key:randomUUID(),_offer_id:p.receipt.event.aggregateId,_note:null });
  assert.equal(reported.event.kind,'fulfillment.reported');
  assert.throws(() => rpc(helper,'rpc_confirm_fulfillment',{ ...args,_expected_head: head(n.circle),_idempotency_key: randomUUID(),_confirmed_units: 1 }), /cannot confirm own/);
  const confirmed = rpc(owner,'rpc_confirm_fulfillment',{ ...args,_expected_head:head(n.circle),_idempotency_key:randomUUID(),_confirmed_units:1 });
  assert.equal(confirmed.event.kind,'fulfillment.confirmed');
  assert.equal(publicHash(n),null); // A fulfilled need is no longer advertised as open.
  assert(!admin(`SELECT payload FROM public.witness_events WHERE circle_id=${sqlLiteral(n.circle)};`).includes('funds'));
  evidence.receipts.push(...[n.receipt,p.receipt,accepted,reported,confirmed].map(r => ({ kind:r.event.kind,eventHash:r.event.eventHash })));
});
test('two communities simultaneously accepting the lone wheelchair produce exactly one reservation', async () => {
  const supply = makeCapacity(); const a = await makeNeed(), b = await makeNeed();
  const pa = await pledge(a,supply.capacity), pb = await pledge(b,supply.capacity);
  const results = await Promise.allSettled([rpcAsync(owner,'rpc_accept_offer',acceptanceArgs(a,pa.receipt)),rpcAsync(owner,'rpc_accept_offer',acceptanceArgs(b,pb.receipt))]);
  assert.equal(results.filter(r => r.status==='fulfilled').length,1);
  assert.equal(results.filter(r => r.status==='rejected').length,1);
  assert.equal(admin(`SELECT sum(units) FROM bananagram_private.capacity_pledges WHERE capacity_id=${sqlLiteral(supply.capacity.payload.id)} AND reserved;`),'1');
});
test('source pledge is idempotent; changed quantity under the same key is denied', async () => {
  const n = await makeNeed(), supply = makeCapacity(); const p = await pledge(n,supply.capacity);
  const adapter = new GardenAdmissionAdapter((fn,args) => rpc(helper,fn,args));
  const replay = await adapter.propose({ need:n.need,capacity:supply.capacity,proposal:p.proposal,now:clock(),expectedHead:p.expectedHead });
  assert.equal(replay.replayed,true); assert.equal(replay.event.eventHash,p.receipt.event.eventHash);
  assert.throws(() => rpc(helper,'rpc_pledge_capacity',{ _circle_id:n.circle,_expected_head:p.expectedHead,_idempotency_key:p.proposal.id,
    _need_id:n.source.object,_capacity_id:supply.capacity.payload.id,_need_hash:hash(n.need),_capacity_hash:hash(supply.capacity),_units:2 }), /idempotency_conflict/);
});
test('revocation between route and owner acceptance is denied by source', async () => {
  const n=await makeNeed(), supply=makeCapacity(); const p=await pledge(n,supply.capacity);
  assertCapacity(reviseRouting(supply.capacity,{status:'withdrawn'},supply.keys));
  assert.throws(() => rpc(owner,'rpc_accept_offer',acceptanceArgs(n,p.receipt)), /stale/);
});
test('availability actually expires after pledge but before owner acceptance', async () => {
  const n=await makeNeed(); const supply=makeCapacity({ expiresAt:new Date(Date.now()+1800).toISOString() });
  const p=await pledge(n,supply.capacity);
  await new Promise(resolve => setTimeout(resolve,1900));
  assert.throws(() => rpc(owner,'rpc_accept_offer',acceptanceArgs(n,p.receipt)), /stale/);
});
test('changed source calibration/unit rejects a forged capacity pledge even via raw RPC', async () => {
  const n=await makeNeed({resource:'firewood',unit:'cord'}), supply=makeCapacity({resource:'firewood',unit:'bundle'});
  assert.deepEqual(routeCapacity(n.need,[supply.capacity],clock()),[]);
  assert.throws(() => rpc(helper,'rpc_pledge_capacity',{ _circle_id:n.circle,_expected_head:head(n.circle),_idempotency_key:randomUUID(),
    _need_id:n.source.object,_capacity_id:supply.capacity.payload.id,_need_hash:hash(n.need),_capacity_hash:hash(supply.capacity),_units:1 }), /incompatible/);
});
test('declined publication stays private and cannot be routed through native source', async () => {
  const n=await makeNeed({publication:false}), supply=makeCapacity();
  assert.equal(publicHash(n),null);
  assert.throws(() => selectedGardenNeed({ receipt:n.receipt,selected:true,publicationApproved:false,publicFields:n.fields,source:n.source,keys:n.keys }), /opt-in/);
  assert.throws(() => rpc(helper,'rpc_pledge_capacity',{ _circle_id:n.circle,_expected_head:head(n.circle),_idempotency_key:randomUUID(),
    _need_id:n.source.object,_capacity_id:supply.capacity.payload.id,_need_hash:'a'.repeat(64),_capacity_hash:hash(supply.capacity),_units:1 }), /private/);
});
test('public opt-in withdrawal challenges stale mirrors and prevents a new public page', async () => {
  const n=await makeNeed(), supply=makeCapacity(); const p=await pledge(n,supply.capacity);
  const withdrawn=reviseRouting(n.need,{status:'withdrawn'},n.keys); selectNeed(withdrawn,false);
  assert.equal(publicHash(n),null);
  assert(!(await publicRoutingPage(n.need,async()=>publicHash(n),clock())).includes('wheelchair'));
  assert.throws(() => rpc(owner,'rpc_accept_offer',acceptanceArgs(n,p.receipt)), /stale/);
  const renewed=sealRouting('need',{...withdrawn.payload,revision:3,previousHash:hash(withdrawn),status:'open',
    source:{...withdrawn.payload.source,revision:3}},n.keys);
  assert.throws(()=>selectNeed(renewed,true), /cannot reactivate/);
});
test('fresh source version invalidates stale capacity snapshots before admission', async () => {
  const n=await makeNeed(), supply=makeCapacity();
  assertCapacity(reviseRouting(supply.capacity,{region:'south-county'},supply.keys));
  await assert.rejects(pledge(n,supply.capacity), /stale/);
});
test('missing identity and private source table access are denied; original accept cannot bypass guard', async () => {
  const n=await makeNeed(), supply=makeCapacity(); const p=await pledge(n,supply.capacity);
  assert.throws(() => rpc(null,'rpc_accept_offer',acceptanceArgs(n,p.receipt)), /unauthenticated/);
  for (const query of ['SELECT * FROM bananagram_private.available_capacity;',
    `SELECT bananagram_core.rpc_accept_offer(${sqlLiteral(n.circle)},${sqlLiteral(head(n.circle))},'bypass-key',${sqlLiteral(p.receipt.event.aggregateId)});`]) {
    assert.throws(() => admin(`SET ROLE authenticated; ${query}`), /permission denied/);
  }
});
test('stale circle head cannot accept or consume capacity', async () => {
  const n=await makeNeed(), supply=makeCapacity(); const p=await pledge(n,supply.capacity);
  const args={...acceptanceArgs(n,p.receipt),_expected_head:'0'.repeat(64)};
  assert.throws(() => rpc(owner,'rpc_accept_offer',args), /stale_head/);
  assert.equal(admin(`SELECT count(*) FROM bananagram_private.capacity_pledges WHERE capacity_id=${sqlLiteral(supply.capacity.payload.id)} AND reserved;`),'0');
});
test('native decline does not reserve or confirm physical capacity', async () => {
  const n=await makeNeed(), supply=makeCapacity(); const p=await pledge(n,supply.capacity);
  const declined=rpc(owner,'rpc_decline_offer',{...acceptanceArgs(n,p.receipt),_reason:'Not suitable'});
  assert.equal(declined.event.kind,'offer.declined');
  assert.throws(() => rpc(owner,'rpc_accept_offer',acceptanceArgs(n,p.receipt)), /not pledged/);
  assert.equal(admin(`SELECT count(*) FROM bananagram_private.capacity_pledges WHERE capacity_id=${sqlLiteral(supply.capacity.payload.id)} AND reserved;`),'0');
});
test('native private introduction requires BOTH authenticated parties; withdraw and outsiders cannot read contacts', async () => {
  const n=await makeNeed(), supply=makeCapacity(); const p=await pledge(n,supply.capacity);
  rpc(owner,'rpc_accept_offer',acceptanceArgs(n,p.receipt));
  const args={_circle_id:n.circle,_offer_id:p.receipt.event.aggregateId}; let reads=0;
  const base={sourceRpc:(fn,inputs)=>rpc(owner,fn,inputs),circleId:n.circle,offerId:args._offer_id,
    deliverPrivateContact:async()=>{reads++;return 'PRIVATE CONTACT VIA TEST PROVIDER';}};
  await assert.rejects(nativePrivateIntroduction(base), /two-party/);
  rpc(owner,'rpc_consent_capacity_contact',{...args,_decision:'allow',_expires_at:n.need.payload.expiresAt});
  await assert.rejects(nativePrivateIntroduction(base), /two-party/);
  assert.throws(()=>rpc(outsider,'rpc_consent_capacity_contact',{...args,_decision:'allow',_expires_at:n.need.payload.expiresAt}), /party/);
  rpc(helper,'rpc_consent_capacity_contact',{...args,_decision:'allow',_expires_at:n.need.payload.expiresAt});
  assert.equal(await nativePrivateIntroduction(base),'PRIVATE CONTACT VIA TEST PROVIDER'); assert.equal(reads,1);
  rpc(helper,'rpc_consent_capacity_contact',{...args,_decision:'withdraw',_expires_at:n.need.payload.expiresAt});
  await assert.rejects(nativePrivateIntroduction(base), /two-party/); assert.equal(reads,1);
  assert.throws(()=>rpc(outsider,'rpc_capacity_contact_allowed',args), /party/);
  rpc(helper,'rpc_consent_capacity_contact',{...args,_decision:'allow',_expires_at:n.need.payload.expiresAt});
  rpc(owner,'rpc_close_need',{_circle_id:n.circle,_expected_head:head(n.circle),_idempotency_key:randomUUID(),_need_id:n.source.object,_reason:'Withdrawing this request'});
  assert.equal(publicHash(n),null);
  await assert.rejects(nativePrivateIntroduction(base), /two-party/); assert.equal(reads,1);
  assert(!admin(`SELECT payload FROM public.witness_events WHERE circle_id=${sqlLiteral(n.circle)};`).includes('CONTACT'));
});
test('actual authority process death retains reservation; two cold mirrors cannot synthesize confirmation', async () => {
  const n=await makeNeed(), supply=makeCapacity(); const p=await pledge(n,supply.capacity);
  const accepted=rpc(owner,'rpc_accept_offer',acceptanceArgs(n,p.receipt));
  mkdirSync('dist/routing-002',{recursive:true});
  const files=[];
  for (const name of ['mirror-a','mirror-b']) {
    const mirror=new RoutingMirror(); mirror.receive(n.need); mirror.receive(supply.capacity);
    const file=`dist/routing-002/${name}.json`; writeFileSync(file,JSON.stringify(mirror.export(),null,2)); files.push(file);
  }
  execFileSync('docker',['kill','--signal','KILL',container]); execFileSync('docker',['start',container]);
  let ready=false;
  for (let i=0;i<100;i++) {
    try { execFileSync('docker',['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres'],{stdio:'ignore'}); ready=true; break; }
    catch { await new Promise(resolve=>setTimeout(resolve,100)); }
  }
  assert(ready);
  assert.equal(admin(`SELECT sum(units) FROM bananagram_private.capacity_pledges WHERE capacity_id=${sqlLiteral(supply.capacity.payload.id)} AND reserved;`),'1');
  assert.equal(admin(`SELECT count(*) FROM public.witness_events WHERE circle_id=${sqlLiteral(n.circle)} AND kind='fulfillment.confirmed';`),'0');
  for (const file of files) {
    const cold=JSON.parse(execFileSync(process.execPath,['src/routing/cold-verify.mjs',file,clock()],{encoding:'utf8'}));
    assert.equal(cold.proposals[0].id,p.proposal.id); assert(cold.authority.includes('none'));
  }
  const other=await makeNeed(); const otherPledge=await pledge(other,supply.capacity);
  assert.throws(()=>rpc(owner,'rpc_accept_offer',acceptanceArgs(other,otherPledge.receipt)), /reserved/);
  evidence.receipts.push({kind:accepted.event.kind,eventHash:accepted.event.eventHash,coldReplay:'reservation survived SIGKILL; no confirmation'});
  writeFileSync('dist/routing-002/native-evidence.json',JSON.stringify(evidence,null,2));
});
