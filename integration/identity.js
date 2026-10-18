// Pure identity-linking primitives. No Firebase calls, side effects or account merges.
export const ALLOWED_PROJECTS=Object.freeze(["sterling-motors","sterling-mutual-insurance","sterling-payroll-5d200"]);
export function validIdentityRef(ref){
 return !!ref && typeof ref==="object" && ALLOWED_PROJECTS.includes(ref.projectId) && typeof ref.uid==="string" && /^[a-zA-Z0-9_-]{1,128}$/.test(ref.uid);
}
export function identityKey(ref){
 if(!validIdentityRef(ref)) throw new Error("Invalid subsidiary identity reference");
 return ref.projectId+":"+ref.uid;
}
export function candidateLink(left,right,evidence){
 if(!validIdentityRef(left)||!validIdentityRef(right)) throw new Error("Invalid identity reference");
 if(identityKey(left)===identityKey(right)) throw new Error("Cannot link an account to itself");
 if(!evidence || evidence.verified!==true || !["dual-authenticated","reviewed-admin-proof"].includes(evidence.method))
  return {status:"review-required",left:identityKey(left),right:identityKey(right)};
 return {status:"verified-candidate",left:identityKey(left),right:identityKey(right),evidenceMethod:evidence.method};
}
// Verified candidate is NOT a persisted link. Backend authorization and unique mapping checks remain required.
