import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const original=read('../ops/exodus-004/casework.html');
const native=read('../labs/penny-puddle-014/composer.mjs');
const adapter=read('./workbench.mjs'),ui=read('./workbench-ui.js');
function wrap(s,exports){
 if(/<\/script/i.test(s))throw Error('Unexpected script delimiter');
 const js=s.replace(/^export (?=(?:const|function) )/gm,'');
 if(/^\s*(?:import|export)\s/m.test(js))throw Error('Unexpected module syntax');
 return '(()=>{\n'+js+'\nreturn {'+exports.join(',')+'};\n})()';
}
const section='<section id="wb-panel" hidden><h2>Living Workbench — candidate cooperation review</h2><p class="muted">Use a non-sensitive case. Manually classify supported source-linked claims. A reviewed claim is not independent verification. Only select offers you have checked for overlap; all routes remain HOLD.</p><label>Reported remaining amount (USD)<input id="wb-target" type="number" min=".01" step=".01"></label><details><summary>Evidence gates</summary><div id="wb-gates"></div></details><details><summary>Selected reported offers</summary><div id="wb-offers"></div></details><button id="wb-run" class="primary">Generate candidate routes</button><p id="wb-status" role="status" aria-live="polite"></p><div id="wb-results"></div></section>';
if(!original.includes('<section><h2>Next actions</h2>')||!original.includes('</body>'))throw Error('Casework source changed');
const html=original.replace('</style>','#wb-offers input[type=checkbox]{width:auto;margin-right:.45rem}</style>').replace('<section><h2>Next actions</h2>',section+'<section><h2>Next actions</h2>').replace('JUBILEE / EXODUS 004','JUBILEE / INTE-GREAT 002').replace('<h1>Local Casework Desk</h1>','<h1>The Living Workbench</h1>').replace('</body>','<script id="wb-native">const NativeComposer='+wrap(native,['synthesizeAgreements'])+'; const Workbench='+wrap(adapter,['GATES','plan'])+';\n'+ui+'</script></body>');
for(const m of html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g))new Function(m[1]);
writeFileSync(new URL('./workbench.html',import.meta.url),html);
