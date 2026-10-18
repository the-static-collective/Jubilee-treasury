// PENNY BOX 001 — local-first public need board, no money processing.
import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Journal, publicBoard, createNeed, createOffer, createObservation, createClose } from './ledger.mjs';

const UI = readFileSync(new URL('./ui.js', import.meta.url), 'utf8');
const css = [
  ':root{--ink:#20312d;--pine:#274c40;--cream:#faf5e9;--copper:#b78140}',
  '*{box-sizing:border-box}body{font:18px/1.55 system-ui,sans-serif;margin:0;background:var(--cream);color:var(--ink)}',
  'header{background:var(--pine);color:white;padding:2.6rem max(1rem,calc((100% - 920px)/2))}',
  'h1{font-size:clamp(2.8rem,8vw,5rem);line-height:1;margin:.2em 0}header p{max-width:48rem}',
  'main{max-width:920px;margin:auto;padding:1.4rem 1rem 4rem}h2{line-height:1.2}',
  '.needs{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:1rem}',
  '.need,.note{background:white;border:1px solid #d6d2c8;border-radius:1rem;padding:1.25rem}',
  '.count{font-weight:700}.caption{font-size:.86rem;color:#475852}',
  '.callout{border-left:5px solid var(--copper);padding:1.1rem;background:#fff6e2;margin:1.3rem 0}',
  '.eyebrow{font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:.8rem}',
  'progress{width:100%;height:1rem;accent-color:var(--pine)}',
  'button,select{display:block;width:100%;font:inherit;padding:.5rem;margin:.5rem 0}',
  'button{background:var(--pine);color:white;border:0;border-radius:.4rem;cursor:pointer}',
  'button:disabled{opacity:.6}.interest{border-top:1px solid #ddd;margin-top:1rem;padding-top:1rem}',
  '.small{font-size:.88rem}',
  '@media print{body{font-size:13px}header{padding:1rem}main{padding:.5rem}.no-print{display:none}.need{break-inside:avoid}}'
].join('');

function reply(res, status, value, type='application/json') {
  res.writeHead(status, {
    'Content-Type': type + '; charset=utf-8',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': type === 'text/html'
      ? "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; form-action 'none'"
      : "default-src 'none'; frame-ancestors 'none'"
  });
  res.end(type === 'application/json' ? JSON.stringify(value) : value);
}
function escape(s) {
  return String(s).replace(/[&<>"']/g, x => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[x]);
}
function authorized(req, token) {
  if (typeof token !== 'string' || token.length < 24) return false;
  const supplied = Buffer.from(req.headers.authorization || '');
  const expected = Buffer.from('Bearer ' + token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
async function input(req) {
  if ((req.headers['content-type'] || '').split(';')[0].trim() !== 'application/json')
    throw Error('JSON required');
  const parts=[]; let size=0;
  for await (const part of req) {
    size += part.length;
    if (size > 2048) throw Error('Payload exceeds limit');
    parts.push(part);
  }
  const val = JSON.parse(Buffer.concat(parts).toString('utf8'));
  if (!val || typeof val !== 'object' || Array.isArray(val)) throw Error('JSON object required');
  return val;
}
function fields(val, names) {
  if (Object.keys(val).sort().join('|') !== [...names].sort().join('|'))
    throw Error('Unknown or missing form fields');
}
function page(board, isPrint) {
  const cards = board.needs.map(n => {
    const percentage = Math.max(0,Math.min(100,Math.round(n.observed*100/n.goal)));
    const interest = n.status === 'OPEN' && !isPrint
      ? '<form class="interest no-print" data-need-id="' + escape(n.id) + '">' +
        '<label>How might you help?<select aria-label="Help with ' + escape(n.title) + '">' +
        '<option value="time">Volunteer time</option><option value="transport">Transportation</option>' +
        '<option value="equipment">Equipment</option><option value="groceries">Groceries</option>' +
        '</select></label><button type="submit">Raise a hand (anonymous)</button>' +
        '<p role="status" aria-live="polite" class="caption">A signal only. Speak with the local steward to arrange anything.</p></form>' : '';
    return '<article class="need"><h2>' + escape(n.title) + '</h2><p>' + escape(n.summary) +
      '</p><progress value="' + percentage + '" max="100">' + percentage + '%</progress>' +
      '<p class="count">' + n.observed.toLocaleString('en-US') + ' / ' + n.goal.toLocaleString('en-US') +
      ' ' + escape(n.unitLabel) + '</p><p class="caption">' + escape(n.status) +
      '. Locally steward-recorded, not a bank balance.</p>' + interest + '</article>';
  }).join('');
  const printed = isPrint ? '<section class="note"><h2>Approved QR goes here</h2>' +
    '<p>Generate an offline QR code from the church-approved HTTPS address, then scan-test it. ' +
    'This local prototype has no public address.</p><div style="width:160px;height:160px;border:3px dashed #345f4b"></div></section>' :
    '<p class="no-print"><a href="/print">Print a companion poster</a></p>';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>PENNY BOX — Small Things Count</title><style>' + css + '</style></head><body>' +
    '<header><p class="eyebrow">Community participation · Local prototype</p>' +
    '<h1>PENNY BOX</h1><p><strong>Small things count.</strong> A coin. A ride. A spare computer. An ordinary act of care.</p></header>' +
    '<main><section class="callout"><strong>How to take part:</strong> ' +
    'Physical contributions go in a church-managed box. For volunteering or equipment, speak with a steward. ' +
    'This page does not process payments or collect contact details.</section>' +
    '<h2>What our community is working toward</h2><div class="needs">' +
    (cards || '<p>No open needs yet.</p>') + '</div>' +
    '<section class="note"><h2>Two separate kinds of participation</h2>' +
    '<p><strong>Coins and goods:</strong> a steward counts or receives them. ' +
    '<strong>Service:</strong> a steward separately confirms completed actions. ' +
    'Anonymous interest never increases public progress.</p>' +
    '<p class="small">The included examples are synthetic. No accounts, payment links, token issuance, ' +
    'donor rankings, or tax-deduction claims.</p></section>' + printed + '</main>' +
    (isPrint ? '' : '<script src="/ui.js" defer></script>') + '</body></html>';
}
export function createPennyBox({ journalPath, stewardToken = null }) {
  const store = new Journal(journalPath);
  return createServer(async (req,res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    try {
      if (req.method === 'GET' && path === '/ui.js')
        return reply(res,200,UI,'application/javascript');
      if (req.method === 'GET' && path === '/health') {
        store.state();
        return reply(res,200,{status:'LOCAL_DEMO',noPayments:true,noPennyIssuance:true});
      }
      if (req.method === 'GET' && ['/', '/print', '/api/board'].includes(path)) {
        const board = publicBoard(store.state());
        return path === '/api/board' ? reply(res,200,board) :
          reply(res,200,page(board,path==='/print'),'text/html');
      }
      if (path.startsWith('/api/steward/')) {
        if (!authorized(req,stewardToken))
          return reply(res,401,{error:'Local steward authorization required'});
        if (req.method === 'GET' && path === '/api/steward/ledger') {
          const state=store.state();
          return reply(res,200,{ offers:state.offers, observations:state.observations,
            needs:state.needs, note:'Observations are not settlements or physical-delivery proof' });
        }
        if (req.method === 'POST') {
          const data=await input(req);
          if (path === '/api/steward/need') {
            fields(data,['title','summary','goal','unit']);
            const e=createNeed(data); store.append(e);
            return reply(res,201,{needId:e.need.id});
          }
          if (path === '/api/steward/observe') {
            fields(data,['needId','quantity','unit','basis']);
            const e=createObservation(data); store.append(e);
            return reply(res,201,{observationId:e.observation.id,status:'LOCAL_STEWARD_OBSERVATION'});
          }
          if (path === '/api/steward/close') {
            fields(data,['needId']); store.append(createClose(data));
            return reply(res,200,{status:'CLOSED'});
          }
        }
      }
      if (req.method === 'POST' && path === '/api/interest') {
        const data=await input(req); fields(data,['needId','kind']);
        const e=createOffer(data); store.append(e);
        return reply(res,202,{status:'CANDIDATE_ONLY',offerId:e.offer.id,
          message:'Not a pledge or completed act. Contact your church steward directly.'});
      }
      return reply(res,404,{error:'Not found'});
    } catch(error) {
      const expected = /Invalid |Unrecognized|Unexpected|Unknown|JSON required|JSON object|Payload exceeds|not applicable|Wrong observation|form fields/i.test(String(error.message));
      return reply(res,expected?400:503,{error:expected?'Input refused':'Journal unavailable or integrity check failed'});
    }
  });
}
