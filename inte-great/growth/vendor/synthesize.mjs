/**
 * GRAFT-017 — bounded counterexample-guided synthesis (CEGIS).
 *
 * No complete method is supplied. Enumerate typed combinations of the five
 * elementary operators, test on PUBLIC cases, request ONE developer
 * counterexample only after proposing a candidate, and freeze the final AST.
 * Held-out inputs are never imported or used in the search.
 *
 * Native MOTIF-003 changes branch ORDER, not the validity contract. Classical
 * exhaustive search uses the exact same grammar, cases, and feedback budget.
 */
import {createHash} from 'node:crypto';
import {allPrograms,renderProgram} from './primitives.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const escaped=x=>x.replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
function publicGate(program,story,spec){
 const html=renderProgram(program,story);
 const expected=[story.title,story.subtitle,...story.captions]
    .every(x=>html.includes(escaped(x)));
 const safe=!/<(?:script|iframe|img|object|embed|form|base|link)\b|<[^>]*\bon\w+\s*=|url\s*\(|@import\b/i.test(html);
 const semantic=story.captions.every((_,i)=>html.includes(
  '<section class="card" aria-label="Story card '+(i+1)+'" data-index="'+(i+1)+'"><p>'));
 const count=(html.match(/<section class="card"/g)||[]).length===story.captions.length;
 return expected&&safe&&semantic&&count&&
  html.startsWith('<!doctype html><html lang="en">')&&
  html.includes('@media print{')&&
  Buffer.byteLength(html,'utf8')<=spec.search.maxHtmlBytes;
}
const strategies={
 'motif-structural-priority':true,'classical-exhaustive':true
};
export function synthesizeOne(spec,{strategy,priority,
  revealCounterexample}){
 if(!Object.hasOwn(strategies,strategy)||typeof revealCounterexample!=='function')
   throw new Error('Explicit supported strategy and independent developer challenger required');
 const ordered=allPrograms(priority);
 const known=spec.publicCases.map(x=>structuredClone(x.story));
 const attempts=[];let programsEvaluated=0,selected=null,rounds=0;
 for(let round=0;round<spec.search.maxCounterexampleRounds;round++){
  const seen=new Set();
  selected=null;
  for(const candidate of ordered){
   const fingerprint=JSON.stringify(candidate);
   if(seen.has(fingerprint))throw new Error('Duplicate candidate');
   seen.add(fingerprint);
   programsEvaluated++;
   if(programsEvaluated>spec.search.maxPrograms*spec.search.maxCounterexampleRounds)
    throw new Error('Search exhausted stated program-count cap');
   if(known.every(story=>publicGate(candidate,story,spec))){
    selected=candidate;break;
   }
  }
  if(!selected)throw new Error('No program satisfies known constraints');
  const counterexample=revealCounterexample(selected);
  const row={program:structuredClone(selected),publicPass:true,
   developmentPass:counterexample===null};
  if(counterexample!==null){
   if(counterexample.kind!=='SYNTHETIC_DEVELOPMENT_COUNTEREXAMPLE'||
      !counterexample.story||!counterexample.name)
    throw new Error('Invalid independently sourced counterexample');
   row.counterexampleName=counterexample.name;
   // The candidate FAILED: add only the newly revealed example to training.
   // Do not carry in held-out cases, even accidentally.
   known.push(structuredClone(counterexample.story));
   rounds++;
  }
  attempts.push(row);
  if(counterexample===null)break;
  if(attempts.length>=spec.search.maxHistoryEntries)
    throw new Error('Too many failed attempts');
 }
 if(!selected||attempts.at(-1)?.developmentPass!==true)
  throw new Error('HOLD: no candidate survived bounded counterexample loop');
 return {
  strategy,selectedProgram:selected,programsEvaluated,
  counterexampleRounds:rounds,attempts,
  publicOutputHashes:spec.publicCases.map(c=>
   sha(renderProgram(selected,c.story))),
  implementationWasSelectedFromPrimitiveCompositions:true,
  noUnrestrictedProgramExecution:true,
  notARealHumanService:true,
  noHiddenCaseAccess:true
 };
}
export function runSyntheses(spec,priority,revealCounterexample){
 if(!spec||spec.schema!=='jubilee.capability-unwritten-method/v1'||
    spec.authority!=='PROPOSE_ONLY'||spec.publicCases?.length!==2||
    !Array.isArray(spec.operators)||spec.operators.length!==5)
  throw new Error('Invalid public research contract');
 if(!Array.isArray(priority)||JSON.stringify([...priority].sort())!==
  JSON.stringify(['angles','entities','raw']))
  throw new Error('Native branch priority must list all three known strategies once');
 const motif=synthesizeOne(spec,{strategy:'motif-structural-priority',
  priority,revealCounterexample});
 const exhaustive=synthesizeOne(spec,{strategy:'classical-exhaustive',
  priority:['raw','angles','entities'],revealCounterexample});
 return {
  schema:'graft.unwritten-method-laboratory/v1',
  authority:'PROPOSE_ONLY',
  publicSpecFingerprintSha256:sha(JSON.stringify(spec)),
  sourceProject:'the-static-collective/GRAFT',
  generationTechnique:'finite-composition-from-primitives-not-a-prompted-arbitrary-code-author',
  runs:[motif,exhaustive],
  realContacts:0,realMoneyMovedCents:0,
  productionDeploymentAuthorized:false
 };
}
