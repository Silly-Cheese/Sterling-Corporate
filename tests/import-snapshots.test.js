import test from "node:test";
import assert from "node:assert/strict";
import {importKey,sourceProfile,importObserved} from "../scripts/import-snapshots.mjs";
test("source-scoped import IDs are stable and distinct",()=>{
 const a=importKey("sterling-motors","same");
 assert.equal(a,importKey("sterling-motors","same"));
 assert.notEqual(a,importKey("sterling-mutual-insurance","same"));
});
test("snapshot profile excludes email, compensation and permissions",()=>{
 const profile=sourceProfile({projectId:"sterling-motors",uid:"u1",displayName:"Jane",role:"Manager",active:true,sha256:"hash",email:"secret"}, "2026-10-14T00:00:00.000Z");
 assert.deepEqual(Object.keys(profile).sort(),["active","displayName","lastSeenAt","projectId","source","sourceHash","sourceUid","title"].sort());
});
test("same source hash is idempotent, never overwrites",async()=>{
 let writes=0;
 const db={collection:()=>({doc:()=>({get:async()=>({exists:true,data:()=>({projectId:"sterling-motors",sourceUid:"u1",sourceHash:"hash"})}),set:async()=>{writes++}})})};
 const result=await importObserved(db,[{projectId:"sterling-motors",uid:"u1",sha256:"hash"}],"now");
 assert.equal(result.unchanged,1);assert.equal(writes,0);
});
test("identity collision blocks overwriting another source",async()=>{
 let writes=0;
 const db={collection:()=>({doc:()=>({get:async()=>({exists:true,data:()=>({projectId:"sterling-mutual-insurance",sourceUid:"other"})}),set:async()=>{writes++}})})};
 const result=await importObserved(db,[{projectId:"sterling-motors",uid:"u1",sha256:"hash"}],"now");
 assert.equal(result.conflicts,1);assert.equal(writes,0);
});
