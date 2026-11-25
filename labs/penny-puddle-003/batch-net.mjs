// Mathematical netting of fictional obligations, NEVER legal settlement authority.
// Cross-platform balances cannot be netted merely because arithmetic balances.
const id = x => typeof x === 'string' && x.trim().length > 0;
export function proposeBatchNetting({ obligations, explicitModelAuthorizations = [] }) {
  if (!Array.isArray(obligations) || obligations.length > 100) throw new TypeError('Use up to 100 obligations');
  if (!Array.isArray(explicitModelAuthorizations)) throw new TypeError('Provide authorization assertions');
  const consent = new Set(explicitModelAuthorizations);
  const net = new Map(), ids = new Set();
  let grossCents = 0;
  for (const o of obligations) {
    if (!id(o?.id) || ids.has(o.id)) throw new Error('Missing or duplicate obligation ID');
    ids.add(o.id);
    if (!id(o.from) || !id(o.to) || o.from===o.to) throw new Error('Distinct parties required');
    if (!Number.isSafeInteger(o.cents) || o.cents <= 0) throw new TypeError('Positive integer cents required');
    if (grossCents > Number.MAX_SAFE_INTEGER-o.cents) throw new RangeError('Gross overflow');
    grossCents+=o.cents;
    for (const [participant, delta] of [[o.from,-o.cents],[o.to,o.cents]]) {
      const sum=(net.get(participant)||0)+delta;
      if (!Number.isSafeInteger(sum)) throw new RangeError('Net overflow');
      net.set(participant,sum);
    }
  }
  const parties=[...net.keys()].sort();
  const positions=parties.map(p=>({party:p,netCents:net.get(p)}));
  const sum=positions.reduce((n,p)=>n+p.netCents,0);
  if (sum!==0) throw new Error('Conservation invariant failed');
  const authorized=parties.every(p=>consent.has(p));
  if (!authorized) return {
    status:'hold-for-participant-and-rail-review',grossCents,positions,
    proposedSettlementMoves:[],externalMovesMade:0,realFundsMoved:false,
    note:'Every affected party must consent to this clearing scenario; cross-app netting requires authorized provider arrangements.',
  };
  const debtors=positions.filter(p=>p.netCents<0).map(p=>({id:p.party,remaining:-p.netCents}));
  const creditors=positions.filter(p=>p.netCents>0).map(p=>({id:p.party,remaining:p.netCents}));
  const moves=[];let i=0,j=0;
  while (i<debtors.length && j<creditors.length) {
    const cents=Math.min(debtors[i].remaining,creditors[j].remaining);
    moves.push({from:debtors[i].id,to:creditors[j].id,cents});
    debtors[i].remaining-=cents;creditors[j].remaining-=cents;
    if (debtors[i].remaining===0) i++;
    if (creditors[j].remaining===0) j++;
  }
  if (debtors.some(d=>d.remaining) || creditors.some(c=>c.remaining)) throw new Error('Netting mismatch');
  return {
    status:'mathematical-netting-proposal-only',grossCents,positions,
    proposedSettlementMoves:moves,externalMovesMade:0,realFundsMoved:false,
    legalNettingAuthorized:false,settlementProviderIntegrated:false,
    note:'Modeled party consent does not establish contractual or regulatory authority to settle or net transactions.',
  };
}
