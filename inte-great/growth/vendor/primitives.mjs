/**
 * GRAFT-017 — small typed operator interpreter, not a prelisted full method.
 *
 * Each complete program is assembled from five independent, source-owned
 * choices. It cannot execute arbitrary JS or import unapproved libraries.
 * Jubilee implements its OWN independent compiler and acceptance contract.
 */
const encode={
 raw:s=>s,
 angles:s=>s.split('<').join('&lt;').split('>').join('&gt;'),
 entities:s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
};
export const grammar=[
 {slot:'escape',choices:['raw','angles','entities']},
 {slot:'cards',choices:['paragraph','sections','labeled-sections']},
 {slot:'wrapper',choices:['fragment','document']},
 {slot:'print',choices:['none','print-css']},
 {slot:'indices',choices:['none','data-index']}
];
export function allPrograms(priority=['raw','angles','entities']){
 if(!Array.isArray(priority)||priority.length!==3||
    new Set(priority).size!==3||priority.some(x=>!grammar[0].choices.includes(x)))
  throw new Error('No caller-defined untrusted operator preferences');
 let partial=[[]];
 for(const [i,slot] of grammar.entries()){
  const choices=i===0?priority:slot.choices;
  partial=partial.flatMap(stages=>choices.map(x=>[
    ...stages,{slot:slot.slot,choice:x}
  ]));
 }
 if(partial.length!==72)throw new Error('Incorrect combinatorial search size');
 return partial.map(stages=>({schema:'graft.typed-story-program/v1',stages}));
}
export function renderProgram(program,story){
 if(!program||program.schema!=='graft.typed-story-program/v1'||
    !Array.isArray(program.stages)||program.stages.length!==5)
  throw new Error('Bounded complete program required');
 const config={};
 for(let n=0;n<grammar.length;n++){
  const got=program.stages[n],expected=grammar[n];
  if(!got||got.slot!==expected.slot||
     !expected.choices.includes(got.choice)||
     Object.keys(got).sort().join(',')!=='choice,slot')
   throw new Error('Unknown source operator or stage order');
  config[got.slot]=got.choice;
 }
 if(Object.keys(program).sort().join(',')!=='schema,stages')
  throw new Error('Reject arbitrary source text and unrecognized program functions');
 const e=encode[config.escape];
 const captions=story.captions.map((value,index)=>{
  const n=index+1;
  const number=config.indices==='data-index'?
    ' data-index="'+n+'"':'';
  if(config.cards==='paragraph')
    return '<p class="card"'+number+'>'+e(value)+'</p>';
  const label=config.cards==='labeled-sections'?
    ' aria-label="Story card '+n+'"':'';
  return '<section class="card"'+label+number+'><p>'+e(value)+'</p></section>';
 }).join('');
 const content='<h1>'+e(story.title)+'</h1>'+
   '<p class="subtitle">'+e(story.subtitle)+'</p>'+captions+
   '<footer>Fictional research only. No rights, contract, money or service.</footer>';
 if(config.wrapper==='fragment')return '<div class="story">'+content+'</div>';
 const styles=config.print==='print-css'?
   '<style>@media print{body{background:white;color:black}.card{break-inside:avoid}}</style>':'';
 return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
   '<title>'+e(story.title)+'</title>'+styles+
   '</head><body>'+content+'</body></html>';
}
