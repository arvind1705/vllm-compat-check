export function modelScore(model,scores){
 const options=model.variants??[model];
 // The displayed memory uses the first (lowest-memory) checkpoint.
 const exact=scores[String(options[0]?.checkpoint??'').toLowerCase()];
 if(exact&&Number.isFinite(exact.indices?.intelligence))return exact;
 // A deliberate base-reference mapping may be shared, never an exact quantized score.
 for(const variant of options){const score=scores[String(variant.checkpoint).toLowerCase()];if(score?.scope==='base'&&Number.isFinite(score.indices?.intelligence))return score}
 return null;
}
