import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
test("Corporate inline module must parse",()=>{
 const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const match=html.match(/<script type="module">([\s\S]*?)<\/script>/);
 assert.ok(match,"inline application script exists");
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"sterling-script-"));
 try{
  const file=path.join(dir,"corporate.mjs");
  fs.writeFileSync(file,match[1]);
  const result=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
