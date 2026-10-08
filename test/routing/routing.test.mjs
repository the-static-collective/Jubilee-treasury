import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { identity, hash, canonical } from '../../src/protocol.mjs';
import { sealRouting, validateRouting, reviseRouting, RoutingMirror } from '../../src/routing/envelopes.mjs';
import { routeCapacity, publicRoutingPage, exchangePrivateContact } from '../../src/routing/router.mjs';
import { GARDEN_COMMIT, selectedGardenNeed, GardenAdmissionAdapter } from '../../src/routing/garden-adapter.mjs';
import { createGardenRpcClient } from '../../src/routing/supabase-client.mjs';

const now = '2026-10-08T12:00:00.000Z';
function fixture() {
  const owner = identity(), helper = identity();
  const fields = { resource: 'wheelchair', kind: 'goods', unit: 'item', quantity: 1, region: 'north-county',
    boundaries: ['pickup'], validFrom: '2026-10-08T00:00:00.000Z', expiresAt: '2026-10-09T00:00:00.000Z' };
  const source = { system: 'garden-campfire', version: GARDEN_COMMIT, authority: 'circle-001', object: 'need-001', revision: 1 };
  const receipt = { event: { kind: 'need.opened', actor: { role: 'household' }, aggregateId: source.object,
    payload: { unitLabel: fields.unit, targetUnits: 1, summary: 'PRIVATE MEDICAL FACT', householdLabel: 'PRIVATE NAME' } } };
  const need = selectedGardenNeed({ receipt, selected: true, publicationApproved: true, publicFields: fields, source, keys: owner });
  const capacity = sealRouting('capacity', { ...need.payload, id: 'capacity-001', status: 'available',
    source: { ...source, object: 'capacity-001' } }, helper);
  return { owner, helper, fields, source, receipt, need, capacity };
}
test('selected need omits every private receipt field and held slip context', () => {
  const f = fixture();
  assert(!canonical(f.need).includes('PRIVATE'));
  for (const options of [{ selected: false }, { publicationApproved: false }]) {
    assert.throws(() => selectedGardenNeed({ ...f, publicFields: f.fields, keys: f.owner,
      selected: true, publicationApproved: true, ...options }), /opt-in/);
  }
});
test('private emergency never publishes even when a native need exists', () => {
  const f = fixture();
  assert.throws(() => selectedGardenNeed({ ...f, publicFields: f.fields, keys: f.owner,
    selected: true, publicationApproved: false }), /opt-in/);
});
test('receipt quantities and native version cannot be silently changed', () => {
  const f = fixture();
  assert.throws(() => selectedGardenNeed({ ...f, publicFields: { ...f.fields, quantity: 2 }, keys: f.owner,
    selected: true, publicationApproved: true }), /mismatch/);
});
test('independent supply has no need pointer and routes without money', () => {
  const { need, capacity } = fixture();
  assert(!canonical(capacity).includes('need-001'));
  const [p] = routeCapacity(need, [capacity], now);
  assert.equal(p.quantity, 1); assert.equal(p.state, 'candidate_source_admission_required');
  assert(p.reasons.length >= 7 && p.uncertainty.length >= 3);
});
test('routing order and duplicated inputs have identical deterministic results', () => {
  const { need, capacity, helper } = fixture();
  const another = sealRouting('capacity', { ...capacity.payload, id: 'capacity-002', source: { ...capacity.payload.source, object: 'capacity-002' } }, helper);
  assert.deepEqual(routeCapacity(need, [capacity, another, capacity], now), routeCapacity(need, [another, capacity], now));
});
test('cord and bundle never convert; wrong resource, kind, region and boundaries do not match', () => {
  const { need, capacity, helper } = fixture();
  for (const change of [{ unit: 'bundle' }, { resource: 'firewood' }, { kind: 'service' }, { region: 'south-county' }, { boundaries: [] }]) {
    const other = sealRouting('capacity', { ...capacity.payload, ...change }, helper);
    assert.deepEqual(routeCapacity(need, [other], now), []);
  }
});
test('usable quantity is explicit and never exceeds either source quantity', () => {
  const { need, capacity, owner } = fixture();
  const large = sealRouting('need', { ...need.payload, quantity: 7 }, owner);
  assert.equal(routeCapacity(large, [capacity], now)[0].quantity, 1);
});
test('revoked, expired, reserved, declined, contested and unsafe capacities do not route', () => {
  const { need, capacity, helper } = fixture();
  for (const status of ['reserved', 'declined', 'withdrawn', 'expired', 'contested', 'unsafe']) {
    assert.deepEqual(routeCapacity(need, [sealRouting('capacity', { ...capacity.payload, status }, helper)], now), []);
  }
  assert.deepEqual(routeCapacity(need, [capacity], capacity.payload.expiresAt), []);
});
test('destination/contact injection and signature substitution fail before routing', () => {
  const { need, capacity, helper } = fixture();
  for (const privateField of ['contact', 'destination', 'phone', 'medicalFacts', 'preciseAddress', 'membership']) {
    assert.throws(() => sealRouting('need', { ...need.payload, [privateField]: 'attacker' }, helper), /schema/);
  }
  assert.throws(() => routeCapacity(need, [{ ...capacity, payload: { ...capacity.payload, region: 'attacker-county' } }], now), /signature/);
});
test('source version, authority and owner continuity are protected during mirror updates', () => {
  const { need, owner, helper } = fixture();
  const mirror = new RoutingMirror(); mirror.receive(need);
  const revision = reviseRouting(need, {}, owner);
  for (const substitute of [sealRouting('need', revision.payload, helper),
    sealRouting('need', { ...revision.payload, source: { ...revision.payload.source, authority: 'attacker-circle' } }, owner)]) {
    assert.throws(() => mirror.receive(substitute), /substituted/);
  }
});
test('withdrawn source cannot reopen or reappear on a new live public page', async () => {
  const { need, owner } = fixture();
  const withdrawn = reviseRouting(need, { status: 'withdrawn' }, owner);
  const mirror = new RoutingMirror(); mirror.receive(need); mirror.receive(withdrawn);
  assert.deepEqual(routeCapacity(withdrawn, [], now), []);
  assert.throws(() => reviseRouting(withdrawn, { status: 'open' }, owner), /Retired/);
  const page = await publicRoutingPage(need, async () => hash(withdrawn), now);
  assert(!page.includes('wheelchair'));
  assert(!((await publicRoutingPage(withdrawn, async () => hash(withdrawn), now)).includes('wheelchair')));
});
test('source outage and expiry HOLD a new public view rather than advertise a stale need', async () => {
  const { need } = fixture();
  assert(!(await publicRoutingPage(need, async () => { throw new Error('offline'); }, now)).includes('wheelchair'));
  assert((await publicRoutingPage(need, async () => hash(need), now)).includes('wheelchair'));
  assert(!(await publicRoutingPage(need, async () => hash(need), need.payload.expiresAt)).includes('wheelchair'));
});
test('cold processes reconstruct exact signed history from each of two mirrors', () => {
  const { need, capacity } = fixture();
  const directory = mkdtempSync(path.join(tmpdir(), 'treasury-cold-'));
  try {
    const expected = routeCapacity(need, [capacity], now);
    for (const name of ['mirror-a', 'mirror-b']) {
      const mirror = new RoutingMirror(); mirror.receive(need); mirror.receive(capacity);
      const file = path.join(directory, `${name}.json`); writeFileSync(file, JSON.stringify(mirror.export()));
      const cold = JSON.parse(execFileSync(process.execPath, ['src/routing/cold-verify.mjs', file, now], { encoding: 'utf8' }));
      assert.deepEqual(cold.proposals, expected); assert(cold.authority.includes('none'));
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('hostile bundles cannot partially change a mirror; stale origins are rejected', () => {
  const { need, owner } = fixture();
  const mirror = new RoutingMirror(); mirror.receive(need);
  const next = reviseRouting(need, {}, owner);
  assert.throws(() => mirror.import([next, { ...next, signature: 'bad' }]));
  assert.equal(hash(mirror.latest('need', need.payload.id)), hash(need));
  mirror.receive(next); assert.throws(() => mirror.receive(need), /Stale/);
});
test('private contact requires both latest signed consents and never enters history', async () => {
  const { need, capacity, owner, helper } = fixture();
  const proposal = routeCapacity(need, [capacity], now)[0];
  const consent = (party, keys, decision = 'allow') => sealRouting('consent', {
    proposalId: proposal.id, party, decision, expiresAt: need.payload.expiresAt }, keys);
  let reads = 0;
  const base = { proposal, need, capacity, now, challengeSources: async () => ({needHash:hash(need),capacityHash:hash(capacity)}),
    readPrivateContact: async () => { reads++; return 'PRIVATE CONTACT'; } };
  await assert.rejects(exchangePrivateContact({ ...base, readLatestConsents:async()=>[consent('requester', owner)] }));
  for (const decision of ['decline', 'withdraw']) {
    await assert.rejects(exchangePrivateContact({ ...base, readLatestConsents:async()=>[consent('requester', owner), consent('helper', helper, decision)] }));
  }
  assert.equal(reads, 0);
  const both = [consent('requester', owner), consent('helper', helper)];
  await assert.rejects(exchangePrivateContact({ ...base, challengeSources:async()=>({needHash:'stale',capacityHash:hash(capacity)}),readLatestConsents:async()=>both }), /stale/);
  assert.equal(await exchangePrivateContact({ ...base, readLatestConsents:async()=>both }), 'PRIVATE CONTACT');
  assert.throws(() => new RoutingMirror().receive(both[0]), /Private/);
});
test('proposal quantity/reason laundering cannot reach native RPC or private contacts', async () => {
  const { need, capacity } = fixture(); const p = routeCapacity(need, [capacity], now)[0];
  let called = false;
  const adapter = new GardenAdmissionAdapter(async () => { called = true; });
  for (const change of [{ quantity: 999 }, { state: 'confirmed' }, { capacityHash: 'a'.repeat(64) }]) {
    await assert.rejects(adapter.propose({ need, capacity, proposal: { ...p, ...change }, now, expectedHead: 'none' }), /substituted/);
  }
  assert.equal(called, false);
});
test('transport success has no confirmation method or delivery evidence', async () => {
  const { need, capacity } = fixture();
  const proposal = routeCapacity(need, [capacity], now)[0];
  const adapter = new GardenAdmissionAdapter(async () => ({ status: 'transported_only' }));
  await assert.rejects(adapter.propose({ need, capacity, proposal, now, expectedHead: 'unknown' }), /HOLD/);
  assert.equal(adapter.confirm, undefined); assert.equal(adapter.reserve, undefined);
});
test('malformed quantities, dates and unbounded metadata are rejected', () => {
  const { capacity, helper } = fixture();
  for (const change of [{ quantity: NaN }, { quantity: 1.5 }, { quantity: -1 }, { validFrom: 'today' },
    { expiresAt: '2026-01-01T00:00:00.000Z' }, { boundaries: ['private address here'] }]) {
    assert.throws(() => sealRouting('capacity', { ...capacity.payload, ...change }, helper));
  }
  assert.throws(() => validateRouting({ ...capacity, signature: capacity.signature + '=' }));
});
test('HTTP adapter forwards the source session and refuses unsupported confirmation operations', async () => {
  let request;
  const rpc = createGardenRpcClient({ sourceUrl:'https://source.example.invalid/',anonKey:'public-key',accessToken:async()=> 'session-token',
    fetchImpl:async(url,options)=>{request={url:String(url),options};return {ok:true,json:async()=>({source:'receipt'})};} });
  assert.deepEqual(await rpc('rpc_accept_offer',{_offer_id:'pledge-001'}),{source:'receipt'});
  assert.equal(request.options.headers.Authorization,'Bearer session-token');
  assert.equal(request.options.redirect,'error');
  assert.equal(request.url,'https://source.example.invalid/rest/v1/rpc/rpc_accept_offer');
  await assert.rejects(rpc('rpc_confirm_fulfillment',{}), /Unsupported/);
});
test('HTTP source errors and missing authentication fail closed without private body reflection', async () => {
  let called=false;
  const base={sourceUrl:'https://source.example.invalid/',anonKey:'public-key',accessToken:async()=>'',
    fetchImpl:async()=>{called=true;return {ok:false,status:403,json:async()=>({private:'SECRET CONTACT'})};}};
  await assert.rejects(createGardenRpcClient(base)('rpc_accept_offer',{}), /missing/); assert.equal(called,false);
  await assert.rejects(createGardenRpcClient({...base,accessToken:async()=> 'session'})('rpc_accept_offer',{}),
    error=>error.message==='HOLD: source admission failed (403)');
  assert.throws(()=>createGardenRpcClient({...base,sourceUrl:'http://insecure.example.invalid/'}), /HTTPS/);
});
test('expired consent and a substituted helper key cannot read private contacts', async () => {
  const {need,capacity,owner,helper}=fixture(); const proposal=routeCapacity(need,[capacity],now)[0]; let reads=0;
  const consent=(party,keys,expiresAt)=>sealRouting('consent',{proposalId:proposal.id,party,decision:'allow',expiresAt},keys);
  const base={proposal,need,capacity,now,challengeSources:async()=>({needHash:hash(need),capacityHash:hash(capacity)}),readPrivateContact:async()=>{reads++;}};
  for(const invalid of [consent('helper',helper,now),consent('helper',identity(),need.payload.expiresAt)]) {
    await assert.rejects(exchangePrivateContact({...base,readLatestConsents:async()=>[consent('requester',owner,need.payload.expiresAt),invalid]}));
  }
  assert.equal(reads,0);
});
