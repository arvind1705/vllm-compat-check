"""Import every assembled upstream recipe with variant and origin audit records."""
import json,subprocess,concurrent.futures,datetime,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
def fetch(url):
 return json.loads(subprocess.check_output(['curl','-fsSL','--retry','2','--max-time','40',url],stderr=subprocess.DEVNULL))
china={'Qwen','GLM (Z-AI)','Z.ai','DeepSeek','inclusionAI','Moonshot AI','MiniMax','StepFun','OpenMOSS','MiMo (Xiaomi)','Ernie (Baidu)','InternLM','Jina AI','Hunyuan (Tencent)','Hy (Tencent)','MiniCPM (OpenBMB)','PaddlePaddle','Seed (ByteDance)','IndexTeam','InternVL (OpenGVLab)','Wan (Alibaba)','LongCat (Meituan)','Dots','Fish Audio'}
allowed={'Meta','Google','Mistral AI','Microsoft','OpenAI','LiquidAI','Poolside','Thinking Machines Lab','JetBrains','Arcee AI','Reflection','RecursiveSI','Stability AI','Lightricks','BharatGen','Black Forest Labs','IBM Granite','Preferred Networks','Muse (Meta)'}
def policy(provider,ids):
 low=' '.join(ids).lower()
 if provider in china or any(x in low for x in ['qwen','deepseek','minimax','glm-','kimi-','hunyuan','internlm','internvl','flux-3-image-klein']):return 'excluded','Chinese original model or checkpoint lineage'
 if provider in allowed:return 'included','Original developer allowlist; checkpoint ID screened for Chinese lineage'
 return 'review','Original lineage needs review; publisher alone is insufficient'
index=fetch('https://recipes.vllm.ai/models.json')
cache=ROOT/'data/upstream';cache.mkdir(exist_ok=True)
def work(entry):
 try:
  d=fetch('https://recipes.vllm.ai'+entry['json']);return entry,d,None
 except Exception as ex:return entry,None,type(ex).__name__
rows=[];errors=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
 for entry,d,err in pool.map(work,index):
  if err:errors.append({'id':entry['hf_id'],'error':err});continue
  model=d.get('model',{});provider=d.get('meta',{}).get('provider',entry['provider']);base=model.get('model_id',entry['hf_id'])
  state,why=policy(provider,[base,entry['hf_id']])
  variants=d.get('variants') or {'default':{}}
  for key,v in variants.items():
   checkpoint=v.get('model_id',base);status,reason=policy(provider,[base,checkpoint,entry['hf_id']])
   rows.append(dict(recipe=entry['hf_id'],title=d.get('meta',{}).get('title',entry['title']),provider=provider,base=base,checkpoint=checkpoint,variant=key,precision=v.get('precision','unknown'),minimumGB=v.get('vram_minimum_gb'),maxContext=model.get('context_length'),parameters=model.get('parameter_count'),architecture=model.get('architecture'),minVllm=v.get('min_vllm_version',model.get('min_vllm_version')),hardware=v.get('supported_hardware',list(d.get('meta',{}).get('hardware',{}))),policy=status,policyReason=reason,tasks=d.get('meta',{}).get('tasks',[]),url='https://recipes.vllm.ai'+entry['url'],source=d.get('source'),description=v.get('description','')))
  # Keep raw resolved payload for reproducibility and later enrichment.
  name=entry['hf_id'].replace('/','--')+'.json'
  (cache/name).write_text(json.dumps(d,separators=(',',':'))+'\n')
# API index contains checkpoint aliases; deduplicate variant identities, prefer base-recipe records.
unique={}
for r in rows:
 k=(r['checkpoint'].lower(),r['precision'])
 if k not in unique or r['recipe'].lower()==r['base'].lower():unique[k]=r
out=dict(updated=datetime.datetime.now(datetime.timezone.utc).isoformat(),indexCount=len(index),fetchedCount=len(index)-len(errors),errors=errors,variants=list(unique.values()),policyNote='Unknown origins and unscreened publishers are withheld for review. Identifier screening is not full supply-chain certification.')
(ROOT/'data/catalog.json').write_text(json.dumps(out,indent=2)+'\n')
(ROOT/'data/recipes.json').write_text(json.dumps(index,indent=2)+'\n')
from collections import Counter
print(json.dumps({'recipes':len(index),'fetched':out['fetchedCount'],'failures':len(errors),'variantPolicyCounts':dict(Counter(r['policy'] for r in out['variants']))}))
