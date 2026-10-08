import {contentHash,signSignal,importBatch,project} from './ambient-trickle-009.mjs';

export const BANDCAMP_CONFIG_SCHEMA='jubilee.bandcamp-source/v0.1';
const ID=/^[A-Za-z0-9][A-Za-z0-9:._-]{2,127}$/;
const CURRENCY={USD:2,EUR:2,GBP:2,CAD:2,AUD:2,NZD:2,JPY:0};
const SALE_TYPES=new Set(['album','track','package','merch','item','gift_card','gift card']);
const REVERSALS=new Set(['reversal','refund']);
const MAX_ROWS=20000;
const fail=reason=>{throw new Error('BANDCAMP_SOURCE_HOLD: '+reason);};
const check=(x,msg)=>{if(!x)fail(msg);};
const integer=x=>Number.isSafeInteger(x)&&x>=1&&x<=1000000000;
const normalizedValue=x=>x===undefined||x===null?'':String(x).trim();
const fingerprint=x=>contentHash(x).slice(0,32);
const currentDate=x=>{const d=new Date(x);check(typeof x==='string'&&x.trim().length>0&&Number.isFinite(d.valueOf()),'invalid source UTC timestamp');return d.toISOString();};

export function configureBandcamp({bandId,sourceId,purposeId}) {
  check(integer(Number(bandId))&&ID.test(sourceId)&&ID.test(purposeId),'owner-configured band ID, source and purpose required');
  return {schema:BANDCAMP_CONFIG_SCHEMA,bandId:Number(bandId),sourceId,purposeId};
}
export function parseCsv(input) {
  check(typeof input==='string'&&Buffer.byteLength(input,'utf8')<=12*1024*1024,'CSV size limit 12 MB');
  const out=[];let cell='',row=[],quoted=false;
  const raw=input.replace(/^\uFEFF/,'');
  for(let i=0;i<raw.length;i++){
    const c=raw[i];
    if(quoted){
      if(c==='"'&&raw[i+1]==='"'){cell+='"';i++;}
      else if(c==='"')quoted=false;
      else cell+=c;
    }else if(c==='"'){
      check(cell.length===0,'invalid CSV quote');quoted=true;
    }else if(c===','){row.push(cell);cell='';}
    else if(c==='\r'||c==='\n'){
      if(c==='\r'&&raw[i+1]==='\n')i++;
      row.push(cell);cell='';
      if(row.some(x=>x!=='')){out.push(row);check(out.length<=MAX_ROWS+1,'CSV row limit');}
      row=[];
    }else cell+=c;
  }
  check(!quoted,'unclosed quoted CSV');
  if(cell!==''||row.length){row.push(cell);if(row.some(x=>x!==''))out.push(row);}
  check(out.length>=2,'CSV needs headers and at least one row');
  const heads=out[0].map(x=>x.toLowerCase().trim().replace(/[\s-]+/g,'_'));
  check(new Set(heads).size===heads.length,'duplicate CSV column');
  for(const required of ['date','item_type','currency','bandcamp_transaction_id'])
    check(heads.includes(required),'unsupported CSV headers; missing '+required);
  const rows=[];
  for(const [i,cells]of out.slice(1).entries()){
    check(cells.length===heads.length,'CSV column count mismatch at row '+(i+2));
    rows.push(Object.fromEntries(heads.map((key,index)=>[key,cells[index]])));
  }
  return rows;
}
// Only a deliberately tiny allowlist is read. Buyer/shipping/PayPal/city fields
// are never copied, hashed, serialized, displayed, logged or signed.
function normalizedRow(input){
  check(input&&typeof input==='object'&&!Array.isArray(input),'invalid report row');
  const get=(key)=>normalizedValue(input[key]);
  const type=get('item_type').toLowerCase().replace(/\s+/g,'_');
  check(SALE_TYPES.has(type)||REVERSALS.has(type)||type==='payout','unsupported item type');
  const transaction=get('bandcamp_transaction_id');
  check(/^[0-9]{1,25}$/.test(transaction),'missing Bandcamp transaction identity');
  const itemId=get('bandcamp_transaction_item_id');
  check(!itemId||/^[0-9]{1,25}$/.test(itemId),'invalid transaction item identity');
  const related=get('bandcamp_related_transaction_id');
  check(!related||/^[0-9]{1,25}$/.test(related),'invalid linked reversal identity');
  const currency=get('currency').toUpperCase();
  check(Object.hasOwn(CURRENCY,currency),'unsupported currency/precision');
  const date=currentDate(get('date'));
  const quantity= get('quantity')===''?1:Number(get('quantity'));
  check(integer(quantity),'invalid item quantity');
  const total=get('sub_total');
  const contribution=get('additional_fan_contribution');
  const payout=get('amount_you_received');
  const url=get('item_url');
  // A URL is used *only* inside a deterministic fallback identity commitment.
  // Never store or expose it. No arbitrary URL is fetched.
  return {type,transaction,itemId,related,currency,date,quantity,total,contribution,payout,
    itemName:get('item_name'),itemUrl:url};
}
export function amountMinor(value,currency,{allowZero=false}={}){
  check(Object.hasOwn(CURRENCY,currency),'unsupported currency');
  const decimals=CURRENCY[currency],s=normalizedValue(value);
  check(new RegExp('^[+]?[0-9]+(?:\\.[0-9]{1,'+Math.max(decimals,1)+'})?$').test(s),'invalid decimal amount');
  const [whole,part='']=s.replace(/^\+/,'').split('.');
  check(decimals>0||part==='','currency does not permit fractional minor units');
  const x=BigInt(whole)*(10n**BigInt(decimals))+BigInt(part.padEnd(decimals,'0')||'0');
  check(x<=1000000000000n&&(x>0n||(allowZero&&x===0n)),'nonpositive or excessive amount');
  return Number(x);
}
function monetaryRow(row){
  const decimal=row.type==='payout'?row.payout:row.total;
  const amount=amountMinor(decimal,row.currency,{allowZero:false});
  const fan=row.type==='payout'?0:row.contribution?amountMinor(row.contribution,row.currency,{allowZero:true}):0;
  check(Number.isSafeInteger(amount+fan)&&amount+fan<=1000000000000,'unsupported monetary sum');
  return amount+fan;
}
function identity(row){
  if(row.itemId)return 'bci-'+row.itemId;
  // Original CSV lacks v4 item IDs. Stable, private-safe fingerprint of a
  // source row, never row-number-based; identical rows within a report HOLD.
  return 'bcf-'+fingerprint({transaction:row.transaction,type:row.type,
    date:row.date,itemUrl:row.itemUrl,itemName:row.itemName,
    currency:row.currency,quantity:row.quantity,amount:row.total,fan:row.contribution});
}
function reportEvent(row,config){
  const base=identity(row),amount=monetaryRow(row);
  const details={schema:'bandcamp-minimal-source-facts/v0.1',
    transaction:row.transaction,itemIdentity:base,currency:row.currency,
    type:row.type,quantity:row.quantity,amountMinor:amount,date:row.date};
  const evidenceHash=contentHash(details);
  const assetId=(row.type==='payout'?'bc-payout-':'bc-sale-')+fingerprint({bandId:config.bandId,base});
  return {assetId, transaction:row.transaction,minor:amount,unit:'minor_'+row.currency.toLowerCase(),
    payload:{
      eventId:'bc-event-'+fingerprint({bandId:config.bandId,base,kind:row.type}),
      assetId,revision:1,previousHash:null,
      kind:'money',
      // Sale != account funds. Only a Bandcamp payout report claims settlement,
      // and that claim is still not independently bank-verified.
      status:row.type==='payout'?'settlement_reported':'pledge_reported',
      quantity:amount,unit:'minor_'+row.currency.toLowerCase(),
      purposeId:config.purposeId,evidenceHash,observedAt:row.date
    }
  };
}
function ensureLocal(inbox,config,keys){
  const source=inbox?.policy?.sources?.find(s=>s.sourceId===config.sourceId);
  check(source&&source.publicKey===keys?.publicKey&&
    source.allowedKinds?.includes('money')&&source.allowedPurposes?.includes(config.purposeId),
    'source key/purpose does not match private local policy');
}
function holdItem(type,row,reason){
  return {kind:type,sourceRowType:row.type,transactionCommitment:fingerprint({transaction:row.transaction}),
    reason,disposition:'HOLD_FOR_HUMAN_RECONCILIATION'};
}
export function importBandcampRows(inbox,config,keys,inputs){
  config=configureBandcamp(config);
  ensureLocal(inbox,config,keys);
  check(Array.isArray(inputs)&&inputs.length<=MAX_ROWS,'bounded owner report array required');
  const rows=inputs.map(normalizedRow);
  let staged=inbox; const indexes=new Map(),seen=new Set();
  const sourceSignals=()=>staged.signals.filter(s=>s.sourceId===config.sourceId);
  const reports=[],held=[];
  // First inspect the current retained signals to find exact original sale
  // references, without ever persisting the raw rows.
  const originalByAsset=new Map();
  for(const s of sourceSignals()){
    if(s.payload.revision===1&&s.payload.status==='pledge_reported')
      originalByAsset.set(s.payload.assetId,s);
  }
  const linkByTransaction=new Map();
  // Import sales/payouts before reversals regardless of report row order.
  for(const row of rows.filter(x=>!REVERSALS.has(x.type))){
    const key=identity(row),duplicate=key+'|'+row.type;
    check(!seen.has(duplicate),'ambiguous repeated source item; cannot risk double count');
    seen.add(duplicate);
    const entry=reportEvent(row,config);
    if(sourceSignals().some(s=>s.payload.assetId===entry.assetId)){
      const first=sourceSignals().find(s=>s.payload.assetId===entry.assetId&&s.payload.revision===1);
      check(first&&first.payload.evidenceHash===entry.payload.evidenceHash,
        'same source item changed; not a new independent gift');
    }else{
      staged=importBatch(staged,[signSignal(config.sourceId,entry.payload,keys)]);
      reports.push({assetId:entry.assetId,kind:row.type,status:entry.payload.status,
        unit:entry.unit,quantity:entry.minor});
    }
    if(row.type!=='payout'){
      if(!linkByTransaction.has(row.transaction))linkByTransaction.set(row.transaction,[]);
      linkByTransaction.get(row.transaction).push(entry);
      const orig=sourceSignals().find(s=>s.payload.assetId===entry.assetId&&s.payload.revision===1);
      if(orig)originalByAsset.set(entry.assetId,orig);
    }
  }
  // Only a full exact-currency reversal tied to exactly ONE known source sale
  // is auto-revoked. Partial/multi-item/unknown reversals remain HOLD, without
  // erasing anything or manufacturing a compensating cash balance.
  for(const row of rows.filter(x=>REVERSALS.has(x.type))){
    const related=row.related;
    if(!related){held.push(holdItem('reversal',row,'missing_original_transaction_link'));continue;}
    const candidates=linkByTransaction.get(related)||[];
    if(candidates.length!==1){held.push(holdItem('reversal',row,'ambiguous_or_missing_original_sale'));continue;}
    const original=candidates[0];
    if(original.unit!=='minor_'+row.currency.toLowerCase()){
      held.push(holdItem('reversal',row,'currency_mismatch'));continue;
    }
    let value;
    try {value=monetaryRow(row);}catch{
      held.push(holdItem('reversal',row,'unverifiable_refund_amount'));continue;
    }
    if(value!==original.minor){held.push(holdItem('reversal',row,'partial_or_mismatched_reversal'));continue;}
    const latest=sourceSignals().filter(s=>s.payload.assetId===original.assetId).at(-1);
    check(latest,'original signed source record missing');
    if(latest.payload.status==='revoked')continue;
    const id='bc-refund-'+fingerprint({bandId:config.bandId,transaction:row.transaction,original:related,
      item:row.itemId||identity(row)});
    const payload={...latest.payload,eventId:id,revision:latest.payload.revision+1,
      previousHash:contentHash(latest),status:'revoked',observedAt:row.date,
      evidenceHash:contentHash({schema:'bandcamp-full-reversal-claim/v0.1',
        related,refundTx:row.transaction,original:original.assetId,amountMinor:value,currency:row.currency})};
    staged=importBatch(staged,[signSignal(config.sourceId,payload,keys)]);
    reports.push({assetId:original.assetId,kind:'full_reversal',status:'revoked',
      unit:original.unit,quantity:original.minor});
  }
  return {
    inbox:staged,added:staged.signals.length-inbox.signals.length,
    reported:reports,heldForReview:held,projection:project(staged),
    note:'Owner-controlled Bandcamp sales report observations; no buyer PII, payout bank proof, holdings or charity donation inferred.'
  };
}
export function importCsv(inbox,config,keys,bytes){
  return importBandcampRows(inbox,config,keys,parseCsv(bytes));
}
export function importApiV4(inbox,config,keys,body){
  check(body&&Object.keys(body).join(',')==='report'&&Array.isArray(body.report),
    'Bandcamp v4 report array required');
  return importBandcampRows(inbox,config,keys,body.report);
}
export async function fetchAuthorizedBandcampV4(config,startTime,endTime,{
  fetchImpl=fetch,token=process.env.BANDCAMP_ACCESS_TOKEN
}={}){
  config=configureBandcamp(config);
  check(typeof token==='string'&&token.length>8,'Bandcamp OAuth bearer access not configured; manual CSV supported');
  check(typeof startTime==='string'&&typeof endTime==='string'&&
    /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(startTime)&&
    /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(endTime)&&
    startTime<endTime,'bounded Bandcamp UTC time window required');
  const url='https://bandcamp.com/api/sales/4/sales_report';
  let response;
  try {response=await fetchImpl(url,{method:'POST',redirect:'error',
    headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({band_id:config.bandId,start_time:startTime,end_time:endTime}),
    signal:AbortSignal.timeout(30000)});}
  catch {fail('Bandcamp API network access failed');}
  check(response?.ok===true,'Bandcamp API authorization or report request failed');
  if(response.url)check(response.url===url,'unexpected API destination');
  let result;
  try {
    const text=await response.text();
    check(text.length<=12*1024*1024,'API response too large');
    result=JSON.parse(text);
  }catch{fail('invalid Bandcamp API response');}
  check(result&&Array.isArray(result.report)&&result.report.length<=MAX_ROWS,'Bandcamp v4 report array missing');
  return result;
}
