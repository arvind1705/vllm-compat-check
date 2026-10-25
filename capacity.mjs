export const contexts=[65536,98304,131072];
export function capacity(model,hw,{util=.85,overhead=3,kvMargin=.15,bytes=2}={}){
 const weights=model.params*1e9*bytes/2**30;
 const budget=hw.vram*util;
 const hostPeak=3+weights; // Measured idle host baseline example + full checkpoint-size staging envelope.
 return contexts.map(context=>{
  const kv=2*model.layers*model.kvHeads*model.headDim*2*context/2**30;
  const perRequest=kv*(1+kvMargin);
  const concurrency=Math.max(0,Math.floor((budget-weights-overhead)/perRequest));
  const reason=hw.gpuCount>1?'Multi-GPU precision / sharding unverified':context>model.maxContext?'Context unsupported':hostPeak>hw.ram?'Host startup risk':concurrency<1?'Exceeds GPU budget':null;
  return {context,weights,budget,kv,perRequest,hostPeak,concurrency:reason?0:concurrency,reason};
 });
}
