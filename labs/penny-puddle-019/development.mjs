/**
 * The two discriminating cases are supplied AFTER a concrete NAND circuit
 * passes the public friendly examples. No final 3-input transfer inputs
 * enter GRAFT's source program search.
 */
import {evaluateCircuit} from './independent.mjs';
const cases=[
 {id:'previously-unseen-10',inputs:[1,0],expected:1},
 {id:'previously-unseen-11',inputs:[1,1],expected:0}
];
export function firstFailedDevelopmentCase(circuit){
 for(const item of cases){
  const actual=evaluateCircuit(circuit,item.inputs);
  if(actual!==item.expected)
   return {kind:'SOURCE-OWNED-CONCRETE-COUNTEREXAMPLE',
    id:item.id,inputs:[...item.inputs],expected:item.expected,
    observed:actual,offeredAfterConcreteProposal:true,
    humanDataUsed:false,externalAuthority:false};
 }
 return null;
}
