import {ADAPTERS} from "./integration/adapter-contract.js";
export function mountIntegrationReadiness(){
 const root=document.getElementById("integrationReadiness");
 if(!root)return;
 root.replaceChildren();
 const intro=document.createElement("p");intro.className="muted";intro.textContent="Read-only integration readiness. Configuration discovery is not a live authentication or database connection test.";root.append(intro);
 for(const [key,adapter] of Object.entries(ADAPTERS)){
  const panel=document.createElement("article");panel.className="panel";panel.style.marginTop="12px";
  const heading=document.createElement("h3");heading.textContent=key==="motors"?"Sterling Motors":"Sterling Mutual Insurance";
  const detail=document.createElement("p");detail.className="muted";detail.textContent="Firebase project: "+adapter.projectId+" • Staff collection: "+adapter.staffCollection;
  const status=document.createElement("span");status.className="tag warn";status.textContent="Not connected / sync disabled";
  const steps=document.createElement("p");steps.className="inline-note";steps.textContent="Next gates: verify employee read permissions; obtain source schema samples; confirm per-project auth; test reconciliation; approve a read-only integration.";
  const link=document.createElement("a");link.href="https://github.com/"+adapter.repo;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Review subsidiary source ↗";
  panel.append(heading,detail,status,steps,link);root.append(panel);
 }
 const caution=document.createElement("div");caution.className="notice";caution.textContent="Corporate administrator sign-in alone does not grant access to another Firebase project. No secrets, cross-project UIDs or account data are requested here.";root.append(caution);
}
