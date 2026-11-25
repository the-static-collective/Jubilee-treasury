// Fictional physical penny recirculation proposals. No shipment, custody,
 // authentic merchant request, courier fee, or legal coin pickup is created.
const integer=(v,name,zero=false)=>{
 if(!Number.isSafeInteger(v)||v<(zero?0:1))throw new TypeError(name+' must be '+(zero?'nonnegative':'positive')+' safe integer');
 return v;
};
const identity=(v,name)=>{if(typeof v!=='string'||!v.trim())throw new TypeError(name+' requires ID');return v;};
export function proposeCoinCirculation({stewards,requests,links}) {
 if(!Array.isArray(stewards)||stewards.length>10 || !Array.isArray(requests)||requests.length>10 || !Array.isArray(links)||links.length>50)
   throw new TypeError('Model at most 10 stewards, 10 requests, and 50 links');
 const stock=new Map(),demand=new Map(),linksSeen=new Set(),rows=[];
 for(const b of stewards){
   identity(b?.id,'steward');integer(b.availableUnencumberedCoins,'steward stock',true);
   if(stock.has(b.id))throw new Error('Duplicate steward');
   if(b.availableUnencumberedCoins>10000)throw new RangeError('Coin lab source limit');
   stock.set(b.id,b.availableUnencumberedCoins);
 }
 for(const r of requests){
   identity(r?.id,'request');integer(r.coinsRequested,'request amount');
   if(demand.has(r.id))throw new Error('Duplicate request');
   if(typeof r.consentForModel!=='boolean')throw new TypeError('Explicit request consent assumption needed');
   demand.set(r.id,{remaining:r.coinsRequested,consentForModel:r.consentForModel});
 }
 for(const l of links){
   identity(l?.id,'link');
   if(linksSeen.has(l.id))throw new Error('Duplicate link');
   linksSeen.add(l.id);
   if(!stock.has(l.fromSteward)||!demand.has(l.toRequest))throw new Error('Unknown route endpoint');
   integer(l.maxCoins,'link capacity');
   integer(l.perTripCostCents,'trip cost',true);
   integer(l.per100CoinHandlingCents,'handling cost',true);
   if(typeof l.consentForModel!=='boolean')throw new TypeError('Explicit route consent assumption needed');
   rows.push({...l,remainingCapacity:l.maxCoins});
 }
 // Simple deterministic heuristic; a *candidate* plan, not global optimization.
 rows.sort((a,b)=>(a.perTripCostCents+a.per100CoinHandlingCents)-(b.perTripCostCents+b.per100CoinHandlingCents)||a.id.localeCompare(b.id));
 let totalProposedCoins=0,modeledServiceCostCents=0;
 const assignments=[];
 for(const l of rows){
   const req=demand.get(l.toRequest);
   if(!req.consentForModel||!l.consentForModel)continue;
   const count=Math.min(stock.get(l.fromSteward),req.remaining,l.remainingCapacity);
   if(count<=0)continue;
   const handling=l.perTripCostCents+Math.ceil(count*l.per100CoinHandlingCents/100);
   const item={stewardId:l.fromSteward,requestId:l.toRequest,coins:count,
     grossWeightGrams:count*2.5,modeledServiceCostCents:handling,
     status:'candidate-not-shipped'};
   assignments.push(item);
   stock.set(l.fromSteward,stock.get(l.fromSteward)-count);
   req.remaining-=count;
   totalProposedCoins+=count;
   modeledServiceCostCents+=handling;
 }
 const unmetRequests=[...demand].map(([id,r])=>({id,unmetCoins:r.remaining})).filter(r=>r.unmetCoins>0);
 return {
   status:'physical-circulation-proposal-only',assignments,unmetRequests,
   totalProposedCoins,grossWeightGrams:totalProposedCoins*2.5,modeledServiceCostCents,
   residualUnencumberedStock:[...stock].map(([id,coins])=>({id,coins})),
   actualCoinMovement:false,realCentsIssued:0,realCustodyVerified:false,
   heuristicOnly:true,
   note:'A pickup/delivery is a real service job only if an actual merchant, steward and sponsor agree and physical coins are independently verified.',
 };
}
