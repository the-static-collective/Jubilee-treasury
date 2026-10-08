import { contentHash, signSignal, importBatch, project } from './ambient-trickle-009.mjs';

const OWNER = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/;
const REPO = /^[A-Za-z0-9_.-]{1,100}$/;
const SHA = /^[a-f0-9]{40}$/;
const FULL = /^https:\/\/api\.github\.com\//;
const throwSource = code => { throw new Error('GITHUB_SOURCE_REFUSED: '+code); };
const ensure = (condition,reason) => {if(!condition)throwSource(reason);};

export function configureRepo(repoFullName, purposeId, sourceId, options={}) {
  ensure(typeof repoFullName==='string' && repoFullName.split('/').length===2,'owner/repository required');
  const [owner,repo]=repoFullName.split('/');
  ensure(OWNER.test(owner)&&REPO.test(repo) && !repo.endsWith('.git'),'invalid repository locator');
  ensure(typeof purposeId==='string' && /^[A-Za-z0-9][A-Za-z0-9:._-]{2,127}$/.test(purposeId),'purpose id');
  ensure(typeof sourceId==='string' && /^[A-Za-z0-9][A-Za-z0-9:._-]{2,127}$/.test(sourceId),'source id');
  const baseBranch=options.baseBranch??'main';
  ensure(typeof baseBranch==='string' && /^[A-Za-z0-9][A-Za-z0-9._/-]{0,125}$/.test(baseBranch) && !baseBranch.includes('..'),'invalid base branch');
  return {schema:'jubilee.github-pull-source/v0.1',repoFullName,purposeId,sourceId,baseBranch};
}
function verifyConfig(c) {
  ensure(c && Object.keys(c).sort().join(',')===['baseBranch','purposeId','repoFullName','schema','sourceId'].sort().join(',') &&
    c.schema==='jubilee.github-pull-source/v0.1','adapter config');
  return configureRepo(c.repoFullName,c.purposeId,c.sourceId,{baseBranch:c.baseBranch});
}
export async function githubGet(config, apiPath, {fetchImpl=fetch,token=process.env.GITHUB_TOKEN}={}) {
  verifyConfig(config);
  ensure(typeof apiPath==='string' && /^\/[A-Za-z0-9/._?=&%-]+$/.test(apiPath) &&
    apiPath.startsWith('/repos/'+config.repoFullName+'/'),'request outside pinned repository');
  const url='https://api.github.com'+apiPath;
  ensure(FULL.test(url),'GitHub API hostname required');
  const headers={'accept':'application/vnd.github+json','user-agent':'jubilee-trickle-source-010',
    'x-github-api-version':'2022-11-28'};
  if(token)headers.authorization='Bearer '+token;
  let response;
  try {response=await fetchImpl(url,{headers,redirect:'error',signal:AbortSignal.timeout(12000)});}
  catch {throwSource('GitHub API unreachable');}
  ensure(response && response.ok===true,'GitHub API rejected request: HTTP '+(response?.status??'unknown'));
  if(response.url)ensure(response.url===url,'unexpected API redirect');
  let payload;
  try{
    const wire=await response.text();
    ensure(wire.length<=3000000,'GitHub response exceeds bounded size');
    payload=JSON.parse(wire);
  }catch(e){if(e.message?.startsWith('GITHUB_SOURCE_REFUSED'))throw e;throwSource('invalid API JSON');}
  return payload;
}
function pullFacts(config,pull,commit) {
  verifyConfig(config);
  ensure(pull && typeof pull==='object' && !Array.isArray(pull),'pull object');
  ensure(Number.isSafeInteger(pull.number) && pull.number>0,'invalid PR number');
  ensure(pull.base?.repo?.full_name===config.repoFullName,'repository mismatch');
  ensure(pull.base?.ref===config.baseBranch,'base branch not admitted');
  ensure(pull.state==='closed' && typeof pull.merged_at==='string' && !Number.isNaN(Date.parse(pull.merged_at)),'not a merged PR');
  ensure(typeof pull.merge_commit_sha==='string' && SHA.test(pull.merge_commit_sha),'missing verified merge SHA');
  ensure(pull.html_url=== 'https://github.com/'+config.repoFullName+'/pull/'+pull.number,'unexpected source URL');
  ensure(commit && commit.sha===pull.merge_commit_sha,'merge commit cannot be verified');
  ensure(commit.html_url === 'https://github.com/'+config.repoFullName+'/commit/'+commit.sha,'unexpected commit location');
  const facts={
    source:'github-rest-merge',
    repository:config.repoFullName,
    pullNumber:pull.number,
    mergeCommit:commit.sha,
    mergedAt:new Date(pull.merged_at).toISOString(),
    baseBranch:pull.base.ref
  };
  return {facts,evidenceHash:contentHash(facts)};
}
export async function readVerifiedMerge(config,prNumber,opts={}) {
  verifyConfig(config);
  ensure(Number.isSafeInteger(prNumber) && prNumber>0 && prNumber<=100000000,'valid positive PR number');
  const pull=await githubGet(config,'/repos/'+config.repoFullName+'/pulls/'+prNumber,opts);
  ensure(pull.number===prNumber,'PR number mismatch');
  ensure(typeof pull.merge_commit_sha==='string' && SHA.test(pull.merge_commit_sha),'merge commit required');
  const commit=await githubGet(config,'/repos/'+config.repoFullName+'/commits/'+pull.merge_commit_sha,opts);
  return pullFacts(config,pull,commit);
}
export function signatureForMerge(config,facts,keys) {
  verifyConfig(config);
  const {facts:record,evidenceHash}=facts;
  ensure(record && record.repository===config.repoFullName &&
    record.baseBranch===config.baseBranch && evidenceHash===contentHash(record),'merge evidence mismatch');
  ensure(Number.isSafeInteger(record.pullNumber) && record.pullNumber>0 && SHA.test(record.mergeCommit),
    'invalid merge identifier');
  // A merge is a source-reported software occurrence, NOT an economic valuation,
  // donor permission grant, legal transfer, or source code license assignment.
  const payload={
    eventId:'ghmerge-'+record.pullNumber,
    assetId:'ghpr-'+record.pullNumber,
    revision:1,previousHash:null,
    kind:'software',status:'delivery_reported',quantity:1,unit:'merged_pr',
    purposeId:config.purposeId,evidenceHash,
    observedAt:record.mergedAt
  };
  return signSignal(config.sourceId,payload,keys);
}
export async function observeMergedPull(inbox,config,keys,prNumber,opts={}) {
  verifyConfig(config);
  const allowed=inbox.policy.sources.find(s=>s.sourceId===config.sourceId &&
    s.publicKey===keys.publicKey &&
    s.allowedKinds.includes('software') && s.allowedPurposes.includes(config.purposeId));
  ensure(allowed,'local policy must pin repo source key and purpose');
  const verified=await readVerifiedMerge(config,prNumber,opts);
  const event=signatureForMerge(config,verified,keys);
  const result=importBatch(inbox,[event]);
  return {
    inbox:result,source:{...verified.facts,evidenceHash:verified.evidenceHash},
    added:result.signals.length-inbox.signals.length,projection:project(result)
  };
}
export async function discoverRecentMerges(config,{fetchImpl=fetch,token=process.env.GITHUB_TOKEN,pages=2}={}) {
  verifyConfig(config);
  ensure(Number.isSafeInteger(pages) && pages>=1 && pages<=10,'pages must be 1..10');
  const numbers=new Set();
  for(let page=1;page<=pages;page++){
    const raw=await githubGet(config,
      '/repos/'+config.repoFullName+'/pulls?state=closed&sort=updated&direction=desc&per_page=100&page='+page,
      {fetchImpl,token});
    ensure(Array.isArray(raw)&&raw.length<=100,'invalid pull listing');
    for(const pull of raw){
      if(pull?.base?.repo?.full_name===config.repoFullName &&
         pull?.base?.ref===config.baseBranch &&
         pull.state==='closed' && pull.merged_at && Number.isSafeInteger(pull.number) &&
         pull.number>0)numbers.add(pull.number);
    }
    if(raw.length<100)break;
  }
  return [...numbers].sort((a,b)=>a-b);
}
