/**
 * Development-only counterexamples. Expose exactly one to a particular
 * proposed architecture AFTER proposal. GRAFT never imports final-only
 * heldout source into its search.
 */
import {assess} from './independent.mjs';
export const cases=[
 {name:'nested-different-types',input:'([])',
   expected:{valid:true,pairs:[[0,3,'()'],[1,2,'[]']]}},
 {name:'cross-nesting-is-invalid',input:'([)]',
   expected:{valid:false,pairs:[]}},
 {name:'nested-same-type',input:'(())',
   expected:{valid:true,pairs:[[0,3,'()'],[1,2,'()']]}},
 {name:'wrong-closer',input:'(]',
   expected:{valid:false,pairs:[]}},
 {name:'unclosed-opener',input:'(',
   expected:{valid:false,pairs:[]}},
 {name:'stray-closing-prefix',input:')()',
   expected:{valid:false,pairs:[]}},
 {name:'nested-triple',input:'([[]])',
   expected:{valid:true,pairs:[[0,5,'()'],[1,4,'[]'],[2,3,'[]']]}}
];
export function revealFirstCounterexample(program){
 for(const record of cases){
  const check=assess(program,record);
  if(!check.passed)return {
    kind:'SYNTHETIC_AFTER_PROPOSAL_COUNTEREXAMPLE',
    name:record.name,input:record.input,
    expected:structuredClone(record.expected),
    observed:check.actual,
    failedChecks:Object.keys(check.checks).filter(x=>!check.checks[x]),
    disclosedAfterProposal:true,
    realActorData:false,
    rightsOrMoneyAuthority:false
  };
 }
 return null;
}
