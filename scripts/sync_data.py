"""Refresh public upstream metadata; no API credentials required."""
import json, subprocess, pathlib, datetime
ROOT=pathlib.Path(__file__).resolve().parents[1]
def get(url):
    return json.loads(subprocess.check_output(["curl", "-fsSL", "--max-time", "30", url], stderr=subprocess.DEVNULL))
models=[('meta-llama/Llama-3.2-1B-Instruct','Meta','US',1.24,16,8,64,131072),('meta-llama/Llama-3.2-3B-Instruct','Meta','US',3.21,28,8,128,131072),('meta-llama/Llama-3.1-8B-Instruct','Meta','US',8.03,32,8,128,131072),('microsoft/Phi-3.5-mini-instruct','Microsoft','US',3.82,32,32,96,131072),('mistralai/Mistral-7B-Instruct-v0.3','Mistral AI','France',7.25,32,8,128,32768),('mistralai/Mistral-Nemo-Instruct-2407','Mistral AI','France',12.25,40,8,128,131072),('microsoft/phi-4','Microsoft','US',14.66,40,10,128,16384)]
models += [
 ('mistralai/Mistral-Small-3.1-24B-Instruct-2503','Mistral AI','France',24,40,8,128,131072),
 ('google/gemma-3-1b-it','Google','US',1,26,1,256,32768),
 ('google/gemma-3-4b-it','Google','US',4.3,34,4,256,131072),
 ('google/gemma-3-12b-it','Google','US',12.2,48,8,256,131072),
 ('google/gemma-3-27b-it','Google','US',27.4,62,16,128,131072),
 ('google/gemma-2-2b-it','Google','US',2.61,26,4,256,8192),
 ('google/gemma-2-9b-it','Google','US',9.24,42,8,256,8192),
 ('HuggingFaceTB/SmolLM2-1.7B-Instruct','Hugging Face','US / France',1.71,24,32,64,8192),
 ('HuggingFaceTB/SmolLM3-3B','Hugging Face','US / France',3.08,36,4,128,65536),
 ('ibm-granite/granite-3.3-2b-instruct','IBM','US',2.53,40,8,64,131072),
 ('ibm-granite/granite-3.3-8b-instruct','IBM','US',8.17,40,8,128,131072),
 ('microsoft/Phi-4-mini-instruct','Microsoft','US',3.84,32,8,128,131072),
 ('mistralai/Ministral-8B-Instruct-2410','Mistral AI','France',8.02,36,8,128,131072),
 ('meta-llama/Llama-3.3-70B-Instruct','Meta','US',70.6,80,8,128,131072)
]

out=[]
for id,provider,country,p,l,h,d,ctx in models:
    verified=False
    try:
        c=get('https://huggingface.co/'+id+'/resolve/main/config.json')
        c=c.get('text_config',c)
        l=c['num_hidden_layers']; h=c['num_key_value_heads']; d=c.get('head_dim',c['hidden_size']//c['num_attention_heads']); ctx=c['max_position_embeddings']; verified=True
    except Exception as e: print(id, 'using documented fallback:',type(e).__name__)
    out.append(dict(id=id,name=id.split('/')[1],provider=provider,country=country,params=p,layers=l,kvHeads=h,headDim=d,maxContext=ctx,configVerified=verified,source='https://huggingface.co/'+id,licenseNote='Review model license and gated access requirements.', note='Conservative full-attention KV estimate; hybrid/sliding-window savings excluded. Multimodal estimates are text-only; image/audio overhead excluded.' if provider=='Google' else ''))
recipes=get('https://recipes.vllm.ai/models.json')
(ROOT/'data/recipes.json').write_text(json.dumps(recipes,indent=2)+'\n')
(ROOT/'data/models.json').write_text(json.dumps(dict(updated=datetime.datetime.now(datetime.timezone.utc).isoformat(),models=out),indent=2)+'\n')
print('Saved',len(out),'curated models and',len(recipes),'recipe index entries')
