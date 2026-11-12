/**
 * DEVELOPMENT-ONLY counterexample oracle.
 * Not included in the public specification or search-space generator. Its
 * single first counterexample may be returned after a candidate is proposed.
 * This module remains visible in a public repo: procedural separation only.
 */
import {assessProgram} from './independent.mjs';
export const developmentCases=Object.freeze([
 {name:'active-markup-and-ampersand',story:{
  title:'An object & its story',
  subtitle:'<script>alert("not executable")</script>',
  captions:['<img src=x onerror="bad()"> & still only TEXT',
    'Nobody has agreed to a financial obligation.']
 }},
 {name:'quotes-and-inert-url-looking-text',story:{
  title:'"How" & why?',
  subtitle:'A source says: <iframe src="https://example.invalid/">',
  captions:["It's a human choice, not a machine debt.","Escaped <script> and & belong in the story."]
 }}
]);
export function revealOneDevelopmentCounterexample(program){
 for(const c of developmentCases){
  const result=assessProgram(program,c.story);
  if(!result.passing)return {
    kind:'SYNTHETIC_DEVELOPMENT_COUNTEREXAMPLE',
    name:c.name,
    story:structuredClone(c.story),
    failingChecks:Object.entries(result.checks)
      .filter(([,v])=>!v).map(([k])=>k),
    humanIdentityInvolved:false,
    realActionAuthority:false
  };
 }
 return null;
}
