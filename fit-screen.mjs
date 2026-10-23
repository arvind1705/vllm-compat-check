// Upstream minimum already includes an approximate allowance beyond weights.
// Reserve additional free GPU space rather than counting that allowance twice.
export function screenFit(row,hardware,reserveGiB=4){
 const minimum=typeof row.minimumGB==='number'&&row.minimumGB>0?row.minimumGB*1e9/2**30:null;
 const reserve=Math.max(0,reserveGiB);
 const budget=Math.max(0,hardware.vram-reserve);
 return {minimum,reserve,budget,remaining:minimum===null?null:hardware.vram-minimum,fits:!(hardware.gpuCount>1)&&minimum!==null&&minimum<=budget};
}
