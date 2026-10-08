import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {
  makeKeys,newRegistry,openDoor,withdrawDoor,inspectRegistry,publicBoard,
  doorProposal,recordSourceReport,proposedRelatteHold,sampleDoorDemo
} from '../src/door-registry-012.mjs';
import {newInbox,policyFor,project} from '../src/ambient-trickle-009.mjs';
import {main as cli} from '../src/door-cli-012.mjs';

const keys=makeKeys(),sourceId='test-door-source-012',purpose='purpose-resource-help-001';
const create=()=>newRegistry(keys);
const common={purposeId:purpose,termsRef:'terms-independent-review-001',
  publicationRef:'owner-publication-consent-001'};
const physical=(id='door-pennies-001')=>({id,kind:'physical',...common,
  target:{assetType:'pennies',unit:'penny'}});
const bullion=()=>({id:'door-bullion-001',kind:'physical',...common,
  target:{assetType:'gold_bullion',unit:'milligram'}});
const work=()=>({id:'door-work-001',kind:'service',...common,
  target:{serviceType:'labor',unit:'minute'}});
const payment=(provider,url,id='door-pay-001')=>({id,kind:'payment_link',...common,target:{provider,url}});
const wallet=(address='0x'+'a'.repeat(40),id='door-wallet-001')=>({
 id,kind:'wallet',...common,target:{chainId:1,address,asset:'native_only'}
});
const policy=()=>newInbox(policyFor(sourceId,keys.publicKey,
  ['money','crypto','coins','gold','equipment','supplies','labor','compute','transport','broadcast_rights'],[purpose]));
const time='2026-10-08T16:10:00.000Z';
const report=(overrides={})=>({
 eventId:'manual-report-001',assetId:'asset-penny-001',quantity:37,
 evidenceHash:'a'.repeat(64),observedAt:time,sourceAuthority:'local_operator_claim',...overrides
});
const add=d=>openDoor(create(),keys,d,time);
test('37-penny synthetic door retains count, never invents bank money',()=>{
 const r=add(physical()),p=inspectRegistry(r);
 assert.equal(p.open[0].target.unit,'penny');
 assert.equal(p.paymentsReceived,false);assert.equal(p.assetsOwned,false);
 assert.equal(doorProposal(r,physical().id).paymentReceived,false);
});
test('gold bullion is measured by milligram without speculative market value or assay',()=>{
 const r=add(bullion()),p=inspectRegistry(r).open[0];
 assert.equal(p.target.unit,'milligram');
 assert.equal(JSON.stringify(p).includes('price'),false);
});
test('useful-work offers have explicit unit and cannot invent availability',()=>{
 const p=inspectRegistry(add(work())).open[0];
 assert.equal(p.target.serviceType,'labor');assert.equal(p.target.unit,'minute');
});
test('only exact HTTPS provider-host/pathed links may be opened',()=>{
 const cases=[
  ['cash_app','https://cash.app/$TestOnly'],
  ['venmo','https://venmo.com/u/TestOnly'],
  ['paypal','https://paypal.me/TestOnly']
 ];
 for(const [provider,url]of cases){
  const p=add(payment(provider,url));
  assert.equal(inspectRegistry(p).open[0].target.url,url);
 }
});
test('lookalike domains, URL credentials, parameters, redirects and HTTP are refused',()=>{
 const bad=[
  'https://cash.app.evil.com/$TestOnly','https://evil.com/?go=cash.app',
  'https://cash.app@evil.com/$TestOnly','http://cash.app/$TestOnly',
  'https://cash.app/$TestOnly?redirect=example.com',
  'https://cash.app/$TestOnly#hidden','https://cash.app:444/$TestOnly',
  'https://cash.app/%24TestOnly','javascript:alert(1)'
 ];
 for(const url of bad)assert.throws(()=>add(payment('cash_app',url)),/DOOR_HOLD/);
 assert.throws(()=>add(payment('paypal','https://cash.app/$TestOnly')),/DOOR_HOLD/);
});
test('wallet target must be chain-pinned and public lower-case address only',()=>{
 assert.equal(inspectRegistry(add(wallet())).open[0].target.chainId,1);
 assert.throws(()=>add(wallet('0x'+'0'.repeat(40))),/nonzero/);
 assert.throws(()=>add(wallet('0x'+'A'.repeat(40))),/lower-case/);
 assert.throws(()=>add({...wallet(),target:{...wallet().target,chainId:999}}),/chain allowlist/);
 assert.throws(()=>add({...wallet(),target:{...wallet().target,secretRecoveryPhrase:'words'}}),/target fields/);
});
test('payment and wallet doors expose no payment, chain-confirmation or transfer service',()=>{
 for(const door of [
   payment('paypal','https://paypal.me/TestOnly'),wallet()
 ]){
  const r=add(door),p=doorProposal(r,door.id);
  assert.equal(p.paymentReceived,false);assert.equal(p.ownershipChanged,false);
  assert.equal(p.rightsGranted,false);
  assert.equal(p.status,'HOLD_PROPOSAL_ONLY');
 }
});
test('owner key signs exact registry history; tampering rejects',()=>{
 const r=add(physical());
 const bad=structuredClone(r);bad.events[0].payload.target.assetType='gold_bullion';
 assert.throws(()=>inspectRegistry(bad),/invalid owner-signed registry event/);
 const bad2=structuredClone(r);bad2.events[0].signature='abc';
 assert.throws(()=>inspectRegistry(bad2),/invalid owner-signed registry event/);
});
test('wrong signing key and duplicate door IDs cannot rewrite destination',()=>{
 const r=add(physical()),alt=makeKeys();
 assert.throws(()=>openDoor(r,alt,work(),time),/steward key/);
 assert.throws(()=>openDoor(r,keys,physical(),time),/duplicate/);
});
test('withdrawal denies further proposals and cannot silently reopen same identity',()=>{
 const r=add(physical()),n=withdrawDoor(r,keys,'door-pennies-001','ref-revocation-001',time);
 assert.equal(inspectRegistry(n).open.length,0);
 assert.equal(inspectRegistry(n).withdrawn[0].doorId,'door-pennies-001');
 assert.throws(()=>doorProposal(n,'door-pennies-001'),/unavailable/);
 assert.throws(()=>openDoor(n,keys,physical(),time),/cannot reopen/);
});
test('public board is locally generated, never self-publishes; source key must be pinned',()=>{
 const r=add(payment('paypal','https://paypal.me/TestOnly'));
 assert.throws(()=>publicBoard(r),/pinned externally/);
 assert.throws(()=>publicBoard(r,{pinnedPublicKey:makeKeys().publicKey}),/pinned externally/);
 const html=publicBoard(r,{pinnedPublicKey:keys.publicKey});
 assert.match(html,/https:\/\/paypal.me\/TestOnly/);
 assert.match(html,/noopener noreferrer/);
 assert.match(html,/No donor form, analytics/);
 assert.doesNotMatch(html,/<form|fetch\(|connectWallet|<script/i);
});
test('withdrawn public link is absent from fresh board, while old copies are not recalled',()=>{
 const a=add(payment('venmo','https://venmo.com/u/TestOnly'));
 const before=publicBoard(a,{pinnedPublicKey:keys.publicKey});
 assert.match(before,/venmo.com/);
 const b=withdrawDoor(a,keys,'door-pay-001','owner-withdraw-001',time);
 assert.doesNotMatch(publicBoard(b,{pinnedPublicKey:keys.publicKey}),/venmo.com/);
});
test('37 pennies become only signed goods/coin observation, NOT spendable fiat',()=>{
 const r=add(physical());
 const x=recordSourceReport(r,'door-pennies-001',policy(),keys,sourceId,report());
 assert.equal(x.added,1);
 assert.equal(x.observation.quantity,37);
 assert.equal(x.observation.kind,'coins');
 assert.equal(x.observation.unit,'penny');
 assert.equal(x.observation.status,'offer_reported');
 assert.equal(x.received,false);assert.equal(x.verifiedCustody,false);
 assert.equal(project(x.inbox).claimedMoneyReports.length,0);
});
test('bullion offers retain milligrams without quality/price inference',()=>{
 const x=recordSourceReport(add(bullion()),'door-bullion-001',policy(),keys,sourceId,
   report({eventId:'manual-bullion-001',assetId:'asset-gold-001',quantity:31103}));
 assert.equal(x.observation.kind,'gold');
 assert.equal(x.observation.unit,'milligram');
 assert.equal(x.verifiedAssay,false);
});
test('reported volunteer time remains offer only, not a fulfilled service',()=>{
 const x=recordSourceReport(add(work()),'door-work-001',policy(),keys,sourceId,
   report({eventId:'manual-hours-001',assetId:'asset-time-001',quantity:90}));
 assert.equal(x.observation.kind,'labor');assert.equal(x.observation.unit,'minute');
 assert.equal(x.observation.status,'offer_reported');
 assert.equal(x.rightsGranted,false);
});
test('payment link click alone does not record; explicit operator report stays pledge',()=>{
 const r=add(payment('cash_app','https://cash.app/$TestOnly'));
 assert.equal(inspectRegistry(r).count,1);
 const x=recordSourceReport(r,'door-pay-001',policy(),keys,sourceId,
   report({eventId:'report-payment-001',assetId:'claimed-pledge-001',quantity:100}));
 assert.equal(x.observation.kind,'money');assert.equal(x.observation.status,'pledge_reported');
 assert.equal(x.observation.unit,'minor_usd');
 assert.equal(x.verifiedProviderSettlement,false);
 assert.equal(project(x.inbox).claimedMoneyReports.length,0);
});
test('wallet observation cannot claim chain finality or cryptocurrency ownership',()=>{
 const x=recordSourceReport(add(wallet()),'door-wallet-001',policy(),keys,sourceId,
   report({eventId:'manual-chain-001',assetId:'unverified-crypto-001',quantity:1}));
 assert.equal(x.observation.kind,'crypto');assert.equal(x.observation.status,'offer_reported');
 assert.equal(x.verifiedChainTx,false);
});
test('repeat signed local report idempotent but conflicting rewrite is denied',()=>{
 const r=add(physical()),a=recordSourceReport(r,'door-pennies-001',policy(),keys,sourceId,report());
 const again=recordSourceReport(r,'door-pennies-001',a.inbox,keys,sourceId,report());
 assert.equal(again.added,0);assert.equal(project(again.inbox).signalCount,1);
 assert.throws(()=>recordSourceReport(r,'door-pennies-001',a.inbox,keys,sourceId,report({quantity:99})),/contradictory/);
});
test('privacy/credential fields rejected; no source password, name, note or seed phrase in the observation',()=>{
 const r=add(physical());
 assert.throws(()=>openDoor(r,keys,{...work(),donorName:'private person'},time),/fields/);
 assert.throws(()=>recordSourceReport(r,'door-pennies-001',policy(),keys,sourceId,
   {...report(),donorEmail:'example@example.com'}),/fixed privacy/);
 assert.throws(()=>recordSourceReport(r,'door-pennies-001',policy(),keys,sourceId,
   {...report(),privateKey:'sensitive'}),/fixed privacy/);
});
test('wrong purpose or source signer rejects manual observation',()=>{
 const r=add(physical());
 assert.throws(()=>recordSourceReport(r,'door-pennies-001',policy(),makeKeys(),sourceId,report()),/must be pinned/);
 const bad=newInbox(policyFor(sourceId,keys.publicKey,['money'],[purpose]));
 assert.throws(()=>recordSourceReport(r,'door-pennies-001',bad,keys,sourceId,report()),/outside approved/);
});
test('reLATTE observation candidate cannot promote an asset or authorize a transfer',()=>{
 const r=add(physical()),x=recordSourceReport(r,'door-pennies-001',policy(),keys,sourceId,report());
 const spec=proposedRelatteHold(x.inbox,sourceId,'asset-penny-001',time);
 assert.equal(spec.schema,'relatte.opaque-organ-spec/v0');
 assert.equal(spec.artifact_kind,'OBSERVATION_NOT_ASSET');
 assert.equal(spec.requested_effect.permissionGranted,false);
 assert.equal(spec.donor_claims.kind,'coins');
});
test('offline CLI demo includes 37-penny door without generating real provider addresses',()=>{
 const d=cli(['demo']);
 assert.equal(d.projection.open.length,3);
 assert.ok(d.projection.open.some(x=>x.id==='demo-penny-jar-001'));
 assert.doesNotMatch(JSON.stringify(d),/paypal.me|cash.app|venmo.com/);
});
test('local operator init → publish source signed door → offline board → claim → HOLD → withdraw',()=>{
 const root=mkdtempSync(join(tmpdir(),'jubilee-doors-')),dir=join(root,'private'),doorFile=join(root,'door.json'),
   reportFile=join(root,'report.json'),board=join(root,'board.html'),specFile=join(root,'hold.json');
 const init=cli(['init',dir,sourceId,purpose]);assert.match(init.notice,/No live payments/);
 writeFileSync(doorFile,JSON.stringify(physical()));
 const op=cli(['open',dir,doorFile]);assert.equal(op.opened,'door-pennies-001');
 cli(['board',dir,board]);assert.ok(existsSync(board));
 assert.match(readFileSync(board,'utf8'),/door-pennies-001/);
 writeFileSync(reportFile,JSON.stringify(report()));
 assert.equal(cli(['record',dir,'door-pennies-001',reportFile]).added,1);
 assert.equal(cli(['record',dir,'door-pennies-001',reportFile]).added,0);
 assert.equal(cli(['show',dir]).trickle.signalCount,1);
 assert.equal(cli(['hold',dir,'asset-penny-001',specFile]).admission,false);
 assert.equal(JSON.parse(readFileSync(specFile,'utf8')).artifact_kind,'OBSERVATION_NOT_ASSET');
 cli(['withdraw',dir,'door-pennies-001','withdrawal-record-001']);
 assert.throws(()=>cli(['proposal',dir,'door-pennies-001']),/unavailable/);
});
