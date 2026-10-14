import {createHash} from "node:crypto";
export function importKey(projectId,uid){
 if(!["sterling-motors","sterling-mutual-insurance"].includes(projectId)||!uid||typeof uid!=="string")throw Error("Invalid source identity");
 return createHash("sha256").update(projectId+"\u0000"+uid).digest("hex");
}
export function sourceProfile(record,runAt){
 return {projectId:record.projectId,sourceUid:record.uid,displayName:record.displayName||"Unnamed staff member",
 title:record.role||"Staff member",active:record.active===true,
 sourceHash:record.sha256||"",source:"github-readonly-observer",lastSeenAt:runAt};
}
export async function importObserved(db,records,runAt){
 const stats={created:0,updated:0,unchanged:0,conflicts:0};
 for(const record of records){
  const id=importKey(record.projectId,record.uid);
  const ref=db.collection("subsidiaryStaffSnapshots").doc(id);
  const current=await ref.get();
  if(current.exists){
   const existing=current.data();
   if(existing.projectId!==record.projectId||existing.sourceUid!==record.uid){stats.conflicts++;continue}
   if(existing.sourceHash===record.sha256){stats.unchanged++;continue}
  }
  await ref.set(sourceProfile(record,runAt));
  if(current.exists)stats.updated++;else stats.created++;
 }
 return stats;
}
