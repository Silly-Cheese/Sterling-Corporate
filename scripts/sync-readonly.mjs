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
  const inputs=[];
  for(const [key,id,secret,collection] of [
   ["motors","sterling-motors","STERLING_MOTORS_SERVICE_ACCOUNT_JSON","users"],
   ["mutual","sterling-mutual-insurance","STERLING_MUTUAL_SERVICE_ACCOUNT_JSON","staff"]
  ]){
   const credentials=JSON.parse(process.env[secret]);
   if(credentials.project_id!==id)throw Error("Project mismatch for "+key);
   const app=initializeApp({credential:cert(credentials),projectId:id},"sync-"+key);apps.push(app);
   const db=getFirestore(app);
   // Bounded, paginated source reads; only explicitly recognized staff records become observations.
   let sourceCount=0;
   while(true){
    let query=db.collection(collection).orderBy("__name__").limit(50);
    const snap=await query.get();if(snap.empty)break;
    for(const doc of snap.docs){const record=normalize(key,doc.id,doc.data());if(record)inputs.push(record)}
    sourceCount+=snap.size;
    break; // Free-tier safety: at most 50 reads per subsidiary per run.
   }
   result.sourceCounts[key]=sourceCount;
  }
  const output=reconcile(inputs);result.observedCount=output.records.length;result.conflicts=output.conflicts;result.status=output.conflicts.length?"conflicts-found":"observed";
  // No Firestore writes, account writes, local PII exports, or cross-project mutation.
  log("Read-only observation complete: "+JSON.stringify({sourceCounts:result.sourceCounts,records:output.records.length,conflicts:output.conflicts.length}));
  if(output.conflicts.length)process.exitCode=3;
 }finally{await Promise.all(apps.map(deleteApp))}
}
try{await main()}catch(error){result.status="error";result.errorClass=error?.code||error?.name||"unknown";log("Sync failed: "+result.errorClass);process.exitCode=1}
finally{result.finishedAt=new Date().toISOString();await mkdir(".sync-status",{recursive:true});await writeFile(".sync-status/status.json",JSON.stringify(result,null,2));}
