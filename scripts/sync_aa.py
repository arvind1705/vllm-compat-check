"""Import AA scores with explicit checkpoint-to-AA-ID mappings; never fuzzy-match scores.
Use --input /path/authorized-api-response.json or AA_API_KEY in your environment.
Mapping format in data/aa-mapping.json:
{"org/checkpoint":{"id":"stable-aa-model-id","scope":"exact"}}
Use scope=base only when deliberately displaying a base model reference score.
"""
import argparse,json,os,pathlib,subprocess,datetime,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--input');a=p.parse_args()
if a.input:payload=json.loads(pathlib.Path(a.input).read_text())
else:
 key=os.environ.get('AA_API_KEY')
 if not key:sys.exit('Set AA_API_KEY locally, or use --input with an authorized API JSON export. Do not put keys in browser code or source control.')
 if any(c in key for c in '\r\n"\\'):sys.exit('Invalid API key format.')
 # Secret header goes only over stdin to curl; never appears in argv or files.
 config='url = "https://artificialanalysis.ai/api/v2/language/models/free"\nheader = "x-api-key: '+key+'"\n'
 result=subprocess.run(['curl','-fsSL','--max-time','60','--config','-'],input=config,text=True,capture_output=True)
 if result.returncode:sys.exit('Artificial Analysis request failed. Check key, network and API access; no score file was changed.')
 payload=json.loads(result.stdout)
rows=payload.get('data',[])
if not isinstance(rows,list):sys.exit('Expected a language-model API response with a data array.')
lookup={str(r.get('id')):r for r in rows if isinstance(r,dict)}
mapping=json.loads((ROOT/'data/aa-mapping.json').read_text());scores={}
for checkpoint,link in mapping.items():
 r=lookup.get(str(link.get('id')))
 if not r:continue
 scope=link.get('scope')
 if scope not in ('exact','base'):sys.exit('Mapping scope must be exact or base.')
 ev=r.get('evaluations',{})
 indices={k:ev.get('artificial_analysis_'+k+'_index') for k in ['intelligence','coding','agentic']}
 indices={k:v for k,v in indices.items() if isinstance(v,(int,float)) and not isinstance(v,bool)}
 scores[checkpoint.lower()]={'aaId':r['id'],'name':r.get('name'),'slug':r.get('slug'),'scope':scope,'indices':indices}
out={'source':'https://artificialanalysis.ai/','updated':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scores':scores,'status':f'{len(rows)} AA models imported; {len(scores)} explicitly mapped checkpoints.','apiModelCount':len(rows)}
(ROOT/'data/aa-scores.json').write_text(json.dumps(out,indent=2)+'\n')
print(out['status'])
