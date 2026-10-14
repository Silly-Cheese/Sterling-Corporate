import {initializeApp,getApps} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,signOut,setPersistence,inMemoryPersistence} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {getFirestore,doc,getDoc} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {ADAPTERS,mapStaffRecord} from "./adapter-contract.js";
// Firebase WEB configurations are public identifiers, not administrator secrets.
// Every read still requires a separately authenticated subsidiary session and subsidiary Firestore rules.
const CONFIGS={
 motors:{apiKey:"AIzaSyBNEKMbXLAHoGRC2sg2mbiBlkIAqbJyT-U",authDomain:"sterling-motors.firebaseapp.com",projectId:"sterling-motors",appId:"1:919793587834:web:3f79f498e9f3523a960dc3"},
 mutual:{apiKey:"AIzaSyCElkgTv9krB-cFleFV5ySuS_F45cVqao0",authDomain:"sterling-mutual-insurance.firebaseapp.com",projectId:"sterling-mutual-insurance",appId:"1:863681721493:web:fbe3ee5909599f146d179c"}
};
export function mountIntegrationReadiness(){
 const root=document.getElementById("integrationReadiness");if(!root)return;
 root.replaceChildren();
 const intro=document.createElement("p");intro.className="muted";intro.textContent="Verify access to your own existing subsidiary staff profile. No record is copied, and no Corporate identity link is created.";root.append(intro);
 const sessions=new Map();
 for(const [key,adapter] of Object.entries(ADAPTERS)){
  const panel=document.createElement("article");panel.className="panel";panel.style.marginTop="12px";
  const heading=document.createElement("h3");heading.textContent=key==="motors"?"Sterling Motors":"Sterling Mutual Insurance";
  const detail=document.createElement("p");detail.className="muted";detail.textContent="Firebase: "+adapter.projectId+" • Personnel collection: "+adapter.staffCollection;
  const status=document.createElement("div");status.className="notice";status.setAttribute("role","status");status.textContent="Not verified — no active connection";
  const form=document.createElement("form");form.className="toolbar";form.autocomplete="off";
  const emailLabel=document.createElement("label");emailLabel.className="field";emailLabel.textContent="Subsidiary email";
  const email=document.createElement("input");email.type="email";email.required=true;email.autocomplete="username";emailLabel.append(email);
  const passLabel=document.createElement("label");passLabel.className="field";passLabel.textContent="Subsidiary password";
  const pass=document.createElement("input");pass.type="password";pass.required=true;pass.autocomplete="current-password";passLabel.append(pass);
  const btn=document.createElement("button");btn.type="submit";btn.className="btn primary";btn.textContent="Verify my staff access";
  const disconnect=document.createElement("button");disconnect.type="button";disconnect.className="btn";disconnect.textContent="Disconnect";
  form.append(emailLabel,passLabel,btn,disconnect);
  form.addEventListener("submit",async event=>{
   event.preventDefault();btn.disabled=true;status.textContent="Authenticating and testing existing staff permissions…";
   try{
    const appName="sterling-readonly-"+key;
    const app=getApps().find(a=>a.name===appName)||initializeApp(CONFIGS[key],appName);
    const auth=getAuth(app);await setPersistence(auth,inMemoryPersistence);const credential=await signInWithEmailAndPassword(auth,email.value,pass.value);
    pass.value="";sessions.set(key,auth);
    const db=getFirestore(app);
    const self=await getDoc(doc(db,adapter.staffCollection,credential.user.uid));
    if(!self.exists())throw Error("No staff record associated with this Firebase account");
    const person=mapStaffRecord(key,self.id,self.data());
    if(!person.active)throw Error("Your staff record is not active");
    status.textContent="Verified: own active staff record readable. No employee lists accessed, copied or merged.";
   }catch(e){pass.value="";status.textContent="Connection NOT verified: "+(e.code||e.message)+". Check this project's account and permissions.";const auth=sessions.get(key);if(auth){await signOut(auth).catch(()=>{});sessions.delete(key)}}
   finally{btn.disabled=false;}
  });
  disconnect.addEventListener("click",async()=>{
   const auth=sessions.get(key);if(auth){await signOut(auth).catch(()=>{});sessions.delete(key)}
   pass.value="";email.value="";status.textContent="Disconnected. No data was stored in Corporate.";
  });
  const steps=document.createElement("p");steps.className="inline-note";steps.textContent="This verification checks only your own account and does not enable corporate synchronization.";
  panel.append(heading,detail,status,form,steps);root.append(panel);
 }
 const caution=document.createElement("div");caution.className="notice";caution.textContent="Separate Firebase projects keep separate login sessions. Authentication uses Firebase directly for the selected subsidiary; no passwords are saved to Firestore. Do not use another employee's credentials.";root.append(caution);
}
