/**
 * Jubilee owned independent analysis of the 018 derived card attribute.
 * GRAFT's primitive selector and renderer are NEVER imported.
 * The original 017 source-owned renderer is used unmodified as the base.
 */
import {allTypedPrograms,makeUnwrittenSpec,validateTypedProgram} from '../penny-puddle-017/contract.mjs';
import {independentRun} from '../penny-puddle-017/independent.mjs';
import {baseMethod,makePrimitiveChallenge,validatePrimitiveChallenge,
  validatePrimitiveStory} from './contract.mjs';

const regexActive=/<(?:script|iframe|img|form|link|object|embed|base)\b|<[^>]*\bon\w+\s*=|<[^>]*(?:src|href)\s*=\s*["']?\s*(?:https?:|javascript:)|url\s*\(|@import\b/i;
const methodKeys=['constant-one','utf16-units','unicode-codepoints',
  'whitespace-tokens','intl-graphemes'];

function candidateCount(mode,text){
 if(mode==='constant-one')return 1;
 if(mode==='utf16-units')return text.length;
 if(mode==='unicode-codepoints')return Array.from(text).length;
 if(mode==='whitespace-tokens')return text.trim().split(/\s+/u).length;
 if(mode==='intl-graphemes'){
  const segmenter=new Intl.Segmenter('en',{granularity:'grapheme'});
  return Array.from(segmenter.segment(text)).length;
 }
 throw new Error('Unsupported primitive operator');
}
export function validMethod(m){
 if(!m||Object.keys(m).sort().join(',')!=='attach,mode,reduce,schema'||
    m.schema!=='graft.card-computed-primitive/v1'||
    !methodKeys.includes(m.mode)||m.reduce!=='length'||
    m.attach!=='data-graphemes')
  throw new Error('HOLD: derived attribute requires an allowlisted typed primitive, not arbitrary code');
 return true;
}
export function independentCountAndRender(method,story,contract=makePrimitiveChallenge()){
 validatePrimitiveChallenge(contract);
 validMethod(method);validatePrimitiveStory(story);
 const base=independentRun(baseMethod(),story,makeUnwrittenSpec());
 let result=base;
 story.captions.forEach((caption,i)=>{
  const number=i+1;
  const anchor='<section class="card" aria-label="Story card '+number+
    '" data-index="'+number+'"><p>';
  const count=candidateCount(method.mode,caption);
  const updated='<section class="card" aria-label="Story card '+number+
    '" data-index="'+number+'" data-graphemes="'+count+'"><p>';
  if(!result.includes(anchor)||result.indexOf(anchor)!==result.lastIndexOf(anchor))
   throw new Error('Source-owned base compiler lost exact typed card anchor');
  result=result.replace(anchor,updated);
 });
 return result;
}
export function assessPrimitive(method,example,contract=makePrimitiveChallenge()){
 validMethod(method);
 if(!example||!Array.isArray(example.expectedCounts)||
    example.expectedCounts.length!==example.story?.captions?.length||
    example.expectedCounts.some(x=>!Number.isSafeInteger(x)||x<1||x>240))
  throw new Error('Independent expected grapheme counts missing or out of bounds');
 const output=independentCountAndRender(method,example.story,contract);
 const actual=example.story.captions.map(x=>candidateCount(method.mode,x));
 const checks={
  exactExpectedCounts:JSON.stringify(actual)===JSON.stringify(example.expectedCounts),
  allCardAttributesPresent:actual.every((v,i)=>output.includes(
    'data-index="'+(i+1)+'" data-graphemes="'+v+'"><p>')),
  noActiveMarkup:!regexActive.test(output),
  deterministic:output===independentCountAndRender(method,example.story,contract),
  bounded:Buffer.byteLength(output,'utf8')<=contract.bounds.maxHtmlBytes
 };
 return {pass:Object.values(checks).every(Boolean),checks,actualCounts:actual,
  expectedCounts:example.expectedCounts,html:output,
  utf8Bytes:Buffer.byteLength(output,'utf8')};
}
/**
 * FINITE IMPOSSIBILITY witness, not universal mathematics.
 * The old 017 grammar is explicitly 72 choices. We execute all and verify
 * that NONE emits the newly requested dynamic card attribute, even though
 * they may all produce perfectly fine static HTML.
 */
export function legacyExpressivityProof(contract=makePrimitiveChallenge()){
 validatePrimitiveChallenge(contract);
 const old=makeUnwrittenSpec(),programs=allTypedPrograms(old);
 const a=contract.publicExamples[0].story;
 const b={...a,captions:['ab']};
 const results=programs.map(program=>{
  validateTypedProgram(program,old);
  const x=independentRun(program,a,old);
  const y=independentRun(program,b,old);
  return x.includes('data-graphemes=')&&y.includes('data-graphemes=');
 });
 const successes=results.filter(Boolean).length;
 return {sourceGrammar:'source-owned-017/five-fixed-stage-DSL',
  combinationsActuallyExecuted:programs.length,
  missingDynamicAttribute:'data-graphemes',
  oldProgramsSatisfyingRequestedFeature:successes,
  absentWithinFiniteLanguage:successes===0,
  missingNotImpossibleInGeneralComputing:true,
  noRealEconomicBenefitEstablished:true};
}
export const makeDescriptor=mode=>({
 schema:'graft.card-computed-primitive/v1',mode,
 reduce:'length',attach:'data-graphemes'
});
