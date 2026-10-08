import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=readFileSync(new URL('../examples/local-offer-composer.html',import.meta.url),'utf8');
test('standalone composer has local offer and need modes plus official giving door',()=>{
  assert.match(file,/<select id="recordType"/);
  assert.match(file,/value="OFFER"/);
  assert.match(file,/value="NEED"/);
  assert.match(file,/download=type\.toLowerCase/);
  assert.match(file,/donate\.kinshipradio\.org\/pledge\/kinship-radio-fall-share/);
});
test('offline composer does not submit private donor or payment data over network',()=>{
  assert.doesNotMatch(file,/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|serviceWorker/);
  assert.doesNotMatch(file,/<form\b|<input[^>]+name=["'](?:credit|card|account|email)/);
  assert.match(file,/No donation was sent or accepted/);
});
