/**
 * CAPABILITY-019 PUBLIC TASK: construct a missing two-input Boolean operator
 * from a SINGLE NAND gate primitive. No correct circuit supplied.
 *
 * The original 018 catalog is text counting; the old 017 72-program document
 * DSL is not a Boolean gate composer. This experiment separates "cannot
 * express under a strict instruction budget" from "impossible to compute".
 *
 * NAND is a KNOWN functionally complete gate. A derived NAND-only XOR is
 * textbook logic, not historically new computing or novel mathematics.
 */
import {createHash} from 'node:crypto';
export const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function makeGateChallenge(){
 return {
  schema:'jubilee.graft-gate-invention/v1',
  authority:'PROPOSE_ONLY',
  source:'the-static-collective/Jubilee-treasury',
  receiver:'the-static-collective/GRAFT',
  task:{
   name:'two-input-disagreement-indicator',
   description:'Return 1 precisely when the two independent Boolean inputs differ.',
   inputCount:2,outputCount:1,
   sourceWireIds:[0,1],
   onlySourceGate:'NAND',
   gateSemantics:'NOT (wireLeft AND wireRight)',
   newGateMayOnlyReadEarlierWires:true,
   unorderedGateOperands:true,
   outputMustBeMostRecentlyConstructedGate:true,
   depthLimit:4,
   noConstantsNoLoopsNoExternalLibraries:true,
   composeDerivedPrimitiveAgainForThreeInputOddParity:true
  },
  publicExamples:[
   {inputs:[0,0],expected:0},
   {inputs:[0,1],expected:1}
  ],
  budgets:{
   maxCandidateEvaluationsPerRound:3000,
   maxDevelopmentRounds:3,maxGateCount:4,
   maxRecordedAttempts:4,maxArtifactBytes:20000
  },
  authorship:{
   syntheticOnly:true,noRealHumanRecords:true,
   financialAuthority:false,realFundsMovedCents:0,
   productionAdmission:false
  }
 };
}
export function validChallenge(x){
 if(JSON.stringify(x)!==JSON.stringify(makeGateChallenge()))
  throw new Error('Source-owned public Boolean task was altered');
 return true;
}
export function validateCircuit(c,spec=makeGateChallenge()){
 validChallenge(spec);
 if(!c||c.schema!=='graft.nand-circuit/v1'||
   !Array.isArray(c.gates)||c.gates.length<1||
   c.gates.length>spec.task.depthLimit||
   Object.keys(c).sort().join(',')!=='gates,schema')
  throw new Error('HOLD: source-invented circuit is not bounded NAND-only AST');
 c.gates.forEach((pair,i)=>{
  if(!Array.isArray(pair)||pair.length!==2||
     pair.some(x=>!Number.isInteger(x)||x<0||x>i+1)||
     pair[0]>pair[1])
   throw new Error('HOLD: each NAND gate must use a canonical pair of existing wires');
 });
 return true;
}
export function validateSample(c){
 if(!c||!Array.isArray(c.inputs)||c.inputs.length!==2||
    c.inputs.some(x=>x!==0&&x!==1)||
    (c.expected!==0&&c.expected!==1))
  throw new Error('Malformed Boolean sample');
 return true;
}
