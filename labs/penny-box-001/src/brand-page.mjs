// PENNY BOX 002: the same approved public data, rendered as a phone-first commons doorway.
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const head = title => '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta name="theme-color" content="#163e32">'+
  '<meta name="description" content="PENNY BOX — Small things count. A local community participation prototype.">'+
  '<title>'+escape(title)+'</title><link rel="icon" href="/mark.svg" type="image/svg+xml">'+
  '<link rel="stylesheet" href="/brand.css"></head><body>';
export function brandPage(board,isPrint) {
 if(isPrint) return head('PENNY BOX — Print Kit')+
  '<main class="print-page"><div class="print-panel"><h1>THE PENNY BOX PRINT KIT.</h1>'+
  '<p><strong>Approved QR goes here.</strong> Place a QR code here only after church/steward approval. The poster deliberately has no live destination. No real donations, public account or real church data are enabled.</p>'+
  '<p>Print at 100% / actual size. Check your container before applying labels. This is artwork for a reused box, not structural packaging plans.</p>'+
  '<p><a href="/kit/poster-letter.svg" download>Letter-size poster</a>'+
  '<a href="/kit/box-front-5x7.svg" download>5×7-inch box label</a>'+
  '<a href="/kit/box-top-8x2.svg" download>8×2-inch top strip</a>'+
  '<a href="/">Back to community board</a></p></div>'+
  '<div class="print-previews"><figure><img alt="PENNY BOX QR-ready community poster" src="/kit/poster-letter.svg"><figcaption>US Letter • reserved QR area</figcaption></figure>'+
  '<figure><img alt="PENNY BOX collection label" src="/kit/box-front-5x7.svg"><figcaption>Five-by-seven-inch box label</figcaption></figure></div></main></body></html>';
 const cards = board.needs.map((n,i)=>{
  const percentage=Math.max(0,Math.min(100,Math.round(n.observed*100/n.goal)));
  const interest=n.status==='OPEN'?
    '<form class="interest" data-need-id="'+escape(n.id)+'">'+
    '<label>HOW COULD YOU HELP?<select aria-label="Help with '+escape(n.title)+'">'+
    '<option value="time">Volunteer time</option><option value="transport">Transportation</option>'+
    '<option value="equipment">Equipment</option><option value="groceries">Groceries</option></select></label>'+
    '<button type="submit">Raise a hand (anonymous) ↗</button>'+
    '<p role="status" aria-live="polite" class="caption">A signal only. Speak with a steward to arrange help.</p></form>':'';
  return '<article class="need"><span class="badge">PROJECT '+String(i+1).padStart(2,'0')+'</span>'+
    '<h3>'+escape(n.title)+'</h3><p class="description">'+escape(n.summary)+'</p>'+
    '<div class="progress-meta"><strong>'+n.observed.toLocaleString('en-US')+' / '+n.goal.toLocaleString('en-US')+
    '</strong><small>'+percentage+'% observed</small></div>'+
    '<progress value="'+percentage+'" max="100" aria-label="Observed progress for '+escape(n.title)+'">'+percentage+'%</progress>'+
    '<p class="caption">'+escape(n.unitLabel)+' · '+escape(n.status)+'<br>Recorded by a local steward; not a bank balance.</p>'+interest+'</article>';
 }).join('');
 return head('PENNY BOX — Small Things Count')+
  '<div class="topbar"><div class="shell topbar-inner"><a class="brand" href="/"><img src="/mark.svg" alt="">PENNY BOX</a>'+
  '<a class="top-link" href="/print">Print the box kit ↗</a></div></div>'+
  '<header class="hero"><div class="shell hero-inner"><div><p class="eyebrow">COMMON GOODS / LOCAL HANDS</p>'+
  '<h1 aria-label="Small things count">Small things<br><em>count.</em></h1>'+
  '<p class="lead">A coin. A ride. A little time. A spare computer. Ordinary things, offered together, can become something good.</p>'+
  '<div class="hero-actions"><a class="primary" href="#community-needs">See what we can do ↗</a>'+
  '<a class="light-link" href="#how-it-works">How PENNY BOX works</a></div></div>'+
  '<img class="hero-mark" src="/mark.svg" alt="A seedling growing inside a penny"></div></header>'+
  '<div class="dotted-rule" aria-hidden="true"></div>'+
  '<main class="shell"><section class="intro"><div><p class="eyebrow section-kicker">THE COMMUNITY TABLE</p>'+
  '<h2>Bring what you have.<br>Help where you can.</h2>'+
  '<p>There is no minimum, no ranking, and no account needed. Look at a need, offer a hand, or put coins in the physical box. A trusted local steward coordinates any real-world action.</p></div>'+
  '<aside class="stamp"><p class="eyebrow">THE RULE OF THE BOX</p><strong>Offering is not the same as completing.</strong>'+
  '<p>Needs, interest, physical coins, donated equipment and completed services stay separately recorded. This demonstration never processes money.</p></aside></section>'+
  '<section class="board" id="community-needs" aria-labelledby="needs-heading"><div class="section-header">'+
  '<div><p class="eyebrow section-kicker">LOCAL WORK / SHARED GOOD</p><h2 id="needs-heading">What needs tending?</h2></div>'+
  '<p class="small-label">Steward-recorded progress, not verified payments or financial balances.</p></div><div class="needs">'+
  (cards||'<p>No open needs yet.</p>')+'</div></section>'+
  '<section class="how" id="how-it-works"><p class="eyebrow section-kicker">AS SIMPLE AS THAT</p><h2>How a little becomes a lot.</h2>'+
  '<div class="steps"><div class="step"><div class="step-count">01</div><h3>See the need.</h3><p>Find a local project you care about. The board shows what a steward has recorded so far.</p></div>'+
  '<div class="step"><div class="step-count">02</div><h3>Bring your part.</h3><p>A penny goes in the box; a helping hand is offered here or in person. No pressure.</p></div>'+
  '<div class="step"><div class="step-count">03</div><h3>See the good.</h3><p>As a steward confirms actions, the board changes. An interest signal alone never increases progress.</p></div></div></section>'+
  '<div class="lowbar"><div><h3>Want to put a box on a table?</h3><p>Download an editable poster and labels. QR stays blank until a steward approves a real HTTPS page.</p></div>'+
  '<a href="/print">OPEN THE PRINT KIT ↗</a></div></main>'+
  '<footer><div class="shell"><strong>PENNY BOX / SMALL THINGS COUNT</strong><span>Local prototype · Synthetic examples · No payments or PENNY issuance</span></div></footer>'+
  '<script src="/ui.js" defer></script></body></html>';
}
