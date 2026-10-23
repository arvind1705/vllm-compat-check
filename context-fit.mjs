import {screenFit} from './fit-screen.mjs';
export const minimumContext=65536;
export function contextFit(row,hw,models){
 const recipe=screenFit(row,hw);
 if(!Number.isFinite(row.maxContext)||row.maxContext<minimumContext)return {...recipe,status:'excluded',reason:'Native context below 64K or unknown'};
 if(!recipe.fits)return {...recipe,status:'excluded',reason:'Insufficient recipe memory headroom'};
 const model=models.find(m=>m.id.toLowerCase()===row.checkpoint.toLowerCase());
 if(!model||row.precision!=='bf16')return {...recipe,status:'unknown',reason:'64K cache/residency needs profiling'};
 const weights=model.params*1e9*2/2**30;
 const kv=2*model.layers*model.kvHeads*model.headDim*2*minimumContext/2**30;
 // Keep the explicit free reserve; runtime + full 64K cache are inside the budget.
 const required=Math.max(recipe.minimum,weights+3+kv*1.15);
 return {...recipe,required,status:required<=recipe.budget?'candidate':'excluded',reason:required<=recipe.budget?'Calculated for one 64K request':'64K memory estimate exceeds budget'};
}
