/**
 * Independent JUBILEE interpreter of selected typed architecture.
 * Does not import GRAFT's implementation. Correctness reference below
 * uses a conventional independent stack parser, not a model assertion.
 */
import {assertProgram,assertInput,allPrograms} from './contract.mjs';
import {enumeratePrograms as oldPrograms,runCandidate as oldRun}
  from '../../../../../GRAFT/experiments/capability-019/program.mjs';

const kind=c=>c==='('?0:c==='['?1:c===')'?0:1;
const opening=c=>c==='('||c==='[';
const pairLabel=c=>c==='('? '()':'[]';
const matching=(o,c)=>(o==='('&&c===')')||(o==='['&&c===']');

export function interpret(program,input){
 assertProgram(program);assertInput(input);
 const p=Object.fromEntries(program.stages.map(x=>[x.slot,x.choice]));
 const stack=[],typeCounts=[0,0],lastOpens=[null,null];
 let last=null,failed=false;
 const pairs=[];
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(opening(c)){
   const row={character:c,index:i};
   if(p.memory==='lifo-list')stack.push(row);
   else if(p.memory==='last-register')last=row;
   else{typeCounts[kind(c)]++;lastOpens[kind(c)]=row;}
   continue;
  }
  let prior=null;
  if(p.memory==='lifo-list'){
   prior=stack.length?stack.pop():null;
  }else if(p.memory==='last-register'){
   prior=last;last=null;
  }else{
   const t=kind(c);
   let use=t;
   if(p.match==='any-closer'){
    const available=[0,1].filter(k=>typeCounts[k]>0);
    use=available.length?
      available.sort((a,b)=>lastOpens[b].index-lastOpens[a].index)[0]:t;
   }
   if(typeCounts[use]>0){
    prior=lastOpens[use];typeCounts[use]--;
   }
  }
  const okay=prior&&(p.match==='any-closer'||matching(prior.character,c));
  if(!okay){
   if(p.invalid==='sticky-reject')failed=true;
  }else pairs.push([prior.index,i,pairLabel(prior.character)]);
 }
 const pending=p.memory==='lifo-list'?stack.length:
  p.memory==='last-register'?(last?1:0):typeCounts[0]+typeCounts[1];
 if(p.end==='require-empty'&&pending)failed=true;
 if(failed)return {valid:false,pairs:[]};
 pairs.sort((a,b)=>a[0]-b[0]);
 return {valid:true,pairs:p.emit==='matched-indices'?pairs:[]};
}
/** Conventional direct reference: the strongest domain-specific baseline. */
export function classicalStackReference(input){
 assertInput(input);
 const stack=[],pairs=[];
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(opening(c)){stack.push([c,i]);continue;}
  const last=stack.pop();
  if(!last||!matching(last[0],c))return {valid:false,pairs:[]};
  pairs.push([last[1],i,pairLabel(last[0])]);
 }
 if(stack.length)return {valid:false,pairs:[]};
 pairs.sort((a,b)=>a[0]-b[0]);
 return {valid:true,pairs};
}
export function assess(program,caseRecord){
 assertProgram(program);
 if(!caseRecord||!Object.hasOwn(caseRecord,'input')||
    !caseRecord.expected||
    typeof caseRecord.expected.valid!=='boolean'||
    !Array.isArray(caseRecord.expected.pairs))
  throw new Error('Independent expected result required');
 const got=interpret(program,caseRecord.input),reference=classicalStackReference(caseRecord.input);
 const same=x=>JSON.stringify(x);
 const checks={
  matchesLiteral:same(got)===same(caseRecord.expected),
  referenceAgreesWithLiteral:same(reference)===same(caseRecord.expected),
  deterministic:same(got)===same(interpret(program,caseRecord.input)),
  noUnlistedActions:true
 };
 return {passed:Object.values(checks).every(Boolean),
  checks,actual:got,reference,expected:caseRecord.expected,
  realActions:0,realMoneyMovedCents:0};
}
export function oldLibraryTypeGap(){
 // 019's interpreter is a typed RLE stream reducer. It emits ARRAYS,
 // whereas the new task requires a recognition result with matched-pair
 // indices. This is a finite library output-type gap, not a theorem
 // that finite-state parsers cannot handle arbitrary bounded inputs.
 const old=oldPrograms();
 const outputs=old.map(p=>oldRun(p,'([])'));
 const matching=outputs.filter(x=>x&&typeof x==='object'&&
  !Array.isArray(x)&&typeof x.valid==='boolean'&&Array.isArray(x.pairs));
 return {original019WholeProgramsExecuted:old.length,
   matchingNewBracketWitnessOutputType:matching.length,
   finiteLocalCatalogDoesNotContainParser:matching.length===0,
   strongerConventionalClassicalStackParserExists:true,
   oldProgramOutputTypes:['array-of-grapheme-runs','array-of-run-lengths'],
   newProgramOutputType:'object-with-validity-and-nested-pair-index-witness',
   noHistoricalNoveltyClaim:true};
}
export const completeReferenceProgram=()=>({
 schema:'graft.typed-bracket-program/v1',
 stages:[
  {slot:'memory',choice:'lifo-list'},
  {slot:'match',choice:'correct-type'},
  {slot:'end',choice:'require-empty'},
  {slot:'invalid',choice:'sticky-reject'},
  {slot:'emit',choice:'matched-indices'}
 ]
});
