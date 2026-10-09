// PENNY-019: intentionally self-contained, offline simulator. NOT a native runtime adapter.
import { createHash } from 'node:crypto';

const sha = value => createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(message); };
const check = (ok, message) => { if (!ok) fail(message); };
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const exact = (value, fields, name) => {
  check(plain(value), name + ' must be an object');
  check(Object.keys(value).sort().join('|') === [...fields].sort().join('|'), name + ' has missing or additional fields');
};
const canonical = value => {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (plain(value)) return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  check(value !== undefined && (value === null || ['string', 'number', 'boolean'].includes(typeof value)), 'unsupported value');
  if (typeof value === 'number') check(Number.isFinite(value), 'nonfinite number');
  return JSON.stringify(value);
};
const digest = value => sha(canonical(value));
const copy = value => JSON.parse(JSON.stringify(value));
const identifier = (value, name, max = 60) => {
  check(typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._ -]*$/.test(value) && value.length <= max, 'invalid ' + name);
  return value;
};
const statement = (value, name, max = 240) => {
  check(typeof value === 'string' && value.trim().length >= 1 && value.length <= max && !/[\r\n\u0000-\u001f]/.test(value), 'invalid ' + name);
  return value;
};

export function verifyHistory(history) {
  check(Array.isArray(history), 'missing history');
  let previous = 'GENESIS';
  for (let i = 0; i < history.length; i++) {
    const event = history[i];
    exact(event, ['index', 'prev', 'type', 'payload', 'hash'], 'event');
    check(event.index === i && event.prev === previous, 'broken event ancestry');
    check(event.hash === digest({ index: i, prev: previous, type: event.type, payload: event.payload }), 'changed event bytes');
    previous = event.hash;
  }
  return previous;
}

export function inspectImage(bytes, mime) {
  check(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= 2_000_000, 'image must be local bytes <= 2 MB');
  check(mime === 'image/png' || mime === 'image/jpeg', 'image MIME refused');
  const png = bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  const jpeg = bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  check(mime === 'image/png' ? png : jpeg, 'image magic mismatch');
  // Magic bytes are NOT a decoding, consent, or photography-authenticity certificate.
  return { mime, byteLength: bytes.length, sha256: sha(bytes), sourceKind: 'imported-bytes-not-camera-shutter' };
}

const looks = ['PORCH_LIGHT', 'GHOST_NEGATIVE', 'HANDWRITTEN_MARGIN', 'TREE_RING', 'MISSED_THREAD', 'DAWN_AFTERIMAGE'];
export function sixDevelopments(candidate) {
  check(plain(candidate) && typeof candidate.id === 'string' && candidate.image && /^[a-f0-9]{64}$/.test(candidate.image.sha256), 'candidate image required');
  return looks.map((lens, index) => ({
    index, lens, originalImageSha256: candidate.image.sha256,
    developmentId: digest({ candidateId: candidate.id, lens, index }),
    pixelsGenerated: false, rightsGranted: false
  }));
}

export class ArcadeBox {
  constructor(boxId) {
    this.id = identifier(boxId, 'box ID');
    this.history = [];
    this.edges = new Set();
    this.candidates = new Map();
    this.choices = new Map();
    this.prints = new Map();
    this.withdrawn = new Set();
    this.incoming = new Map();
    this.admitted = new Set();
  }
  record(type, payload) {
    const event = { index: this.history.length, prev: this.history.at(-1)?.hash ?? 'GENESIS', type, payload: copy(payload) };
    event.hash = digest(event);
    this.history.push(event);
    return copy(event);
  }
  snapshot() {
    verifyHistory(this.history);
    return copy({ schema: 'haunted-jubilee-arcade-019/snapshot', boxId: this.id, history: this.history, head: verifyHistory(this.history),
      coinBackingVerified: 0, activePennyUnits: 0, stationPublications: 0 });
  }
  turn({ edge, alias, offer, imageBytes, imageMime, permissions, flash = 'OFF' }) {
    exact(edge, ['deviceId', 'sessionId', 'sequence', 'direction', 'ticks'], 'crank edge');
    identifier(edge.deviceId, 'device'); identifier(edge.sessionId, 'session');
    check(Number.isSafeInteger(edge.sequence) && edge.sequence >= 0 && edge.direction && ['CW', 'CCW'].includes(edge.direction) && edge.ticks === 1, 'invalid bounded edge');
    check(flash === 'OFF' || flash === 'SIMULATED_POP', 'real flash hardware unavailable');
    const edgeId = digest(edge);
    check(!this.edges.has(edgeId), 'edge already consumed');
    // An accepted simulated edge is spent before examining candidate content.
    this.edges.add(edgeId);
    this.record('SIMULATED_EDGE_CONSUMED', { edgeId, simulated: true, oneTurnOnly: true });
    try {
      identifier(alias, 'alias', 40); statement(offer, 'offer');
      exact(permissions, ['review', 'print', 'mail'], 'permission set');
      check(Object.values(permissions).every(v => typeof v === 'boolean') && permissions.review === true, 'private review permission required');
      const image = inspectImage(imageBytes, imageMime);
      const candidate = { schema: 'haunted-jubilee-arcade-019/candidate', boxId: this.id, edgeId, alias, offer, image, permissions: copy(permissions),
        flash, status: 'PROPOSAL_ONLY', isKinshipSubmission: false, isCranknodeNativeReceipt: false };
      candidate.id = digest(candidate);
      this.candidates.set(candidate.id, candidate);
      this.record('OFFER_CANDIDATE_HELD', { candidate });
      return copy(candidate);
    } catch (error) {
      this.record('TURN_REFUSED_NO_WORK', { edgeId, reason: error.message });
      throw error;
    }
  }
  choose(candidateId, variant, decision, by) {
    const candidate = this.candidates.get(candidateId);
    check(candidate && !this.choices.has(candidateId), 'unknown or already developed candidate');
    identifier(by, 'chooser');
    check(['KEEP', 'COMPOST', 'HAUNT'].includes(decision), 'unknown development decision');
    const selected = sixDevelopments(candidate).find(d => d.index === variant);
    check(selected, 'variant must be 0..5');
    this.choices.set(candidateId, { selected, decision, by });
    this.record('HUMAN_DEVELOPMENT_CHOICE', { candidateId, selected, decision, by });
    return copy({ selected, decision });
  }
  approvePrint(candidateId, by) {
    const candidate = this.candidates.get(candidateId);
    const choice = this.choices.get(candidateId);
    check(candidate && choice && choice.decision !== 'COMPOST', 'no keepable photograph');
    check(candidate.permissions.print && !this.withdrawn.has(candidateId), 'printing permission absent or withdrawn');
    check(!this.prints.has(candidateId), 'card already prepared');
    identifier(by, 'approver');
    const lines = ['HAUNTED JUBILEE ARCADE / 019', 'OFFER: ' + candidate.offer, 'FROM: ' + candidate.alias,
      'DEVELOPMENT: ' + choice.selected.lens, 'SOURCE SHA-256: ' + candidate.image.sha256,
      'CANDIDATE: ' + candidateId, 'STATUS: HUMAN-APPROVED PRINT PROJECTION / NOT PHYSICALLY PRINTED',
      'NOT CASH, CURRENCY, PROOF OF SERVICE OR PERMISSION TO BROADCAST'];
    const card = { schema: 'haunted-jubilee-arcade-019/card', candidateId, by, text: lines.join('\n'), sourceImageSha256: candidate.image.sha256,
      variantId: choice.selected.developmentId, printedPhysically: false };
    card.id = digest(card);
    this.prints.set(candidateId, card);
    this.record('HUMAN_PRINT_PROJECTION_APPROVED', { card });
    return copy(card);
  }
  withdraw(candidateId, by) {
    check(this.candidates.has(candidateId), 'unknown candidate');
    identifier(by, 'withdrawer');
    check(!this.withdrawn.has(candidateId), 'already withdrawn');
    this.withdrawn.add(candidateId);
    this.record('FUTURE_REUSE_WITHDRAWN', { candidateId, by });
  }
  claimPenny({ claimId, numberOfCoins, by }) {
    identifier(claimId, 'coin claim'); identifier(by, 'coin claimant');
    check(Number.isSafeInteger(numberOfCoins) && numberOfCoins > 0 && numberOfCoins <= 1000, 'invalid physical coin count');
    check(!this.history.some(e => e.type === 'UNVERIFIED_COIN_REPORT_HELD' && e.payload.claimId === claimId), 'duplicate coin claim');
    this.record('UNVERIFIED_COIN_REPORT_HELD', { claimId, numberOfCoins, by, backingAdmitted: 0, pennyUnitsIssued: 0,
      notPenny014Custody: true, notProofOfPhysicalCoins: true });
    return this.snapshot();
  }
  prepareMail({ candidateId, to, by, time = 'MAIL' }) {
    const candidate = this.candidates.get(candidateId);
    const card = this.prints.get(candidateId);
    check(candidate && card && candidate.permissions.mail && !this.withdrawn.has(candidateId), 'mail rights or card missing');
    check(['NOW', 'MAIL', 'HEIR'].includes(time), 'invalid braided time');
    identifier(to, 'receiver'); identifier(by, 'mailer');
    check(to !== this.id, 'boxes must be independently identified');
    const mailKey = digest({ candidateId, to, cardId: card.id });
    check(!this.history.some(e => e.type === 'MAIL_CANDIDATE_PREPARED' && e.payload.mailKey === mailKey), 'same card/destination already prepared');
    this.record('MAIL_CANDIDATE_PREPARED', { candidateId, to, by, time, mailKey, status: 'TRANSPORT_CANDIDATE_NOT_DELIVERY' });
    const snapshot = this.snapshot();
    const payload = { schema: 'haunted-jubilee-arcade-019/parcel', origin: this.id, destination: to, time, candidate, card, history: snapshot.history,
      originHead: snapshot.head, mailKey, nature: 'UNSIGNED_OFFLINE_SIMULATION_NOT_RELATTE_ADMISSION' };
    return copy({ ...payload, id: digest(payload) });
  }
  receive(parcel) {
    check(plain(parcel), 'parcel required');
    const { id, ...payload } = parcel;
    check(id === digest(payload), 'altered parcel');
    exact(payload, ['schema', 'origin', 'destination', 'time', 'candidate', 'card', 'history', 'originHead', 'mailKey', 'nature'], 'parcel');
    check(payload.schema === 'haunted-jubilee-arcade-019/parcel' && payload.destination === this.id && payload.origin !== this.id, 'wrong receiving box');
    check(!this.incoming.has(id), 'duplicate postal delivery');
    check(verifyHistory(payload.history) === payload.originHead, 'source history changed');
    const origin = payload.history;
    const last = origin.at(-1);
    check(last?.type === 'MAIL_CANDIDATE_PREPARED' && last.payload.mailKey === payload.mailKey && last.payload.to === this.id, 'missing exact source mail event');
    check(origin.some(e => e.type === 'OFFER_CANDIDATE_HELD' && e.payload.candidate.id === payload.candidate.id && canonical(e.payload.candidate) === canonical(payload.candidate)), 'source candidate missing');
    check(origin.some(e => e.type === 'HUMAN_PRINT_PROJECTION_APPROVED' && canonical(e.payload.card) === canonical(payload.card)), 'human-approved original card missing');
    check(!origin.some(e => e.type === 'FUTURE_REUSE_WITHDRAWN' && e.payload.candidateId === payload.candidate.id), 'withdrawn source');
    check(payload.candidate.permissions.mail === true && payload.candidate.permissions.print === true, 'missing source mail/print permission');
    check(payload.card.id === digest(Object.fromEntries(Object.entries(payload.card).filter(([k]) => k !== 'id'))), 'changed card');
    check(payload.mailKey === digest({ candidateId: payload.candidate.id, to: this.id, cardId: payload.card.id }), 'wrong mailing key');
    this.incoming.set(id, copy(parcel));
    this.record('RECEIVED_FOR_LOCAL_HUMAN_REVIEW_HELD', { parcelId: id, sourceHead: payload.originHead, status: 'HOLD_NOT_STATION_OR_TREASURY_ADMISSION' });
    return copy({ parcelId: id, status: 'HOLD', canBroadcast: false, canIssuePenny: false });
  }
  interpretHeir(parcelId, by, interpretation) {
    check(this.incoming.has(parcelId) && !this.admitted.has(parcelId), 'unknown or already interpreted parcel');
    identifier(by, 'receiver owner'); statement(interpretation, 'interpretation');
    this.admitted.add(parcelId);
    const parent = this.incoming.get(parcelId);
    this.record('OWNER_LOCAL_HEIR_INTERPRETATION', { parcelId, originalCardId: parent.card.id, by, interpretation,
      rightsLimitedTo: 'LOCAL_PRIVATE_STORY_ONLY', notPublication: true, notWorkConfirmation: true });
    return copy({ parcelId, parentCardId: parent.card.id, interpretation, status: 'PRIVATE_HEIR_INTERPRETATION', published: false });
  }
}
