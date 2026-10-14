export const STATES=Object.freeze(["draft","submitted","approved","rejected"]);
export function computeGross({payType,rateCents,regularHours,overtimeHours=0,bonusCents=0}){
 if(!["hourly","salary"].includes(payType)||![rateCents,bonusCents].every(Number.isSafeInteger)||rateCents<0||bonusCents<0||rateCents>100000000||bonusCents>100000000)throw Error("Invalid compensation");
 if(![regularHours,overtimeHours].every(n=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=744))throw Error("Invalid hours");
 const total=payType==="salary"?rateCents+bonusCents:Math.round(regularHours*rateCents)+Math.round(overtimeHours*rateCents*1.5)+bonusCents;
 if(!Number.isSafeInteger(total)||total>200000000)throw Error("Gross pay out of range");
 return total;
}
export function canTransition(from,to){return ({draft:["submitted"],submitted:["approved","rejected"],rejected:["draft"],approved:[]}[from]||[]).includes(to);}
export function validPeriod(from,to){return /^\d{4}-\d{2}-\d{2}$/.test(from)&&/^\d{4}-\d{2}-\d{2}$/.test(to)&&from<=to&&Number.isFinite(Date.parse(from))&&Number.isFinite(Date.parse(to));}
