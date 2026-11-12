/**
 * Jubilee-owned reference interpreter and complete bounded proof search.
 *
 * This is separately implemented from GRAFT's synthesizer. The Boolean
 * circuit is typed DATA; it is never eval'd as JS, executed remotely, or
 * turned into a claim about a real person.
 */
import {makeGateChallenge,validateCircuit,validateSample} from './contract.mjs';

export function evaluateCircuit(c,inputs,spec=makeGateChallenge()){
 validateCircuit(c,spec);
 if(!Array.isArray(inputs)||inputs.length!==2||
    inputs.some(x=>x!==0&&x!==1))
  throw new Error('Binary input pair only');
 const wires=[...inputs];
 for(const pair of c.gates)wires.push(Number(!(wires[pair[0]]&&wires[pair[1]])));
 return wires.at(-1);
}
export function exactTruthTable(c){
 const cells=[[0,0],[0,1],[1,0],[1,1]];
 return cells.map(inputs=>({inputs,actual:evaluateCircuit(c,inputs)}));
}
export function samplesPass(c,samples){
 return samples.every(s=>{validateSample(s);return evaluateCircuit(c,s.inputs)===s.expected});
}
const id=p=>p.join(',');
export const firstLexicalPairs=()=>[[0,0],[0,1],[1,1]];
export const firstJointDependencyPairs=()=>[[0,1],[0,0],[1,1]];
function canonicalPairs(signalCount){
 const pairs=[];
 for(let a=0;a<signalCount;a++)
  for(let b=a;b<signalCount;b++)
   pairs.push([a,b]);
 return pairs;
}
/** Enumerate all canonical NAND-only circuits; last gate is output. */
export function enumerateCircuits(depth,{firstPairs=firstLexicalPairs()}={}){
 if(!Number.isInteger(depth)||depth<1||depth>4)
  throw new Error('Finite NAND depth 1–4 required');
 const legal=firstLexicalPairs().map(id).sort().join('|');
 if(!Array.isArray(firstPairs)||firstPairs.length!==3||
    firstPairs.map(id).sort().join('|')!==legal)
  throw new Error('First-gate operator priority must be a complete bijection');
 function* search(gates){
  if(gates.length===depth){
   yield {schema:'graft.nand-circuit/v1',
    gates:gates.map(pair=>[...pair])};
   return;
  }
  const next=gates.length===0?firstPairs:
    canonicalPairs(2+gates.length);
  for(const pair of next)yield* search([...gates,pair]);
 }
 return search([]);
}
export function minimalCircuitProof(maxDepth=3){
 const target=[
  {inputs:[0,0],expected:0},{inputs:[0,1],expected:1},
  {inputs:[1,0],expected:1},{inputs:[1,1],expected:0}
 ];
 let checked=0,compatible=0;
 const byDepth=[];
 for(let depth=1;depth<=maxDepth;depth++){
  let n=0,passing=0;
  for(const circuit of enumerateCircuits(depth)){
   checked++;n++;
   if(samplesPass(circuit,target)){compatible++;passing++;}
  }
  byDepth.push({depth,completeCircuitCount:n,matchingDisagreementCount:passing});
 }
 return {
  exactExhaustiveSearch:true,alphabet:'NAND-only with two input wires',
  checkedCircuitCount:checked,byDepth,
  matchesFound:compatible,
  gateBudgetBelowFourInsufficient:compatible===0,
  notAnImpossibilityClaimForAllCircuits:true
 };
}
export function exactFirstPassing(samples,{firstPairs=firstLexicalPairs()}={}){
 const spec=makeGateChallenge();
 let checked=0;
 for(let depth=1;depth<=spec.task.depthLimit;depth++){
  for(const c of enumerateCircuits(depth,{firstPairs})){
   checked++;
   if(checked>spec.budgets.maxCandidateEvaluationsPerRound)
    throw new Error('Bounded search budget exceeded');
   if(samplesPass(c,samples))return {circuit:c,checked,depth};
  }
 }
 return {circuit:null,checked,depth:null};
}
/** The newly discovered macro is not manually implemented as a logic gate. */
export function applyBinaryMacro(c,x,y){
 return evaluateCircuit(c,[x,y]);
}
/**
 * Transfer test: two usages of the derived 2-input NAND-only macro
 * compute parity of THREE independent inputs. The candidate search has
 * never seen any of these 3-input samples.
 */
export function applyTwiceForThreeInputs(c,inputs){
 if(!Array.isArray(inputs)||inputs.length!==3||
   inputs.some(x=>x!==0&&x!==1))
  throw new Error('Three Boolean inputs required');
 return applyBinaryMacro(c,applyBinaryMacro(c,inputs[0],inputs[1]),inputs[2]);
}
