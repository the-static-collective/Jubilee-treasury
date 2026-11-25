// Synthetic checks only. No customer data, authorization service, publishing or accounting.
const lessons=[{"id":"flyer","title":"Design a useful event flyer","steps":["Confirm who, what, when, where and contact details.","Use authorized artwork; establish one hierarchy and a legible layout.","Export digital and print versions; check legibility and correct information."],"proof":"An independent reader can identify the event and its details; customer approves the files."},{"id":"church","title":"Build a coherent gathering kit","steps":["Establish one approved event brief.","Adapt the same design to poster, handout and screen sizes.","Review each format independently and hand off all agreed files."],"proof":"All three formats agree and the recipient can use them."},{"id":"landing","title":"Build a useful one-page website","steps":["Agree the audience, scope and public contact route.","Build a responsive page from authorized text and assets.","Check desktop/mobile, links, accessibility and hand off editable source."],"proof":"The owner can open and edit the source and a visitor can find the contact route."},{"id":"orphanage","title":"Recover an unfinished project","steps":["Agree a two-hour audit boundary and source access.","Inventory source versions, working parts, unknowns and blockers.","Return a ranked restart plan; make only the small improvement authorized."],"proof":"The owner can locate the sources and independently choose the next action."},{"id":"own-shop","title":"Make a shop that belongs to its maker","steps":["Agree up to three offers, proposed prices, rights and maker-owned inquiry channel.","Adapt the fictional sample; replace every sample fact with approved content.","Test mobile and links; hand off source and deployment instructions to the owner."],"proof":"The maker controls files, hosting, domain and contact route; can edit and leave independently."}];
function methodRecord(v){
 const ids=["flyer","church","landing","orphanage","own-shop"];
 if(!ids.includes(v.lesson))throw Error("Choose a lesson.");
 if(!["original_generic","customer_derived"].includes(v.origin))throw Error("Declare origin.");
 if(v.origin==="customer_derived"&&v.permission!==true)throw Error("Separate customer permission required.");
 if(v.rights!==true||v.sanitized!==true)throw Error("Rights and removal of identifying or confidential material must be reviewed.");
 for(const k of ["title","steps","check"]){if(typeof v[k]!=="string"||!v[k].trim()||v[k].length>4000)throw Error("Complete bounded method fields.");}
 return {schema:"apprentice.method/v1",lesson:v.lesson,origin:v.origin,title:v.title.trim(),steps:v.steps.trim(),check:v.check.trim(),status:"HOLD_FOR_INDEPENDENT_REVIEW",rightsAttested:true,sanitizationAttested:true,permissionAttested:v.origin==="customer_derived"?true:null,publicationAuthorized:false,customerAcceptance:false,recognizedCashMinor:0};
}
function deliveryRecord(v){
 if(!["flyer","church","landing","orphanage","own-shop"].includes(v.lesson))throw Error("Choose a lesson.");
 for(const k of ["ref","scope","files","next"]){if(typeof v[k]!=="string"||!v[k].trim()||v[k].length>4000)throw Error("Complete bounded handoff fields.");}
 return {schema:"apprentice.delivery/v1",visibility:"PRIVATE_LOCAL_ONLY",lesson:v.lesson,ref:v.ref.trim(),scope:v.scope.trim(),files:v.files.trim(),next:v.next.trim(),status:"DRAFT_AWAITING_CUSTOMER_REVIEW",customerAcceptance:false,paymentVerified:false,recognizedCashMinor:0};
}
function tests(){
 const m={lesson:"own-shop",origin:"original_generic",title:"Independent handoff",steps:"Export editable source",check:"Owner edits independently",rights:true,sanitized:true};
 const d={lesson:"own-shop",ref:"SYNTHETIC-001",scope:"One demo",files:"demo.html",next:"Review"};
 const out=[];const t=(n,f)=>{if(!f())throw Error(n);out.push(n)};const reject=f=>{try{f();return false}catch{return true}};
 t("five unique source lessons",()=>lessons.length===5&&new Set(lessons.map(x=>x.id)).size===5);
 t("generic method stays held",()=>methodRecord(m).status==="HOLD_FOR_INDEPENDENT_REVIEW");
 t("customer-derived without permission refused",()=>reject(()=>methodRecord({...m,origin:"customer_derived"})));
 t("customer-derived attestation remains held",()=>methodRecord({...m,origin:"customer_derived",permission:true}).publicationAuthorized===false);
 t("rights required",()=>reject(()=>methodRecord({...m,rights:false})));
 t("sanitization required",()=>reject(()=>methodRecord({...m,sanitized:false})));
 t("blank step refused",()=>reject(()=>methodRecord({...m,steps:" "})));
 t("unknown lesson refused",()=>reject(()=>deliveryRecord({...d,lesson:"x"})));
 t("delivery remains private",()=>deliveryRecord(d).visibility==="PRIVATE_LOCAL_ONLY");
 t("delivery is not acceptance",()=>deliveryRecord(d).customerAcceptance===false);
 t("both recognize zero cash",()=>deliveryRecord(d).recognizedCashMinor===0&&methodRecord(m).recognizedCashMinor===0);
 t("private ref not carried into method",()=>!JSON.stringify(methodRecord({...m,ref:d.ref})).includes(d.ref));
 t("bounded inputs",()=>reject(()=>deliveryRecord({...d,scope:"x".repeat(4001)})));
 return out;
}
export {lessons,methodRecord,deliveryRecord,tests};
console.log(JSON.stringify({checks:tests()},null,2));
