import {reconcile,normalize} from "./sync-core.mjs";
import {writeFile,mkdir} from "node:fs/promises";
const DRY=process.argv.includes("--dry-run");
const result={mode:"READ_ONLY",startedAt:new Date().toISOString(),projects:["sterling-motors","sterling-mutual-insurance"],sourceCounts:{},conflicts:[],observedCount:0,coverage:'bounded-sample',status:"not-started"};
function log(message){process.stdout.write(JSON.stringify({timestamp:new Date().toISOString(),message})+"\n")}
async function main(){
 if(DRY){result.status="dry-run";log("Dry-run: no Firebase credentials accessed");return}
 const required=["STERLING_MOTORS_SERVICE_ACCOUNT_JSON","STERLING_MUTUAL_SERVICE_ACCOUNT_JSON"];
 const missing=required.filter(k=>!process.env[k]);
 if(missing.length){result.status="blocked-missing-credentials";log("Missing required project credentials: "+missing.join(", "));process.exitCode=2;return}
 const {initializeApp,cert,deleteApp}=await import("firebase-admin/app");
 const {getFirestore}=await import("firebase-admin/firestore");
 const apps=[];
 try{
  const importing=process.env.STERLING_CORPORATE_IMPORT_ENABLED==="true";
  let corporateDb=null,importObserved=null;
  if(importing){
   if(!process.env.STERLING_CORPORATE_SERVICE_ACCOUNT_JSON)throw Error("Corporate import credential missing");
   const credentials=JSON.parse(process.env.STERLING_CORPORATE_SERVICE_ACCOUNT_JSON);
   if(credentials.project_id!=="sterling-corporate")throw Error("Corporate credential project mismatch");
   const corporate=initializeApp({credential:cert(credentials),projectId:"sterling-corporate"},"sync-corporate");
   apps.push(corporate);corporateDb=getFirestore(corporate);
   ({importObserved}=await import("./import-snapshots.mjs"));
   result.coverage="rotating-50-document-windows";
   result.imports={created:0,updated:0,unchanged:0,conflicts:0};
  }
  const inputs=[];
  for(const [key,id,secret,collection] of [
   ["motors","sterling-motors","STERLING_MOTORS_SERVICE_ACCOUNT_JSON","users"],
   ["mutual","sterling-mutual-insurance","STERLING_MUTUAL_SERVICE_ACCOUNT_JSON","staff"]
  ]){
   const credentials=JSON.parse(process.env[secret]);
   if(credentials.project_id!==id)throw Error("Project mismatch for "+key);
   const app=initializeApp({credential:cert(credentials),projectId:id},"sync-"+key);apps.push(app);
   const db=getFirestore(app);
   // Import uses a durable per-project cursor; at most 50 source reads per run.
   const cursorRef=importing?corporateDb.collection("integrationSyncCursors").doc(key):null;
   const priorCursor=cursorRef?(await cursorRef.get()).data()?.afterId:null;
   const sourceQuery=db.collection(collection).orderBy("__name__").limit(50);
   const snap=await (priorCursor?sourceQuery.startAfter(priorCursor):sourceQuery).get();
   const batch=[];
   for(const doc of snap.docs){const record=normalize(key,doc.id,doc.data());if(record)batch.push(record)}
   result.sourceCounts[key]=snap.size;
   const output=reconcile(batch);
   inputs.push(...batch);
   result.conflicts.push(...output.conflicts);
   if(importing){
    if(output.conflicts.length)throw Error("Duplicate staff identities found in "+key);
    const counts=await importObserved(corporateDb,output.records,new Date().toISOString());
    for(const field of Object.keys(result.imports))result.imports[field]+=counts[field]||0;
    if(counts.conflicts)throw Error("Corporate import source collision");
    // Cursor advances only after all observations are imported.
    await cursorRef.set({afterId:snap.size<50?null:snap.docs.at(-1).id,updatedAt:new Date().toISOString(),projectId:id,scanned:snap.size});
   }

  }
  const output=reconcile(inputs);result.observedCount=output.records.length;result.conflicts=output.conflicts;result.status=output.conflicts.length?"conflicts-found":"observed";
  if(importing)result.status="corporate-snapshots-updated";
  // No subsidiary writes, account writes, or local PII exports.
  log("Read-only observation complete: "+JSON.stringify({sourceCounts:result.sourceCounts,records:output.records.length,conflicts:output.conflicts.length}));
  if(output.conflicts.length)process.exitCode=3;
 }finally{await Promise.all(apps.map(deleteApp))}
}
try{await main()}catch(error){result.status="error";result.errorClass=error?.code||error?.name||"unknown";log("Sync failed: "+result.errorClass);process.exitCode=1}
finally{result.finishedAt=new Date().toISOString();await mkdir(".sync-status",{recursive:true});await writeFile(".sync-status/status.json",JSON.stringify(result,null,2));}
