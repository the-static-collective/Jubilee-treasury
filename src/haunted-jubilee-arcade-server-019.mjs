// PENNY-019 local-only cabinet façade. Uses the exact offline simulation core.
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ArcadeBox, sixDevelopments } from './haunted-jubilee-arcade-019.mjs';

const pageUrl = new URL('../examples/haunted-jubilee-arcade-019.html', import.meta.url);
const limit = 3_100_000;
const write = (res, code, data) => {
  const body = JSON.stringify(data);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'", 'Referrer-Policy': 'no-referrer' });
  res.end(body);
};
const fields = (v, names) => {
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).sort().join('|') !== [...names].sort().join('|')) {
    throw new Error('invalid command fields');
  }
};

export function makeArcadeServer() {
  const porch = new ArcadeBox('PORCH-BOOTH');
  const mailroom = new ArcadeBox('MAILROOM-BOOTH');
  let sequence = 0;
  const sessionId = 'sim-' + randomBytes(8).toString('hex');
  const state = () => ({
    mode: 'SYNTHETIC_LOCAL_ONLY', simulatedBoxesOneProcess: true,
    porch: porch.snapshot(), mailroom: mailroom.snapshot(),
    candidates: [...porch.candidates.values()].map(c => ({ ...c, six: sixDevelopments(c),
      choice: porch.choices.get(c.id) ?? null, card: porch.prints.get(c.id) ?? null, withdrawn: porch.withdrawn.has(c.id) })),
    held: [...mailroom.incoming].map(([id,p]) => ({ id, parentCardId: p.card.id, offer: p.candidate.offer,
      alias: p.candidate.alias, heirInterpreted: mailroom.admitted.has(id) }))
  });
  const run = cmd => {
    if (!cmd || typeof cmd !== 'object' || Array.isArray(cmd) || typeof cmd.action !== 'string') throw new Error('invalid command');
    switch (cmd.action) {
      case 'turn': {
        fields(cmd, ['action','alias','offer','imageBase64','mime','print','mail','flash']);
        if (typeof cmd.imageBase64 !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(cmd.imageBase64) || cmd.imageBase64.length > 2_700_000) throw new Error('image encoding refused');
        const image = Buffer.from(cmd.imageBase64, 'base64');
        sequence++;
        return porch.turn({ edge: { deviceId: 'browser-simulated-click', sessionId, sequence, direction: 'CW', ticks: 1 },
          alias: cmd.alias, offer: cmd.offer, imageBytes: image, imageMime: cmd.mime,
          permissions: { review: true, print: cmd.print, mail: cmd.mail }, flash: cmd.flash ? 'SIMULATED_POP' : 'OFF' });
      }
      case 'choose':
        fields(cmd, ['action','id','variant','decision']);
        return porch.choose(cmd.id, cmd.variant, cmd.decision, 'LocalHumanVisitor');
      case 'print':
        fields(cmd, ['action','id']);
        return porch.approvePrint(cmd.id, 'LocalHumanVisitor');
      case 'mail': {
        fields(cmd, ['action','id']);
        const parcel = porch.prepareMail({ candidateId: cmd.id, to: mailroom.id, by: 'LocalHumanVisitor', time: 'MAIL' });
        return mailroom.receive(parcel);
      }
      case 'heir':
        fields(cmd, ['action','parcelId','interpretation']);
        return mailroom.interpretHeir(cmd.parcelId, 'LocalHumanReceiver', cmd.interpretation);
      case 'claimPenny':
        fields(cmd, ['action','claimId','numberOfCoins']);
        return porch.claimPenny({ claimId: cmd.claimId, numberOfCoins: cmd.numberOfCoins, by: 'LocalSimulatedReporter' });
      default: throw new Error('unknown operation');
    }
  };
  return http.createServer(async (req, res) => {
    const expectedHost = '127.0.0.1:' + req.socket.localPort;
    if (req.headers.host !== expectedHost) {
      write(res, 403, { error: 'localhost-only Host boundary' }); return;
    }
    const source = req.headers.origin;
    if (source && source !== 'http://' + expectedHost) {
      write(res, 403, { error: 'cross-origin request refused' }); return;
    }
    if (req.method === 'GET' && req.url === '/') {
      try {
        const body = await readFile(pageUrl);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
          'Referrer-Policy': 'no-referrer' });
        res.end(body);
      } catch { write(res, 500, { error: 'local cabinet page missing' }); }
      return;
    }
    if (req.method === 'GET' && req.url === '/api/state') { write(res, 200, state()); return; }
    if (req.method !== 'POST' || req.url !== '/api/action') {
      write(res, 404, { error: 'no such local door' }); return;
    }
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) {
      write(res, 415, { error: 'JSON required' }); return;
    }
    try {
      let count = 0;
      const pieces = [];
      for await (const part of req) {
        count += part.length;
        if (count > limit) throw new Error('bounded request size exceeded');
        pieces.push(part);
      }
      const cmd = JSON.parse(Buffer.concat(pieces).toString('utf8'));
      const result = run(cmd);
      write(res, 200, { result, state: state() });
    } catch (error) {
      write(res, 400, { error: error.message, state: state() });
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL('file://' + process.argv[1]))) {
  const app = makeArcadeServer();
  app.listen(8777, '127.0.0.1', () => {
    console.log('HAUNTED JUBILEE ARCADE — synthetic local cabinet: http://127.0.0.1:8777');
    console.log('No camera, money, real flash, printer or external service is contacted.');
    console.log('Close the process to end this ephemeral session.');
  });
}
