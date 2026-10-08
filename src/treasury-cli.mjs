#!/usr/bin/env node
import { openSync,closeSync,mkdirSync,writeFileSync,readFileSync,renameSync,unlinkSync,existsSync } from 'node:fs';
import { join,resolve } from 'node:path';
import { generateSteward,newLedger,append,inspect,summary,matches,relatteSpec } from './asset-treasury-007.mjs';

const usage = 'Usage: node src/treasury-cli.mjs init DIR | apply DIR EVENT_TYPE PAYLOAD_JSON | show DIR | matches DIR | export DIR FILE | board DIR FILE | relatte DIR ASSET_ID FILE | demo';
const load = path=>JSON.parse(readFileSync(path,'utf8'));
function exclusive(path,data) {const fd=openSync(path,'wx',0o600);try{writeFileSync(fd,JSON.stringify(data,null,2)+'\n');}finally{closeSync(fd);}}
function safelyReplace(path, data) {
  const temp=path+'.new-'+process.pid;
  exclusive(temp,data);
  try{renameSync(temp,path);}catch(error){try{unlinkSync(temp);}catch{}throw error;}
}
const esc=v=>String(v).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function html(ledger) {
  const s=summary(ledger);
  const noncash=s.noncashAvailable.map(a=>'<li><strong>'+esc(a.label)+'</strong> — '+a.available+' '+esc(a.unit)+' ('+esc(a.kind)+')</li>').join('');
  const routes=s.readyToConsider.map(x=>'<li>'+esc(x.assetId)+' → '+esc(x.needId)+' — up to '+x.maximum+' '+esc(x.unit)+' <em>proposal only</em></li>').join('');
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Jubilee Asset Treasury — Operator Board</title><style>body{font:1rem/1.6 system-ui;max-width:55rem;margin:2rem auto;padding:1rem;color:#242424}section{padding:1rem;border:1px solid #ccc;border-radius:1rem;margin:1rem 0}a{color:#154e94}h1{line-height:1.1}</style><h1>Jubilee Asset Treasury</h1><p><strong>Experimental local operator view — not Kinship-owned or approved.</strong> Independently attested assets, not verified financial accounts or deliveries.</p><p>For gifts of money to Kinship, use <a href="https://donate.kinshipradio.org/pledge/kinship-radio-fall-share" rel="noopener noreferrer">Kinship’s official Fall Share donation page</a>. This treasury cannot take payments.</p><section><h2>Available noncash resources</h2><ul>'+(noncash||'<li>None recorded</li>')+'</ul></section><section><h2>Possible matches, awaiting human permission</h2><ul>'+(routes||'<li>No proposals</li>')+'</ul></section><section><h2>External payment reports — not official accounting</h2><p>'+s.outsidePaymentAttestations.length+' steward-recorded settlement attestations. These are not counted toward station fundraising totals.</p></section><p>History events: '+s.eventCount+' | locally signed head: '+esc(s.head||'none')+'</p><p>This snapshot is static and must be refreshed. It does not prove the real-world status of any offer or need.</p></html>';
}
export function main(args=process.argv.slice(2)) {
  const [command,dir,...rest]=args;
  if(command==='demo') {
    const key=generateSteward();let journal=newLedger(key);
    const event=(type,payload)=>{journal=append(journal,key,type,payload);};
    event('OFFER',{id:'asset-wood-001',kind:'goods',label:'Firewood delivery',quantity:2,unit:'cord',mode:'gift',purposeIds:['community-heat-001'],termsRef:'terms-signed-offline-001'});
    event('OFFER',{id:'asset-time-001',kind:'service',label:'Volunteer loading',quantity:6,unit:'hour',mode:'service',purposeIds:['community-heat-001'],termsRef:'terms-volunteer-001'});
    event('OFFER',{id:'asset-cash-001',kind:'money',label:'External financial gift report',quantity:25,unit:'usd',mode:'external-funds',purposeIds:['station-fall-share-001'],termsRef:'terms-station-001'});
    event('NEED',{id:'need-winter-001',title:'Firewood for a household',kind:'goods',unit:'cord',quantity:2,purposeId:'community-heat-001'});
    for(const id of ['asset-wood-001','asset-time-001','asset-cash-001']) event('ACCEPT',{assetId:id,termsEvidenceRef:'local-review-'+id});
    event('RECEIVE',{assetId:'asset-wood-001',evidenceRef:'local-delivery-wood-001',assertion:'asset_received_attested'});
    event('RECEIVE',{assetId:'asset-time-001',evidenceRef:'local-volunteer-confirmation-001',assertion:'asset_received_attested'});
    // The money item remains accepted, never paid or counted in a station total.
    event('RESERVE',{id:'reservation-wood-001',assetId:'asset-wood-001',needId:'need-winter-001',quantity:1});
    event('FULFILL',{reservationId:'reservation-wood-001',evidenceRef:'local-recipient-report-001'});
    return {summary:summary(journal),crossingCandidate:relatteSpec(journal,'asset-wood-001'),notice:'Synthetic test records; no station participation or real transfers occurred'};
  }
  if(!command||!dir)throw Error(usage);
  const root=resolve(dir);
  const journalPath=join(root,'ledger.json'),keyPath=join(root,'private-steward.json');
  if(command==='init') {
    mkdirSync(root,{recursive:true,mode:0o700});
    if(existsSync(journalPath)||existsSync(keyPath))throw Error('Treasury already exists; refusing overwrite');
    const keys=generateSteward();
    exclusive(keyPath,keys);exclusive(journalPath,newLedger(keys));
    return {created:true,root,privateKeyPath:keyPath,warning:'Do not publish or send private-steward.json. No bank, donor or beneficiary private records belong here.'};
  }
  const ledger=load(journalPath);inspect(ledger);
  if(command==='show')return summary(ledger);
  if(command==='matches')return matches(ledger);
  if(command==='export'||command==='board'||command==='relatte') {
    const assetId=command==='relatte'?rest[0]:null;
    const output=command==='relatte'?rest[1]:rest[0];
    if(!output)throw Error(usage);
    const content=command==='export'?ledger:command==='board'?html(ledger):relatteSpec(ledger,assetId,new Date().toISOString());
    if(command==='board'){const fd=openSync(resolve(output),'wx',0o600);try{writeFileSync(fd,content);}finally{closeSync(fd);}}
    else exclusive(resolve(output),content);
    return {written:resolve(output),type:command,events:ledger.events.length,head:summary(ledger).head};
  }
  if(command==='apply') {
    const [type,payloadFile]=rest;if(!type||!payloadFile)throw Error(usage);
    const lock=join(root,'.ledger-write-lock');let fd;
    try{fd=openSync(lock,'wx',0o600);}catch{throw Error('Treasury locked; another writer or recovery step must be resolved');}
    try{
      const fresh=load(journalPath);const keys=load(keyPath);
      const next=append(fresh,keys,type,load(resolve(payloadFile)),new Date().toISOString());
      safelyReplace(journalPath,next);
      return {applied:type,head:summary(next).head,events:next.events.length};
    }finally{closeSync(fd);unlinkSync(lock);}
  }
  throw Error(usage);
}
if(process.argv[1] && import.meta.url===new URL('file://'+resolve(process.argv[1])).href) {
  try{console.log(JSON.stringify(main(),null,2));}
  catch(e){console.error(e.message);process.exitCode=1;}
}
