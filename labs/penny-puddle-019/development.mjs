/**
 * Developer challenge, revealed only after an actual candidate is submitted.
 * The sequence is intentionally diagnostic: each failure distinguishes a
 * different family of mistakes. The final heldout suite is separate.
 */
import {checkRLEProgram} from './independent.mjs';
export const developerCases=[
 {id:'adjacent-equal',input:'aa',expected:[['a',2]]},
 {id:'case-must-remain-distinct',input:'Aa',expected:[['A',1],['a',1]]},
 {id:'joined-emoji-are-one-grapheme',input:'👩‍💻👩‍💻',expected:[['👩‍💻',2]]},
 {id:'order-is-not-a-global-histogram',input:'aaba',
  expected:[['a',2],['b',1],['a',1]]}
];
export function firstCounterexample(program){
 for(const t of developerCases){
  const verdict=checkRLEProgram(program,t);
  if(!verdict.passed)return {
    kind:'SYNTHETIC_AFTER_PROPOSAL_COUNTEREXAMPLE',
    id:t.id,input:t.input,expected:t.expected,
    actual:verdict.value,
    failingChecks:Object.entries(verdict.checks)
      .filter(([,pass])=>!pass).map(([k])=>k),
    onlyRevealedAfterCandidate:true,
    noRealPersonOrContract:true
  };
 }
 return null;
}
