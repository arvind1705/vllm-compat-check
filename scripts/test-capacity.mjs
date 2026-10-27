import assert from 'node:assert/strict';import {capacity,contexts} from '../capacity.mjs';import {hardware} from '../hardware.mjs';
const m={params:8,layers:32,kvHeads:8,headDim:128,maxContext:131072};
const a=capacity(m,hardware['g6.2xlarge']),b=capacity(m,hardware['g6e.2xlarge']),c=capacity(m,{vram:96,ram:64});
assert.deepEqual(contexts,[65536,98304,131072]);
assert.equal(a[0].concurrency,0);assert.ok(b[0].concurrency>a[0].concurrency);assert.ok(c[0].concurrency>b[0].concurrency);
assert.ok(c[0].concurrency>=c[1].concurrency&&c[1].concurrency>=c[2].concurrency);
assert.ok(capacity(m,{vram:96,ram:64},{overhead:10})[0].concurrency < capacity(m,{vram:96,ram:64},{overhead:0})[0].concurrency);
assert.equal(capacity({...m,maxContext:65536},{vram:96,ram:64})[1].reason,'Context unsupported');
assert.equal(capacity({...m,params:70},{vram:96,ram:64})[0].reason,'Host startup risk');
for(const r of [...a,...b,...c])if(r.concurrency){assert.ok(r.weights+4.1+r.perRequest*r.concurrency<=r.budget);assert.ok(r.weights+4.1+r.perRequest*(r.concurrency+1)>r.budget)}
console.log('Long-context boundaries, scaling, host limit and integer concurrency checks passed');
