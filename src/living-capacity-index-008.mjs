import { inspect, matches, digest } from './asset-treasury-007.mjs';

// JUBILEE ECONOMICS 008: a read-only projection from the Treasury's signed journal.
// The index does not custody money, mint rights, reserve assets, or execute recipes.
const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
const TOKEN = /^[a-z][a-z0-9_-]{1,63}$/;
const pos = x => Number.isSafeInteger(x) && x > 0 && x <= 1000000;
function refuse(reason) { throw new Error('LIVING_INDEX_REFUSED: ' + reason); }
function demand(ok, reason) { if (!ok) refuse(reason); }
function shape(x, keys) {
  return x && typeof x === 'object' && !Array.isArray(x) &&
    Object.keys(x).length === keys.length && keys.every(k => Object.hasOwn(x, k));
}
const id = x => typeof x === 'string' && REF.test(x);
const token = x => typeof x === 'string' && TOKEN.test(x);
const keyOf = x => x.kind + '/' + x.unit;

function validateRecipes(recipes) {
  demand(Array.isArray(recipes) && recipes.length <= 40, 'recipes must be bounded array');
  const seen = new Set();
  for (const r of recipes) {
    demand(shape(r, ['id','purposeId','termsRef','inputs','output']), 'recipe schema');
    demand(id(r.id) && id(r.purposeId) && id(r.termsRef) && !seen.has(r.id), 'recipe identity, purpose, or duplicate');
    seen.add(r.id);
    demand(Array.isArray(r.inputs) && r.inputs.length >= 2 && r.inputs.length <= 12, 'recipe needs 2-12 inputs');
    for (const a of r.inputs) {
      demand(shape(a, ['kind','unit','quantity']) && token(a.kind) && token(a.unit) &&
        a.kind !== 'money' && pos(a.quantity), 'invalid recipe input');
    }
    demand(shape(r.output, ['kind','unit','quantity']) && token(r.output.kind) &&
      token(r.output.unit) && r.output.kind !== 'money' && pos(r.output.quantity), 'invalid recipe output');
  }
}

// A single input asset can be considered for many incompatible options; this is NOT
// an allocation. Never total the recipe options into a "portfolio" or balance.
export function livingIndex(ledger, options = {}) {
  demand(options && typeof options === 'object' && !Array.isArray(options), 'options');
  const p = inspect(ledger); // verifies signatures, hash links, and transitions
  if (Object.hasOwn(options, 'expectedHead')) {
    demand(options.expectedHead === p.head, 'stale signed history head');
  }
  const recipes = options.recipes ?? [];
  validateRecipes(recipes);

  // Deliberately exclude names, labels, evidence bodies, contact details, and
  // external-money quantities from this portable projection.
  const assets = p.assets.filter(a => a.kind !== 'money').map(a => ({
    id:a.id,kind:a.kind,unit:a.unit,mode:a.mode,purposeIds:[...a.purposeIds].sort(),
    termsRef:a.termsRef,state:a.state,available:a.available,
    reserved:a.reserved,consumed:a.consumed
  })).sort((a,b) => a.id.localeCompare(b.id));
  const needs = p.needs.map(n => ({
    id:n.id,kind:n.kind,unit:n.unit,purposeId:n.purposeId,
    requested:n.quantity,open:n.remaining,fulfilled:n.fulfilled,reserved:n.reserved
  })).sort((a,b) => a.id.localeCompare(b.id));
  const routes = matches(ledger).map(m => ({
    assetId:m.assetId,needId:m.needId,maximumIfReservedAlone:m.maximum,
    unit:m.unit,status:'PROPOSAL_ONLY'
  })).sort((a,b) => (a.needId+'/'+a.assetId).localeCompare(b.needId+'/'+b.assetId));

  const compositions = [];
  const blocked = [];
  for (const r of [...recipes].sort((a,b)=>a.id.localeCompare(b.id))) {
    // Repeated inputs of the same kind/unit must share one inventory pool,
    // not count the same resource again as though independently available.
    const requirements = new Map();
    for (const input of r.inputs) {
      const k = keyOf(input);
      requirements.set(k, (requirements.get(k) ?? 0) + input.quantity);
      demand(Number.isSafeInteger(requirements.get(k)) && requirements.get(k) <= 1000000, 'recipe input overflow');
    }
    let batches = Infinity;
    const inputs = [...requirements].sort(([a],[b])=>a.localeCompare(b)).map(([key,needed]) => {
      const eligible = assets.filter(a => keyOf(a) === key && a.state === 'received' &&
        a.purposeIds.includes(r.purposeId) && a.mode !== 'external-funds' && a.available > 0);
      const available = eligible.reduce((sum,a)=>sum+a.available,0);
      demand(Number.isSafeInteger(available), 'capacity overflow');
      batches = Math.min(batches, Math.floor(available/needed));
      return {kind:key.split('/')[0],unit:key.split('/')[1],neededPerBatch:needed,
        available,sourceAssetIds:eligible.map(a=>a.id)};
    });
    const item = {recipeId:r.id,purposeId:r.purposeId,termsRef:r.termsRef,
      inputs,output:r.output,maximumBatchesIfExclusivelyAllocated:batches,
      status:'CANDIDATE_ONLY_NOT_PRODUCTION'};
    (batches > 0 ? compositions : blocked).push(item);
  }
  const body = {
    schema:'jubilee.living-capacity-index/v0.1',sourceHistoryHead:p.head,
    sourceEventCount:p.eventCount,
    assets,needs,routes,compositions,blockedRecipes:blocked,
    externalFundsAttestationCount:p.assets.filter(a=>a.kind==='money' && a.state==='received').length,
    noSpendableMoney:true,
    authority:'READ_ONLY_SOURCE_PINNED_PROPOSALS',
    notice:'Only signed local steward assertions. Options are mutually competing possibilities, not additive inventory, legal rights, verified delivery, guaranteed yield, credits, or a human-worth score.'
  };
  return {...body,cutHash:digest(body)};
}
