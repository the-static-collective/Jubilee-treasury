import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {keysForSource,policyFor,newInbox,project,relatteObservationSpec} from '../src/ambient-trickle-009.mjs';
import {configureRepo,readVerifiedMerge,observeMergedPull,discoverRecentMerges,signatureForMerge} from '../src/github-source-010.mjs';
import {main as cli} from '../src/github-source-cli-010.mjs';

const repo='the-static-collective/reLATTE',sourceId='github-relatte-source-001',purpose='purpose-software-001';
const config=()=>configureRepo(repo,purpose,sourceId,{baseBranch:'main'});
const keys=keysForSource();
const policy=()=>policyFor(sourceId,keys.publicKey,['software'],[purpose]);
const sha='d'.repeat(40);
function fixture(overrides={},commitOverrides={}){
 const pull={number:64,state:'closed',merged_at:'2026-10-07T06:05:16Z',merge_commit_sha:sha,
  html_url:'https://github.com/'+repo+'/pull/64',base:{ref:'main',repo:{full_name:repo}},...overrides};
 const commit={sha,html_url:'https://github.com/'+repo+'/commit/'+sha,...commitOverrides};
 return {pull,commit};
}
function api(fixturePull=fixture().pull,fixtureCommit=fixture().commit) {
 const called=[];
 const fetchImpl=async(url,opts)=>{
  called.push(url);
  assert.equal(opts.redirect,'error');
  assert.ok(url.startsWith('https://api.github.com/repos/'+repo+'/'));
  const output=url.includes('/pulls?')?[fixturePull]:url.endsWith('/pulls/64')?fixturePull:
    url.includes('/commits/')?fixtureCommit:{};
  return {ok:true,status:200,url,text:async()=>JSON.stringify(output)};
 };
 return {fetchImpl,called};
}
test('GitHub source pins owner/repo and one source purpose',()=>{
 assert.equal(config().repoFullName,repo);
 assert.throws(()=>configureRepo('https://attacker.example','purpose-001','source-001'),/owner\/repository/);
 assert.throws(()=>configureRepo('attacker.com/repo?x','purpose-001','source-001'),/invalid repository/);
 assert.throws(()=>configureRepo(repo,'bad','source-001'),/purpose id/);
});
test('verified merge uses exact GitHub PR and exact merge commit (no author or title)',async()=>{
 const fake=api(),fact=await readVerifiedMerge(config(),64,{fetchImpl:fake.fetchImpl,token:''});
 assert.equal(fact.facts.repository,repo);assert.equal(fact.facts.pullNumber,64);
 assert.equal(fact.facts.mergeCommit,sha);assert.match(fact.evidenceHash,/^[a-f0-9]{64}$/);
 assert.equal(fake.called.length,2);
 assert.ok(!JSON.stringify(fact).includes('author'));
});
test('unmerged PR cannot be recorded as completed contribution',async()=>{
 const fake=api(fixture({merged_at:null,state:'open'}).pull);
 await assert.rejects(readVerifiedMerge(config(),64,{fetchImpl:fake.fetchImpl,token:''}),/merge commit|required|not a merged PR/);
});
test('wrong target base or repository refuses before source signing',async()=>{
 for(const patch of [{base:{ref:'feature',repo:{full_name:repo}}},{base:{ref:'main',repo:{full_name:'bad-other/repo'}}}]){
  const fake=api(fixture(patch).pull);
  await assert.rejects(readVerifiedMerge(config(),64,{fetchImpl:fake.fetchImpl,token:''}),/repository mismatch|base branch/);
 }
});
test('mismatching commit or forged merge location refuses',async()=>{
 const fake=api(fixture().pull,fixture({}, {sha:'e'.repeat(40)}).commit);
 await assert.rejects(readVerifiedMerge(config(),64,{fetchImpl:fake.fetchImpl,token:''}),/merge commit cannot be verified/);
 const wrong=api(fixture({html_url:'https://evil.example/steal'}).pull);
 await assert.rejects(readVerifiedMerge(config(),64,{fetchImpl:wrong.fetchImpl,token:''}),/source URL/);
});
test('redirects, unauthorized responses and invalid JSON refuse',async()=>{
 const redirect=async(url)=>({ok:true,url:'https://not-github.example/',status:200,text:async()=>JSON.stringify(fixture().pull)});
 await assert.rejects(readVerifiedMerge(config(),64,{fetchImpl:redirect,token:''}),/unexpected API redirect/);
 const fail=async()=>({ok:false,status:403,text:async()=>''});
 await assert.rejects(readVerifiedMerge(config(),64,{fetchImpl:fail,token:''}),/HTTP 403/);
 const bad=async(url)=>({ok:true,status:200,url,text:async()=>'{invalid'});
 await assert.rejects(readVerifiedMerge(config(),64,{fetchImpl:bad,token:''}),/invalid API JSON/);
});
test('merged PR enters existing private Trickle inbox as source-authored software report',async()=>{
 const r=await observeMergedPull(newInbox(policy()),config(),keys,64,{fetchImpl:api().fetchImpl,token:''});
 assert.equal(r.added,1);
 const view=r.projection;
 assert.equal(view.signalCount,1);assert.equal(view.noncashOffers[0].kind,'software');
 assert.equal(view.noncashOffers[0].status,'delivery_reported');
 assert.equal(view.noncashOffers[0].unit,'merged_pr');
 assert.equal(view.claimedMoneyReports.length,0);
 assert.equal(view.assetsAdmitted,false);assert.equal(view.fundsTransferred,false);
 assert.equal(view.currentSourceReports[0].assetId,'ghpr-64');
});
test('double-read and repeat signed observation are idempotent',async()=>{
 const first=await observeMergedPull(newInbox(policy()),config(),keys,64,{fetchImpl:api().fetchImpl,token:''});
 const next=await observeMergedPull(first.inbox,config(),keys,64,{fetchImpl:api().fetchImpl,token:''});
 assert.equal(next.added,0);
 assert.deepEqual(project(next.inbox),project(first.inbox));
});
test('policy cannot be replaced by a different local adapter key',async()=>{
 const wrongKey=keysForSource();
 await assert.rejects(observeMergedPull(newInbox(policy()),config(),wrongKey,64,{fetchImpl:api().fetchImpl}),/local policy must pin/);
});
test('no direct permission, donated money, or software ownership inferred',async()=>{
 const r=await observeMergedPull(newInbox(policy()),config(),keys,64,{fetchImpl:api().fetchImpl});
 const hold=relatteObservationSpec(r.inbox,sourceId,'ghpr-64','2026-10-08T19:00:00.000Z');
 assert.equal(hold.artifact_kind,'OBSERVATION_NOT_ASSET');
 assert.equal(hold.requested_effect.permissionGranted,false);
 assert.equal(hold.donor_claims.semanticStatus,'source_report_only_no_settlement_or_asset_admission');
 assert.equal(hold.donor_claims.unit,'merged_pr');
});
test('recent merges only source from pinned repository and allowed base',async()=>{
 const f=api();
 const result=await discoverRecentMerges(config(),{fetchImpl:f.fetchImpl,token:'',pages:2});
 assert.deepEqual(result,[64]);
 assert.equal(f.called.length,1);
});
test('operator init -> one verified PR -> repeated pull -> HOLD candidate; no network writer',async()=>{
 const root=mkdtempSync(join(tmpdir(),'github-live-source-'));
 const dir=join(root,'private');
 cli(['init',dir,repo,purpose,sourceId]);
 const first=await cli(['pull',dir,'64'],{fetchImpl:api().fetchImpl,token:''});
 assert.equal(first.added,1);
 const second=await cli(['pull',dir,'64'],{fetchImpl:async()=>{throw Error('should not call for duplicate');},token:''});
 assert.equal(second.replayed,1);
 const out=join(root,'hold.json');
 const h=await cli(['hold',dir,'64',out]);
 assert.equal(h.authority,'HOLD_OBSERVATION_ONLY');
 assert.equal(JSON.parse(readFileSync(out,'utf8')).source_particular,sourceId+':ghpr-64');
 const settings=JSON.parse(readFileSync(join(dir,'github-adapter.json'),'utf8'));
 assert.equal(settings.repoFullName,repo);
});
test('operator scan with two passes requires no per-event new entry',async()=>{
 const root=mkdtempSync(join(tmpdir(),'github-scan-')),dir=join(root,'private');
 cli(['init',dir,repo,purpose,sourceId]);
 const f=api();
 const first=await cli(['scan',dir,'1'],{fetchImpl:f.fetchImpl,token:''});
 assert.equal(first.newReports,1);
 const next=await cli(['scan',dir,'1'],{fetchImpl:f.fetchImpl,token:''});
 assert.equal(next.newReports,0);
 assert.equal(next.projection.signalCount,1);
});
test('blind signer cannot invent GitHub evidence hashes from arbitrary payload',()=>{
 const facts={facts:{source:'github-rest-merge',repository:repo,pullNumber:64,mergeCommit:sha,
   mergedAt:'2026-10-07T06:05:16.000Z',baseBranch:'main'},evidenceHash:'b'.repeat(64)};
 assert.throws(()=>signatureForMerge(config(),facts,keys),/evidence mismatch/);
});
