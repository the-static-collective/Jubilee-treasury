/**
 * Final-only, manually specified test answers. This source remains public,
 * so separation is a reproducible PROCESS rule, not cryptographic secrecy.
 * The GRAFT generator must not import this module before freezing its AST.
 */
import {assess} from './independent.mjs';
export const cases=[
 {name:'empty-valid',input:'',expected:{valid:true,pairs:[]}},
 {name:'deep-mixed',input:'[([])]',
  expected:{valid:true,pairs:[[0,5,'[]'],[1,4,'()'],[2,3,'[]']]}},
 {name:'two-sibling-arrays',input:'([][])',
  expected:{valid:true,pairs:[[0,5,'()'],[1,2,'[]'],[3,4,'[]']]}},
 {name:'nested-round-siblings',input:'[()()]',
  expected:{valid:true,pairs:[[0,5,'[]'],[1,2,'()'],[3,4,'()']]}},
 {name:'interleaved-invalid',input:'[(])',
  expected:{valid:false,pairs:[]}},
 {name:'missing-final-close',input:'([[]]',
  expected:{valid:false,pairs:[]}},
 {name:'extra-final-close',input:'([])]',
  expected:{valid:false,pairs:[]}},
 {name:'nested-and-siblings',input:'[[][]]',
  expected:{valid:true,pairs:[[0,5,'[]'],[1,2,'[]'],[3,4,'[]']]}},
 {name:'repeated-wrong-closer',input:'(]])',
  expected:{valid:false,pairs:[]}},
 {name:'stray-closing-before-valid',input:']([])',
  expected:{valid:false,pairs:[]}}
];
export function examineAfterFreeze(program){
 const outcomes=cases.map(c=>{
  const r=assess(program,c);
  return {name:c.name,passed:r.passed,
   actual:r.actual,expected:r.expected,
   failures:Object.keys(r.checks).filter(x=>!r.checks[x])};
 });
 return {total:outcomes.length,passed:outcomes.filter(x=>x.passed).length,
   allPassed:outcomes.every(x=>x.passed),
   outcomes,searchHadNoAccessToTheseInputRecords:true,
   repositorySourceIsPublic:true,
   noRealParticipantOrEconomicData:true};
}
