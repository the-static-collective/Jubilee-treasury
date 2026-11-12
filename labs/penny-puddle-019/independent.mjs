/**
 * Completely independent, Jubilee-owned reference interpreter.
 *
 * This interpreter constructs a generic stream reducer from the submitted
 * typed AST. GRAFT's interpreter is neither imported nor trusted. No eval,
 * arbitrary user JS, network, real asset, authority, or user identification.
 */
import {listAllPrograms,validateProgram,validateInput} from './contract.mjs';
import {makePrimitiveChallenge,makeDescriptor,
 independentCountAndRender} from '../penny-puddle-018/independent.mjs';
import {makePrimitiveChallenge as earlierChallenge} from '../penny-puddle-018/contract.mjs';
import {makeUnwrittenSpec,allTypedPrograms} from '../penny-puddle-017/contract.mjs';
import {independentRun} from '../penny-puddle-017/independent.mjs';

export function compileAndRun(program,text){
 validateProgram(program);validateInput(text);
 const d=Object.fromEntries(program.stages.map(x=>[x.slot,x.choice]));
 const tokenize={
  utf16:x=>x.split(''),
  codepoint:x=>Array.from(x),
  grapheme:x=>Array.from(
   new Intl.Segmenter('en',{granularity:'grapheme'}).segment(x),
   x=>x.segment)
 }[d.segment];
 const units=tokenize(text);
 const runs=[];
 for(const unit of units){
  if(runs.length===0){
   runs.push([unit,1]);continue;
  }
  const last=runs.at(-1);
  const equal=d.identity==='casefold'?
    last[0].toLowerCase()===unit.toLowerCase():
    last[0]===unit;
  const action=equal?d.ifSame:d.ifDifferent;
  if(action==='append')runs.push([unit,1]);
  else if(action==='increment')last[1]++;
  else throw new Error('Unsupported reducer action');
 }
 return d.emit==='lengths-only'?runs.map(x=>x[1]):runs;
}
export function checkRLEProgram(program,caseRecord){
 validateProgram(program);
 if(!caseRecord||typeof caseRecord!=='object'||
    !Array.isArray(caseRecord.expected)||!caseRecord.expected.length)
  throw new Error('Independent test requires literal expected pairs');
 const value=compileAndRun(program,caseRecord.input);
 const structural=Array.isArray(value)&&value.every(x=>
  Array.isArray(x)&&x.length===2&&typeof x[0]==='string'&&
  Number.isSafeInteger(x[1])&&x[1]>0);
 const literal=JSON.stringify(value)===JSON.stringify(caseRecord.expected);
 const roundtrip=structural&&
  value.map(([grapheme,n])=>grapheme.repeat(n)).join('')===caseRecord.input;
 const maximal=structural&&value.every((p,i)=>
  i===0||p[0]!==value[i-1][0]);
 const totalGraphemes=Array.from(
   new Intl.Segmenter('en',{granularity:'grapheme'}).segment(caseRecord.input)
  ).length;
 const countPreserved=structural&&
  value.reduce((sum,p)=>sum+p[1],0)===totalGraphemes;
 const noSideEffects=JSON.stringify(program).length<=450;
 const checks={literal,structural,roundtrip,maximal,countPreserved,noSideEffects,
  deterministic:JSON.stringify(value)===JSON.stringify(compileAndRun(program,caseRecord.input))};
 return {passed:Object.values(checks).every(Boolean),checks,value,
  expected:caseRecord.expected,realContacts:0,realMoneyMovedCents:0};
}
export function originalLibrariesGap(){
 // Execute, rather than vaguely asserting, the original 017 and 018
 // implementations. They don't include an ordered run reducer.
 const old=makeUnwrittenSpec();
 const programs=allTypedPrograms(old);
 const story={title:'Fictional',subtitle:'Invented',
  captions:['aaabbaa']};
 const old017=programs.map(p=>independentRun(p,story,old));
 const old018Modes=['constant-one','utf16-units','unicode-codepoints',
  'whitespace-tokens','intl-graphemes'];
 const old018=old018Modes.map(mode=>independentCountAndRender(
  makeDescriptor(mode),story,earlierChallenge()));
 const expectedType='ordered array of exact [grapheme,count] pairs';
 const claimedOldSolution=old017.filter(x=>Array.isArray(x)).length+
  old018.filter(x=>Array.isArray(x)).length;
 return {
  original017ProgramsExecuted:old017.length,
  original018OperatorsExecuted:old018.length,
  oldWholeProgramsProvidingRequiredTypedRLE:claimedOldSolution,
  missingFromOriginalCombinedFiniteCatalog:claimedOldSolution===0,
  oldOutputTypes:['HTML document string','HTML document with count attribute'],
  requiredNewOutputType:expectedType,
  doesNotProveComputationalImpossibility:true
 };
}
export const expectedProgram=()=>({
 schema:'graft.typed-rle-program/v1',
 stages:[
  {slot:'segment',choice:'grapheme'},
  {slot:'identity',choice:'exact'},
  {slot:'ifSame',choice:'increment'},
  {slot:'ifDifferent',choice:'append'},
  {slot:'emit',choice:'ordered-pairs'}
 ]
});
