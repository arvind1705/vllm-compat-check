import {under50,isTextGeneration} from './catalog-policy.mjs?v=2';
import {precisionEligible} from './precision-policy.mjs?v=2';
import {screenFit} from './fit-screen.mjs?v=2';
import {latestModelFilter} from './latest-models.mjs?v=2';
import {capacity,contexts} from './capacity.mjs?v=2';

// Qwen log cache density is an illustrative cross-model proxy, not a measurement
// of these checkpoints. Recipe minima already include a coarse runtime allowance.
export function estimateConcurrency(row,model,hw,context){
 if(!Number.isFinite(row.maxContext)||row.maxContext<context)return {reason:'Context unsupported'};
 if(model&&String(row.precision).toLowerCase()==='bf16'){
  const c=capacity(model,hw,{util:.95,overhead:4.1})[contexts.indexOf(context)];
  return {count:c.concurrency,method:'architecture',reason:c.reason,weights:c.weights,budget:c.budget,perRequest:c.perRequest};
 }
 const cacheGiB=Math.max(0,hw.vram-4-row.minimumGB*1e9/2**30);
 return {count:Math.floor(cacheGiB*(301115/11.44)/context),method:'qwen proxy',cacheGiB,cacheTokens:Math.floor(cacheGiB*(301115/11.44))};
}
export function recommendations(catalog,models,scores,hw,context){
 const latest=latestModelFilter([...catalog.filter(under50),...models.filter(m=>m.params<50)]);
 const seen=new Set();
 const eligible=catalog.filter(r=>!/(?:^|\/)gemma[-_ ]4[-_ ]e2b(?:[-_ ]|$)/i.test(r.checkpoint||'')&&r.policy==='included'&&!/diffusion|translat/i.test([r.checkpoint,r.title,r.base].join(' '))&&under50(r)&&isTextGeneration(r)&&latest(r)&&precisionEligible(r.precision,hw)&&Number.isFinite(r.maxContext)&&r.maxContext>=context&&screenFit(r,hw,4).fits)
  .filter(r=>{const key=r.checkpoint.toLowerCase()+'|'+r.precision.toLowerCase();if(seen.has(key))return false;seen.add(key);return true})
  .map(r=>{
   const score=scores[r.checkpoint.toLowerCase()];
   const model=models.find(m=>m.id.toLowerCase()===r.checkpoint.toLowerCase());
   const estimates=Object.fromEntries([65536,131072].map(ctx=>[ctx,estimateConcurrency(r,model,hw,ctx)]));
   return {row:r,score:Number.isFinite(score?.indices?.intelligence)?score:null,estimates};
  }).filter(x=>[context,131072].every(ctx=>!x.estimates[ctx].reason&&x.estimates[ctx].count>0));
 // Group only publisher copies with the same checkpoint basename, precision,
 // memory/context metadata and score. Different checkpoints remain accessible.
 const groups=new Map();
 for(const item of eligible){
  const r=item.row, basename=r.checkpoint.split('/').pop().toLowerCase();
  const key=JSON.stringify([r.provider.toLowerCase(),basename,r.precision.toLowerCase(),r.minimumGB,r.maxContext,item.score?.indices.intelligence??null]);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(item);
 }
 return [...groups.values()].map(group=>{
  group.sort((a,b)=>{
   const original=x=>x.row.checkpoint.split('/')[0].toLowerCase()===x.row.provider.toLowerCase();
   return Number(original(b))-Number(original(a))||a.row.checkpoint.localeCompare(b.row.checkpoint);
  });
  return {...group[0],alternatives:group.slice(1).map(x=>x.row)};
 }).sort((a,b)=>(b.score?.indices.intelligence??-1)-(a.score?.indices.intelligence??-1)||a.row.minimumGB-b.row.minimumGB||a.row.checkpoint.localeCompare(b.row.checkpoint));
}

export function sortRecommendations(rows,order){
 return [...rows].sort((a,b)=>{
  const byScore=()=>(b.score?.indices.intelligence??-1)-(a.score?.indices.intelligence??-1);
  const delta=order==='name'?a.row.checkpoint.localeCompare(b.row.checkpoint):order==='memory'?a.row.minimumGB-b.row.minimumGB:order==='concurrency'?b.estimates[131072].count-a.estimates[131072].count:byScore();
  return delta||byScore()||a.row.checkpoint.localeCompare(b.row.checkpoint);
 });
}
