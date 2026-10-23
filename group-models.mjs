// Upstream display title + developer + total size identify a model across quantizers.
export function groupModels(rows){
 const groups=new Map();
 for(const row of rows){
  const key=[row.provider,row.title||row.base,row.parameters].map(v=>String(v??'').trim().toLowerCase()).join('|');
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(row);
 }
 return [...groups.values()].map(variants=>{
  variants.sort((a,b)=>a.minimumGB-b.minimumGB||a.checkpoint.localeCompare(b.checkpoint));
  return {...variants[0],variants,precisions:[...new Set(variants.map(r=>r.precision.toUpperCase()))]};
 });
}
