import test from "node:test";import assert from "node:assert/strict";import {spawnSync} from "node:child_process";import fs from "node:fs";
test("Phase 3 browser module syntax and mount",()=>{
 const filename=new URL("../phase3.js",import.meta.url);
 const result=spawnSync(process.execPath,["--check",filename.pathname],{encoding:"utf8"});
 assert.equal(result.status,0,result.stderr);
 const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
 assert.match(html,/id="phase3"/);assert.match(html,/import\("\.\/phase3\.js"\)/);
});
