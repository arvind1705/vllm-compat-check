import {latestModelFilter} from './latest-models.mjs';
import {under50,isTextGeneration} from './catalog-policy.mjs';
import {hardware} from './hardware.mjs';
import {capacity} from './capacity.mjs';
const root=document.getElementById('recipeCatalog'),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{
const [catalog,curated,aa]=await Promise.all(['data/catalog.json','data/models.json','data/aa-scores.json'].map(p=>fetch(p).then(r=>{if(!r.ok)throw Error(p);return r.json()})));
const latest=latestModelFilter([...catalog.variants.filter(under50),...curated.models.filter(m=>m.params<50)]);
const counts=Object.fromEntries(['included','excluded','review'].map(k=>[k,catalog.variants.filter(r=>r.policy===k).length]));
root.innerHTML=`<div class="section-title"><b>Latest-family recipe catalog</b><span class="pill">Exact checkpoint variants</span></div><p>${catalog.fetchedCount} / ${catalog.indexCount} recipe detail records imported · ${counts.included} included variant records · ${counts.excluded} excluded for Chinese lineage · ${counts.review} awaiting origin review. ${catalog.errors.length} fetch failures.</p><p>Latest recognized family releases among sub-50B models are selected before filtering to text generation, including models not yet assessed for long-context concurrency. The calculated tables below remain a separate ${curated.models.filter(m=>m.params<50&&latest(m)).length}-model architecture catalog; they are not exhaustive.</p><p><b>Scope: text generation, fewer than 50B total parameters.</b> MoE active parameter counts do not determine eligibility. Unknown sizes are withheld. Scores from <a href="https://artificialanalysis.ai/" target="_blank" rel="noreferrer">Artificial Analysis</a>. ${esc(aa.status)} ${aa.updated?'Updated '+esc(aa.updated):'No scores imported yet.'}</p><div class="compare-controls"><label>Search all checkpoints<input id="catalogSearch" placeholder="Gemma 4, gpt-oss, Nemotron, Mistral…"></label><label>GPU<select id="catalogGpu">${Object.entries(hardware).map(([id,h])=>`<option value="${id}">${id} · ${esc(h.gpu)}</option>`).join('')}</select></label><label>Origin policy<select id="catalogPolicy"><option value="included">Included non-Chinese developers</option><option value="review">Withheld: lineage needs review</option><option value="excluded">Audit: excluded Chinese lineage</option></select></label></div><p id="catalogCount"></p><div class="cost-table-wrap"><table><thead><tr><th>Exact checkpoint / variant</th><th>Recipe requirements</th><th>AA scores</th><th>64K concurrency</th><th>96K concurrency</th><th>128K concurrency</th></tr></thead><tbody id="catalogRows"></tbody></table></div><details><summary>Coverage and policy limitations</summary><p>Recipe minimum VRAM is a preliminary upstream estimate, not measured cache capacity at these context lengths. Minimums are GB and converted to GiB for comparison. Missing hardware qualification for these exact EC2 GPUs remains unverified. A fit screen does not assert single-GPU kernel support.</p><p>${esc(catalog.policyNote)} NVIDIA, IFM and other publishers without reviewed original lineage are withheld, unless identifiers explicitly reveal excluded lineage. Quantizer names do not override the original developer. Variant aliases are deduplicated by checkpoint and precision.</p><p>Imported ${esc(catalog.updated)}. Refresh using python3 scripts/import_recipes.py. ${catalog.errors.length?'Fetch failures: '+esc(catalog.errors.map(r=>r.id).join(', ')):'No recipe detail fetch failures.'}</p></details>`;
const $=id=>document.getElementById(id);
function render(){
 const hw=hardware[$('catalogGpu').value],q=$('catalogSearch').value.toLowerCase();
 const rows=catalog.variants.filter(r=>under50(r)&&isTextGeneration(r)&&latest(r)&&r.policy===$('catalogPolicy').value&&[r.checkpoint,r.title,r.provider,r.precision].join(' ').toLowerCase().includes(q)).sort((a,b)=>a.provider.localeCompare(b.provider)||a.checkpoint.localeCompare(b.checkpoint));
 $('catalogCount').textContent=`${rows.length} matching variant records · selected GPU ${hw.vram} GiB planning capacity · 85% memory budget`;
 $('catalogRows').innerHTML=rows.map(r=>{
 const score=aa.scores[r.checkpoint.toLowerCase()];
 const scoreHtml=score?Object.entries(score.indices).map(([k,v])=>`${esc(k)}: ${Number(v).toFixed(1)}`).join('<br>')+`<small>${score.scope==='exact'?'Exact checkpoint mapping':'Base model reference — quantized quality unverified'}<br>${esc(score.name)}</small>`:'Not matched<small>No verified AA mapping / score</small>';
 const match=curated.models.find(m=>m.id.toLowerCase()===r.checkpoint.toLowerCase());
 const native=['bf16','fp16'].includes(String(r.precision).toLowerCase());
 const measured=match&&native&&r.policy==='included'?capacity(match,hw):null;
 const min=r.minimumGB==null?null:r.minimumGB*1e9/2**30;
 const cells=[65536,98304,131072].map((ctx,i)=>{
 if(hw.gpuCount>1)return '<td>Multi-GPU precision / sharding unverified</td>';
 if(r.policy!=='included')return `<td>${r.policy==='excluded'?'Excluded by policy':'Lineage review required'}</td>`;
 if(r.maxContext&&ctx>r.maxContext)return '<td>Context unsupported</td>';
 if(min!==null&&min>hw.vram*.85)return '<td>Recipe minimum exceeds budget</td>';
 if(measured){const c=measured[i];return `<td>${c.reason?esc(c.reason):c.concurrency+'× estimated'}<small>Curated architecture calculation</small></td>`}
 return '<td><span class="badge risk">Needs assessment</span><small>KV/state metadata and GPU qualification required</small></td>';
 });
 return `<tr><td><a target="_blank" rel="noreferrer" href="${esc(r.url)}">${esc(r.checkpoint)} ↗</a><small>${esc(r.provider)} · ${esc(r.variant)} · ${esc(r.precision)}<br>${esc(r.policyReason)}</small></td><td>${r.minimumGB==null?'Minimum VRAM unknown':esc(r.minimumGB)+' GB recipe minimum'}<small>Context: ${r.maxContext?Number(r.maxContext).toLocaleString():'unknown'}<br>vLLM ≥ ${esc(r.minVllm||'unspecified')}<br>Exact EC2 GPU qualification: unverified</small></td><td>${scoreHtml}</td>${cells.join('')}</tr>`;
 }).join('')||'<tr><td colspan="6">No matching variants.</td></tr>';
}
['catalogSearch','catalogGpu','catalogPolicy'].forEach(id=>$(id).addEventListener('input',render));render();
}catch(e){root.textContent='Full recipe import is not available yet. Run python3 scripts/import_recipes.py and reload.';console.error(e)}
