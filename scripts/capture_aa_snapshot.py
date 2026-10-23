"""One-time public leaderboard snapshot. No API key or runtime network requests.
Usage: python3 scripts/capture_aa_snapshot.py /path/to/public-leaderboard.html
Fetch the public page with curl first. Explicit identity rules only; no fuzzy joins.
"""
import json,re,pathlib,sys,datetime
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Table(HTMLParser):
 def __init__(self):super().__init__();self.row=None;self.cell=None;self.link=None;self.rows=[]
 def handle_starttag(self,tag,attrs):
  if tag=='tr':self.row=[];self.link=None
  if self.row is not None and tag in ('td','th'):self.cell=[]
  if self.row is not None and tag=='a':
   href=dict(attrs).get('href','')
   if href.startswith('/models/') and not href.endswith('/providers'):self.link=href
 def handle_data(self,data):
  if self.cell is not None:self.cell.append(data)
 def handle_endtag(self,tag):
  if tag in ('td','th') and self.cell is not None:self.row.append(' '.join(self.cell).strip());self.cell=None
  if tag=='tr' and self.row is not None:
   if len(self.row)>3 and re.fullmatch(r'\d+(?:\.\d+)?(?:\s*\*)?',self.row[3]):self.rows.append((self.row,self.link))
   self.row=None
parser=Table();parser.feed(pathlib.Path(sys.argv[1]).read_text())
rows={r[0]:(r,link) for r,link in parser.rows}
# Base-model references; never assert the tested quantization equals our checkpoint.
rules={
 'gemma-4-31b-it':'Gemma 4 31B','gemma-4-26b-a4b-it':'Gemma 4 26B A4B',
 'gemma-4-12b-it':'Gemma 4 12B','gemma-4-e2b-it':'Gemma 4 E2B','gemma-4-e4b-it':'Gemma 4 E4B',
 'diffusiongemma-26b-a4b-it':'DiffusionGemma 26B A4B',
 'lfm2.5-8b-a1b':'LFM2.5-8B-A1B','lfm2.5-1.2b-instruct':'LFM2.5-1.2B-Instruct',
 'lfm2.5-1.2b-thinking':'LFM2.5-1.2B-Thinking','lfm2.5-vl-1.6b':'LFM2.5-VL-1.6B',
 'phi-4':'Phi-4','phi-4-multimodal-instruct':'Phi-4 Multimodal',
 'gpt-oss-20b':'gpt-oss-20b (high)',
}
catalog=json.loads((ROOT/'data/catalog.json').read_text());scores={};unique={}
for entry in catalog['variants']:
 if entry['policy']!='included':continue
 checkpoint=entry['checkpoint'];name=checkpoint.split('/')[-1].lower()
 # Remove only known quantization suffixes, preserving model identity and reasoning mode.
 canonical=re.sub(r'-(fp8(?:-dynamic|-block)?|bf16|nvfp4|qat-w4a16-ct|qat-mobile-ct)$','',name)
 aaName=rules.get(canonical)
 if not aaName:
  m=re.fullmatch(r'ministral-3-(3|8|14)b-instruct-2512(?:-bf16)?',canonical)
  if m:aaName='Ministral 3 '+m[1]+'B'
 if not aaName or aaName not in rows:continue
 row,link=rows[aaName];score=float(row[3].replace('*','').strip())
 rec=dict(aaId=None,name=aaName,slug=(link or '').split('/')[-1],scope='base',indices={'intelligence':score},estimated='*' in row[3],url='https://artificialanalysis.ai'+link if link else 'https://artificialanalysis.ai/leaderboards/models',note='Public rounded leaderboard value; base-model reference, not a quantization-specific evaluation.')
 scores[checkpoint.lower()]=rec;unique[aaName]=rec
out=dict(source='https://artificialanalysis.ai/leaderboards/models',updated=datetime.datetime.now(datetime.timezone.utc).isoformat(),captureDate='2026-10-23',captureMethod='Public server-rendered leaderboard table, one-time snapshot',indexVersion='Artificial Analysis Intelligence Index v4.3.2',scores=scores,status=f'One-time public snapshot: {len(unique)} AA model identities mapped to {len(scores)} checkpoint records.',references=list(unique.values()))
if not scores:sys.exit('No explicit matches found; existing score snapshot left unchanged.')
(ROOT/'data/aa-scores.json').write_text(json.dumps(out,indent=2)+'\n')
print(out['status']);print('\n'.join(unique))
