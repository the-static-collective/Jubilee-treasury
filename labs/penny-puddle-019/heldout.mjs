/**
 * FINAL-ONLY. Test records are public in repository source but the GRAFT
 * generator does not import this module or receive inputs before freezing
 * its AST. No cryptographic secrecy or general Unicode conformance claim.
 */
import {checkRLEProgram} from './independent.mjs';
export const heldoutCases=[
 {id:'three-separated-runs',input:'aaabbaa',
  expected:[['a',3],['b',2],['a',2]]},
 {id:'case-sensitive-adjacency',input:'AAAaa',
  expected:[['A',3],['a',2]]},
 {id:'joined-emoji',input:'👩‍💻👩‍💻💻',
  expected:[['👩‍💻',2],['💻',1]]},
 {id:'canonical-distinction',input:'e\u0301e\u0301é',
  expected:[['e\u0301',2],['é',1]]},
 {id:'regional-flags',input:'🇺🇸🇺🇸🇫🇷',
  expected:[['🇺🇸',2],['🇫🇷',1]]},
 {id:'whitespace-is-data',input:'  aa   ',
  expected:[[' ',2],['a',2],[' ',3]]},
 {id:'skin-tone-modifiers',input:'👍🏽👍🏽🙂🙂🙂',
  expected:[['👍🏽',2],['🙂',3]]},
 {id:'alternating-runs',input:'ababa',
  expected:[['a',1],['b',1],['a',1],['b',1],['a',1]]}
];
export function evaluateFrozen(program){
 const evidence=heldoutCases.map(c=>{
  const v=checkRLEProgram(program,c);
  return {id:c.id,passed:v.passed,
    failingChecks:Object.keys(v.checks).filter(k=>!v.checks[k]),
    computed:v.value,expected:c.expected};
 });
 return {allPassed:evidence.every(x=>x.passed),
  testsPassed:evidence.filter(x=>x.passed).length,
  total:evidence.length,
  evidence,finalOnly:true,importedByBuilder:false,
  publiclyVisibleSource:true,
  actualFinancialOrPersonalEffects:0};
}
