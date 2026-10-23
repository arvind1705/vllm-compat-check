import {hardware} from './hardware.mjs';
import {estimate} from './engine.mjs';
const $=id=>document.getElementById(id), ids=['cpu','ram','vram','base','os','util','context','seq','precision','overhead','loading'];
const defaults=Object.fromEntries(ids.map(id=>[id,$(id).value]));
let data,recipes,selected='meta-llama/Llama-3.2-3B-Instruct';
const fmt=n=>n.toFixed(1), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={candidate:'Memory candidate',risk:'Host RAM risk',no:'Does not fit'};
function render(){
 if(ids.some(id=>!$(id).checkValidity()||!$(id).value)){ $('advice').textContent='Enter valid values in every configuration field.';return; }
 const c=Object.fromEntries(ids.map(id=>[id,Number($(id).value)]));
 const rows=data.models.filter(m=>m.params<50).map(m=>({...m,...estimate(m,c)}));
 $('gpuStat').textContent=fmt(c.vram*c.util)+' GiB';$('ramStat').textContent=fmt(c.ram-c.base-c.os)+' GiB';$('fitStat').textContent=rows.filter(m=>m.status==='candidate').length+' / '+rows.length;
 $('advice').textContent=`${fmt(c.ram-c.base-c.os)} GiB remains after assumed runtime RAM and OS reserve. Startup may need staging memory beyond this. ${c.cpu<=4?'With '+c.cpu+' vCPUs, start with one request at a time. ':''}GPU fit alone does not guarantee a successful launch.`;
 const shown=rows.filter(m=>(m.name+' '+m.provider).toLowerCase().includes($('search').value.toLowerCase())&&($('status').value==='all'||m.status===$('status').value));
 $('models').innerHTML=shown.map(m=>`<button class="model ${m.id===selected?'selected':''}" data-id="${esc(m.id)}"><div class="row"><div><h3>${esc(m.name)}</h3><div class="meta">${esc(m.provider)} · ${m.country} · ${m.params}B parameters · ${c.precision===2?'16-bit':c.precision===1.1?'FP8 scenario':'4-bit scenario'}</div></div><span class="badge ${m.status}">${labels[m.status]}</span></div><div class="bar"><span class="weights" style="width:${Math.min(100,m.weights/m.budget*100)}%"></span><span class="kv" style="width:${Math.min(100,m.kv/m.budget*100)}%"></span><span class="runtime" style="width:${Math.min(100,c.overhead/m.budget*100)}%"></span></div><div class="numbers"><span>${fmt(m.total)} / ${fmt(m.budget)} GiB GPU</span><span>Host peak proxy ${fmt(m.host)} GiB →</span></div></button>`).join('')||'<p>No models match these filters.</p>';
 if(!shown.some(m=>m.id===selected)) selected=shown[0]?.id;
 document.querySelectorAll('[data-id]').forEach(el=>el.onclick=()=>{selected=el.dataset.id;render()});
 const m=rows.find(m=>m.id===selected);if(!m){$('detail').innerHTML='';return}
 const cmd=`vllm serve ${m.id} \\\n  --dtype bfloat16 \\\n  --max-model-len ${c.context} \\\n  --max-num-seqs ${c.seq} \\\n  --gpu-memory-utilization ${c.util} \\\n  --cpu-offload-gb 0 \\\n  --enforce-eager`;
 $('detail').innerHTML=`<div class="detail"><h3>${esc(m.name)} <span class="badge ${m.status}">${labels[m.status]}</span></h3><p>Weights ${fmt(m.weights)} + KV cache ${fmt(m.kv)} + runtime ${fmt(c.overhead)} = ${fmt(m.total)} GiB GPU.<br>Host peak proxy ${fmt(m.host)} GiB. ${esc(m.note||'')} ${m.configVerified?'Architecture metadata fetched from model config.':'Architecture metadata uses a curated fallback; verify the model config.'}</p><a href="${m.source}" target="_blank" rel="noreferrer">Model card & license ↗</a> · <a href="https://docs.vllm.ai/en/stable/models/supported_models.html" target="_blank" rel="noreferrer">Check vLLM architecture support ↗</a>${c.precision!==2?'<p>Planning scenario only. Select a specific compatible quantized checkpoint before deployment.</p>':m.status==='no'?'<p>This configuration exceeds GPU memory or the model context limit. Reduce context / concurrency or choose a smaller model.</p>':`<p>${m.status==='risk'?'Resolve the host RAM risk before trying this command.':'Candidate command — validate startup and load on your instance.'} Install a vLLM version supporting this architecture. Gated checkpoints (including Gemma and Llama) require approved Hugging Face access.</p><pre>${esc(cmd)}</pre><button id="copy">Copy candidate command</button>`}</div>`;
 if($('copy'))$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(cmd);$('copy').textContent='Copied'}catch{$('copy').textContent='Select and copy the command above'}};
}
try{
 [data,recipes]=await Promise.all(['data/models.json','data/recipes.json'].map(p=>fetch(p).then(r=>{if(!r.ok)throw Error(p);return r.json()})));
 $('sync').textContent=`Snapshot: ${new Date(data.updated).toLocaleDateString()}. ${recipes.length} upstream recipes. ${data.models.length} curated model estimates. Refresh with python3 scripts/sync_data.py.`;
 const allowed=new Set(['meta-llama','microsoft','mistralai','Google','google','HuggingFaceTB','ibm-granite']);
 const reviewed=recipes.filter(r=>allowed.has(r.hf_id.split('/')[0]));
 $('recipes').innerHTML=reviewed.map(r=>`<a target="_blank" rel="noreferrer" href="https://recipes.vllm.ai${encodeURI(r.url)}">${esc(r.title)} · recipe only, not assessed ↗</a>`).join('');
 ids.forEach(id=>$(id).addEventListener('input',render));['search','status'].forEach(id=>$(id).addEventListener('input',render));
 $('instance').onchange=()=>{const p=hardware[$('instance').value];if(p){$('cpu').value=p.cpu;$('ram').value=p.ram;$('vram').value=p.vram}render()};
 $('reset').onclick=()=>{ids.forEach(id=>$(id).value=defaults[id]);$('instance').value='g6.2xlarge';$('search').value='';$('status').value='all';render()};render();
}catch(e){$('models').textContent='Could not load model data. Serve this folder over HTTP and run the data sync script if needed.';console.error(e)}
