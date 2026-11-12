/**
 * CAPABILITY-020 — public behavioral contract; no winning program supplied.
 *
 * Can the 019 sequential run-accumulator language be extended to a DIFFERENT
 * kind of state: a LIFO pending-obligation store for two-type nested brackets?
 *
 * We deliberately expose three representations (single register, per-type
 * counters, and a generic last-in-first-out array) as primitives. The
 * machine composes its architecture and policies; it does NOT invent stack
 * data structures or parsing theory from nothing.
 */
import {createHash} from 'node:crypto';

export const grammar=[
  {slot:'memory',options:['last-register','per-type-counters','lifo-list']},
  {slot:'match',options:['any-closer','correct-type']},
  {slot:'end',options:['allow-unclosed','require-empty']},
  {slot:'invalid',options:['ignore','sticky-reject']},
  {slot:'emit',options:['validity-only','matched-indices']}
];
export const digest=x=>createHash('sha256')
 .update(JSON.stringify(x)).digest('hex');
export function challenge(){
 return {
   schema:'jubilee.structural-memory-change/v1',
   authority:'PROPOSE_ONLY',
   source:'the-static-collective/Jubilee-treasury',
   receiver:'the-static-collective/GRAFT',
   task:'recognize-and-witness-properly-nested-two-type-brackets',
   inputAlphabet:'()[]',
   outputType:'{valid:boolean,pairs:sorted-array-of-[open-index,close-index,type]}',
   behavior:'Accept only correctly nested and closed brackets; for valid input list each matched pair by its opening index; invalid input returns empty pairs.',
   stages:grammar.map(x=>({slot:x.slot,options:[...x.options]})),
   publicCases:[
     {name:'one-round',input:'()',expected:{valid:true,pairs:[[0,1,'()']]}},
     {name:'one-square',input:'[]',expected:{valid:true,pairs:[[0,1,'[]']]}},
     {name:'two-flat',input:'()[]',expected:{valid:true,
       pairs:[[0,1,'()'],[2,3,'[]']]}}
   ],
   existingLibrary:{
     predecessor:'CAPABILITY-019 / 48 stream run-compressor programs',
     output:'ordered run-count pairs, never bracket matching witness',
     correctArchitectureProvidedAsWholeProgram:false
   },
   bounds:{maxPrograms:48,maxDevelopmentRounds:8,
     maxTextLength:40,maxReportBytes:36000,maxHistory:12},
   rights:{allInputsInvented:true,realPeopleContacted:0,
     actualRightsVerified:false,realMoneyMovedCents:0,
     realWorkPerformed:false,actualCreditorReleaseCents:0}
 };
}
export function verifyChallenge(v){
 if(JSON.stringify(v)!==JSON.stringify(challenge()))
  throw new Error('HOLD: modified or unsupported source-owned 020 problem');
 return true;
}
export function assertInput(value){
 if(typeof value!=='string'||value.length>40||/[^()[\]]/.test(value))
  throw new Error('Only bounded fictional parentheses/brackets permitted');
 return true;
}
export function assertProgram(p){
 if(!p||p.schema!=='graft.typed-bracket-program/v1'||
    Object.keys(p).sort().join(',')!=='schema,stages'||
    !Array.isArray(p.stages)||p.stages.length!==grammar.length)
   throw new Error('Typed bracket program shape required');
 for(let i=0;i<grammar.length;i++){
  const s=p.stages[i],g=grammar[i];
  if(!s||Object.keys(s).sort().join(',')!=='choice,slot'||
     s.slot!==g.slot||!g.options.includes(s.choice))
   throw new Error('HOLD: reject unlisted memory or instruction primitive');
 }
 return true;
}
export function allPrograms(){
 let sequences=[[]];
 for(const group of grammar){
  sequences=sequences.flatMap(stages=>group.options.map(choice=>[
   ...stages,{slot:group.slot,choice}
  ]));
 }
 if(sequences.length!==48)throw new Error('Unexpected bounded grammar size');
 return sequences.map(stages=>({
  schema:'graft.typed-bracket-program/v1',stages
 }));
}
