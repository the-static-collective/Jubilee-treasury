import { identity, firstNeed, nextNeed, Mirror, makeOffer, proposeMatches, makeDecision, makeReport, hash, publicPage } from './protocol.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const family = identity(); const neighbor = identity();
const needs = firstNeed(family, {
  id: 'need-emergency-winter-001', title: 'Winter household support',
  summary: 'Request for firewood, groceries, and accessible mobility equipment. No private address posted.', region: 'Socorro County',
  requirements: [
    { id: 'need-firewood-001', resource: 'firewood', quantity: 2, unit: 'cord', kind: 'goods' },
    { id: 'need-food-001', resource: 'groceries', quantity: 4, unit: 'box', kind: 'goods' },
    { id: 'need-wheelchair-001', resource: 'wheelchair', quantity: 1, unit: 'item', kind: 'goods' },
    { id: 'need-ride-001', resource: 'transport', quantity: 2, unit: 'trip', kind: 'service' },
  ],
});
const porch = new Mirror('porch'); const library = new Mirror('library'); const campground = new Mirror('campground');
for (const host of [porch, library, campground]) host.receive(needs);
const offer = makeOffer(neighbor, { id: 'offer-firewood-001', need: needs, requirementId: 'need-firewood-001', region: 'Socorro County', quantity: 2, unit: 'cord', kind: 'goods' });
const candidates = proposeMatches(library.latest(needs.payload.id), [offer]);
const accepted = makeDecision(family, needs, offer, 'accepted');
const report = makeReport(neighbor, needs, offer, accepted);
const confirmed = makeDecision(family, needs, offer, 'confirmed', report);
// The porch server disappears, but the signed request and human event proofs still exist elsewhere.
const updated = nextNeed(family, needs, { public: { ...needs.payload.public, summary: 'Winter support: firewood delivery reported and confirmed by requester. More help is still welcome.' } });
for (const host of [library, campground]) host.receive(updated);
const recovery = new Mirror('recovered-on-another-host'); recovery.import(library.export(needs.payload.id));
mkdirSync('dist', { recursive: true });
writeFileSync('dist/winter-need.html', publicPage(recovery.latest(needs.payload.id)));
writeFileSync('dist/portable-need.json', JSON.stringify(library.export(needs.payload.id), null, 2));
console.log(JSON.stringify({
  survivingHosts: [library.name, campground.name, recovery.name],
  latestRevision: recovery.latest(needs.payload.id).payload.revision,
  identicalLatestHash: hash(recovery.latest(needs.payload.id)) === hash(campground.latest(needs.payload.id)),
  matchesAreOnlyProposals: candidates.map(v => v.state),
  receiptSequence: ['signed helper offer', accepted.payload.stage, report.payload.claim, confirmed.payload.stage],
  exported: ['dist/winter-need.html', 'dist/portable-need.json'],
  fundsTransmitted: false,
}, null, 2));
