import test from 'node:test';
import assert from 'node:assert/strict';
import {generateSteward,newLedger,append,inspect,matches,summary,relatteSpec,digest,canonical} from '../src/asset-treasury-007.mjs';
import { main as cli } from '../src/treasury-cli.mjs';
import { mkdtempSync,readFileSync,writeFileSync,existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const keys=generateSteward(), intruder=generateSteward();
const asset=(id='asset-wood-001')=>({id,kind:'goods',label:'Firewood donation',quantity:2,unit:'cord',mode:'gift',purposeIds:['purpose-winter-001'],termsRef:'terms-offline-001'});
const money={id:'asset-money-001',kind:'money',label:'Kinship official gift attestation (test only)',quantity:200,unit:'usd',mode:'external-funds',purposeIds:['purpose-radio-001'],termsRef:'terms-station-001'};
const need=(id='need-heat-001')=>({id,title:'One household winter heat',kind:'goods',unit:'cord',quantity:2,purposeId:'purpose-winter-001'});
const build=(events=[],key=keys)=>events.reduce((l,[type,payload])=>append(l,key,type,payload),newLedger(key));
const received=()=>build([['OFFER',asset()],['ACCEPT',{assetId:asset().id,termsEvidenceRef:'evidence-terms-001'}],['RECEIVE',{assetId:asset().id,evidenceRef:'evidence-delivery-001',assertion:'asset_received_attested'}],['NEED',need()]]);
const reserve={id:'reserve-wood-001',assetId:'asset-wood-001',needId:'need-heat-001',quantity:1};
test('canonical ordering stable and ledger keys signed',()=>{
  assert.equal(canonical({z:[1,2],a:0}),canonical({a:0,z:[1,2]}));
  const l=build([['OFFER',asset()]]);
  assert.equal(inspect(l).eventCount,1);
  assert.match(inspect(l).head,/^[a-f0-9]{64}$/);
  assert.throws(()=>append(l,intruder,'NEED',need()),/wrong steward/);
});
test('offer is not acceptance; acceptance is not receipt',()=>{
  let l=build([['OFFER',asset()]]);
  assert.equal(inspect(l).assets[0].available,0);
  assert.throws(()=>append(l,keys,'RECEIVE',{assetId:'asset-wood-001',evidenceRef:'evidence-001',assertion:'asset_received_attested'}),/only accepted/);
  l=append(l,keys,'ACCEPT',{assetId:'asset-wood-001',termsEvidenceRef:'evidence-terms-001'});
  assert.equal(inspect(l).assets[0].available,0);
  assert.equal(inspect(l).assets[0].state,'accepted');
});
test('valid distinct receipt unlocks allocatable goods and reasoned matching',()=>{
  const l=received(),m=matches(l);
  assert.equal(m.length,1);assert.equal(m[0].maximum,2);
  assert.equal(m[0].status,'proposal_only_not_reservation');
  assert.equal(inspect(l).assets[0].available,2);
});
test('reservation cannot exceed stock, need or allocation rights',()=>{
  const l=received();
  assert.throws(()=>append(l,keys,'RESERVE',{...reserve,quantity:3}),/insufficient/);
  const ok=append(l,keys,'RESERVE',{...reserve,quantity:2});
  assert.equal(matches(ok).length,0);
  assert.throws(()=>append(ok,keys,'RESERVE',{...reserve,id:'reserve-wood-002',quantity:1}),/insufficient/);
});
test('one reservation cannot be fulfilled twice or released after use',()=>{
  const l=append(received(),keys,'RESERVE',reserve);
  const yes=append(l,keys,'FULFILL',{reservationId:reserve.id,evidenceRef:'recipient-confirmation-001'});
  assert.equal(inspect(yes).assets[0].consumed,1);
  assert.equal(inspect(yes).assets[0].available,1);
  assert.throws(()=>append(yes,keys,'FULFILL',{reservationId:reserve.id,evidenceRef:'recipient-confirmation-002'}),/no longer active/);
  assert.throws(()=>append(yes,keys,'RELEASE',{reservationId:reserve.id,evidenceRef:'release-002'}),/no longer active/);
});
test('release restores capacity without inventing actual fulfillment',()=>{
  const l=append(received(),keys,'RESERVE',reserve);
  const released=append(l,keys,'RELEASE',{reservationId:reserve.id,evidenceRef:'release-001'});
  assert.equal(inspect(released).assets[0].available,2);
  assert.equal(inspect(released).needs[0].fulfilled,0);
  assert.equal(inspect(released).reservations[0].state,'released');
});
test('restricted purpose cannot route to unrelated request',()=>{
  const l=build([['OFFER',asset()],['ACCEPT',{assetId:'asset-wood-001',termsEvidenceRef:'evidence-001'}],['RECEIVE',{assetId:'asset-wood-001',evidenceRef:'evidence-002',assertion:'asset_received_attested'}],['NEED',{...need(),purposeId:'purpose-sports-001'}]]);
  assert.equal(matches(l).length,0);
  assert.throws(()=>append(l,keys,'RESERVE',reserve),/restricted/);
});
test('incompatible units cannot be converted automatically',()=>{
  const l=build([['OFFER',asset()],['ACCEPT',{assetId:'asset-wood-001',termsEvidenceRef:'evidence-001'}],['RECEIVE',{assetId:'asset-wood-001',evidenceRef:'evidence-002',assertion:'asset_received_attested'}],['NEED',{...need(),unit:'bundle'}]]);
  assert.equal(matches(l).length,0);
  assert.throws(()=>append(l,keys,'RESERVE',reserve),/kind\/unit mismatch/);
});
test('cash can be offered, but only external settlement can be attested',()=>{
  let l=build([['OFFER',money],['ACCEPT',{assetId:money.id,termsEvidenceRef:'official-terms-001'}]]);
  assert.equal(summary(l).outsidePaymentAttestations.length,0);
  assert.throws(()=>append(l,keys,'RECEIVE',{assetId:money.id,evidenceRef:'external-reference-001',assertion:'asset_received_attested'}),/assertion mismatches/);
  l=append(l,keys,'RECEIVE',{assetId:money.id,evidenceRef:'external-reference-001',assertion:'external_settlement_attested'});
  assert.equal(summary(l).outsidePaymentAttestations.length,1);
  assert.equal(summary(l).noncashAvailable.length,0);
  assert.match(summary(l).accountingNotice,/NOT authoritative/);
});
test('cash never becomes treasury-controlled spending balance',()=>{
  let l=build([['OFFER',money],['ACCEPT',{assetId:money.id,termsEvidenceRef:'official-terms-001'}],['RECEIVE',{assetId:money.id,evidenceRef:'external-reference-001',assertion:'external_settlement_attested'}],['NEED',{id:'need-cash-001',title:'Radio operational expenses',kind:'money',unit:'usd',quantity:200,purposeId:'purpose-radio-001'}]]);
  assert.equal(matches(l).length,0);
  assert.throws(()=>append(l,keys,'RESERVE',{id:'reserve-cash-001',assetId:money.id,needId:'need-cash-001',quantity:5}),/not a transferable balance/);
});
test('arbitrary typed gift classes are admissible with explicit terms',()=>{
  let l=build([['OFFER',{id:'asset-streaming-001',kind:'broadcast_rights',label:'Limited audio permission',quantity:1,unit:'license',mode:'license',purposeIds:['purpose-radio-001'],termsRef:'license-document-001'}]]);
  l=append(l,keys,'ACCEPT',{assetId:'asset-streaming-001',termsEvidenceRef:'permission-check-001'});
  l=append(l,keys,'RECEIVE',{assetId:'asset-streaming-001',evidenceRef:'rights-document-001',assertion:'asset_received_attested'});
  assert.equal(inspect(l).assets[0].available,1);
});
test('spoofed donation terms or private donor contact rejected',()=>{
  assert.throws(()=>build([['OFFER',{...asset(),donorEmail:'private@example.com'}]]),/schema mismatch/);
  assert.throws(()=>build([['OFFER',{...asset(),termsRef:'https://unsafe.example'}]]),/terms reference/);
  assert.throws(()=>build([['OFFER',{...asset(),purposeIds:[]}]]),/purpose list required/);
});
test('decline/withdraw are not verified receipts and may not be accepted later',()=>{
  const a=build([['OFFER',asset()],['WITHDRAW',{assetId:'asset-wood-001',termsEvidenceRef:'requester-withdraw-001'}]]);
  assert.throws(()=>append(a,keys,'ACCEPT',{assetId:'asset-wood-001',termsEvidenceRef:'evidence-001'}),/not open/);
  assert.equal(inspect(a).assets[0].state,'withdrawn');
});
test('signed ledger refuses edit, truncate or reorder of history',()=>{
  const l=received(),mutated=structuredClone(l);
  mutated.events[0].payload.label='Altered';
  assert.throws(()=>inspect(mutated),/invalid ledger signature/);
  const altered=structuredClone(l);altered.events.reverse();
  assert.throws(()=>inspect(altered),/event order/);
  const shortened=structuredClone(l);shortened.events.pop();
  // Signed history can be truncated deliberately; missing future events require separate head pin.
  assert.equal(inspect(shortened).eventCount,l.events.length-1);
});
test('reLATTE export uses a real opaque-organ spec shape, not fake signature/receipt',()=>{
  const l=received(), spec=relatteSpec(l,'asset-wood-001');
  assert.equal(spec.schema,'relatte.opaque-organ-spec/v0');
  assert.equal(spec.artifact_kind,'TREASURY_ASSET_CANDIDATE');
  assert.equal(spec.source_history_head,'sha256:'+inspect(l).head);
  assert.match(spec.payload_refs[0].address,/^urn:sha256:[a-f0-9]{64}$/);
  assert.equal(spec.requested_effect.permissionGranted,false);
  assert.equal(spec.donor_claims.provenance,'steward_signed_local_claim_not_legal_title_or_settlement');
  assert.equal(spec.signing,undefined);
});
test('refuses crossing for mere offers',()=>{
  const l=build([['OFFER',asset()]]);
  assert.throws(()=>relatteSpec(l,'asset-wood-001'),/only received/);
});
test('demo provides a real protocol sequence with no station money claim',()=>{
  const demo=cli(['demo']);
  assert.equal(demo.summary.outsidePaymentAttestations.length,0);
  assert.equal(demo.summary.noncashAvailable.length,2);
  assert.equal(demo.crossingCandidate.requested_effect.kind,'HOLD_PROPOSAL_ONLY');
  assert.equal(demo.summary.readyToConsider.length,1);
});
test('CLI durable path init -> apply -> export -> board -> reLATTE',()=>{
  const d=mkdtempSync(join(tmpdir(),'jubilee-treasury-'));
  cli(['init',d]);assert.ok(existsSync(join(d,'private-steward.json')));
  const payload=join(d,'offer.json');writeFileSync(payload,JSON.stringify(asset()));
  cli(['apply',d,'OFFER',payload]);
  assert.equal(cli(['show',d]).offers,1);
  const exportPath=join(d,'public-export.json'),boardPath=join(d,'board.html');
  cli(['export',d,exportPath]);cli(['board',d,boardPath]);
  assert.equal(JSON.parse(readFileSync(exportPath,'utf8')).events.length,1);
  assert.match(readFileSync(boardPath,'utf8'),/Kinship.s official Fall Share donation page/);
  assert.throws(()=>cli(['export',d,exportPath]),/EEXIST/);
});
test('asset receipt cannot be imported as independent station-endorsed proof',()=>{
  const l=received(),spec=relatteSpec(l,'asset-wood-001');
  assert.equal(spec.requested_effect.kind,'HOLD_PROPOSAL_ONLY');
  assert.equal(spec.donor_claims.localStatus,'received');
  assert.equal(spec.donor_claims.mode,'gift');
  assert.equal(spec.return_address,null);
});
