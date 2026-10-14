import test from "node:test";
import assert from "node:assert/strict";
import {normalizeEmployee,parseStaffExport,reconciliationCandidates} from "../integration/reconciliation.js";
const m={projectId:"sterling-motors",uid:"a1",displayName:"Alex Smith",email:"alex@example.com",isStaff:true,status:"active"};
const i={projectId:"sterling-mutual-insurance",uid:"b2",displayName:"Alex Smith",email:"alex@example.com",status:"active"};
test("normalizes two different staff schemas",()=>{const records=parseStaffExport(JSON.stringify([m,i]));assert.equal(records.length,2);assert.equal(records[0].isStaff,true);assert.equal(records[1].isStaff,true)});
test("same email is review only",()=>assert.equal(reconciliationCandidates(parseStaffExport(JSON.stringify([m,i])))[0].status,"review-required"));
test("blocks duplicate uid per project",()=>assert.throws(()=>parseStaffExport(JSON.stringify([m,m])),/Duplicate/));
test("blocks unknown projects and non staff",()=>{assert.throws(()=>normalizeEmployee("foreign","x",{}));assert.equal(reconciliationCandidates([normalizeEmployee(m.projectId,m.uid,{...m,isStaff:false}),normalizeEmployee(i.projectId,i.uid,i)]).length,0)});
