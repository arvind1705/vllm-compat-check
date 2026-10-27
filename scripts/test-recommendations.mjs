import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recommendations,estimateConcurrency,sortRecommendations} from '../recommendations.mjs';
import {hardware} from '../hardware.mjs';
const catalog=JSON.parse(readFileSync(new URL('../data/catalog.json',import.meta.url))).variants;
const models=JSON.parse(readFileSync(new URL('../data/models.json',import.meta.url))).models;
const scores=JSON.parse(readFileSync(new URL('../data/aa-scores.json',import.meta.url))).scores;
assert.deepEqual(Object.keys(hardware),['g6.2xlarge','g6e.2xlarge']);
for(const hw of Object.values(hardware))for(const context of [65536,131072]){
 const rows=recommendations(catalog,models,scores,hw,context);
 assert.ok(rows.length);
 for(const {row,estimates} of rows){assert.equal(row.policy,'included');assert.ok(row.maxContext>=context);assert.ok(row.minimumGB*1e9/2**30+4<=hw.vram);assert.ok(!estimates[context].reason&&estimates[context].count>0);assert.ok(!estimates[131072].reason&&estimates[131072].count>0);assert.ok(!/llama-3\.1/i.test(row.checkpoint));assert.notEqual(row.checkpoint,'google/translategemma-4b-it');assert.ok(!/gemma-4-e2b|diffusion|translat/i.test(row.checkpoint))}
 for(let i=1;i<rows.length;i++)assert.ok((rows[i-1].score?.indices.intelligence??-1)>=(rows[i].score?.indices.intelligence??-1));
}
console.log('Two-instance ranking, eligibility, context and screened memory checks passed');

const l4=recommendations(catalog,models,scores,hardware['g6.2xlarge'],65536);
assert.ok(l4.some(x=>/gemma-4-e4b/i.test(x.row.checkpoint)), 'Gemma 4 E4B remains visible');

const l40=recommendations(catalog,models,scores,{vram:64,ram:64},65536);
const laguna=l40.filter(x=>/laguna-xs\.2-fp8$/i.test(x.row.checkpoint));
assert.equal(laguna.length,1);assert.equal(laguna[0].row.checkpoint,'poolside/Laguna-XS.2-FP8');assert.ok(laguna[0].alternatives.some(r=>r.checkpoint==='RedHatAI/Laguna-XS.2-FP8'));

const proxy=estimateConcurrency({maxContext:131072,minimumGB:10,precision:"fp8"},null,{vram:22},65536);
assert.equal(proxy.method,"qwen proxy");assert.equal(proxy.cacheTokens,Math.floor(proxy.cacheGiB*301115/11.44));assert.equal(proxy.count,Math.floor((22-4-10e9/2**30)*301115/11.44/65536));
assert.equal(estimateConcurrency({maxContext:65536,minimumGB:10,precision:"fp8"},null,{vram:22},131072).reason,"Context unsupported");

const nemotron=recommendations(catalog,models,scores,hardware['g6e.2xlarge'],131072).find(x=>x.row.checkpoint==='nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8');
assert.ok(nemotron);assert.ok(nemotron.estimates[131072].count>0);assert.match(nemotron.row.policyReason,/Qwen/);

const sorted=sortRecommendations(l4,"concurrency");
for(let i=1;i<sorted.length;i++)assert.ok(sorted[i-1].estimates[131072].count>=sorted[i].estimates[131072].count);
const byMemory=sortRecommendations(l4,"memory");
for(let i=1;i<byMemory.length;i++)assert.ok(byMemory[i-1].row.minimumGB<=byMemory[i].row.minimumGB);
assert.equal(nemotron.score?.indices.intelligence,9);
