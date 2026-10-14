import test from "node:test";import assert from "node:assert/strict";
import {computeGross,canTransition,validPeriod} from "../payroll/core.js";
import {mapStaffRecord,integrationHealth} from "../integration/adapter-contract.js";
test("gross payroll calculations",()=>{assert.equal(computeGross({payType:"hourly",rateCents:2000,regularHours:40,overtimeHours:2,bonusCents:500}),86500);assert.equal(computeGross({payType:"salary",rateCents:150000,regularHours:0,bonusCents:500}),150500)});
test("rejects invalid pay inputs",()=>assert.throws(()=>computeGross({payType:"hourly",rateCents:-1,regularHours:20})));
test("states and pay periods",()=>{assert.equal(canTransition("submitted","approved"),true);assert.equal(canTransition("approved","draft"),false);assert.equal(validPeriod("2026-10-01","2026-10-14"),true)});
test("different existing staff schemas",()=>{assert.equal(mapStaffRecord("motors","a",{isStaff:true,status:"active"}).active,true);assert.equal(mapStaffRecord("mutual","b",{status:"active"}).projectId,"sterling-mutual-insurance");assert.equal(integrationHealth({verified:false}),"not-verified")});
