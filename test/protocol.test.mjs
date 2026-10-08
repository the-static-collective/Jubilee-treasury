import test from 'node:test';
import assert from 'node:assert/strict';
import { canonical, hash, identity, seal, verify, firstNeed, nextNeed, Mirror, makeOffer, proposeMatches, makeDecision, makeReport, publicPage } from '../src/protocol.mjs';
const keys = identity(), other = identity();
const fixture = () => firstNeed(keys, {id:'need-winter-001',title:'Need firewood and food',summary:'Safe public summary',region:'local-region',requirements:[{id:'req-firewood-001',resource:'firewood',quantity:2,unit:'cord',kind:'goods'},{id:'req-food-001',resource:'groceries',quantity:3,unit:'box',kind:'goods'}]});
const offerFor = (n = fixture()) => makeOffer(other, {id:'offer-wood-001',need:n,requirementId:'req-firewood-001',region:'local-region',quantity:2,unit:'cord',kind:'goods'});
const throws = (fn, msg) => assert.throws(fn, msg);

test('canonical representation does not depend on key ordering', () => assert.equal(canonical({z:1,a:{b:2,a:1}}), canonical({a:{a:1,b:2},z:1})));
test('signed envelope verifies and tampering is rejected', () => { const n=fixture();assert.equal(verify(n), true);const bad=structuredClone(n);bad.payload.public.summary='different';assert.equal(verify(bad), false); });
test('owner signed portable snapshots survive origin host loss', () => {
  const original=fixture(), a=new Mirror('A'), b=new Mirror('B'), c=new Mirror('C');
  [a,b,c].forEach(h=>assert.equal(h.receive(original),'admitted'));
  const moved=nextNeed(keys,original,{public:{...original.payload.public,title:'Updated household request'}});
  b.receive(moved);c.receive(moved);const restore=new Mirror('D');restore.import(b.export(original.payload.id));
  assert.equal(hash(restore.latest(original.payload.id)),hash(c.latest(original.payload.id)));
  assert.equal(restore.latest(original.payload.id).payload.revision,2);
  assert.equal(a.latest(original.payload.id).payload.revision,1);
});
test('replaying latest is idempotent', () => {const n=fixture(), h=new Mirror('A');h.receive(n);assert.equal(h.receive(n),'duplicate');assert.equal(h.export(n.payload.id).length,1);});
test('stale updates, gap, and forking same revision fail closed', () => {
  const n=fixture(), h=new Mirror('A');h.receive(n);const two=nextNeed(keys,n);h.receive(two);
  throws(()=>h.receive(n),/Stale/);
  throws(()=>h.receive(nextNeed(keys,n,{status:'withdrawn'})),/Stale/);
  const three=nextNeed(keys,two), four=nextNeed(keys,three);
  throws(()=>h.receive(four),/Stale/);
  assert.equal(h.latest(n.payload.id).payload.revision,2);
});
test('owner substitution and forged update are refused', () => {
  const n=fixture(), h=new Mirror('A');h.receive(n);throws(()=>nextNeed(other,n),/Only owner/);
  const f=seal('need',{...n.payload,revision:2,previousHash:hash(n)},other);
  throws(()=>h.receive(f),/Owner key substitution/);
});
test('signed withdrawal suppresses matching and refuses reactivation', () => {
  const n=fixture(), withdrawn=nextNeed(keys,n,{status:'withdrawn'}), h=new Mirror('A');h.import([n,withdrawn]);
  assert.deepEqual(proposeMatches(withdrawn,[offerFor(n)]),[]);
  throws(()=>nextNeed(keys,withdrawn,{status:'open'}),/Withdrawn/);
  throws(()=>makeOffer(other,{id:'offer-after-001',need:withdrawn,requirementId:'req-firewood-001',region:'local-region',quantity:1,unit:'cord',kind:'goods'}),/Withdrawn/);
});
test('offers bind to exact request snapshot and disclose deterministic reasons', () => {
  const n=fixture(), offer=offerFor(n);const matches=proposeMatches(n,[offer]);
  assert.equal(matches.length,1);assert.equal(matches[0].state,'proposal_not_acceptance');
  assert.equal(proposeMatches(nextNeed(keys,n),[offer]).length,0);
});
test('invalid, wrong region and mismatched requirement offers do not route', () => {
  const n=fixture(), o=offerFor(n), tampered=structuredClone(o);
  tampered.payload.region='local-region';tampered.payload.quantity=7;
  assert.equal(proposeMatches(n,[tampered]).length,0);
  const remote=makeOffer(other,{id:'offer-far-001',need:n,requirementId:'req-firewood-001',region:'other-region',quantity:1,unit:'cord',kind:'goods'});
  assert.equal(proposeMatches(n,[remote]).length,0);
  throws(()=>makeOffer(other,{id:'offer-bad-001',need:n,requirementId:'req-food-001',region:'local-region',quantity:1,unit:'cord',kind:'goods'}),/Requirement mismatch/);
});
test('helper claim cannot become human confirmation without signed report', () => {
  const n=fixture(),o=offerFor(n),accepted=makeDecision(keys,n,o,'accepted');
  throws(()=>makeDecision(keys,n,o,'confirmed'),/requires signed helper report/);
  throws(()=>makeReport(keys,n,o,accepted),/Only helper/);
  const report=makeReport(other,n,o,accepted);const confirmed=makeDecision(keys,n,o,'confirmed',report);
  assert.equal(confirmed.payload.stage,'confirmed');assert.equal(confirmed.publicKey,keys.publicKey);
});
test('unrelated signed report cannot confirm a distinct offer', () => {
  const n=fixture(),o=offerFor(n),accept=makeDecision(keys,n,o,'accepted'),report=makeReport(other,n,o,accept);
  const another=makeOffer(other,{id:'offer-wood-002',need:n,requirementId:'req-firewood-001',region:'local-region',quantity:2,unit:'cord',kind:'goods'});
  throws(()=>makeDecision(keys,n,another,'confirmed',report),/requires signed helper report/);
});
test('owner-acceptance is not helper self-approval', () => {const n=fixture(),o=offerFor(n);throws(()=>makeDecision(other,n,o,'accepted'),/Recipient authority/);});
test('private/protected fields cannot be published in manifest', () => {
  const n=fixture();const x=seal('need',{...n.payload,privateAddress:'123 Private Rd'},keys);
  throws(()=>new Mirror('a').receive(x),/schema mismatch/);
  const y=seal('need',{...n.payload,public:{...n.payload.public,phone:'555-1212'}},keys);
  throws(()=>new Mirror('a').receive(y),/approved fields/);
});
test('import is atomic on hostile bundles', () => {
  const n=fixture(), a=new Mirror('A'), b=nextNeed(keys,n), malicious=nextNeed(keys,n,{status:'withdrawn'});
  throws(()=>a.import([n,b,malicious]),/Stale/);assert.equal(a.latest(n.payload.id),null);
});
test('public page escapes hostile markup and does not assert verified identity', () => {
  const n=fixture(), x=seal('need',{...n.payload,public:{...n.payload.public,title:'<img src=x onerror=alert(1)>'}},keys);
  const html=publicPage(x);assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.match(html,/not real-world identity/);
});
test('zero-dollar requests function without payment integrations', () => {const n=fixture(), h=new Mirror('offline');assert.equal(h.receive(n),'admitted');assert.equal(h.latest(n.payload.id).payload.public.requirements[0].kind,'goods');});
test('unsealed offer cannot be matched by a mirror', () => {const n=fixture();assert.deepEqual(proposeMatches(n,[{type:'offer',payload:{}}]),[]);});
