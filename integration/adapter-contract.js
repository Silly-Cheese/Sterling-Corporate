// No live access is granted by this contract. All cross-project integration is OFF until verified.
export const ADAPTERS=Object.freeze({
 motors:{projectId:"sterling-motors",staffCollection:"users",staffActive:"isStaff == true && status == active",repo:"Silly-Cheese/sterling-motors"},
 mutual:{projectId:"sterling-mutual-insurance",staffCollection:"staff",staffActive:"status == active",repo:"Silly-Cheese/Sterling-Mutual-Insurance"}
});
export function mapStaffRecord(company,uid,doc){
 if(!ADAPTERS[company])throw Error("Unsupported subsidiary");
 if(!uid||typeof uid!=="string"||!doc||typeof doc!=="object")throw Error("Invalid personnel input");
 const active=company==="motors"?doc.isStaff===true&&doc.status==="active":doc.status==="active";
 return {projectId:ADAPTERS[company].projectId,uid,displayName:String(doc.displayName||doc.name||"").slice(0,120),
  jobTitle:String(doc.title||doc.role||"").slice(0,100),active};
}
export function integrationHealth(s){return s?.verified===true&&s?.permissionTested===true&&s?.lastSyncSucceeded===true?"verified":"not-verified";}
