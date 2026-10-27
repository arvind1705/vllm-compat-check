// Recognize versioned product families explicitly. Keep unrecognized names rather
// than guessing that a parameter count, release date or fine-tune is a version.
const families = [
 ['llama', /(?:^|\/)\s*(?:meta-)?llama[-_ ](\d+(?:\.\d+)?)(?=[-_ ])/i],
 ['gemma', /(?:^|\/)gemma[-_ ](\d+(?:\.\d+)?)(?=[-_ ])/i],
 ['phi', /(?:^|\/)phi[-_ ](\d+(?:\.\d+)?)(?=$|[-_ ])/i],
 ['granite', /(?:^|\/)granite[-_ ](\d+(?:\.\d+)?)(?=[-_ ])/i],
 ['smollm', /(?:^|\/)smollm[-_ ]?(\d+(?:\.\d+)?)(?=[-_ ])/i],
 ['qwen', /(?:^|\/)qwen[-_ ]?(\d+(?:\.\d+)?)(?=[-_ ])/i],
 ['mistral-small', /(?:^|\/)mistral[-_ ]small[-_ ](\d+(?:\.\d+)?)(?=[-_ ])/i],
 ['ministral', /(?:^|\/)ministral[-_ ](\d+(?:\.\d+)?)(?=[-_ ])/i],
 ['lfm', /(?:^|\/)lfm[-_ ]?(\d+(?:\.\d+)?)(?=[-_ ])/i],
];
function identity(row) {
 // Checkpoint identity is more specific than recipe titles, which can refer to
 // a different size or version in an upstream multi-variant recipe.
 const names = [row.checkpoint, row.id, row.hf_id, row.name, row.title].filter(Boolean);
 for (const name of names) {
  if (/(?:^|\/)ministral[-_ ]\d+(?:\.\d+)?b(?:[-_ ]|$)/i.test(String(name))) return {family:'ministral',version:[0]};
  for (const [family, re] of families) {
  const match=String(name).match(re);
  if (match) {
   const version=match[1].split('.').map(Number);
   return {family,version};
  }
  }
 }
 return null;
}
function compareVersions(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d}return 0}
export function latestModelFilter(rows){
 const latest=new Map();
 for(const row of rows){const id=identity(row);if(id&&(!latest.has(id.family)||compareVersions(id.version,latest.get(id.family))>0))latest.set(id.family,id.version)}
 return row=>{const id=identity(row);return !id||!latest.has(id.family)||compareVersions(id.version,latest.get(id.family))===0};
}
