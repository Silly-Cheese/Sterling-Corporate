import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";import {spawnSync} from "node:child_process";
test("Corporate visual assets exist and are linked",()=>{
 const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
 assert.match(html,/href="\.\/favicon\.svg"/);assert.match(html,/href="\.\/corporate-theme\.css(?:\?[^"]+)?"/);
 assert.match(fs.readFileSync(new URL("../favicon.svg",import.meta.url),"utf8"),/<svg[^>]+viewBox=/);
 assert.match(html,/id="integrationReadiness"/);
});
test("Integration readiness module parses",()=>{
 const file=new URL("../integration/readiness-ui.js",import.meta.url);
 const r=spawnSync(process.execPath,["--check",file.pathname],{encoding:"utf8"});
 assert.equal(r.status,0,r.stderr);
});

test("Connection verification never enumerates the staff collection",()=>{
 const source=fs.readFileSync(new URL("../integration/readiness-ui.js",import.meta.url),"utf8");
 assert.match(source,/getDoc\(doc\(db,adapter.staffCollection,credential.user.uid\)\)/);
 assert.match(source,/inMemoryPersistence/);
 assert.doesNotMatch(source,/getDocs\(/);
});

test("Subsidiary sessions persist while staff permissions are rechecked on refresh",()=>{
 const source=fs.readFileSync(new URL("../integration/readiness-ui.js",import.meta.url),"utf8");
 assert.match(source,/browserLocalPersistence/);
 assert.match(source,/onAuthStateChanged\(auth/);
 assert.match(source,/getDoc\(doc\(getFirestore\(app\),adapter.staffCollection,user.uid\)\)/);
 assert.doesNotMatch(source,/inMemoryPersistence/);
});
