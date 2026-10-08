import { readFileSync } from 'node:fs';
import { RoutingMirror } from './envelopes.mjs';
import { routeCapacity } from './router.mjs';
import { hash } from '../protocol.mjs';

const [file, now] = process.argv.slice(2);
const mirror = new RoutingMirror();
mirror.import(JSON.parse(readFileSync(file, 'utf8')));
const history = mirror.export();
const needIds = [...new Set(history.filter(e => e.type === 'need').map(e => e.payload.id))];
const capacityIds = [...new Set(history.filter(e => e.type === 'capacity').map(e => e.payload.id))];
const capacities = capacityIds.map(id => mirror.latest('capacity', id));
const proposals = needIds.flatMap(id => routeCapacity(mirror.latest('need', id), capacities, now));
console.log(JSON.stringify({ bundleHash: hash(history), proposals, authority: 'none; historical candidates require live source admission' }));
