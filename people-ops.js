import {collection,getDocs,addDoc,doc,updateDoc,serverTimestamp,query,limit} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
export function mountPeopleOps({db,getUser,showMessage}){
 const root=document.getElementById("peopleOps");
 root.innerHTML=`<div class="eyebrow">PHASE 2 / PEOPLE OPERATIONS</div><h2>Positions, Reporting & Simulated Payroll</h2>
 <p class="muted">Create multiple subsidiary positions per employee, assign a reporting manager and manage compensation. These are Corporate records only; no subsidiary accounts or payments are affected.</p>
 <form id="positionForm"><div class="toolbar">
 <label class="field">Employee<select id="posEmployee" required class="editor-select"></select></label>
 <label class="field">Company<select id="posCompany" class="editor-select"><option value="corporate">Sterling Corporate</option><option value="motors">Sterling Motors</option><option value="mutual">Sterling Mutual</option></select></label>
 <label class="field">Title<input id="posTitle" required maxlength="100"></label>
 <label class="field">Manager<select id="posManager" class="editor-select"></select></label>
 <label class="field">Pay type<select id="posPayType" class="editor-select"><option value="hourly">Hourly</option><option value="salary">Salary per pay period</option></select></label>
 <label class="field">Rate ($)<input id="posRate" type="number" min="0" max="1000000" step=".01" required></label>
 </div><button class="btn primary" type="submit">Add position</button></form>
 <div class="notice" id="posNotice" role="status">Positions are separate from verified Firebase identities.</div>
 <div class="toolbar"><label class="field">Employee positions<select id="posFilter" class="editor-select"></select></label><button class="btn" type="button" id="refreshPositions">Refresh</button></div>
 <div class="list" id="positionsList"></div>
 <hr style="border:0;border-top:1px solid #2a3545;margin:28px 0">
 <h2>Simulated Payroll Calculator</h2><p class="muted">Select an active position and enter approved hours, overtime and bonuses. A saved pay-run is marked simulated; it cannot disburse funds.</p>
 <form id="payForm"><div class="toolbar"><label class="field">Position<select id="payPosition" class="editor-select" required></select></label>
 <label class="field">Regular hours<input id="payHours" type="number" min="0" max="744" step=".25" value="80" required></label>
 <label class="field">Overtime hours<input id="payOvertime" type="number" min="0" max="744" step=".25" value="0" required></label>
 <label class="field">Bonus ($)<input id="payBonus" type="number" min="0" max="1000000" step=".01" value="0" required></label></div>
 <div class="notice" id="payPreview">Select a position to calculate sample gross pay.</div>
 <button class="btn primary" type="submit">Save simulated pay record</button></form>
 <h2 style="margin-top:24px">Recent simulated pay records</h2><div id="payRecords" class="list"></div>
 <h2 style="margin-top:24px">Personnel event history</h2><div id="peopleHistory" class="list"></div>`;
 const $=id=>document.getElementById(id);let employees=[],positions=[],payRecords=[],history=[];
 const option=(value,label)=>{let o=document.createElement("option");o.value=value;o.textContent=label;return o};
 const fill=(element,items,placeholder)=>{element.replaceChildren(option("",placeholder),...items.map(x=>option(x.id,x.label)))};
 const money=c=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(c/100);
 const cents=n=>Math.round(Number(n)*100);
 const name=id=>employees.find(x=>x.id===id)?.displayName||"Unknown employee";
 const render=()=>{
  const employeeOptions=employees.map(x=>({id:x.id,label:x.displayName+" — "+x.subsidiary}));
  fill($("posEmployee"),employeeOptions,"Select employee");fill($("posManager"),employees.map(x=>({id:x.id,label:x.displayName})),"No manager");
  fill($("posFilter"),employeeOptions,"All employees");
  fill($("payPosition"),positions.filter(x=>x.status==="active").map(x=>({id:x.id,label:name(x.employeeId)+" — "+x.title+" ("+x.subsidiary+")"})),"Select active position");
  drawPositions();drawRecords();drawHistory();preview();
 };
 const drawPositions=()=>{
  const root=$("positionsList");root.replaceChildren();
  const id=$("posFilter").value,subset=positions.filter(p=>!id||p.employeeId===id);
  if(!subset.length){root.textContent="No position records yet.";return}
  for(const p of subset){
   let box=document.createElement("article");box.className="panel company";
   let text=document.createElement("div"),title=document.createElement("h3"),detail=document.createElement("p");
   title.textContent=name(p.employeeId)+" — "+p.title;
   detail.textContent=p.subsidiary+" • "+(p.managerId?"Reports to "+name(p.managerId):"No assigned manager")+" • "+(p.payType==="hourly"?money(p.rateCents)+"/hr":money(p.rateCents)+"/period");
   text.append(title,detail);box.append(text);
   const status=document.createElement("select");status.className="editor-select";status.setAttribute("aria-label","Position status");
   for(const value of ["active","inactive"])status.append(option(value,value));status.value=p.status;
   status.onchange=async()=>{try{await updateDoc(doc(db,"corporatePositions",p.id),{status:status.value,updatedAt:serverTimestamp()});await addHistory("position-status",p.employeeId,p.id+" → "+status.value);showMessage("Position updated.");await refresh()}catch(e){status.value=p.status;showMessage(e.message)}};
   box.append(status);root.append(box);
  }
 };
 const drawRecords=()=>{const el=$("payRecords");el.replaceChildren();if(!payRecords.length){el.textContent="No simulated payroll records yet.";return}for(const p of payRecords.slice(0,30)){const box=document.createElement("div");box.className="panel";box.textContent=name(p.employeeId)+" • "+p.positionTitle+" • "+money(p.grossCents)+" gross • SIMULATED / "+p.status;el.append(box)}};
 const drawHistory=()=>{const el=$("peopleHistory");el.replaceChildren();if(!history.length){el.textContent="No personnel events yet.";return}for(const e of history.slice(0,30)){const box=document.createElement("div");box.className="panel";box.textContent=e.kind+" • "+name(e.employeeId)+" • "+e.detail;el.append(box)}};
 async function addHistory(kind,employeeId,detail){await addDoc(collection(db,"corporatePeopleEvents"),{kind,employeeId,detail,actorUid:getUser().uid,createdAt:serverTimestamp()})}
 const payroll=()=>{
  const p=positions.find(x=>x.id===$("payPosition").value);if(!p)return null;
  const h=Number($("payHours").value),ot=Number($("payOvertime").value),bonus=Number($("payBonus").value);
  if(![h,ot,bonus].every(Number.isFinite)||h<0||ot<0||bonus<0||h>744||ot>744||bonus>1000000)return null;
  const grossCents=p.payType==="salary"?p.rateCents+cents(bonus):Math.round(p.rateCents*h)+Math.round(p.rateCents*1.5*ot)+cents(bonus);
  return {p,h,ot,bonusCents:cents(bonus),grossCents};
 };
 const preview=()=>{const x=payroll();$("payPreview").textContent=x?"SIMULATED gross pay: "+money(x.grossCents)+(x.p.payType==="salary"?" (salary per period; hours informational)":" (overtime example at 1.5×)"):"Choose a position and valid amounts.";};
 for(const k of ["payPosition","payHours","payOvertime","payBonus"])$(k).addEventListener("input",preview);
 $("posFilter").onchange=drawPositions;
 $("refreshPositions").onclick=()=>refresh().catch(e=>showMessage("Refresh failed: "+e.message));
 $("positionForm").onsubmit=async ev=>{
  ev.preventDefault();const employeeId=$("posEmployee").value,managerId=$("posManager").value,rate=cents($("posRate").value);
  if(!employeeId||!employees.some(x=>x.id===employeeId)||managerId===employeeId||!Number.isInteger(rate)||rate<0||rate>100000000)return showMessage("Check employee, manager and pay rate.");
  try{
   const record={employeeId,managerId,subsidiary:$("posCompany").value,title:$("posTitle").value.trim(),payType:$("posPayType").value,rateCents:rate,status:"active",createdBy:getUser().uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
   const docRef=await addDoc(collection(db,"corporatePositions"),record);await addHistory("position-created",employeeId,docRef.id);
   showMessage("Position created.");$("positionForm").reset();await refresh();
  }catch(e){showMessage("Could not add position: "+e.message)}
 };
 $("payForm").onsubmit=async ev=>{
  ev.preventDefault();const x=payroll();if(!x)return showMessage("Select a position and valid hours.");
  if(x.p.status!=="active")return showMessage("Position is not active.");
  try{
   await addDoc(collection(db,"simulatedPayRecords"),{employeeId:x.p.employeeId,positionId:x.p.id,positionTitle:x.p.title,subsidiary:x.p.subsidiary,payType:x.p.payType,rateCents:x.p.rateCents,regularHours:x.h,overtimeHours:x.ot,bonusCents:x.bonusCents,grossCents:x.grossCents,status:"simulated",createdBy:getUser().uid,createdAt:serverTimestamp()});
   showMessage("SIMULATED payroll entry saved. No funds were transferred.");await refresh();
  }catch(e){showMessage("Payroll save failed: "+e.message)}
 };
 async function refresh(){
  const [a,b,c,d]=await Promise.all(["corporateEmployees","corporatePositions","simulatedPayRecords","corporatePeopleEvents"].map(k=>getDocs(query(collection(db,k),limit(100)))));
  employees=a.docs.map(x=>({id:x.id,...x.data()}));positions=b.docs.map(x=>({id:x.id,...x.data()}));
  payRecords=c.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  history=d.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  render();$("posNotice").textContent=positions.length+" Corporate positions loaded (maximum 100).";
 }
 return {refresh};
}
