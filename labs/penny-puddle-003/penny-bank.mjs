// PENNY BANKS 003 — physically-backed *fictional* custody and sponsor-paid work.
// Witness IDs and counts are TEST FIXTURES, not evidence of real coins or real identity.
const integer = (v, label, allowZero = false) => {
  if (!Number.isSafeInteger(v) || v < (allowZero ? 0 : 1)) throw new TypeError(label+' must be '+(allowZero?'nonnegative':'positive')+' safe integer cents');
  return v;
};
const id = (v, label) => {
  if (typeof v !== 'string' || !v.trim()) throw new TypeError(label+' must be a nonempty string');
  return v;
};
export function createStewardBankLab({ banks, fictionalSponsorBudgetCents }) {
  if (!Array.isArray(banks) || banks.length === 0) throw new TypeError('banks must be nonempty');
  integer(fictionalSponsorBudgetCents, 'fictionalSponsorBudgetCents', true);
  const bankMap = new Map(), batches = new Map(), services = new Set(), earmarks = new Map();
  for (const b of banks) {
    id(b?.id,'bank.id');
    if (bankMap.has(b.id)) throw new Error('Duplicate bank');
    integer(b.storageCapacityCoins,'storageCapacityCoins');
    bankMap.set(b.id,{
      id:b.id,storageCapacityCoins:b.storageCapacityCoins,
      recordedCoins:0,earmarkedCoins:0,lostCoins:0,
      hypotheticalServiceEarningsCents:0, frozen:false,
    });
  }
  let budget = fictionalSponsorBudgetCents;
  function snapshot() {
    return {
      syntheticOnly:true, coinBackingActuallyVerified:false, realPennyTokensIssued:0,
      sponsorBudgetCents:budget,
      banks:[...bankMap.values()].map(b=>({...b,availableUnencumberedCoins:Math.max(0,b.recordedCoins-b.earmarkedCoins),uncoveredEarmarksCoins:Math.max(0,b.earmarkedCoins-b.recordedCoins)})),
      batches:batches.size,earmarks:[...earmarks].map(([key,value])=>({key,...value})),
      outsidePaymentsMade:0,
    };
  }
  function countCoins({ bankId, batchId, reportedCoins, countedCoins, witnessIds }) {
    id(bankId,'bankId');id(batchId,'batchId');
    integer(reportedCoins,'reportedCoins');integer(countedCoins,'countedCoins');
    const bank=bankMap.get(bankId);
    if (!bank) throw new Error('Unknown bank');
    if (batches.has(batchId)) throw new Error('Duplicate deposit batch');
    if (!Array.isArray(witnessIds) || witnessIds.length !== 2 ||
        !witnessIds.every(x=>typeof x==='string' && x.trim() && x!==bankId) ||
        witnessIds[0]===witnessIds[1]) throw new Error('Two distinct witness ID assertions are required');
    if (reportedCoins!==countedCoins) return { status:'count-mismatch-held', snapshot:snapshot() };
    if (bank.frozen) throw new Error('Bank frozen for loss review');
    if (bank.recordedCoins > bank.storageCapacityCoins-countedCoins) throw new Error('Insufficient storage capacity');
    bank.recordedCoins += countedCoins;
    batches.set(batchId,{bankId,coins:countedCoins,witnessIds:[...witnessIds],reportedCoins});
    return {status:'synthetic-count-entered',snapshot:snapshot()};
  }
  function earmark({ bankId, requestId, coins }) {
    id(bankId,'bankId');id(requestId,'requestId');
    integer(coins,'coins');
    const b=bankMap.get(bankId);
    if (!b) throw new Error('Unknown bank');
    if (earmarks.has(requestId)) throw new Error('Duplicate earmark ID');
    if (b.frozen) throw new Error('Bank frozen for loss review');
    if (coins > b.recordedCoins-b.earmarkedCoins) throw new Error('Would double-encumber physical coins');
    b.earmarkedCoins+=coins;
    earmarks.set(requestId,{bankId,coins,phase:'held-for-review'});
    return {status:'synthetic-earmark-held',snapshot:snapshot()};
  }
  function payForService({ bankId, serviceId, batchId, category, cents }) {
    id(bankId,'bankId');id(serviceId,'serviceId');id(batchId,'batchId');
    integer(cents,'cents');
    if (!['counting','storage','transport','audit'].includes(category)) throw new Error('Unknown service category');
    const bank=bankMap.get(bankId), batch=batches.get(batchId);
    if (!bank || !batch || batch.bankId!==bankId) throw new Error('Missing fictional custody batch evidence');
    if (bank.frozen) throw new Error('Bank frozen for loss review');
    const key=JSON.stringify([bankId,serviceId]);
    if (services.has(key)) throw new Error('Duplicate service award');
    if (cents>budget) throw new Error('Sponsor budget exhausted; coin backing cannot fund wages');
    budget-=cents;bank.hypotheticalServiceEarningsCents+=cents;
    services.add(key);
    return {status:'fictional-sponsor-paid-work',snapshot:snapshot()};
  }
  function reportLoss({bankId,coins,incidentId}) {
    id(bankId,'bankId');id(incidentId,'incidentId');
    integer(coins,'coins');
    const bank=bankMap.get(bankId);
    if (!bank) throw new Error('Unknown bank');
    if (coins>bank.recordedCoins) throw new Error('Cannot lose more coins than recorded');
    if (bank.frozen) throw new Error('Frozen bank requires independent resolution');
    bank.recordedCoins-=coins;
    bank.lostCoins+=coins;
    bank.frozen=true;
    return {status:'loss-frozen-no-silent-reissue',underCollateralizedCoins:Math.max(0,bank.earmarkedCoins-bank.recordedCoins),snapshot:snapshot()};
  }
  return {snapshot,countCoins,earmark,payForService,reportLoss};
}
