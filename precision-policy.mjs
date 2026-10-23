export function precisionEligible(precision,hardware){
 const p=String(precision).toLowerCase();
 if(p==='nvfp4')return hardware.nativeNVFP4===true;
 return p==='bf16'||p==='fp8';
}
