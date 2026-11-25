// MOONCRATER-002 / THE MAGNET — synthetic candidate matcher, not execution or accounting.
// Input assertions require independent human checking. No private inbox data, external calls,
// price estimates, contact automation or settlement. A REVIEW is not an accepted contract.
// Two-sided search: capability overlap retrieves candidates; gates prevent promotion.
// Paid, resource, distribution and volunteer opportunities remain separate lanes.
// Run: node labs/mooncrater-001/magnet.mjs
// Before field use: verify source provenance, duplicate requests, shared capacity/time,
// conflict-of-interest, explicit owner approval and privacy; compare against manual matching.
function magnet(supply,demand) {
  const results=[];
  for(const s of supply) for(const d of demand) {
    const overlap=s.capabilities.filter(x=>d.requires.includes(x));
    if(!overlap.length)continue;
    const missing=d.requires.filter(x=>!s.capabilities.includes(x));
    const blockers=[];
    if(missing.length)blockers.push("missing capabilities");
    if(s.ownerConsent!==true)blockers.push("owner consent");
    if(s.rightsCleared!==true)blockers.push("rights clearance");
    if(d.evidence!=="explicit_request")blockers.push("explicit external demand");
    if(!Number.isSafeInteger(s.prepHours)||s.prepHours<0||!Number.isSafeInteger(d.windowHours)||s.prepHours>d.windowHours)blockers.push("timing");
    if(d.kind==="paid"&&d.priceAccepted!==true)blockers.push("accepted price");
    if(d.kind==="paid"&&d.paymentRouteApproved!==true)blockers.push("approved payment route");
    results.push({supply:s.id,demand:d.id,kind:d.kind,overlap,missing,blockers,state:blockers.length?"HOLD":"REVIEW",cashRecognizedCents:0});
  }
  return results.sort((a,b)=>(a.blockers.length-b.blockers.length)||(b.overlap.length-a.overlap.length)||a.supply.localeCompare(b.supply)||a.demand.localeCompare(b.demand));
}
function tests(){
  const s={id:"fixture-s",capabilities:["design","print"],ownerConsent:true,rightsCleared:true,prepHours:4};
  const d={id:"fixture-d",requires:["design"],kind:"paid",evidence:"explicit_request",windowHours:24,priceAccepted:true,paymentRouteApproved:true};
  const cases=[
  ["match stays review and recognizes zero cash",()=>magnet([s],[d])[0].state==="REVIEW"&&magnet([s],[d])[0].cashRecognizedCents===0],
  ["no demand no match",()=>magnet([s],[]).length===0],
  ["unrelated request no match",()=>magnet([s],[{...d,requires:["repair"]}]).length===0],
  ["partial match held",()=>magnet([s],[{...d,requires:["design","repair"]}])[0].state==="HOLD"],
  ["inferred demand held",()=>magnet([s],[{...d,evidence:"inferred"}])[0].state==="HOLD"],
  ["no consent held",()=>magnet([{...s,ownerConsent:false}],[d])[0].state==="HOLD"],
  ["no rights held",()=>magnet([{...s,rightsCleared:false}],[d])[0].state==="HOLD"],
  ["deadline held",()=>magnet([s],[{...d,windowHours:2}])[0].state==="HOLD"],
  ["unaccepted price held",()=>magnet([s],[{...d,priceAccepted:false}])[0].state==="HOLD"],
  ["no route held",()=>magnet([s],[{...d,paymentRouteApproved:false}])[0].state==="HOLD"],
  ["noncash resource not money",()=>magnet([s],[{...d,kind:"resource",priceAccepted:false,paymentRouteApproved:false}])[0].cashRecognizedCents===0]];
  for(const [name,fn] of cases)if(!fn())throw Error(name);
  return cases.map(x=>x[0]);
}
export {magnet,tests};
console.log(JSON.stringify({fixtureOnly:true,passed:tests()},null,2));
