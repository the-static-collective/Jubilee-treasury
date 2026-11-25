/**
 * CAPABILITY-019 — PUBLIC SPEC, not the implementation.
 *
 * Construct a compact, lossless RUN-LENGTH ENCODER of adjacent identical
 * Unicode grapheme clusters using a minimal typed state-machine grammar.
 *
 * 018 could COUNT graphemes but lacked any ordered run state/transition or
 * pair output. 019 asks GRAFT to synthesize a NEW-TO-OUR-LIBRARY compound
 * operation, not choose a preexisting RLE implementation.
 *
 * Source-owned report and cases are fictional, no contacts or payments.
 */
import {createHash} from 'node:crypto';
export const stageGrammar=Object.freeze([
 {slot:'segment',options:['utf16','codepoint','grapheme']},
 {slot:'identity',options:['casefold','exact']},
 {slot:'ifSame',options:['append','increment']},
 {slot:'ifDifferent',options:['increment','append']},
 {slot:'emit',options:['lengths-only','ordered-pairs']}
]);
export const copy=x=>JSON.parse(JSON.stringify(x));
export const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function makeChallenge(){
 return {
  schema:'jubilee.constructive-missing-primitive/v1',
  authority:'PROPOSE_ONLY',
  source:'the-static-collective/Jubilee-treasury',
  receiver:'the-static-collective/GRAFT',
  task:'construct-lossless-ordered-grapheme-run-encoder',
  inputType:'bounded-fictional-text-caption',
  outputType:'ordered-array-of-[exact-grapheme-string,positive-run-count]',
  expectedBehavior:'group consecutive identical Unicode grapheme clusters without losing case, accents, ZWJ emoji or original text',
  existingLibrary:{
   primitive018:'Unicode-grapheme COUNT only',
   primitive017:'five-stage static HTML formatter; no run-state or ordered pair output',
   knownFullSolutionProvided:false
  },
  grammar:stageGrammar.map(x=>({slot:x.slot,options:[...x.options]})),
  publicCases:[
   {id:'one',input:'a',expected:[['a',1]]},
   {id:'two-distinct',input:'ab',expected:[['a',1],['b',1]]}
  ],
  constraints:{
   maxPrograms:48,
   maxCounterexampleRounds:6,
   maxResponseChars:250,
   maxReportBytes:30000,
   maxRuns:240,
   maxTextCodeUnits:240,
   maxHeldoutCases:8,
   allowGenericUntrustedCode:false
  },
  rights:{
   allInputsInvented:true,realOwnerConsentVerified:false,
   realCreditorAgreement:false,externalCallsAuthorized:false,
   realMoneyMovedCents:0,actualWorkPerformed:false
  }
 };
}
export function validateChallenge(x){
 if(JSON.stringify(x)!==JSON.stringify(makeChallenge()))
  throw new Error('HOLD: unrecognized source-owned 019 specification');
 return true;
}
export function validateInput(x){
 if(typeof x!=='string'||x.length<1||
    x.length>makeChallenge().constraints.maxTextCodeUnits)
  throw new Error('HOLD: only bounded nonempty fictional strings accepted');
 return true;
}
export function listAllPrograms(){
 let current=[[]];
 for(const group of stageGrammar){
  current=current.flatMap(steps=>group.options.map(choice=>
   [...steps,{slot:group.slot,choice}]));
 }
 if(current.length!==48)throw new Error('Incorrect finite search extent');
 return current.map(stages=>({
  schema:'graft.typed-rle-program/v1',stages
 }));
}
export function validateProgram(program){
 if(!program||program.schema!=='graft.typed-rle-program/v1'||
    Object.keys(program).sort().join(',')!=='schema,stages'||
    !Array.isArray(program.stages)||program.stages.length!==stageGrammar.length)
  throw new Error('HOLD: only a fixed typed candidate program is accepted');
 for(let i=0;i<stageGrammar.length;i++){
  const got=program.stages[i],allowed=stageGrammar[i];
  if(!got||Object.keys(got).sort().join(',')!=='choice,slot'||
     got.slot!==allowed.slot||!allowed.options.includes(got.choice))
   throw new Error('HOLD: unsupported primitive or injected operation');
 }
 return true;
}
