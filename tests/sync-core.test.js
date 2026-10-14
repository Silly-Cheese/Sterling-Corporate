import test from "node:test";import assert from "node:assert/strict";import {normalize,reconcile,digest} from "../scripts/sync-core.mjs";
test("filters Motors non-staff without modifying inputs",()=>{assert.equal(normalize("motors","x",{isStaff:false,status:"active"}),null)});
test("recognizes Mutual staff",()=>assert.equal(normalize("mutual","u",{status:"active"}).projectId,"sterling-mutual-insurance"));
test("detects duplicate scoped identities",()=>{const item=normalize("mutual","u",{status:"active"});assert.equal(reconcile([item,item]).conflicts.length,1)});
test("missing records never trigger deletion",()=>assert.deepEqual(reconcile([],[{projectId:"sterling-motors",uid:"x"}]).removed,[]));
test("deterministic digest",()=>{const x={uid:"x"};assert.equal(digest(x),digest(x))});
