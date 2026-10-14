import {createHash} from "node:crypto";
const clean=v=>String(v??"").trim().slice(0,120);
export function normalize(company,uid,data){
 if(!["motors","mutual"].includes(company)||typeof uid!=="string"||!uid||!data||typeof data!=="object")throw Error("Invalid staff record");
 const active=company==="motors"?data.isStaff===true&&data.status==="active":data.status==="active";
 if(company==="motors"&&data.isStaff!==true)return null;
 return {projectId:company==="motors"?"sterling-motors":"sterling-mutual-insurance",uid,displayName:clean(data.displayName||data.fullName||data.name),role:clean(data.title||data.role),active};
}
export function digest(record){return createHash("sha256").update(JSON.stringify(record)).digest("hex")}
export function reconcile(snapshot,prior=[]){
 const seen=new Set(),records=[],conflicts=[];
 for(const rec of snapshot){
  if(!rec)continue;
  const key=rec.projectId+":"+rec.uid;
  if(seen.has(key)){conflicts.push({kind:"duplicate-source-identity",key});continue}
  seen.add(key);records.push({...rec,sha256:digest(rec)});
 }
 const changed=records.filter(r=>!prior.find(p=>p.projectId===r.projectId&&p.uid===r.uid&&p.sha256===r.sha256));
 // Never infer employee termination from missing partial query results.
 return {records,changed,conflicts,removed:[]};
}
