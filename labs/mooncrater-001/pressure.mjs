// MOONCRATER-001 — synthetic research specimen, not financial software.
// All flags and references are supplied assertions; this code does not verify external evidence.
// No custody, execution authority, network, live campaign, or payment integration.
function assess(c) {
  const gates = ["ownerConsent","rightsCleared","demandEvidence","deliveryReady","authorizedPaymentRoute","deadlineFeasible"];
  const missing = gates.filter(k => c[k] !== true);
  return {id:c.id, state:missing.length ? "HOLD" : "READY_FOR_HUMAN_REVIEW", missing, cashRecognizedCents:0};
}
function reconcile(events) {
  const seen = new Set(), balances = new Map(); let netReceived=0, disbursed=0;
  const check = (v) => Number.isSafeInteger(v) && v >= 0;
  for (const e of events) {
    if (!e.id || seen.has(e.id)) throw Error("duplicate/missing event ID");
    seen.add(e.id);
    if (["pledge","offer","work","valuation"].includes(e.type)) continue;
    if (e.verified !== true || !e.receiptRef || !e.campaignId || !e.ownerConsentRef || !check(e.cents) || e.cents === 0) throw Error("missing settlement evidence");
    const balance = balances.get(e.campaignId) ?? 0;
    if (e.type === "received") { balances.set(e.campaignId,balance+e.cents); netReceived += e.cents; }
    else if (e.type === "disbursed" || e.type === "refund") {
      if (e.cents > balance) throw Error("unbacked outgoing amount");
      balances.set(e.campaignId,balance-e.cents);
      if(e.type==="disbursed") disbursed += e.cents; else netReceived -= e.cents;
    } else throw Error("unknown event");
    if (![netReceived,disbursed,balances.get(e.campaignId)].every(check)) throw Error("unsafe total");
  }
  return {netReceivedCents:netReceived,disbursedCents:disbursed,remainingCents:netReceived-disbursed};
}
function selfTest() {
  const results = [];
  function t(name, fn) { if (!fn()) throw Error(name); results.push(name); }
  function rejects(fn){try{fn();return false}catch{return true}}
  const gates={id:"fixture",ownerConsent:true,rightsCleared:true,demandEvidence:true,deliveryReady:true,authorizedPaymentRoute:true,deadlineFeasible:true};
  const receipt={id:"r1",type:"received",verified:true,receiptRef:"SYNTHETIC",campaignId:"fixture",ownerConsentRef:"SYNTHETIC",cents:100};
  t("ready is not cash",()=>assess(gates).state==="READY_FOR_HUMAN_REVIEW" && assess(gates).cashRecognizedCents===0);
  for(const key of Object.keys(gates).filter(k=>k!=="id")) t("remove "+key,()=>assess({...gates,[key]:false}).state==="HOLD");
  t("pledges and valuations not cash",()=>reconcile([{id:"p",type:"pledge",cents:800000},{id:"v",type:"valuation",cents:999999}]).remainingCents===0);
  t("receipt required",()=>rejects(()=>reconcile([{...receipt,receiptRef:""}])));
  t("duplicate event blocked",()=>rejects(()=>reconcile([receipt,receipt])));
  t("overspend blocked",()=>rejects(()=>reconcile([receipt,{...receipt,id:"r2",type:"disbursed",cents:101}])));
  t("cross-campaign spend blocked",()=>rejects(()=>reconcile([receipt,{...receipt,id:"r2",campaignId:"other",type:"disbursed",cents:1}])));
  t("conservation",()=>reconcile([receipt,{...receipt,id:"r2",type:"disbursed",cents:37}]).remainingCents===63);
  return results;
}
export {assess,reconcile,selfTest};
console.log(JSON.stringify({fixtureOnly:true,passed:selfTest(),actualFundsVerified:false},null,2));
