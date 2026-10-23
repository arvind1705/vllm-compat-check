import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
d=json.loads((root/'data/catalog.json').read_text())
assert d['fetchedCount']+len(d['errors'])==d['indexCount']
assert d['indexCount']>400 and not d['errors']
assert any(r['checkpoint']=='RedHatAI/gemma-4-E2B-it-FP8-dynamic' and r['policy']=='included' for r in d['variants'])
assert all(r['policy']=='excluded' for r in d['variants'] if 'qwen' in r['checkpoint'].lower() or 'deepseek' in r['checkpoint'].lower())
assert any(r['policy']=='review' and r['provider']=='NVIDIA' for r in d['variants'])
assert all(r['url'].startswith('https://recipes.vllm.ai/') for r in d['variants'])
assert all(r['policy'] in {'included','excluded','review'} for r in d['variants'])
print('Catalog coverage, checkpoint variants, lineage exclusions and unknown-origin checks passed')
