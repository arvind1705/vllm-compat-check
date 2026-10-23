export const manualStorageKey='fitcheck-manual-aa-v1';
export function scoreKey(model){return [model.provider,model.title||model.base,model.parameters].map(v=>String(v??'').trim().toLowerCase()).join('|');}
export function validateManualScores(value){
 if(!value||value.schemaVersion!==1||!value.scores||typeof value.scores!=='object'||Array.isArray(value.scores))throw Error('Invalid score backup format.');
 const scores=Object.create(null);
 for(const [key,row] of Object.entries(value.scores)){
  if(!key||key.length>500||!row||typeof row.score!=='number'||!Number.isFinite(row.score)||row.score<0||row.score>100)throw Error('Scores must be numbers between 0 and 100.');
  if(typeof row.updated!=='string'||Number.isNaN(Date.parse(row.updated)))throw Error('Invalid score date.');
  if(typeof row.note!=='string'||row.note.length>1000)throw Error('Invalid score note.');
  scores[key]={score:row.score,updated:row.updated,note:row.note};
 }
 return scores;
}
export function manualEnvelope(scores){return {schemaVersion:1,source:'Fitcheck manual AA references',scores};}
