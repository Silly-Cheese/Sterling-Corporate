import test from "node:test";
import assert from "node:assert/strict";
import {identityKey,candidateLink,validIdentityRef} from "../integration/identity.js";
const m={projectId:"sterling-motors",uid:"abc_123"};
const u={projectId:"sterling-mutual-insurance",uid:"def_456"};
test("valid project-scoped identities",()=>{assert.equal(validIdentityRef(m),true);assert.equal(identityKey(m),"sterling-motors:abc_123");assert.equal(validIdentityRef({...m,projectId:"other"}),false)});
test("unverified matches must not auto-link",()=>assert.equal(candidateLink(m,u,{method:"matching-name",verified:true}).status,"review-required"));
test("verification only produces candidate",()=>assert.equal(candidateLink(m,u,{method:"dual-authenticated",verified:true}).status,"verified-candidate"));
test("identical reference cannot link",()=>assert.throws(()=>candidateLink(m,m,{verified:true,method:"dual-authenticated"})));
