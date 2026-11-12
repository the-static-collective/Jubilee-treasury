/**
 * Jubilee CAPABILITY-017 — PUBLIC specification for composing a new program.
 *
 * No complete correct method is provided. A method is a five-stage typed
 * program chosen from public elementary operators; real GRAFT must search
 * for its program, not copy a finished script. Source-owned independent
 * challenge and held-out cases are kept in separate modules and are NEVER
 * exported inside this specification. The repos are PUBLIC: this is process
 * isolation, NOT cryptographic concealment from a malicious code author.
 */
import {createHash} from 'node:crypto';
export const slots=Object.freeze([
  {slot:'escape',options:['raw','angles','entities']},
  {slot:'cards',options:['paragraph','sections','labeled-sections']},
  {slot:'wrapper',options:['fragment','document']},
  {slot:'print',options:['none','print-css']},
  {slot:'indices',options:['none','data-index']}
]);
export const suiteFingerprint=x=>createHash('sha256')
 .update(JSON.stringify(x)).digest('hex');
export function makeUnwrittenSpec(){
 return {
  schema:'jubilee.capability-unwritten-method/v1',
  authority:'PROPOSE_ONLY',
  source:'the-static-collective/Jubilee-treasury',
  receiver:'the-static-collective/GRAFT',
  goal:'portable-storyboard-for:L',
  input:'fictional-image-permission:F',
  operators:slots.map(x=>({...x,options:[...x.options]})),
  publicCases:[
   {name:'simple',story:{title:'The Unspent Object',
     subtitle:'A fictional exhibit',captions:['A large object rests on a table.',
       'Its story invites cooperation.']}},
   {name:'multiple-cards',story:{title:'Community Notebook',
     subtitle:'Local possibilities',captions:['First offer','Second offer',
       'Third offer']}}
  ],
  objective:{
   escapeUntrustedText:true,
   semanticLabeledCards:true,
   sequentialDataIndices:true,
   printableOffline:true,
   htmlDocumentLanguage:'en',
   deterministic:true,
   noRealActions:true
  },
  search:{
   maxPrograms:72,maxCounterexampleRounds:4,maxHistoryEntries:20,
   maxCardCount:5,maxTextChars:240,maxHtmlBytes:12000,
   nativeResearchMode:'MOTIF-003-as-branch-order-only',
   strongClassicalBaseline:'exhaustive-same-DSL-with-counterexamples',
   weakerBaseline:'existing-fixed-GRAFT-016-method-catalog'
  },
  sourceFacts:{
   userDataUsed:false,realPropertyRightsVerified:false,
   humanConsentRecorded:false,creditorSatisfactionVerified:false,
   realMoneyMovedCents:0,realWorkCompleted:false
  }
 };
}
export function validUnwrittenSpec(x){
 if(JSON.stringify(x)!==JSON.stringify(makeUnwrittenSpec()))
  throw new Error('HOLD: specification is not the source-owned public contract');
 return true;
}
export function allTypedPrograms(spec=makeUnwrittenSpec()){
 validUnwrittenSpec(spec);
 let programs=[[]];
 for(const s of spec.operators)
   programs=programs.flatMap(steps=>s.options.map(option=>
    [...steps,{slot:s.slot,choice:option}]));
 if(programs.length!==spec.search.maxPrograms)
  throw new Error('Finite grammar size does not match source-owned bound');
 return programs.map(stages=>({schema:'graft.typed-story-program/v1',stages}));
}
export function validateTypedProgram(p,spec=makeUnwrittenSpec()){
 validUnwrittenSpec(spec);
 if(!p||p.schema!=='graft.typed-story-program/v1'||
    !Array.isArray(p.stages)||p.stages.length!==spec.operators.length||
    Object.keys(p).sort().join(',')!=='schema,stages')
   throw new Error('HOLD: invalid or extra executable program fields');
 for(let i=0;i<p.stages.length;i++){
  const stage=p.stages[i],def=spec.operators[i];
  if(!stage||Object.keys(stage).sort().join(',')!=='choice,slot'||
     stage.slot!==def.slot||!def.options.includes(stage.choice))
    throw new Error('HOLD: program must use only explicitly allowed typed building blocks');
 }
 return true;
}
export function validateStory(story,spec=makeUnwrittenSpec()){
 validUnwrittenSpec(spec);
 if(!story||typeof story!=='object'||Array.isArray(story)||
    Object.keys(story).sort().join(',')!=='captions,subtitle,title')
  throw new Error('HOLD: unexpected story schema');
 const bounded=x=>typeof x==='string'&&x.length>0&&
   x.length<=spec.search.maxTextChars;
 if(!bounded(story.title)||!bounded(story.subtitle)||
    !Array.isArray(story.captions)||story.captions.length<1||
    story.captions.length>spec.search.maxCardCount||
    story.captions.some(x=>!bounded(x)))
  throw new Error('HOLD: missing/oversized untrusted story fields');
 return true;
}
