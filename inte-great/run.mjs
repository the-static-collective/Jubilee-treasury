import {runAngelCycle} from '../labs/penny-puddle-008/demo.mjs';
import {runAnchorFrontier} from '../labs/penny-puddle-009/demo.mjs';
import {runNetworkQuestionDemo} from '../labs/penny-puddle-013/demo.mjs';
import {runAgreementInvention} from '../labs/penny-puddle-014/demo.mjs';
import {MODE,GATES,replay} from '../ops/exodus-002/returning-node.mjs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

export function run(){
 const prefix=[{kind:'need'},...Array.from({length:8},(_,i)=>({kind:'offer',slot:i+1})),{kind:'proposal'}];
 const held=replay([...prefix,{kind:'admission',decision:'HOLD'}],{mode:MODE});
 const rehearsed=replay([...prefix,...GATES.map(gate=>({kind:'review',gate})),{kind:'admission',decision:'ADMIT'},{kind:'movement',amountMinor:800000},{kind:'receipt',movementIndex:1}],{mode:MODE});
 const angel=runAngelCycle(),anchor=runAnchorFrontier(),question=runNetworkQuestionDemo(),concord=runAgreementInvention();
 assert.equal(held.actualMovementMinor,0);assert.equal(rehearsed.actualMovementMinor,0);
 assert.equal(held.status,'HOLD');assert.equal(rehearsed.status,'HOLD');
 assert.equal(angel.cyclicalOutcome.realMoneyMovedCents,0);
 assert.equal(question.actualPeopleContacted,0);assert.equal(question.actualPaymentsCents,0);
 assert.equal(concord.actualMoneyMovedCents,0);assert.equal(concord.actualContractsExecuted,0);
 return {schema:'jubilee.inte-great.rehearsal/v1',mode:'SYNTHETIC_ONLY',authority:'none',actualMoneyMovedMinor:0,actualContactsMade:0,sections:[
 {name:'ANGEL CIRCLE',purpose:'Understand gift-forward support and separately designated replenishment without recipient debt.',native:'labs/penny-puddle-008/demo.mjs',result:angel},
 {name:'ANCHOR',purpose:'Distinguish actual cash and lawful substitute performance from hypothetical asset value.',native:'labs/penny-puddle-009/demo.mjs',result:anchor},
 {name:'QUESTION',purpose:'Find the decision-critical question before spending effort on introductions.',native:'labs/penny-puddle-013/demo.mjs',result:question},
 {name:'CONCORD',purpose:'Compose conditional alternatives from local willingness cards, not presumed agreements.',native:'labs/penny-puddle-014/demo.mjs',result:concord},
 {name:'EXODUS',purpose:'Rehearse separate review, admission and receipt gates. Neither run authorizes a real movement.',native:'ops/exodus-002/returning-node.mjs',result:{held,rehearsed}}
 ]};
}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function html(report){
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; style-src &apos;unsafe-inline&apos;"><title>INTE-GREAT — native rehearsal</title><style>body{font:16px system-ui;max-width:54rem;margin:auto;padding:1.2rem;line-height:1.55;color:#23352c;background:#fbfaf6}section{border:1px solid #c9d1c9;padding:1rem;margin:1rem 0;border-radius:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.83rem}summary{cursor:pointer;font-weight:600}a{color:#315f48}</style><h1>Native research rehearsal</h1><p>Fictional inputs only. Zero actual money or contacts. These outputs are examples to study, not advice, offers, approvals or evidence for real cases.</p><p><a href="index.html">Return to INTE-GREAT</a></p>'+report.sections.map(s=>'<section><h2>'+esc(s.name)+'</h2><p>'+esc(s.purpose)+'</p><small>'+esc(s.native)+'</small><details><summary>Inspect native output</summary><pre>'+esc(JSON.stringify(s.result,null,2))+'</pre></details></section>').join('')+'</html>';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const arg=process.argv[2];if(arg&&arg!=='--html')throw Error('Usage: node --experimental-strip-types inte-great/run.mjs [--html]');
 const report=run();process.stdout.write(arg==='--html'?html(report):JSON.stringify(report,null,2)+'\n');
}
