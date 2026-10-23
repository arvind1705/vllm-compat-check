export function totalBillions(value){
 const match=String(value??'').trim().match(/^(\d+(?:\.\d+)?)\s*([BM])$/i);
 return match?Number(match[1])*(match[2].toUpperCase()==='M'?.001:1):null;
}
export function under50(row){const n=totalBillions(row.parameters);return n!==null&&n<50;}
// Require explicit upstream text support; ambiguous multimodal-only recipes stay out.
export function isTextGeneration(row){
 const id=String(row.checkpoint??row.id??'').toLowerCase();
 return Array.isArray(row.tasks)&&row.tasks.includes('text')&&!/(whisper|embedding|embed-|rerank|speech|\btts\b|\basr\b|transcrib|ocr)/i.test(id);
}
