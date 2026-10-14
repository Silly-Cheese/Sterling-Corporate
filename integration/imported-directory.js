import {collection,getDocs,query,limit} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
export function mountSubsidiaryDirectory({db}){
 const root=document.getElementById("importedEmployees");if(!root)return null;
 root.className="imported-directory";
 root.innerHTML='<div class="company"><div><div class="eyebrow">AUTOMATED STAFF OBSERVATIONS</div><h2>Subsidiary Employee Directory</h2></div><button id="reloadImportedEmployees" class="btn" type="button">Refresh imported records</button></div><p class="muted">Read-only profiles imported by authorized GitHub Actions. Source accounts and Corporate HR profiles are never changed. Imports may cover only a limited sample until full-scan pagination is implemented.</p><div class="toolbar"><label class="field">Search<input type="search" id="importedSearch" placeholder="Search people, roles or company"></label><label class="field">Company<select id="importedCompany"><option value="all">All subsidiaries</option><option value="sterling-motors">Sterling Motors</option><option value="sterling-mutual-insurance">Sterling Mutual</option></select></label></div><div class="notice" id="importedStatus" role="status">Loading observations…</div><div id="importedList" class="list"></div>';
 const $=id=>root.querySelector("#"+id);
 let records=[];
 const render=()=>{
  const text=$("importedSearch").value.trim().toLowerCase(),company=$("importedCompany").value;
  const filtered=records.filter(r=>(company==="all"||company===r.projectId)&&[r.displayName,r.title,r.projectId].join(" ").toLowerCase().includes(text));
  $("importedList").replaceChildren();
  for(const record of filtered){
   const item=document.createElement("article");item.className="panel company";
   const info=document.createElement("div"),title=document.createElement("h3"),detail=document.createElement("p"),tag=document.createElement("span");
   title.textContent=record.displayName||"Unnamed staff member";
   detail.textContent=(record.title||"Staff member")+" • "+(record.projectId==="sterling-motors"?"Sterling Motors":"Sterling Mutual")+" • Observed "+(record.lastSeenAt||"unknown");
   tag.className="tag "+(record.active?"ok":"warn");tag.textContent=record.active?"Active at last scan":"Inactive at last scan";
   info.append(title,detail);item.append(info,tag);$("importedList").append(item);
  }
  if(!filtered.length)$("importedList").textContent=records.length?"No matching imported employees.":"No imported profiles yet.";
 };
 async function refresh(){
  $("importedStatus").textContent="Loading Corporate snapshot directory…";
  try{
   const snap=await getDocs(query(collection(db,"subsidiaryStaffSnapshots"),limit(100)));
   records=snap.docs.map(d=>d.data()).sort((a,b)=>String(a.displayName||"").localeCompare(String(b.displayName||"")));
   $("importedStatus").textContent=records.length+" read-only profiles loaded (up to 100). Missing people do not imply an inactive account; the current sync samples a limited source window.";
   render();
  }catch(error){$("importedStatus").textContent="Unable to access imported profiles: "+(error.code||error.message)+". Deploy the latest Corporate Firestore rules and confirm administrator access.";}
 }
 $("reloadImportedEmployees").addEventListener("click",refresh);
 $("importedSearch").addEventListener("input",render);
 $("importedCompany").addEventListener("change",render);
 return {refresh};
}
