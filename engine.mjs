export function estimate(m,c){
 const weights=m.params*1e9*c.precision/2**30;
 const kv=2*m.layers*m.kvHeads*m.headDim*2*c.context*c.seq/2**30;
 const total=weights+kv+c.overhead, budget=c.vram*c.util;
 const host=c.base+c.os+Math.max(1,weights*c.loading);
 const status=total>budget||c.context>m.maxContext?'no':host>c.ram?'risk':'candidate';
 return {weights,kv,total,budget,host,status};
}
