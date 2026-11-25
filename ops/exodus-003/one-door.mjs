import {load,init,append,prepareBridge} from './ark.mjs';
import {pathToFileURL} from 'node:url';
const money=n=>'$'+(n/100).toFixed(2);
export function render(root){
 const {result,records}=load(root),f=result.fixture;
 const forms=['NEED — describe the fictional need','OFFER — sponsor slot (1–8)','PROPOSAL — review route','REVIEW — gate checked','ADMISSION — HOLD / REFUSE / ADMIT (simulation)','MOVEMENT — simulated amount in minor units','RECEIPT — movement index','RECOVERY — re-enter marked paper event'];
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><title>ARK One Door</title><style>body{font:16px system-ui;max-width:42rem;margin:2rem auto;padding:1rem;background:#faf9f5;color:#20251f}section{border:1px solid #999;padding:1rem;margin:1rem 0;break-inside:avoid}p.line{height:1.5em;border-bottom:1px solid #888}@media print{body{background:white;margin:0}}</style><h1>THE ARK — One Door</h1><p>Fictional offline rehearsal. Actual commitments and movements: $0. No public or payment authority.</p><section><h2>Local ledger</h2><p>Simulated need: '+money(f.needMinor)+'</p><p>Simulated offers: '+money(f.offeredMinor)+'</p><p>Admission: '+f.admission+'</p><p>Simulated receipts: '+money(f.simulatedReceiptMinor)+'</p><p>Remaining (fictional): '+money(f.remainingMinor)+'</p><p>Records: '+records.length+'</p></section><h2>Printable paper kit</h2>'+forms.map(x=>'<section><strong>'+x+'</strong><p class="line"></p><p class="line"></p><small>Local record reference / steward review / date</small></section>').join('')+'<p>Paper transcription must be explicitly marked RECONSTRUCTED_PAPER. Never put real identity data on this rehearsal sheet.</p></html>';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [cmd,root,arg]=process.argv.slice(2);
 try{
  let out;
  if(cmd==='init')out=init(root);
  else if(cmd==='status')out=load(root).result;
  else if(cmd==='append'||cmd==='reconstruct')out=append(root,JSON.parse(arg),{origin:cmd==='reconstruct'?'RECONSTRUCTED_PAPER':'ORIGINAL_DIGITAL'}).result;
  else if(cmd==='bridge')out=prepareBridge(root,{decision:'PREPARE_SYNTHETIC_RETURN'});
  else if(cmd==='print'){console.log(render(root));process.exit(0);}
  else throw Error('init | status | append | reconstruct | bridge | print');
  console.log(JSON.stringify(out,null,2));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
