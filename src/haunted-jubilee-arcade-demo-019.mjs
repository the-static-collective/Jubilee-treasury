// Two completely synthetic boxes: no serial device, printer, image model, bank, station, or custody.
import { ArcadeBox } from './haunted-jubilee-arcade-019.mjs';

const fixturePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9eO1Jc0AAAAASUVORK5CYII=', 'base64');
const booth = new ArcadeBox('ARCADE-PORCH');
const other = new ArcadeBox('ARCADE-MAILROOM');

const offer = booth.turn({
  edge: { deviceId: 'synthetic-hand-crank', sessionId: 'demo-only-001', sequence: 1, direction: 'CW', ticks: 1 },
  alias: 'The Bicycle Neighbor', offer: 'I can repair a bicycle on Saturday.',
  imageBytes: fixturePng, imageMime: 'image/png',
  permissions: { review: true, print: true, mail: true },
  flash: 'SIMULATED_POP'
});
booth.choose(offer.id, 3, 'HAUNT', 'The Bicycle Neighbor');
const printable = booth.approvePrint(offer.id, 'SimulatedHumanOperator');
booth.claimPenny({ claimId: 'simulated-loose-penny', numberOfCoins: 1, by: 'SimulatedCounter' });
const parcel = booth.prepareMail({ candidateId: offer.id, to: other.id, by: 'SimulatedHumanOperator', time: 'MAIL' });
const receipt = other.receive(parcel);
const child = other.interpretHeir(parcel.id, 'SimulatedLocalReceiver', 'Invite a real human to review a repair workshop idea');

console.log(printable.text);
console.log('\nSIMULATED TWO-BOX RECEIPTS');
console.log(JSON.stringify({
  offerId: offer.id, postcardId: printable.id, parcelId: parcel.id,
  originHead: booth.snapshot().head, receiverHead: other.snapshot().head,
  localDisposition: receipt.status, privateHeir: child,
  reportedPennies: 1, verifiedBacking: 0, activeUnits: 0,
  actualCameraCaptures: 0, physicalPrints: 0, realWorkConfirmed: 0,
  stationPublications: 0, nativeReLATTECrossings: 0
}, null, 2));
