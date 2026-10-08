import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {keysForSource,policyFor,newInbox,project,relatteObservationSpec} from '../src/ambient-trickle-009.mjs';
import {configureBandcamp,parseCsv,amountMinor,importCsv,importApiV4,
  importBandcampRows,fetchAuthorizedBandcampV4} from '../src/bandcamp-source-011.mjs';
import {main as cli} from '../src/bandcamp-source-cli-011.mjs';

const keys=keysForSource(),cfg=configureBandcamp({bandId:123456,sourceId:'bandcamp-owner-export-001',purposeId:'purpose-artist-income-001'});
const fresh=()=>newInbox(policyFor(cfg.sourceId,keys.publicKey,['money'],[cfg.purposeId]));
const sale=(patch={})=>({
 bandcamp_transaction_id:10001,bandcamp_transaction_item_id:20001,bandcamp_related_transaction_id:null,
 item_type:'album',item_name:'Synthetic Record One',artist:'Synthetic Artist',
 date:'04 Jan 2026 23:22:11 GMT',currency:'USD',sub_total:'10.00',
 additional_fan_contribution:'2.00',item_total:'12.00',quantity:1,
 item_url:'https://synthetic.bandcamp.com/album/one',
 buyer_name:'Very Private Fan',buyer_email:'fan@example.com',ship_to_street:'123 Secret Street',
 paid_to:'private-payment-address@example.com',...patch
});
const payout=(patch={})=>sale({
 bandcamp_transaction_id:30001,bandcamp_transaction_item_id:null,
 item_type:'payout',sub_total:'',additional_fan_contribution:'',
 amount_you_received:'8.75',item_total:'',...patch
});
const refund=(patch={})=>sale({
 bandcamp_transaction_id:40001,bandcamp_transaction_item_id:50001,
 bandcamp_related_transaction_id:10001,item_type:'refund',
 sub_total:'-10.00',additional_fan_contribution:'-2.00',...patch
});
function csv(rows){
 const headers=['date','item type','item name','currency','sub total','additional fan contribution',
  'amount you received','bandcamp transaction id','bandcamp transaction item id',
  'bandcamp related transaction id','item url','buyer name','buyer email','ship to street'];
 const map={ 'date':'date','item type':'item_type','item name':'item_name','currency':'currency',
  'sub total':'sub_total','additional fan contribution':'additional_fan_contribution',
  'amount you received':'amount_you_received','bandcamp transaction id':'bandcamp_transaction_id',
  'bandcamp transaction item id':'bandcamp_transaction_item_id','bandcamp related transaction id':'bandcamp_related_transaction_id',
  'item url':'item_url','buyer name':'buyer_name','buyer email':'buyer_email','ship to street':'ship_to_street'};
 const q=s=>'"'+String(s??'').replaceAll('"','""')+'"';
 return [headers.join(','),...rows.map(row=>headers.map(k=>q(row[map[k]])).join(','))].join('\r\n');
}
test('Bandcamp report config requires owner-declared numeric band ID and purpose',()=>{
 assert.equal(cfg.bandId,123456);
 assert.throws(()=>configureBandcamp({bandId:0,sourceId:cfg.sourceId,purposeId:cfg.purposeId}),/required/);
});
test('RFC-compliant quoted CSV roundtrip with multiline fan notes can be parsed but PII never exits',()=>{
 const row=sale({buyer_name:'A, B\nC "D"'});
 const parsed=parseCsv(csv([row]));
 assert.equal(parsed[0].buyer_name,row.buyer_name);
 const result=importCsv(fresh(),cfg,keys,csv([row]));
 assert.equal(result.added,1);
 const output=JSON.stringify({projection:result.projection,inbox:result.inbox,reported:result.reported});
 assert.doesNotMatch(output,/fan@example|Very Private Fan|123 Secret|private-payment-address|A, B/);
});
test('sale and additional fan contribution are reported in correct minor currency units, not cash custody',()=>{
 const r=importBandcampRows(fresh(),cfg,keys,[sale()]);
 const record=r.projection.currentSourceReports[0];
 assert.equal(record.status,'pledge_reported');
 assert.equal(record.quantity,1200);
 assert.equal(record.unit,'minor_usd');
 assert.equal(r.projection.claimedMoneyReports.length,0);
 assert.equal(r.projection.fundsTransferred,false);
 assert.equal(r.projection.assetsAdmitted,false);
});
test('distinct items in one order cannot be collapsed to one item',()=>{
 const r=importApiV4(fresh(),cfg,keys,{report:[sale(),sale({
  bandcamp_transaction_item_id:20002,item_name:'Track Two',item_url:'https://synthetic.bandcamp.com/track/two',sub_total:'3.00',
  additional_fan_contribution:'0.00',item_total:'3.00'
 })]});
 assert.equal(r.added,2);
 assert.equal(r.projection.currentSourceReports.length,2);
});
test('missing v4 item IDs use safe fallback; ambiguous indistinguishable rows HOLD before mutation',()=>{
 const a=sale({bandcamp_transaction_item_id:null});
 assert.equal(importCsv(fresh(),cfg,keys,csv([a])).added,1);
 assert.throws(()=>importCsv(fresh(),cfg,keys,csv([a,a])),/ambiguous repeated source item/);
});
test('reimporting an overlapping owner export adds no duplicated signed source events',()=>{
 const first=importCsv(fresh(),cfg,keys,csv([sale()]));
 const next=importCsv(first.inbox,cfg,keys,csv([sale()]));
 assert.equal(next.added,0);
 assert.equal(next.projection.signalCount,1);
 assert.equal(next.projection.head,first.projection.head);
});
test('payout is distinct from reported sale; payout is a source assertion, not bank reconciliation',()=>{
 const r=importApiV4(fresh(),cfg,keys,{report:[sale(),payout()]});
 assert.equal(r.added,2);
 const claims=r.projection.currentSourceReports;
 assert.equal(claims.find(x=>x.status==='settlement_reported').quantity,875);
 assert.equal(claims.find(x=>x.status==='pledge_reported').quantity,1200);
 assert.equal(r.projection.claimedMoneyReports.length,1);
 assert.equal(r.projection.fundsTransferred,false);
});
test('a precisely linked full refund revokes that original item without inventing negative transferable money',()=>{
 const r=importApiV4(fresh(),cfg,keys,{report:[sale(),refund()]});
 assert.equal(r.added,2);
 assert.equal(r.projection.currentSourceReports.length,0);
 assert.equal(r.projection.revokedReports.length,1);
 assert.equal(r.reported.at(-1).kind,'full_reversal');
 const twice=importApiV4(r.inbox,cfg,keys,{report:[sale(),refund()]});
 assert.equal(twice.added,0);
});
test('refund-only later export can reconcile using private source transaction index',()=>{
 const first=importApiV4(fresh(),cfg,keys,{report:[sale()]});
 const later=importApiV4(first.inbox,cfg,keys,{report:[refund()]},{priorIndex:first.sourceIndex});
 assert.equal(later.added,1);
 assert.equal(later.projection.revokedReports.length,1);
});
test('unlinked and multi-item order refunds stay held rather than guessing',()=>{
 const unknown=importApiV4(fresh(),cfg,keys,{report:[refund()]});
 assert.equal(unknown.added,0);assert.equal(unknown.heldForReview.length,1);
 const two=importApiV4(fresh(),cfg,keys,{report:[sale(),sale({
  bandcamp_transaction_item_id:20002,item_url:'https://synthetic.bandcamp.com/track/two'
 }),refund()]});
 assert.equal(two.added,2);
 assert.equal(two.heldForReview[0].reason,'ambiguous_or_missing_original_sale');
});
test('partial or mismatched refund cannot revoke a complete sale',()=>{
 const r=importApiV4(fresh(),cfg,keys,{report:[sale(),refund({sub_total:'-3.00',additional_fan_contribution:'0.00'})]});
 assert.equal(r.added,1);
 assert.equal(r.projection.currentSourceReports.length,1);
 assert.equal(r.heldForReview[0].reason,'partial_or_mismatched_reversal');
});
test('an exact refund in a different currency does not touch the origin',()=>{
 const r=importApiV4(fresh(),cfg,keys,{report:[sale(),refund({currency:'GBP'})]});
 assert.equal(r.projection.currentSourceReports.length,1);
 assert.equal(r.heldForReview[0].reason,'currency_mismatch');
});
test('strict decimal minor-unit rounding, JPY and unsupported currency gates',()=>{
 assert.equal(amountMinor('2.30','USD'),230);
 assert.equal(amountMinor('120','JPY'),120);
 assert.throws(()=>amountMinor('2.301','USD'),/invalid decimal/);
 assert.throws(()=>amountMinor('120.2','JPY'),/fractional/);
 assert.throws(()=>amountMinor('2.30','CHF'),/unsupported currency/);
});
test('untrusted free forms of payment, pending zero-value items and malicious rows refuse cleanly',()=>{
 assert.throws(()=>importBandcampRows(fresh(),cfg,keys,[sale({sub_total:'0'})]),/nonpositive/);
 assert.throws(()=>importBandcampRows(fresh(),cfg,keys,[sale({currency:'UNKNOWN'})]),/unsupported currency/);
 assert.throws(()=>importBandcampRows(fresh(),cfg,keys,[sale({bandcamp_transaction_id:'not-a-number'})]),/transaction identity/);
});
test('invalid source credentials do not trigger API/network access',async()=>{
 let called=0;
 await assert.rejects(fetchAuthorizedBandcampV4(cfg,'2026-01-01 00:00:00','2026-02-01 00:00:00',{token:'',fetchImpl:()=>{called++;throw Error('not allowed')}}),/not configured/);
 assert.equal(called,0);
});
test('Bandcamp sales API calls are POST-only, bearer-only, v4-only and sanitize response',async()=>{
 const calls=[];
 const response={report:[sale()]};
 const fetchImpl=async(url,opts)=>{
  calls.push({url,opts});
  return {ok:true,status:200,url,text:async()=>JSON.stringify(response)};
 };
 const out=await fetchAuthorizedBandcampV4(cfg,'2026-01-01 00:00:00','2026-02-01 00:00:00',{token:'fake-authorized-token',fetchImpl});
 assert.equal(out.report.length,1);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,'https://bandcamp.com/api/sales/4/sales_report');
 assert.equal(calls[0].opts.method,'POST');
 assert.equal(calls[0].opts.redirect,'error');
 assert.equal(JSON.parse(calls[0].opts.body).band_id,cfg.bandId);
 assert.match(calls[0].opts.headers.Authorization,/Bearer/);
});
test('Bandcamp OAuth error / redirects do not log the token or raw buyer response',async()=>{
 const token='highly-secret-private-access-token';
 const fail=async()=>({ok:false,status:403,url:'https://bandcamp.com/api/sales/4/sales_report',text:async()=>JSON.stringify({buyer_email:'private@example.com'})});
 await assert.rejects(fetchAuthorizedBandcampV4(cfg,'2026-01-01 00:00:00','2026-02-01 00:00:00',{token,fetchImpl:fail}),e=>!e.message.includes(token)&&!e.message.includes('private@example.com'));
 const redir=async()=>({ok:true,url:'https://evil.example/',text:async()=>JSON.stringify({report:[sale()]})});
 await assert.rejects(fetchAuthorizedBandcampV4(cfg,'2026-01-01 00:00:00','2026-02-01 00:00:00',{token,fetchImpl:redir}),/unexpected API destination/);
});
test('strict v4 format refuses legacy object-map report to avoid collisions',()=>{
 assert.throws(()=>importApiV4(fresh(),cfg,keys,{report:{'10':sale()}}),/v4 report array/);
});
test('Trickle reLATTE envelope stays an observation-only HOLD and not an accepted asset',()=>{
 const r=importApiV4(fresh(),cfg,keys,{report:[sale()]});
 const claim=r.projection.currentSourceReports[0];
 const spec=relatteObservationSpec(r.inbox,cfg.sourceId,claim.assetId,'2026-10-08T19:00:00.000Z');
 assert.equal(spec.artifact_kind,'OBSERVATION_NOT_ASSET');
 assert.equal(spec.requested_effect.permissionGranted,false);
});
test('CLI imports owner report privately with no raw fan data persisted and no duplicates',async()=>{
 const root=mkdtempSync(join(tmpdir(),'bandcamp-011-')),dir=join(root,'private'),file=join(root,'report.csv');
 writeFileSync(file,csv([sale()]));
 const initialized=await cli(['init',dir,String(cfg.bandId),cfg.purposeId,cfg.sourceId]);
 assert.ok(existsSync(join(dir,'bandcamp-source-key.json')));
 assert.match(initialized.notice,/No Bandcamp API permission/);
 const first=await cli(['csv',dir,file]);
 assert.equal(first.added,1);
 const next=await cli(['csv',dir,file]);
 assert.equal(next.added,0);
 const state=readFileSync(join(dir,'bandcamp-state.json'),'utf8');
 assert.doesNotMatch(state,/fan@example|Very Private Fan|Secret Street/);
 const claims=await cli(['show',dir]);
 assert.equal(claims.signalCount,1);
 const assetId=claims.currentClaims[0].assetId,out=join(root,'hold.json');
 await cli(['hold',dir,assetId,out]);
 assert.equal(JSON.parse(readFileSync(out,'utf8')).artifact_kind,'OBSERVATION_NOT_ASSET');
});
