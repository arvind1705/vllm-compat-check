import assert from 'node:assert/strict';import {screenFit} from '../fit-screen.mjs';import {hardware} from '../hardware.mjs';
const row={minimumGB:21};const a=screenFit(row,hardware['g6.2xlarge']),b=screenFit(row,hardware['g6e.2xlarge']);
assert.equal(a.fits,false);assert.equal(b.fits,true);assert.ok(Math.abs(a.minimum-19.5577740669)<.0001);assert.equal(a.reserve,4);assert.equal(screenFit({minimumGB:null},hardware['g6.2xlarge']).fits,false);assert.equal(screenFit({minimumGB:0},hardware['g6.2xlarge']).fits,false);
for(const h of Object.values(hardware)){const p=screenFit({minimumGB:1},h);assert.ok(p.budget+p.reserve<=h.vram+.0001);assert.equal(p.reserve,4)}
console.log('Recipe units, extra headroom, missing metadata and LFM L4 exclusion checks passed');
