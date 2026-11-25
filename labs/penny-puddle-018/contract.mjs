/**
 * 018 missing-primitive PUBLIC problem specification.
 * Earlier 017 DSL can escape/format/index captions but cannot derive an
 * arbitrary per-card Unicode GRAPHEME COUNT from its contents. The goal
 * requires one extra typed data-dependent attribute per card.
 *
 * No implementation of the primitive or heldout answers is exported here.
 * A human-authored GRAFT generator searches known built-in text operations,
 * not unrestricted newly invented algorithms.
 */
import {createHash} from 'node:crypto';
import {makeUnwrittenSpec,allTypedPrograms,validateTypedProgram,validateStory} from '../penny-puddle-017/contract.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function baseMethod(){
 const stages=[
  ['escape','entities'],['cards','labeled-sections'],
  ['wrapper','document'],['print','print-css'],['indices','data-index']
 ];
 return {schema:'graft.typed-story-program/v1',
  stages:stages.map(([slot,choice])=>({slot,choice}))};
}
export function makePrimitiveChallenge(){
 const older=makeUnwrittenSpec(),program=baseMethod();
 validateTypedProgram(program,older);
 return {
  schema:'jubilee.graft-missing-primitive/v1',
  authority:'PROPOSE_ONLY',
  source:'the-static-collective/Jubilee-treasury',
  receiver:'the-static-collective/GRAFT',
  baseSource:'labs/penny-puddle-017/independent.mjs',
  baseMethod:program,
  unmetOutput:'per-card-data-graphemes',
  desiredSemantic:'count Unicode extended grapheme clusters (user-perceived characters) per caption, not UTF-16 code units, code points, bytes, words or a fixed literal',
  requiredAttribute:'data-graphemes',
  publicExamples:[
   {name:'plain-single',story:{title:'Invented exhibit',subtitle:'Ordinary text',
     captions:['a']},expectedCounts:[1]},
   {name:'punctuation-single',story:{title:'Invented exhibit',subtitle:'Ordinary text',
     captions:['!']},expectedCounts:[1]}
  ],
  bounds:{
   maxCards:5,maxTextChars:240,maxHtmlBytes:12000,
   maxPrograms:5,maxDevelopmentRounds:3
  },
  oldGrammarProgramCount:allTypedPrograms(older).length,
  originalGrammarExtended:false,
  primitivePermission:'source-owned-bounded-builtins-only',
  privacy:{allInputInvented:true,realIdentityDataUsed:false,
    actualRealWorldWork:false,assetRightsVerified:false,
    realMoneyMovedCents:0}
 };
}
export const fingerprint=x=>hash(x);
export function validatePrimitiveChallenge(x){
 if(JSON.stringify(x)!==JSON.stringify(makePrimitiveChallenge()))
  throw new Error('Source-owned public 018 contract differs');
 return true;
}
export function validatePrimitiveStory(story){
 return validateStory(story,makeUnwrittenSpec());
}
