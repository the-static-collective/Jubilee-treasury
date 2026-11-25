/**
 * INDEPENDENT HELD-OUT TEST INPUTS.
 *
 * This module is intentionally NOT imported by the GRAFT synthesizer or
 * included in the exported public spec. Its contents are visible to GitHub
 * readers; isolation is a controlled process rule, not a secrecy guarantee.
 * Only the final frozen ASTs are scored here, with NO learning afterward.
 */
import {assessProgram} from './independent.mjs';
const heldout=[
 {name:'unicode-and-right-to-left',story:{
   title:'A notebook — 🍃 你好 مرحبا',
   subtitle:'Καλημέρα & ¿Qué tal?',
   captions:['Arabic العربية and English & español.',
    'The gardener said: “اهلاً” — then smiled.',
    'Five unrelated communities can say NO.']
 }},
 {name:'nested-quotation-and-entities',story:{
   title:'A "quote" within a \'quote\' & a title',
   subtitle:'Never execute: <script src=x> & say "no"',
   captions:['Example: <img src="https://invalid.example/" onerror="bad()">',
    'A literal string containing <iframe> & more',
    'The filename "a&b.html" is TEXT, not a link.']
 }},
 {name:'one-card-boundary',story:{
   title:'Smallest complete story',subtitle:'Exactly one card',
   captions:['This is the whole story & it is enough.']
 }},
 {name:'five-card-boundary',story:{
   title:'Five independent possibilities',
   subtitle:'Nobody owns another person\'s decision.',
   captions:['One & only one','Two < three','Three > two',
    'Four quotes: "hi" and \'bye\'','Five:   spaces & punctuation !?']
 }}
];
export function evaluateFrozenHeldout(program,spec){
 const results=heldout.map(c=>{
  const r=assessProgram(program,c.story,spec);
  return {case:c.name,passed:r.passing,
   rejectedChecks:Object.entries(r.checks).filter(([,v])=>!v).map(([k])=>k),
   bytes:r.byteCount};
 });
 return {
  results,
  numberOfHeldoutCases:results.length,
  heldoutCasesPassed:results.filter(x=>x.passed).length,
  allPassed:results.every(x=>x.passed),
  evaluationAfterProgramFrozen:true,
  heldoutDataProvidedToBuilder:false,
  publiclyReadableFixtureSource:true,
  realWorldContractOrFinancialAuthority:false
 };
}
