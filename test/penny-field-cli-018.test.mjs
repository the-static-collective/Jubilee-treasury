import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {main} from '../src/penny-field-cli-018.mjs';
import {approvedFabricationFixture,SIM_GCODE,SIM_PHOTO,syntheticMachineTrace} from '../src/penny-hardware-demo-017.mjs';
import {startSession,appendObservation,makeInspectionBundle} from '../src/penny-field-capture-018.mjs';
const T='2026-10-08T21:17:00.000Z',AT='2026-10-08T21:17:03.000Z';
const challenge='JUBILEE-018-'+'7'.repeat(32);
const save=(dir,name,v)=>{
 const path=join(dir,name);
 writeFileSync(path,typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v),{mode:0o600});return path;
};
async function localWitnessTrial(){
 const tmp=mkdtempSync(join(tmpdir(),'penny-018-'));
 const x=approvedFabricationFixture();
 const g=save(tmp,'box-d-part.gcode',SIM_GCODE);
 const p=save(tmp,'post-photo.png',SIM_PHOTO);
 const notes=save(tmp,'notes.txt','JUBILEE-CHALLENGE '+challenge+
  '\nIndependent trial account of post-print physical measurements for this candidate.\n');
 let s=startSession(x.field,x.candidate,SIM_GCODE,'box-d-part.gcode',T,challenge);
 const {trace}=await syntheticMachineTrace();
 s=appendObservation(s,trace.during,trace.duringAt);
 s=appendObservation(s,trace.after,trace.afterAt);
 const b=makeInspectionBundle(x.field,x.candidate,s,{
  gcodeBytes:SIM_GCODE,photoBytes:SIM_PHOTO,notesBytes:readFileSync(notes),
  inspectedAt:AT,dimensions:{
   widthMm:125,heightMm:130,depthMm:95,assembled:true,looksSafeForUse:true
  }
 });
 const dir=join(tmp,'trial');mkdirSync(dir,{mode:0o700});
 save(dir,'field.json',x.field);save(dir,'candidate.json',x.candidate);
 save(dir,'session.json',s);save(dir,'inspection-evidence.json',b);
 save(dir,'private-input-paths.json',{gcodePath:g,photoPath:p,notesPath:notes});
 const keys={
   fabricator:save(tmp,'fabricator.private.pem',x.owners.fabricator.privateKey),
   witness:save(tmp,'witness.private.pem',x.owners.witness.privateKey),
   new_box_owner:save(tmp,'newowner.private.pem',x.owners.newBox.privateKey)
 };
 return {dir,tmp,keys,b};
}
test('real CLI status only exposes a challenge, not private key or account',async()=>{
 const x=await localWitnessTrial(),r=await main(['status',x.dir]);
 assert.equal(r.observations,2);
 assert.equal(r.independentlyVerifiedPhysicalObject,false);
 assert.equal(r.movementsExecuted,false);
 assert.equal(r.challenge,challenge);
});
test('role-specific signing proceeds independently through CLI, and public handoff has no signer secrets',async()=>{
 const x=await localWitnessTrial();
 const first=await main(['sign',x.dir,'fabricator',x.keys.fabricator]);
 assert.deepEqual(first.acceptedRoles,['fabricator']);
 const partial=await main(['verify',x.dir]);
 assert.equal(partial.status,'HOLD_INDEPENDENT_SIGNATURES_REQUIRED');
 await main(['sign',x.dir,'witness',x.keys.witness]);
 await main(['sign',x.dir,'new_box_owner',x.keys.new_box_owner]);
 const ready=await main(['verify',x.dir]);
 assert.equal(ready.status,'EVIDENCE_READY_FOR_MANUAL_OWNER_REVIEW_NO_AUTOMATIC_APPLY');
 const out=await main(['handoff',x.dir]);
 const handoff=readFileSync(out.output,'utf8');
 assert.equal(out.commissioned,false);
 assert.equal(out.pennyMinted,0);
 assert.doesNotMatch(handoff,/PRIVATE KEY|OCTOPRINT_API_KEY|private-input-paths/);
 assert.equal(JSON.parse(handoff).commissioningAuthorized,false);
 assert.throws(()=>readFileSync(join(x.dir,'handoff-public-review.json')+'-missing'),'none');
});
test('CLI refuses double-signed role and second public handoff overwrite',async()=>{
 const x=await localWitnessTrial();
 await main(['sign',x.dir,'fabricator',x.keys.fabricator]);
 await assert.rejects(()=>main(['sign',x.dir,'fabricator',x.keys.fabricator]),
  /cannot be overwritten/);
 await main(['sign',x.dir,'witness',x.keys.witness]);
 await main(['sign',x.dir,'new_box_owner',x.keys.new_box_owner]);
 await main(['handoff',x.dir]);
 await assert.rejects(()=>main(['handoff',x.dir]),/EEXIST/);
});
test('CLI observes no printer when key is absent, never tries network or uploads',async()=>{
 const x=await localWitnessTrial();
 const old=process.env.OCTOPRINT_API_KEY;delete process.env.OCTOPRINT_API_KEY;
 try{
  await assert.rejects(()=>main(['observe',x.dir,'http://127.0.0.1:5000']),
    /environment variable required/);
 }finally{if(old!==undefined)process.env.OCTOPRINT_API_KEY=old;}
});
test('a private image edited after independent signatures blocks CLI handoff',async()=>{
 const x=await localWitnessTrial();
 for(const [role,key] of Object.entries(x.keys))await main(['sign',x.dir,role,key]);
 const paths=JSON.parse(readFileSync(join(x.dir,'private-input-paths.json')));
 writeFileSync(paths.photoPath,Buffer.concat([SIM_PHOTO,Buffer.from('edited')]));
 await assert.rejects(()=>main(['verify',x.dir]),/missing or modified/);
 await assert.rejects(()=>main(['handoff',x.dir]),/missing or modified/);
});
