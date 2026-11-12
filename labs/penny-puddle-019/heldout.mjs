/**
 * Final-only transfer: no triple-input examples in public spec or
 * counterexample oracle. A frozen 2-input gate circuit is composed with
 * itself and must solve all eight 3-input parity cases.
 *
 * These are public repository files, so isolation is procedural, not
 * cryptographic or resistant to malicious repository contributors.
 */
import {evaluateCircuit,applyTwiceForThreeInputs} from './independent.mjs';
const triples=[];
for(const x of [0,1])for(const y of [0,1])for(const z of [0,1])
 triples.push({inputs:[x,y,z],expected:(x+y+z)%2});
export function scoreFrozenTransfer(c){
 const transfer=triples.map(item=>{
  const output=applyTwiceForThreeInputs(c,item.inputs);
  return {inputs:item.inputs,actual:output,expected:item.expected,
   passed:output===item.expected};
 });
 const twoInput=[
  {inputs:[0,0],expected:0},{inputs:[0,1],expected:1},
  {inputs:[1,0],expected:1},{inputs:[1,1],expected:0}
 ].map(item=>({...item,actual:evaluateCircuit(c,item.inputs)}));
 const swapped=twoInput.every(x=>
  evaluateCircuit(c,[...x.inputs].reverse())===x.actual);
 return {
  finalOnlyAfterCircuitFreeze:true,
  threeInputExamplesProvidedDuringSynthesis:false,
  publicSourceNotSecret:true,
  finalThreeInputChecks:transfer.length,
  transferChecksPassed:transfer.filter(x=>x.passed).length,
  twoInputChecksPassed:twoInput.filter(x=>x.actual===x.expected).length,
  commutativeUnderInputSwap:swapped,
  allPassed:transfer.every(x=>x.passed)&&
    twoInput.every(x=>x.actual===x.expected)&&swapped,
  transfer,
  hypotheticalFinancialAuthority:false
 };
}
