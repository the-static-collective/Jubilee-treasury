// PENNY BOX 001: local-only append journal. Observations are NOT settlements or PENNY issuance.
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const JOURNAL_SCHEMA = 'penny-box.local-observation.v1';
export const UNITS = Object.freeze({
  pennies: 'physical pennies counted',
  deliveries: 'deliveries confirmed',
  devices: 'devices received'
});
const OFFERS = new Set(['time', 'transport', 'equipment', 'groceries']);
const sha = str => createHash('sha256').update(str).digest('hex');
const valueText = (v, label, max = 180) => {
  if (typeof v !== 'string' || !v.trim() || v.length > max || /[\r\n\x00-\x1f]/.test(v))
    throw Error('Invalid ' + label);
  return v.trim();
};
const count = n => {
  if (!Number.isSafeInteger(n) || n < 1 || n > 1000000)
    throw Error('Invalid positive quantity');
  return n;
};
const unit = s => {
  if (!Object.hasOwn(UNITS, s)) throw Error('Unrecognized unit');
  return s;
};
const id = s => {
  if (typeof s !== 'string' || !/^[a-f0-9-]{36}$/.test(s)) throw Error('Invalid ID');
  return s;
};
function exactKeys(input, keys) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).sort().join('|') !== [...keys].sort().join('|'))
    throw Error('Unexpected data fields');
}

export function createNeed({ title, summary, goal, unit: namedUnit }) {
  return { type: 'need.opened', need: {
    id: randomUUID(), title: valueText(title, 'title', 70),
    summary: valueText(summary, 'summary', 240),
    goal: count(goal), unit: unit(namedUnit), status: 'OPEN'
  }};
}
export function createOffer({ needId, kind }) {
  if (!OFFERS.has(kind)) throw Error('Invalid offer kind');
  return { type: 'offer.proposed', offer: {
    id: randomUUID(), needId: id(needId), kind, status: 'CANDIDATE_ONLY'
  }};
}
export function createObservation({ needId, quantity, unit: observedUnit, basis }) {
  const bases = {
    pennies: 'STEWARDS_COUNTED_COINS',
    deliveries: 'STEWARD_CONFIRMED_DELIVERY',
    devices: 'STEWARD_RECEIVED_DEVICE'
  };
  if (basis !== bases[observedUnit]) throw Error('Wrong observation basis');
  return { type: 'observation.recorded', observation: {
    id: randomUUID(), needId: id(needId), quantity: count(quantity), unit: unit(observedUnit),
    basis, classification: 'LOCAL_STEWARD_OBSERVATION_NOT_SETTLEMENT'
  }};
}
export function createClose({ needId }) {
  return { type: 'need.closed', needId: id(needId) };
}
export function replay(events) {
  const needs = new Map(), offers = [], observations = [], used = new Set();
  for (const event of events) {
    if (!event || typeof event !== 'object') throw Error('Malformed journal event');
    if (event.type === 'need.opened') {
      const n = event.need;
      exactKeys(n, ['id', 'title', 'summary', 'goal', 'unit', 'status']);
      id(n.id); valueText(n.title, 'title', 70); valueText(n.summary, 'summary', 240);
      count(n.goal); unit(n.unit);
      if (n.status !== 'OPEN' || needs.has(n.id)) throw Error('Invalid need');
      needs.set(n.id, { ...n, done: 0 });
    } else if (event.type === 'offer.proposed') {
      const o = event.offer;
      exactKeys(o, ['id', 'needId', 'kind', 'status']);
      id(o.id); id(o.needId);
      if (used.has(o.id) || !OFFERS.has(o.kind) || o.status !== 'CANDIDATE_ONLY' ||
          needs.get(o.needId)?.status !== 'OPEN') throw Error('Invalid offer');
      used.add(o.id);
      offers.push({ ...o });
    } else if (event.type === 'observation.recorded') {
      const o = event.observation;
      exactKeys(o, ['id','needId','unit','quantity','basis','classification']);
      id(o.id); id(o.needId); unit(o.unit); count(o.quantity);
      const n = needs.get(o.needId);
      const expectedBasis = {
        pennies: 'STEWARDS_COUNTED_COINS',
        deliveries: 'STEWARD_CONFIRMED_DELIVERY',
        devices: 'STEWARD_RECEIVED_DEVICE'
      }[o.unit];
      if (used.has(o.id) || !n || n.status !== 'OPEN' || n.unit !== o.unit ||
          o.basis !== expectedBasis || o.classification !== 'LOCAL_STEWARD_OBSERVATION_NOT_SETTLEMENT' ||
          n.done + o.quantity > Number.MAX_SAFE_INTEGER) throw Error('Observation not applicable');
      used.add(o.id);
      n.done += o.quantity;
      observations.push({ ...o });
    } else if (event.type === 'need.closed') {
      const n = needs.get(id(event.needId));
      if (!n || n.status !== 'OPEN') throw Error('Invalid close');
      n.status = 'CLOSED';
    } else throw Error('Unknown event type');
  }
  return { needs: [...needs.values()], offers, observations };
}
const hashed = (seq, prev, event) =>
  JSON.stringify({ schema: JOURNAL_SCHEMA, seq, prev, event });

export class Journal {
  constructor(path) { this.path = resolve(path); }
  read() {
    if (!existsSync(this.path)) return { entries: [], events: [], tail: 'GENESIS' };
    const entries = []; let tail = 'GENESIS';
    for (const line of readFileSync(this.path, 'utf8').split('\n').filter(Boolean)) {
      const entry = JSON.parse(line);
      exactKeys(entry, ['schema','seq','prev','event','hash']);
      if (entry.schema !== JOURNAL_SCHEMA || entry.seq !== entries.length + 1 ||
          entry.prev !== tail || entry.hash !== sha(hashed(entry.seq, tail, entry.event)))
        throw Error('Journal chain does not verify');
      entries.push(entry); tail = entry.hash;
    }
    const events = entries.map(e => e.event);
    replay(events);
    return { entries, events, tail };
  }
  append(event) {
    const prev = this.read();
    replay([...prev.events, event]);
    const seq = prev.entries.length + 1;
    const entry = { schema: JOURNAL_SCHEMA, seq, prev: prev.tail, event,
      hash: sha(hashed(seq, prev.tail, event)) };
    mkdirSync(dirname(this.path), { recursive: true, mode: 0o700 });
    // One writer only: SHA chain is NOT an external signature, financial control or fsync.
    appendFileSync(this.path, JSON.stringify(entry) + '\n', { mode: 0o600 });
    return entry;
  }
  state() { return replay(this.read().events); }
}
export function publicBoard(state) {
  return { kind: 'penny-box.public-board.v1',
    notice: 'Steward observations, NOT bank deposits, completed payment, PENNY issuance or independent verification.',
    needs: state.needs.map(n => ({
      id:n.id, title:n.title, summary:n.summary, unit:n.unit,
      unitLabel:UNITS[n.unit], goal:n.goal, observed:n.done, status:n.status
    }))
  };
}
