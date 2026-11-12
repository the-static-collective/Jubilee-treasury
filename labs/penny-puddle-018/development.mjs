/**
 * Controlled development oracle. Challenging examples are supplied ONLY
 * after a concrete program proposal. The source is publicly readable; this
 * is process separation, not secret data or an adversarial-proof seal.
 *
 * These counterexamples distinguish fixed-literal, UTF-16, codepoint and
 * grapheme semantics. Revealing the first failing case teaches the search
 * one new constraint rather than rewarding random wrong predictions.
 */
import {assessPrimitive} from './independent.mjs';
export const developmentCases=[
 {id:'two-visible-letters',story:{title:'Invented notebook',
   subtitle:'Count what a reader sees',captions:['ab']},expectedCounts:[2]},
 {id:'combining-accent',story:{title:'Invented notebook',
   subtitle:'Count what a reader sees',captions:['e\u0301']},expectedCounts:[1]},
 {id:'joined-person-emoji',story:{title:'Invented notebook',
   subtitle:'Count what a reader sees',captions:['👩‍💻']},expectedCounts:[1]}
];
export function firstDeveloperCounterexample(method){
 for(const c of developmentCases){
  const outcome=assessPrimitive(method,c);
  if(!outcome.pass)return {
   id:c.id,
   story:structuredClone(c.story),
   expectedCounts:[...c.expectedCounts],
   observedCounts:outcome.actualCounts,
   failingChecks:Object.entries(outcome.checks)
    .filter(([,v])=>!v).map(([k])=>k),
   offeredAfterProposal:true,
   noHumanData:true,
   monetaryAuthority:false
  };
 }
 return null;
}
