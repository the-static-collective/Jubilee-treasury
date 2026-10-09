import test from 'node:test';
import assert from 'node:assert/strict';
import { ArcadeBox, verifyHistory, inspectImage, sixDevelopments } from '../src/haunted-jubilee-arcade-019.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9eO1Jc0AAAAASUVORK5CYII=', 'base64');
const edge = (sequence = 1) => ({ deviceId: 'simulated-crank-A', sessionId: 'synthetic-session', sequence, direction: 'CW', ticks: 1 });
const input = (n = 1, permission = { review: true, print: true, mail: true }) =>
  ({ edge: edge(n), alias: 'Neighbor', offer: 'I can repair bicycles', imageBytes: png, imageMime: 'image/png',
    permissions: permission, flash: 'SIMULATED_POP' });
const ready = () => {
  const a = new ArcadeBox('ARCADE-A');
  const b = new ArcadeBox('ARCADE-B');
  const candidate = a.turn(input());
  a.choose(candidate.id, 3, 'KEEP', 'Neighbor');
  const card = a.approvePrint(candidate.id, 'HumanOperator');
  const parcel = a.prepareMail({ candidateId: candidate.id, to: b.id, by: 'HumanOperator', time: 'MAIL' });
  return { a, b, candidate, card, parcel };
};

test('one edge produces one proposal, never a native work or custody claim', () => {
  const box = new ArcadeBox('ARCADE-A');
  const candidate = box.turn(input());
  assert.equal(candidate.status, 'PROPOSAL_ONLY');
  assert.equal(candidate.isCranknodeNativeReceipt, false);
  assert.equal(candidate.image.sourceKind, 'imported-bytes-not-camera-shutter');
  assert.equal(box.history.filter(e => e.type === 'OFFER_CANDIDATE_HELD').length, 1);
  assert.throws(() => box.turn(input()), /already consumed/);
  assert.equal(box.snapshot().activePennyUnits, 0);
});

test('invalid work still spends the simulated edge, with no retry loophole', () => {
  const box = new ArcadeBox('ARCADE-A');
  const bad = { ...input(), offer: '' };
  assert.throws(() => box.turn(bad), /invalid offer/);
  assert.equal(box.history.at(-1).type, 'TURN_REFUSED_NO_WORK');
  assert.throws(() => box.turn(input()), /already consumed/);
});

test('hardware cannot smuggle semantic authority and extra ticks', () => {
  const box = new ArcadeBox('ARCADE-A');
  assert.throws(() => box.turn({ ...input(), edge: { ...edge(), publish: true } }), /additional fields/);
  assert.throws(() => box.turn({ ...input(), edge: { ...edge(), ticks: 2 } }), /bounded edge/);
});

test('canonical image stays exact bytes only, never exported into journal', () => {
  const box = new ArcadeBox('ARCADE-A');
  const candidate = box.turn(input());
  assert.equal(candidate.image.sha256, inspectImage(png, 'image/png').sha256);
  assert.equal(JSON.stringify(box.snapshot()).includes(png.toString('base64')), false);
  assert.throws(() => inspectImage(Buffer.from('pretend photo'), 'image/png'), /magic mismatch/);
});

test('six descendant proposals preserve one original and generate no pixels', () => {
  const box = new ArcadeBox('ARCADE-A');
  const candidate = box.turn(input());
  const frames = sixDevelopments(candidate);
  assert.equal(frames.length, 6);
  assert.equal(new Set(frames.map(f => f.developmentId)).size, 6);
  assert.ok(frames.every(f => f.originalImageSha256 === candidate.image.sha256 && !f.pixelsGenerated));
});

test('human COMPOST means no postcard', () => {
  const box = new ArcadeBox('ARCADE-A');
  const candidate = box.turn(input());
  box.choose(candidate.id, 0, 'COMPOST', 'Neighbor');
  assert.throws(() => box.approvePrint(candidate.id, 'Operator'), /no keepable photograph/);
});

test('review consent never implies permission to print or mail', () => {
  const box = new ArcadeBox('ARCADE-A');
  const candidate = box.turn(input(1, { review: true, print: false, mail: false }));
  box.choose(candidate.id, 2, 'KEEP', 'Neighbor');
  assert.throws(() => box.approvePrint(candidate.id, 'Operator'), /permission absent/);
});

test('card approval is a print PROJECTION, not a device event', () => {
  const { a, card } = ready();
  assert.equal(card.printedPhysically, false);
  assert.match(card.text, /NOT PHYSICALLY PRINTED/);
  assert.ok(a.history.some(e => e.type === 'HUMAN_PRINT_PROJECTION_APPROVED'));
  assert.equal(a.history.some(e => e.type === 'PHYSICAL_PRINT_CONFIRMED'), false);
});

test('two boxes accept one intact MAIL parcel as HOLD, without publishing', () => {
  const { a, b, parcel } = ready();
  const before = verifyHistory(a.snapshot().history);
  const receipt = b.receive(parcel);
  assert.equal(receipt.status, 'HOLD');
  assert.equal(receipt.canBroadcast, false);
  assert.equal(receipt.canIssuePenny, false);
  assert.equal(verifyHistory(a.snapshot().history), before);
  assert.equal(b.snapshot().stationPublications, 0);
});

test('the second arrival is a duplicate, not another story or contribution', () => {
  const { b, parcel } = ready();
  b.receive(parcel);
  assert.throws(() => b.receive(parcel), /duplicate postal delivery/);
  assert.equal(b.history.filter(e => e.type === 'RECEIVED_FOR_LOCAL_HUMAN_REVIEW_HELD').length, 1);
});

test('tampering with parcel, card, journal or ancestry is refused', () => {
  const { b, parcel } = ready();
  assert.throws(() => b.receive({ ...parcel, destination: 'ARCADE-Z' }), /altered parcel/);
  const tampered = structuredClone(parcel);
  tampered.history[1].payload.candidate.offer = 'completely different offer';
  assert.throws(() => verifyHistory(tampered.history), /changed event bytes/);
  const altered = structuredClone(parcel);
  altered.card.text = 'forged card';
  assert.throws(() => b.receive(altered), /altered parcel/);
});

test('wrong destination is denied even if parcel checksum is intact', () => {
  const { parcel } = ready();
  const foreign = new ArcadeBox('UNRELATED-C');
  assert.throws(() => foreign.receive(parcel), /wrong receiving box/);
});

test('withdrawal prevents new mail and cannot silently erase previous history', () => {
  const box = new ArcadeBox('ARCADE-A');
  const candidate = box.turn(input());
  box.choose(candidate.id, 1, 'HAUNT', 'Neighbor');
  box.approvePrint(candidate.id, 'Operator');
  const before = box.snapshot().head;
  box.withdraw(candidate.id, 'Neighbor');
  assert.notEqual(box.snapshot().head, before);
  assert.throws(() => box.prepareMail({ candidateId: candidate.id, to: 'ARCADE-B', by: 'Operator' }), /mail rights or card missing/);
});

test('coin declarations remain held and never create backing, issuance or a donation', () => {
  const box = new ArcadeBox('ARCADE-A');
  box.claimPenny({ claimId: 'coin-report-1', numberOfCoins: 37, by: 'WitnessAlias' });
  assert.equal(box.snapshot().coinBackingVerified, 0);
  assert.equal(box.snapshot().activePennyUnits, 0);
  assert.throws(() => box.claimPenny({ claimId: 'coin-report-1', numberOfCoins: 37, by: 'WitnessAlias' }), /duplicate coin/);
});

test('a receiver may reinterpret the card without changing the parent source', () => {
  const { a, b, parcel, card } = ready();
  const sourceHead = a.snapshot().head;
  b.receive(parcel);
  const child = b.interpretHeir(parcel.id, 'Receiver', 'Maybe the repair becomes a neighborhood workshop');
  assert.equal(child.parentCardId, card.id);
  assert.equal(child.published, false);
  assert.equal(a.snapshot().head, sourceHead);
  assert.throws(() => b.interpretHeir(parcel.id, 'Receiver', 'repeat'), /already interpreted/);
});

test('no implicit permissions, photography authenticity, or airplay', () => {
  const box = new ArcadeBox('ARCADE-A');
  assert.throws(() => box.turn(input(1, { review: true, print: true, mail: true, air: true })), /additional fields/);
  assert.equal(box.snapshot().stationPublications, 0);
});
