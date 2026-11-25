/**
 * Independent, SOURCE-OWNED Jubilee interpreter and acceptance tests for
 * GRAFT's GENERATED TYPED PROGRAM. No eval/Function or remote execution.
 *
 * This file deliberately implements the same bounded DSL separately from
 * GRAFT's synthesizer. It is not a claim of HTML security certification.
 */
import {validateStory,validateTypedProgram,
 makeUnwrittenSpec} from './contract.mjs';
const escapeEntities=x=>x.replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const escapeAngles=x=>x.replace(/</g,'&lt;').replace(/>/g,'&gt;');
const safe={
 raw:x=>x,angles:escapeAngles,entities:escapeEntities
};
export function independentRun(program,story,spec=makeUnwrittenSpec()){
 validateTypedProgram(program,spec);
 validateStory(story,spec);
 const mode=Object.fromEntries(program.stages.map(s=>[s.slot,s.choice]));
 const enc=safe[mode.escape];
 const label=i=>'Story card '+(i+1);
 const card=(caption,i)=>{
  const index=mode.indices==='data-index'?' data-index="'+(i+1)+'"':'';
  if(mode.cards==='paragraph')
   return '<p class="card"'+index+'>'+enc(caption)+'</p>';
  const aria=mode.cards==='labeled-sections'?
    ' aria-label="'+label(i)+'"':'';
  return '<section class="card"'+aria+index+'><p>'+
    enc(caption)+'</p></section>';
 };
 const core='<h1>'+enc(story.title)+'</h1>'+
  '<p class="subtitle">'+enc(story.subtitle)+'</p>'+
  story.captions.map(card).join('')+
  '<footer>Fictional research only. No rights, contract, money or service.</footer>';
 const html=mode.wrapper==='document'?
  '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
  '<title>'+enc(story.title)+'</title>'+
  (mode.print==='print-css'?
   '<style>@media print{body{background:white;color:black}.card{break-inside:avoid}}</style>':'')+
  '</head><body>'+core+'</body></html>':
  '<div class="story">'+core+'</div>';
 return html;
}
function activeMarkup(html){
 return /<(?:script|iframe|img|form|link|object|embed|base)\b|<[^>]*\bon\w+\s*=|<[^>]*(?:src|href)\s*=\s*["']?\s*(?:https?:|javascript:)|@import\b|url\s*\(/i.test(html);
}
export function assessProgram(program,story,spec=makeUnwrittenSpec()){
 const html=independentRun(program,story,spec);
 const expected=escapeEntities;
 const contents=[story.title,story.subtitle,...story.captions];
 const textPreserved=contents.every(x=>html.includes(expected(x)));
 const noActiveTags=!activeMarkup(html);
 const semantic=story.captions.every((_,i)=>
  html.includes('<section class="card" aria-label="Story card '+(i+1)+'"'));
 const indexed=story.captions.every((_,i)=>
  html.includes(' data-index="'+(i+1)+'"><p>'));
 const counts=(html.match(/<section class="card"/g)||[]).length===story.captions.length;
 const checks={
  noActiveTags,textPreserved,semantic,indexed,counts,
  hasDocument:html.startsWith('<!doctype html><html lang="en">'),
  printable:html.includes('@media print{'),
  determinism:html===independentRun(program,story,spec),
  bounded:Buffer.byteLength(html,'utf8')<=spec.search.maxHtmlBytes
 };
 return {
  passing:Object.values(checks).every(Boolean),
  checks,
  byteCount:Buffer.byteLength(html,'utf8'),
  html,
  realServicesPerformed:0,realPeopleContacted:0,realMoneyMovedCents:0
 };
}
export function qualitySummary(program,stories,spec=makeUnwrittenSpec()){
 const detailed=stories.map(x=>assessProgram(program,x.story??x,spec));
 return {passing:detailed.every(x=>x.passing),
  cases:detailed.map(x=>({
   passing:x.passing,checks:x.checks,bytes:x.byteCount
  })),
  firstFailingCheck:detailed.flatMap(x=>Object.entries(x.checks)
   .filter(([,value])=>!value).map(([name])=>name))[0]??null};
}
