// Experimental route planner. Every route and balance is a synthetic assumption.
// NO provider API calls, settlement, balance verification, credit, or instructions.
const checkCents = (n, label, zero = false) => {
  if (!Number.isSafeInteger(n) || n < (zero ? 0 : 1)) throw new TypeError(label + ' must be ' + (zero ? 'nonnegative' : 'positive') + ' safe integer cents');
  return n;
};
const checkId = (id, label) => {
  if (typeof id !== 'string' || id.trim().length === 0) throw new TypeError(label + ' must be a nonempty string');
  return id;
};
const better = (a, b) => {
  if (!b) return true;
  return (a.feeCents - b.feeCents) < 0 ||
    (a.feeCents === b.feeCents && (
       a.maxArrivalMinutes < b.maxArrivalMinutes ||
       (a.maxArrivalMinutes === b.maxArrivalMinutes && (
          a.grossCents < b.grossCents ||
          (a.grossCents === b.grossCents && a.actions.length < b.actions.length)
       ))
    ));
};
/**
 * Max target $10, six sources, twelve explicitly modeled DIRECT routes, so
 * exact-cent dynamic programming is tractable. One route per source.
 * Route latency is time until the destination is spendable, not merely "sent".
 */
export function weaveToDestination({ goalCents, horizonMinutes, sources, routes, destinationId }) {
  checkCents(goalCents, 'goalCents');
  if (goalCents > 1000) throw new RangeError('prototype supports targets up to 1000 cents');
  checkCents(horizonMinutes, 'horizonMinutes', true);
  checkId(destinationId, 'destinationId');
  if (!Array.isArray(sources) || sources.length < 1 || sources.length > 6) throw new TypeError('sources must contain 1–6 entries');
  if (!Array.isArray(routes) || routes.length > 12) throw new TypeError('routes must contain 0–12 entries');
  const sourceIds = new Set();
  for (const s of sources) {
    checkId(s?.id, 'source.id');
    if (sourceIds.has(s.id)) throw new Error('Duplicate source id');
    sourceIds.add(s.id);
    checkCents(s.availableCents, 'source.availableCents', true);
    if (s.availableCents > 2000) throw new RangeError('prototype source cap is 2000 cents');
  }
  const routeIds = new Set();
  for (const r of routes) {
    checkId(r?.id, 'route.id');
    if (routeIds.has(r.id)) throw new Error('Duplicate route id');
    routeIds.add(r.id);
    if (!sourceIds.has(r.fromId) || r.toId !== destinationId) throw new Error('Route must originate in a modeled source and lead directly to the modeled destination');
    checkCents(r.minGrossCents, 'route.minGrossCents');
    checkCents(r.maxGrossCents, 'route.maxGrossCents');
    if (r.minGrossCents > r.maxGrossCents || r.maxGrossCents > 2000) throw new RangeError('Invalid route gross range');
    checkCents(r.fixedFeeCents, 'route.fixedFeeCents', true);
    if (!Number.isSafeInteger(r.feeBasisPoints) || r.feeBasisPoints < 0 || r.feeBasisPoints > 10000) throw new TypeError('Invalid basis-point fee');
    checkCents(r.arrivalMinutes, 'route.arrivalMinutes', true);
    if (typeof r.consentedForModel !== 'boolean' || typeof r.providerPermitted !== 'boolean') throw new TypeError('Route requires explicit scenario consent and permission assumptions');
    if (!['assumed','documented'].includes(r.evidence)) throw new TypeError('Route requires evidence label assumed or documented');
    if (!['bank-rail','debit-card','manual-wallet'].includes(r.rail)) throw new TypeError('Unknown modeled rail');
  }
  let states = new Map([[0, { netCents:0, grossCents:0, feeCents:0, maxArrivalMinutes:0, actions:[] }]]);
  for (const source of sources) {
    const next = new Map(states);
    const choices = routes.filter(r => r.fromId === source.id &&
      r.consentedForModel && r.providerPermitted && r.arrivalMinutes <= horizonMinutes);
    for (const route of choices) {
      const upper = Math.min(source.availableCents,route.maxGrossCents);
      for (let gross = route.minGrossCents; gross <= upper; gross++) {
        const fee = route.fixedFeeCents + Math.ceil(gross * route.feeBasisPoints / 10000);
        const net = gross - fee;
        if (net <= 0) continue;
        for (const state of states.values()) {
          const proposed = {
            netCents: state.netCents + net,
            grossCents: state.grossCents + gross,
            feeCents: state.feeCents + fee,
            maxArrivalMinutes: Math.max(state.maxArrivalMinutes,route.arrivalMinutes),
            actions: state.actions.concat({
              sourceId:source.id,routeId:route.id,rail:route.rail,
              grossCents:gross,feeCents:fee,netCents:net,
              arrivalMinutes:route.arrivalMinutes,evidence:route.evidence
            })
          };
          const key = Math.min(goalCents,proposed.netCents);
          if (better(proposed,next.get(key))) next.set(key,proposed);
        }
      }
    }
    states = next;
  }
  const complete = states.get(goalCents);
  const bestPartial = [...states.values()].sort((a,b) => b.netCents - a.netCents ||
    a.feeCents-b.feeCents || a.maxArrivalMinutes-b.maxArrivalMinutes)[0];
  const selected = complete || bestPartial;
  const totalCents = sources.reduce((sum,s)=>sum+s.availableCents,0);
  return {
    status:complete?'feasible-in-model':'not-feasible-in-window',
    goalCents,horizonMinutes,destinationId,totalReportedCents:totalCents,
    netArrivingCents:selected.netCents,
    shortfallCents:Math.max(0,goalCents-selected.netCents),
    grossMovedCents:selected.grossCents,modeledFeeCents:selected.feeCents,
    maxArrivalMinutes:selected.maxArrivalMinutes,actions:selected.actions,
    sourceBalancesVerified:false, providerExecutionAvailable:false,
    settlementCompleted:false, creditAdvanced:false,
    note:'A planning-only model with hypothetical routes; documented rail support does not authorize account access or API execution.',
  };
}
