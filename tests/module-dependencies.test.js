import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
function scan(filename,seen=new Set()){
 if(seen.has(filename))return;seen.add(filename);
 const source=fs.readFileSync(filename,"utf8");
 for(const m of source.matchAll(/(?:from\s*|import\s*\()\s*["'](\.[^"']+)["']/g)){
  const relative=m[1].split("?")[0],next=path.resolve(path.dirname(filename),relative);
  assert.ok(fs.existsSync(next),"Missing relative module: "+path.relative(root,next)+" referenced by "+path.relative(root,filename));
  scan(next,seen);
 }
}
test("all relative dynamic and static ES module imports resolve",()=>{
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 for(const m of html.matchAll(/import\s*\(\s*["'](\.[^"']+)["']\s*\)/g)){
  const source=path.resolve(root,m[1].split("?")[0]);
  assert.ok(fs.existsSync(source),"Missing entry module "+source);
  scan(source);
 }
 scan(path.join(root,"integration/readiness-ui.js"));
 scan(path.join(root,"phase3.js"));
});
