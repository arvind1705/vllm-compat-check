/** All memory quantities are GiB. Measurements replace estimates, never add to them. */
export function planDeployment(instance, slots) {
 const deployments=slots.map(s=>{
  const weights=s.weights;
  const kv=s.kvOverride??(2*s.model.layers*s.model.kvHeads*s.model.headDim*s.kvBytes*s.context*s.seq/2**30);
  const required=s.measuredTotal??weights+kv+s.overhead;
  const budget=instance.vram*s.util;
  return {...s,weights,kv,required,budget,headroom:budget-required,exceedsContext:s.context>s.model.maxContext};
 });
 const allocation=deployments.reduce((n,s)=>n+s.budget,0);
 const host=instance.os+deployments.reduce((n,s)=>n+s.hostRuntime,0);
 const peak=host+(instance.parallelLoad?deployments.reduce((n,s)=>n+s.staging,0):Math.max(0,...deployments.map(s=>s.staging)));
 const reasons=[];
 if(allocation>instance.vram-instance.reserve)reasons.push('Container allocations exceed GPU capacity after the safety reserve.');
 if(deployments.some(s=>s.headroom<0))reasons.push('At least one model exceeds its container GPU budget.');
 if(deployments.some(s=>s.exceedsContext))reasons.push('Requested context exceeds a model context limit.');
 if(peak>instance.ram)reasons.push('Estimated host startup peak exceeds host RAM.');
 return {deployments,allocation,host,peak,reasons,ok:reasons.length===0};
}
