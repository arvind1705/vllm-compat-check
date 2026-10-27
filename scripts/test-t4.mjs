// Removed preset regression: multi-GPU hardware must not reappear as one memory pool.
import assert from 'node:assert/strict';import {hardware} from '../hardware.mjs';import {screenFit} from '../fit-screen.mjs';
assert.equal(hardware['g4dn.metal'],undefined);assert.equal(hardware['g7e.2xlarge'],undefined);assert.equal(Object.keys(hardware).length,2);
assert.equal(screenFit({minimumGB:5},{vram:16,gpuCount:8}).fits,false);
console.log('Retired g4dn preset and multi-GPU false-fit checks passed');
