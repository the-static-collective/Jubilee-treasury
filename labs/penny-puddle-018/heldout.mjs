/**
 * FINAL ONLY. Hard-coded expected Unicode extended grapheme cluster counts
 * are not passed to GRAFT's search or the public contract. Assertions
 * include tricky Unicode cases that differ from JS string length and
 * codepoint count. Cases public in source; process-isolated, not secret.
 */
import {assessPrimitive} from './independent.mjs';
export const heldoutCases=[
 {id:'family-zwj',story:{title:'Fictional display',
   subtitle:'Family joined emoji',captions:['👨‍👩‍👧‍👦']},expectedCounts:[1]},
 {id:'regional-flag',story:{title:'Fictional display',
   subtitle:'Two symbols for one displayed flag',captions:['🇺🇸','a']},
   expectedCounts:[1,1]},
 {id:'modified-emoji',story:{title:'Fictional display',
   subtitle:'Emoji with skin tone modifier',captions:['👍🏽','🙂🙂']},
   expectedCounts:[1,2]},
 {id:'combining-and-mixed',story:{title:'Fictional display',
   subtitle:'Combining accents and Latin letters',captions:['a\u0301b','x','🇫🇷🇯🇵']},
   expectedCounts:[2,1,2]},
 {id:'five-card-boundary',story:{title:'Fictional display',
   subtitle:'Maximum permitted captions',captions:['é','e\u0301','👩‍💻','a b','🧑🏿‍🚀']},
   expectedCounts:[1,1,1,3,1]}
];
export function assessFrozenHeldout(method){
 const cases=heldoutCases.map(c=>{
  const o=assessPrimitive(method,c);
  return {id:c.id,passed:o.pass,
   expectedCounts:c.expectedCounts,
   computedCounts:o.actualCounts,
   failingChecks:Object.entries(o.checks)
     .filter(([,v])=>!v).map(([k])=>k),
   utf8Bytes:o.utf8Bytes};
 });
 return {frozenInputOnly:true,
  heldoutImportedByGenerator:false,
  heldoutCasesPassed:cases.filter(x=>x.passed).length,
  heldoutCasesTotal:cases.length,
  allPassed:cases.every(x=>x.passed),
  sourcePubliclyReadable:true,
  cases,realFinancialAuthority:false};
}
