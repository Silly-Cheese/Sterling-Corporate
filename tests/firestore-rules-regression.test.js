import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const rules=fs.readFileSync(new URL("../firestore.rules",import.meta.url),"utf8");
test("Firestore rules contain intact pay period validation",()=>{
  assert.match(rules,/request\.resource\.data\.start\.matches\('\^\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}\$'\)/);
  assert.match(rules,/request\.resource\.data\.end\.matches\('\^\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}\$'\)/);
  assert.equal((rules.match(/match \/corporatePayPeriods\/\{id\}/g)||[]).length,1);
  assert.equal((rules.match(/match \/integrationRuns\/\{id\}/g)||[]).length,1);
});
test("Firestore rule delimiters balance outside string literals and comments",()=>{
  const source=rules.replace(/\/\/[^\n]*/g,"").replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g,"''");
  const stack=[], pairs={"}":"{",")":"(","]":"["};
  for(const c of source){if("{([".includes(c))stack.push(c);else if("})]".includes(c))assert.equal(stack.pop(),pairs[c],"mismatched delimiter "+c);}
  assert.equal(stack.length,0,"unclosed delimiters");
});
