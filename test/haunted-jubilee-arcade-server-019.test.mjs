import test from 'node:test';
import assert from 'node:assert/strict';
import { makeArcadeServer } from '../src/haunted-jubilee-arcade-server-019.mjs';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9eO1Jc0AAAAASUVORK5CYII=';
const start = async () => {
  const app = makeArcadeServer();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + app.address().port;
  return { app, base };
};
const post = async (base, value, headers={}) => {
  const r = await fetch(base + '/api/action', { method:'POST', headers:{ 'Content-Type':'application/json',...headers}, body:JSON.stringify(value) });
  return { status:r.status, body:await r.json() };
};

test('local cabinet renders offline HTML and exercises turn -> six -> approval -> MAIL/HOLD -> private HEIR', async () => {
  const { app, base } = await start();
  try {
    const html = await fetch(base);
    assert.equal(html.status, 200);
    assert.match(await html.text(), /THE HAUNTED JUBILEE ARCADE/);
    const turn = await post(base, { action:'turn', alias:'Neighbor', offer:'I can fix a bike', imageBase64:png,
      mime:'image/png', print:true, mail:true, flash:false });
    assert.equal(turn.status, 200);
    assert.equal(turn.body.result.status, 'PROPOSAL_ONLY');
    const id = turn.body.result.id;
    assert.equal(turn.body.state.candidates[0].six.length, 6);
    assert.equal(turn.body.state.porch.activePennyUnits, 0);
    assert.ok(!JSON.stringify(turn.body.state).includes(png));
    const choose = await post(base, { action:'choose', id, variant:4, decision:'HAUNT' });
    assert.equal(choose.status, 200);
    const print = await post(base, { action:'print', id });
    assert.equal(print.status, 200);
    assert.equal(print.body.result.printedPhysically, false);
    const mail = await post(base, { action:'mail', id });
    assert.equal(mail.status, 200);
    assert.equal(mail.body.result.status, 'HOLD');
    const parcelId = mail.body.result.parcelId;
    assert.equal(mail.body.state.mailroom.stationPublications, 0);
    const heir = await post(base, { action:'heir', parcelId, interpretation:'One future volunteer workshop is possible' });
    assert.equal(heir.status, 200);
    assert.equal(heir.body.result.published, false);
    assert.equal(heir.body.state.porch.activePennyUnits, 0);
    assert.equal(heir.body.state.mailroom.activePennyUnits, 0);
    assert.equal(heir.body.state.held[0].heirInterpreted, true);
  } finally {
    await new Promise(resolve => app.close(resolve));
  }
});

test('localhost-only origin gate and denied permissions prevent cross-origin or automatic reuse', async () => {
  const { app, base } = await start();
  try {
    const evil = await post(base, { action:'claimPenny', claimId:'x', numberOfCoins:1 }, {Origin:'https://evil.example'});
    assert.equal(evil.status, 403);
    const malformed = await post(base, { action:'turn', alias:'N', offer:'X', imageBase64:png, mime:'image/png',
      print:true, mail:true, flash:false, grantPenny:true });
    assert.equal(malformed.status, 400);
    const turn = await post(base, { action:'turn', alias:'N', offer:'X', imageBase64:png,
      mime:'image/png', print:true, mail:false, flash:false });
    const id = turn.body.result.id;
    assert.equal((await post(base, { action:'choose', id, variant:2, decision:'KEEP' })).status, 200);
    assert.equal((await post(base, { action:'print', id })).status, 200);
    const denied = await post(base, { action:'mail', id });
    assert.equal(denied.status, 400);
    assert.match(denied.body.error, /mail rights/);
    const penny = await post(base, { action:'claimPenny', claimId:'report-1', numberOfCoins:37 });
    assert.equal(penny.status, 200);
    assert.equal(penny.body.state.porch.activePennyUnits, 0);
    assert.equal(penny.body.state.porch.coinBackingVerified, 0);
  } finally {
    await new Promise(resolve => app.close(resolve));
  }
});
