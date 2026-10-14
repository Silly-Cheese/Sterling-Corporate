import {doc,setDoc,serverTimestamp,collection,getDocs,query,limit} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
export function mountLinkReview({corporateDb,getCorporateUser,getIdentityCandidates}){
 const root=document.getElementById("linkReview");if(!root)return;
 root.innerHTML='<h2>Corporate employee association requests</h2><p class="muted">A verified subsidiary session can nominate an existing Corporate employee profile for reconciliation. This creates a pending record only and does not grant account access or merge employees.</p><div class="toolbar"><label class="field">Corporate employee<select id="linkEmployee" class="editor-select"></select></label><label class="field">Verified subsidiary account<select id="linkIdentity" class="editor-select"></select></label><button class="btn primary" id="requestLink" type="button">Save review request</button><button class="btn" id="reloadLinks" type="button">Refresh</button></div><div id="linkStatus" role="status" class="notice">Verify an active staff account in Integration Manager first.</div><div id="linkList" class="list"></div>';
 const $=id=>document.getElementById(id);
 let employees=[];
 const option=(value,label)=>{const el=document.createElement("option");el.value=value;el.textContent=label;return el};
 function populate(){
  $("linkEmployee").replaceChildren(option("","Select Corporate HR record"),...employees.map(e=>option(e.id,e.displayName+" • "+e.subsidiary)));
  $("linkIdentity").replaceChildren(option("","Select verified account"),...getIdentityCandidates().map(x=>option(x.key,x.projectId+" • "+x.displayName)));
 }
 async function refresh(){
  const [staff,links]=await Promise.all([getDocs(query(collection(corporateDb,"corporateEmployees"),limit(100))),getDocs(query(collection(corporateDb,"employeeIdentityLinks"),limit(100)))]);
  employees=staff.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.displayName.localeCompare(b.displayName));
  populate();
  const list=$("linkList");list.replaceChildren();
  for(const d of links.docs){
   const record=d.data(),item=document.createElement("div");item.className="panel";
   const employee=employees.find(e=>e.id===record.employeeId)?.displayName||"Unloaded employee";
   item.textContent=employee+" • "+record.projectId+" • "+record.status+" (no permissions granted)";
   list.append(item);
  }
  if(links.empty)list.textContent="No pending Corporate identity review requests.";
 }
 $("requestLink").onclick=async()=>{
  const employeeId=$("linkEmployee").value;
  const identity=getIdentityCandidates().find(x=>x.key===$("linkIdentity").value);
  if(!employeeId||!identity||!employees.some(x=>x.id===employeeId)){$("linkStatus").textContent="Choose a Corporate employee and currently verified subsidiary account.";return}
  const user=getCorporateUser();if(!user){$("linkStatus").textContent="You must be signed into Corporate.";return}
  try{
   const id=identity.projectId+"_"+identity.uid;
   await setDoc(doc(corporateDb,"employeeIdentityLinks",id),{
    employeeId,projectId:identity.projectId,subsidiaryUid:identity.uid,status:"pending-review",
    requestedBy:user.uid,createdAt:serverTimestamp()
   });
   $("linkStatus").textContent="Pending review request saved. This is not an approved identity link or permission grant.";
   await refresh();
  }catch(e){$("linkStatus").textContent="Request failed: "+(e.code||e.message)}
 };
 $("reloadLinks").onclick=()=>refresh().catch(e=>{$("linkStatus").textContent=e.code||e.message});
 return {refresh,populate};
}
