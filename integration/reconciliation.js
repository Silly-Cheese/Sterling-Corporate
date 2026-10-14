import {validIdentityRef,identityKey} from "./identity.js";
const SOURCE_FIELDS=["displayName","name","fullName","email","title","role","department","status","isStaff","permissions"];
export function normalizeEmployee(projectId,uid,data={}){
 const ref={projectId,uid};
 if(!validIdentityRef(ref))throw new Error("Invalid project or UID");
 if(!data||typeof data!=="object"||Array.isArray(data))throw new Error("Invalid employee data");
 const name=String(data.displayName||data.fullName||data.name||"Unnamed employee").trim().slice(0,120);
 const email=typeof data.email==="string"?data.email.trim().toLowerCase().slice(0,254):"";
 const status=String(data.status||"unknown").toLowerCase();
 const isStaff=projectId==="sterling-motors"?data.isStaff===true:true;
 return {key:identityKey(ref),projectId,uid,name,email,title:String(data.title||data.role||"Unassigned").slice(0,100),department:String(data.department||"").slice(0,100),status,isStaff};
}
export function parseStaffExport(text,{limit=500}={}){
 if(typeof text!=="string"||text.length>2_000_000)throw new Error("Import must be under 2MB");
 let data;try{data=JSON.parse(text)}catch{throw new Error("Invalid JSON")}
 if(!Array.isArray(data)||data.length>limit)throw new Error("Provide a JSON array of up to "+limit+" records");
 const seen=new Set();
 return data.map((item,index)=>{
   if(!item||typeof item!=="object")throw new Error("Invalid row "+(index+1));
   const {projectId,uid,...fields}=item;
   const record=normalizeEmployee(projectId,uid,fields);
   if(seen.has(record.key))throw new Error("Duplicate identity "+record.key);
   seen.add(record.key);
   return record;
 });
}
export function reconciliationCandidates(records){
 const pairs=[];
 for(let i=0;i<records.length;i++)for(let j=i+1;j<records.length;j++){
   const a=records[i],b=records[j];
   if(a.projectId===b.projectId||!a.isStaff||!b.isStaff)continue;
   const sharedEmail=a.email&&b.email&&a.email===b.email;
   const sharedName=a.name!=="Unnamed employee"&&a.name.toLowerCase()===b.name.toLowerCase();
   if(sharedEmail||sharedName)pairs.push({left:a,right:b,reason:sharedEmail?"Same reported email":"Same reported name",status:"review-required"});
 }
 return pairs;
}
export {SOURCE_FIELDS};
