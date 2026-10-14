import {collection,addDoc,getDocs,query,limit,doc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {computeGross,canTransition,validPeriod} from "./payroll/core.js";
import {ADAPTERS} from "./integration/adapter-contract.js";
export function mountPhase3({db,user,notify}){
 const root=document.getElementById("phase3");
 root.innerHTML=`<div class="eyebrow">PHASE 3 • WORKFORCE & INTEGRATIONS</div>
 <h2>Pay periods & timesheet approvals</h2><p class="muted">All payments are simulated. Each timesheet requires manual submission and review. This is a Corporate-only record; subsidiary timekeeping integrations are not connected.</p>
 <form id="periodForm" class="toolbar"><label class="field">Period start<input type="date" id="periodStart" required></label><label class="field">Period end<input type="date" id="periodEnd" required></label><button class="btn primary" type="submit">Create pay period</button></form>
 <div id="periodList" class="list"></div>
 <h2 style="margin-top:28px">Timesheet review queue</h2>
 <form id="timeForm" class="toolbar"><label class="field">Employee<select id="timeEmployee" class="editor-select" required></select></label><label class="field">Position<select id="timePosition" class="editor-select" required></select></label><label class="field">Pay period<select id="timePeriod" class="editor-select" required></select></label><label class="field">Regular hours<input id="timeHours" type="number" step=".25" min="0" max="744" required></label><label class="field">Overtime<input id="timeOvertime" type="number" step=".25" min="0" max="744" value="0" required></label><button class="btn primary" type="submit">Save draft timesheet</button></form>
 <div id="timeQueue" class="list"></div>
 <h2 style="margin-top:28px">Subsidiary Integration Manager</h2><p class="muted">Adapters recognize each project's current employee schema. Connectivity and authorization remain unverified until tested from a trusted integration environment. No automatic writeback.</p>
 <div id="adapterList" class="list"></div>
 <div class="notice" id="phase3Status" role="status">No synchronization or payment processing is enabled.</div>`;
 const $=id=>document.getElementById(id);
 let employees=[],positions=[],periods=[],timesheets=[];
 const option=(id,text)=>{const e=document.createElement("option");e.value=id;e.textContent=text;return e};
 const choose=(id,arr,label)=>$(id).replaceChildren(option("",label),...arr.map(x=>option(x.id,x.label)));
 const pName=id=>employees.find(e=>e.id===id)?.displayName||"Unknown employee";
 const status=t=>{notify(t);$("phase3Status").textContent=t};
 const explainError=e=>status("Operation failed: "+(e.code||e.message));
 async function reload(){
  const [a,b,c,d]=await Promise.all(["corporateEmployees","corporatePositions","corporatePayPeriods","corporateTimesheets"].map(n=>getDocs(query(collection(db,n),limit(100)))));
  employees=a.docs.map(x=>({id:x.id,...x.data()}));positions=b.docs.map(x=>({id:x.id,...x.data()}));periods=c.docs.map(x=>({id:x.id,...x.data()}));timesheets=d.docs.map(x=>({id:x.id,...x.data()}));
  draw();
 }
 function draw(){
  choose("timeEmployee",employees.map(e=>({id:e.id,label:e.displayName})),"Select employee");
  choose("timePeriod",periods.map(p=>({id:p.id,label:p.start+" to "+p.end})),"Select pay period");
  choose("timePosition",positions.filter(x=>x.status==="active").map(p=>({id:p.id,label:p.title+" • "+p.subsidiary})),"Select employee position");
  const pl=$("periodList");pl.replaceChildren();
  for(const p of periods){const el=document.createElement("div");el.className="panel";el.textContent=p.start+" — "+p.end+" • "+p.status+" • Simulated";pl.append(el)}
  if(!periods.length)pl.textContent="No pay periods created yet.";
  const queue=$("timeQueue");queue.replaceChildren();
  for(const t of timesheets){
   const wrap=document.createElement("article");wrap.className="panel";
   const h=document.createElement("h3");h.textContent=pName(t.employeeId)+" • "+t.status;wrap.append(h);
   const line=document.createElement("p");line.className="muted";line.textContent=t.regularHours+" regular / "+t.overtimeHours+" overtime hours • Gross example $"+(t.grossCents/100).toFixed(2);wrap.append(line);
   const actions=document.createElement("div");actions.className="actions";
   const next={draft:["submitted"],submitted:["approved","rejected"],rejected:["draft"],approved:[]}[t.status]||[];
   for(const action of next){const btn=document.createElement("button");btn.type="button";btn.className="btn";btn.textContent=action[0].toUpperCase()+action.slice(1);btn.onclick=async()=>{try{if(!canTransition(t.status,action))throw Error("Invalid transition");await updateDoc(doc(db,"corporateTimesheets",t.id),{status:action,updatedAt:serverTimestamp(),lastActor:user().uid});status("Timesheet "+action+".");await reload()}catch(e){explainError(e)}};actions.append(btn)}
   wrap.append(actions);queue.append(wrap);
  }
  if(!timesheets.length)queue.textContent="No Corporate timesheets yet.";
  const list=$("adapterList");list.replaceChildren();
  for(const [name,adapter] of Object.entries(ADAPTERS)){const el=document.createElement("div");el.className="panel company";const t=document.createElement("div"),h=document.createElement("h3"),p=document.createElement("p"),tag=document.createElement("span");h.textContent=name==="motors"?"Sterling Motors":"Sterling Mutual Insurance";p.textContent=adapter.projectId+" • Staff: "+adapter.staffCollection+" • Repository: "+adapter.repo;t.append(h,p);tag.className="tag warn";tag.textContent="Not verified / sync disabled";el.append(t,tag);list.append(el)}
 }
 $("timeEmployee").onchange=()=>{const id=$("timeEmployee").value;choose("timePosition",positions.filter(p=>p.employeeId===id&&p.status==="active").map(p=>({id:p.id,label:p.title+" • "+p.subsidiary})),"Select employee position")};
 $("periodForm").onsubmit=async e=>{e.preventDefault();const start=$("periodStart").value,end=$("periodEnd").value;if(!validPeriod(start,end))return status("Invalid pay period.");
  try{if(periods.some(p=>p.start===start&&p.end===end))throw Error("Pay period already exists");await addDoc(collection(db,"corporatePayPeriods"),{start,end,status:"open",createdBy:user().uid,createdAt:serverTimestamp()});status("Pay period created.");await reload()}catch(err){explainError(err)}};
 $("timeForm").onsubmit=async e=>{e.preventDefault();const employeeId=$("timeEmployee").value,positionId=$("timePosition").value,periodId=$("timePeriod").value;
  const p=positions.find(p=>p.id===positionId&&p.employeeId===employeeId&&p.status==="active");if(!p||!periods.find(x=>x.id===periodId))return status("Select an active employee position and period.");
  const regularHours=Number($("timeHours").value),overtimeHours=Number($("timeOvertime").value);
  try{if(timesheets.some(t=>t.employeeId===employeeId&&t.positionId===positionId&&t.periodId===periodId))throw Error("A timesheet already exists for this assignment and period");
   const grossCents=computeGross({payType:p.payType,rateCents:p.rateCents,regularHours,overtimeHours});
   await addDoc(collection(db,"corporateTimesheets"),{employeeId,positionId,periodId,regularHours,overtimeHours,grossCents,status:"draft",createdBy:user().uid,lastActor:user().uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});status("Draft timesheet saved.");await reload()
  }catch(err){explainError(err)}
 };
 return {reload};
}
