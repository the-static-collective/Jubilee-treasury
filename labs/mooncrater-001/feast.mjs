// THE FEAST synthetic planning fixtures only. No verification or event authority.
const stages=[["OFFER","What can I freely bring?"],["NEED","What does a willing recipient actually need?"],["BUILD","What small useful act could we complete together?"],["QUESTION","What do we need to learn before proceeding?"]];
function packet(v){
 const fields=["table","act","owner","check","nextTable","handoff"];
 for(const k of fields)if(typeof v[k]!=="string"||!v[k].trim()||v[k].length>500)throw Error("Complete each bounded planning field.");
 if(!["idea","invited","host-reported-willing"].includes(v.successor))throw Error("Choose successor status.");
 if(!["idea","offer","accepted-reported","delivered-reported","review-requested"].includes(v.state))throw Error("Choose act status.");
 return {schema:"feast.table/v1",table:v.table.trim(),act:v.act.trim(),owner:v.owner.trim(),check:v.check.trim(),state:v.state,nextTable:v.nextTable.trim(),handoff:v.handoff.trim(),successor:v.successor,status:"UNSENT_LOCAL_PLAN",recipientVerified:false,deliveryVerified:false,successorVerified:false,recognizedCashMinor:0,publicationAuthorized:false};
}
function tests(){const v={table:"FIXTURE-01",act:"Repair a fictional sign",owner:"Local steward",check:"Recipient inspects",state:"idea",nextTable:"New host",handoff:"Blank planning kit",successor:"idea"};let n=0;function t(ok){if(!ok)throw Error("fixture "+n);n++}const rejects=f=>{try{f();return false}catch{return true}};t(stages.length===4);t(packet(v).status==="UNSENT_LOCAL_PLAN");t(!packet({...v,state:"delivered-reported"}).deliveryVerified);t(!packet({...v,successor:"host-reported-willing"}).successorVerified);t(packet(v).recognizedCashMinor===0);t(!packet(v).publicationAuthorized);t(!packet(v).recipientVerified);t(rejects(()=>packet({...v,state:"verified"})));t(rejects(()=>packet({...v,successor:"confirmed"})));t(rejects(()=>packet({...v,act:""})));t(rejects(()=>packet({...v,handoff:"x".repeat(501)})));t(!JSON.stringify(packet({...v,privateAddress:"PRIVATE-FIXTURE"})).includes("PRIVATE-FIXTURE"));return n;}
export {packet,tests};console.log(JSON.stringify({syntheticChecks:tests()}));
