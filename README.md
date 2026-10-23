# Fitcheck · vLLM compatibility planner

A dependency-free static website for planning single-GPU vLLM deployments. Defaults to g6.2xlarge (8 vCPU, 32 GiB RAM, NVIDIA L4), with an editable 12 GiB measured baseline RAM assumption.

## Run

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Open http://127.0.0.1:5173. Serve over HTTP; ES modules and JSON fetches do not work reliably from file URLs. No secrets or cloud credentials are required. Deploy these static files to any static host. No AWS resources are provisioned.

## Refresh upstream data

```sh
python3 scripts/sync_data.py
node scripts/test-engine.mjs
```

Requires Python 3, curl, and Node for checks. Refresh fetches the public https://recipes.vllm.ai/models.json index and curated Hugging Face configs. Gated/unavailable configs use explicitly flagged fallback architecture metadata. Parameter counts are curated approximations, not extracted tensor counts. Recipe entries outside the allowlist receive no compatibility assessment. The catalog is deliberately bounded, not an exhaustive model database.

## Interpretation

Host RAM and GPU VRAM are separate. A 12 GB Docker image is disk usage, not evidence of 12 GB resident RAM. Enter a measured baseline excluding model loading; otherwise you may double count. Host loading peaks are loader/version dependent: this planner uses a configurable heuristic, not a guaranteed bound. All results require real startup and workload validation.

Weights use total parameters, including all experts where applicable. GPU estimate includes weights, full-context FP16 KV cache across concurrent sequences, and configurable runtime overhead. CPU offload is disabled. Candidate commands use eager mode to reduce CUDA graph overhead; performance may differ. GPU memory uses GiB, with 22.35 as a conservative usable L4 default; replace with your observed nvidia-smi total. 4-bit is only a planning scenario and never generates a launch command for unquantized weights.

Origin policy uses a curated original-developer allowlist (Google, Meta, Microsoft, Mistral AI, IBM, Hugging Face), with explicit US/France labels and source model cards. It excludes unknown origins; this is not certification of training-data provenance or all upstream lineage. Review licenses and model dependencies for your policy. Meta models require gated access approval.

## Files

- `engine.mjs`: memory calculations and classification
- `app.js`: configuration, filters, details, command generation
- `data/models.json`: curated model metadata and provenance
- `data/recipes.json`: upstream recipe index snapshot
- `scripts/sync_data.py`: refresh public metadata

No actual GPU execution, throughput benchmark, or automated instance inspection is performed.

Gemma 2/3 use conservative full-attention KV estimates: sliding-window savings are not modeled. Gemma 3 4B/12B/27B estimates include approximate total parameter weights but exclude image activation and processing overhead; use estimates for text-only planning. Gated Google configs may use flagged curated fallbacks.

## Shared-GPU deployment planner

The top panel supports one or two containers with independent model, weight scenario, total context, concurrency, allocation fraction, GPU runtime overhead, host runtime RAM, and extra loading RAM. GPU allocations share a global capacity and explicit safety reserve. Host peak adds either the largest staging allocation (sequential startup) or the sum (parallel startup).

Optional weight, KV/state and total-required-GPU measurements are in GiB. Total-required-GPU overrides replace the computed components; do not enter unused preallocated cache as required workload memory. FP8 and 4-bit scenarios do not assert availability of a compatible quantized checkpoint. Generated commands remain limited to native-weight candidates in the catalog panel.

The top deployment planner and lower catalog explorer are independent scenarios, labeled separately. Runtime RAM defaults to an explicitly unmeasured 3 GiB per server, not the previous unverified 12 GiB. Startup RAM is also a configurable assumption. Save/load uses browser localStorage; JSON export includes inputs, assumptions, provenance and results. No measurements or files are sent to a server.

Checks: `node scripts/test-planner.mjs` and `node scripts/test-engine.mjs`.

Hardware presets include g6e.2xlarge: 8 vCPUs, 64 GiB host RAM, one NVIDIA L40S marketed as 48 GB. The preset conservatively uses 44 GiB GPU capacity per AWS instance specifications; replace with the actual nvidia-smi total. Presets exist in both the deployment planner and independent catalog explorer. The existing g6.2xlarge remains the default. Shared definitions live in hardware.mjs.

G7e.2xlarge is also available: 8 vCPUs, 64 GiB host RAM, one NVIDIA RTX PRO 6000 Blackwell GPU. The GPU capacity default is 96 GiB per the AWS accelerated-instance specifications; override with nvidia-smi. All presets and calculations are for a single physical GPU. Two-container mode shares that GPU; tensor parallelism and multi-GPU aggregation are not supported. Hardware memory fit does not establish CUDA/vLLM/kernel compatibility on Blackwell.

## Costs

Exactly three hardware presets are exposed: g6.2xlarge, g6e.2xlarge and g7e.2xlarge. The current instance has a user-provided USD 900/month baseline. Alternative monthly quotes are intentionally blank until entered. The planner displays monthly cost, annual cost (12 months), and dollar difference against the editable current baseline. It charges one instance regardless of one/two containers. Cost scope is user-defined and must be consistent across quotes. No live AWS pricing is implied. All three cost fields are included in browser save/load and JSON exports.

## Current deployment scope

The UI now supports exactly one dedicated vLLM container on one physical GPU. Earlier shared-GPU/two-container controls and startup scheduling have been removed. The allocation defaults to 90% of GPU capacity. Concurrency refers to requests served by the same vLLM server. The three EC2 presets and USD monthly cost comparison remain. The internal calculation helper retains multi-slot tests as regression coverage, but the UI constructs exactly one deployment slot.

Updated user-provided monthly USD defaults: g6.2xlarge $900; g6e.2xlarge $1,800; g7e.2xlarge $2,600. Annualized totals are $10,800, $21,600 and $31,200. All are editable reference costs, not live AWS quotes.

## Main results-first comparison

The main page automatically evaluates every catalog model for each of the three GPUs at 65,536 / 98,304 / 131,072 total tokens per request. No model selection is needed. Tables sort by model size and show integer simultaneous full-length request capacity, GPU memory and exclusion reasons. Defaults: native BF16 weights, FP16 full-attention KV, 85% GPU budget, 3 GiB runtime overhead, 15% KV margin, and host peak of one full native weight copy plus 5 GiB. These are conservative scenario assumptions, not measured safe-serving guarantees or throughput estimates. Architecture fallbacks are flagged and hybrid/multimodal models need profiling. Quantized scenarios remain advanced and do not appear as validated baseline fits. Test with `node scripts/test-capacity.mjs`.

## Full recipe import

`python3 scripts/import_recipes.py` imports the assembled official API index plus every recipe detail payload (the API is generated by the repository's source-merging pipeline). Raw source payloads are retained under data/upstream/ and normalized checkpoint variants, context/version/minimum-memory fields, policy reasons and provenance under data/catalog.json. No upstream command text is executed. The initial import fetched 495/495 records with no failures and yielded 244 included, 463 Chinese-lineage-excluded and 71 origin-review variant records after deduplication.

The full catalog is now the first results section. It searches exact checkpoints, includes quantized variants, and screens minimum recipe VRAM/context against each GPU. Precise concurrency is only displayed when a matching curated native architecture calculation is available. Remaining cells explicitly require assessment. Hardware qualification is not inferred from datacenter Hopper/Blackwell recipes. Unknown publishers/lineage are withheld, not silently treated as non-Chinese. The origin map plus identifier screening is a conservative policy implementation, not a comprehensive training-data/dependency certification. Excluded/review records remain accessible through an audit filter.

Refresh script requires curl and Python 3; validates TLS, retries failed requests and records fetch failures without hiding them. Run `python3 scripts/test-catalog.py` after refreshing. Counts reflect checkpoint variant records, not unique base-model families.

Final checkpoint+precision deduplication removes API alias duplicates: 151 included records, 307 excluded records, and 52 requiring origin review. FLUX-3-image-klein variants are excluded for a Qwen-derived text encoder. These supersede the pre-deduplication counts above. Publisher allowlisting and explicit lineage exclusions are a screening policy; dependency lineage is not comprehensively certified.

## Sub-50B scope and Artificial Analysis

All result views now exclude models with 50B or more **total** parameters. The recipe catalog parses B/M units and withholds unknown parameter sizes. This is independent of active MoE parameters. The current origin-included subset has 103 sub-50B checkpoint/precision records.

Artificial Analysis scores use the official API: https://artificialanalysis.ai/data-api/docs . An API key is required; it must stay outside browser code and Git. No live scores have been imported by default. The UI attributes Artificial Analysis and shows missing matches explicitly.

Run `python3 scripts/sync_aa.py --input /absolute/path/authorized-aa-response.json`, or set AA_API_KEY locally and run `python3 scripts/sync_aa.py`. The latter calls the documented free language-model endpoint. Secrets are passed to curl over stdin and never stored in source. Add explicit mappings in data/aa-mapping.json using stable AA model IDs:

```json
{"organization/checkpoint": {"id": "AA-stable-model-id", "scope": "exact"}}
```

Use scope `base` for deliberately displaying a base-model reference score; the UI labels quantized quality unverified. Scores are never fuzzy-matched by name or copied to quantized variants automatically. The sync imports Intelligence/Coding/Agentic index fields when present. API access does not guarantee every model has benchmark coverage. No fetched provider speed or pricing is interpreted as performance or cost on these EC2 instances.

## Simplified main UI

The default view is now three GPU cards, 64K/96K/128K context tabs, search, and a three-column model/context/concurrency table. Source catalog, AA score status, assumptions, costs editor and manual planner are collapsed under Details & advanced settings. Additional recipe checkpoints without reliable concurrency estimates are collapsed separately, so they remain discoverable without being presented as runnable. The primary table uses the existing conservative native-BF16 capacity model, original developer policy and total-parameter limit.

The primary UI now ignores concurrency and lists origin-approved, sub-50B BF16/FP8 text or multimodal checkpoints passing the recipe minimum-memory screen. Threshold = 90% of selected GPU planning capacity, converting recipe GB to GiB. Model context limits are informational, not promised runnable context. Missing minimum memory, unknown origin, non-text tasks and all other precisions are withheld. This is a recipe-memory fit screen, not exact GPU/kernel qualification or a measured maximum-context fit. Older calculation tools remain behind Details.

Text-generation filtering now requires an explicit upstream `text` task and rejects speech/transcription/embedding/reranking/OCR identifiers. Multimodal-only recipes (including Whisper) and unknown tasks are withheld. Models with both text-generation and multimodal support remain eligible for text serving. This filter applies to the main list and full recipe catalog. Regression checks verify Whisper and embedding exclusion.

## Additional GPU headroom policy

The primary fit screen now reserves max(4 GiB, 20% of GPU capacity) **beyond** the recipe minimum. Upstream minimum VRAM already includes a coarse allowance for runtime/cache; it is not a weights-only measurement, so a second fixed runtime estimate is not added to that figure. The extra reserve is a conservative operational policy, not measured overhead or a promise of maximum-context fit. The table shows memory remaining outside the recipe minimum. Host OS/system RAM is separate, and host runtime/loading peaks still require validation. LFM2.5-8B-A1B BF16 (21 GB recipe minimum = 19.56 GiB) is excluded on the L4 under this policy, but passes the L40S memory screen. Check with `node scripts/test-fit-screen.mjs`.

Minimum context is now 65,536 total tokens (input plus output), one request. Main results require a known matching BF16 architecture and enough memory for weights + 3 GiB runtime + full-attention FP16 64K KV with 15% KV margin, as well as the existing recipe/headroom screen. Recipe context below 64K or unknown is excluded. Other BF16/FP8 recipes supporting 64K but lacking exact architecture/residency metadata are collapsed as requiring validation; they are not presented as confirmed 64K fits. Calculated candidates remain unbenchmarked.

Current primary screen ignores context and concurrency again. Extra cushion is now a fixed, editable 3 GiB on every GPU, replacing the percentage reserve. This is an unmeasured user-adjustable planning policy, not a published vLLM CUDA/runtime requirement. vLLM profiles non-Torch allocations, peak activations, weights and CUDA graph memory for the actual model/configuration. Recipe minimums already include a coarse allowance, so the UI does not add another claimed measured runtime overhead. Official references: https://docs.vllm.ai/en/stable/configuration/optimization/ and https://github.com/vllm-project/vllm/blob/main/vllm/v1/worker/gpu_worker.py .

The simple list groups fitting checkpoints by upstream model title, developer and total parameter size. One model/size row shows available BF16/FP8 precisions, with checkpoint details collapsed underneath. Memory/headroom use the lowest recipe-memory checkpoint among the fitting variants; this is not an accuracy or kernel-performance recommendation. Distinct model sizes remain separate.

## One-time public Artificial Analysis snapshot

On 2026-10-23, scores were captured from the public server-rendered https://artificialanalysis.ai/leaderboards/models table (no API key). The local snapshot maps 15 evaluated model identities to 37 recipe checkpoint records using explicit identity rules. It contains rounded public Intelligence Index v4.3.2 values, retains the published estimated asterisk, source links, evaluated model name and capture date. All are labeled base-model references; quantized-checkpoint accuracy is not asserted. GPT-OSS 20B references the explicitly named high-reasoning evaluation. No runtime network request or API credential is needed. Unmatched models remain blank.

To reproduce deliberately: download the public HTML to a temporary file, then run `python3 scripts/capture_aa_snapshot.py /path/to/leaderboard.html`. It does not run on page load. Do not infer missing scores or fuzzy-match different sizes/reasoning modes.

## Manual AA scores

Each model row has a collapsed Edit form for a 0–100 Intelligence Index value and optional evaluation/reference note. Save writes to browser localStorage under fitcheck-manual-aa-v1. Stable keys use developer, upstream title and total parameter size, so values follow grouped models across GPU/precision changes. Manual scores override the bundled snapshot and are labeled with their saved UTC date; Use snapshot removes only that model override. AA sorting uses overrides too.

Manual scores · backup & restore exports a versioned JSON file or imports/merges one. Imports validate the entire file (finite scores, range, dates, notes, schema and 1 MB limit) before saving. Same-model incoming entries replace local values; unrelated entries remain. Persistence is browser/origin-local, not shared with other users, and can be lost when browser data is cleared. Export for durable backups or migration. Works offline. Tested saving a temporary score, reloading to confirm persistence, then removing it through Use snapshot. Unit checks: node scripts/test-manual-scores.mjs.

## g4dn.metal

Added user-provided USD 6,000/month cost (USD 72,000/year), 96 vCPU, 384 GiB RAM, and **8 × T4 with 16 GiB per GPU**. hardware.vram remains per-GPU (16), never a falsely contiguous 128 GiB pool. The main selector includes this multi-GPU exception to the previous single-GPU scope. T4 lacks native BF16 and native FP8 execution. BF16 checkpoints need FP16 conversion, while some FP8 formats can use vLLM's weight-only Marlin path; exact support is unverified. No native BF16/FP8 recipe is marked runnable solely from total memory. A collapsed aggregate-memory shortlist assumes an explicit reserve on every GPU and requires per-rank precision/sharding/communication validation. The old single-GPU manual planner omits this preset; the cost comparison includes it. Older context tables return no capacity for unverified multi-GPU hardware. Tests: node scripts/test-t4.mjs.

Sources: https://docs.aws.amazon.com/ec2/latest/instancetypes/ac.html ; https://developer.nvidia.com/cuda/gpus ; https://github.com/vllm-project/vllm/blob/main/docs/features/quantization/llm_compressor/fp8.md .

NVFP4 variants are now eligible for the Blackwell g7e.2xlarge main list, grouped with the model's BF16/FP8 variants and sized using actual recipe minima (not a uniform 0.5-byte multiplier). The app conservatively withholds older-GPU NVFP4 emulation and excludes T4. vLLM's compressor documentation lists Blackwell CC≥10 for NVFP4; exact SM120 model/kernel support remains checkpoint/version-specific. This does not add GPTQ/AWQ/INT4 or MXFP4 implicitly.

Current default extra GPU cushion is **4 GiB**, editable under Memory assumptions & sources. Main screening rule: converted recipe minimum GiB + 4 GiB ≤ per-GPU planning capacity. This supersedes the earlier 3 GiB extra-cushion default; it does not change measured or assumed runtime components in the separate advanced calculators. The T4 aggregate shortlist applies the reserve separately to all eight GPUs, without claiming sharding/precision support.

Removed g4dn.metal from the active hardware catalog. Only g6.2xlarge ($900/month), g6e.2xlarge ($1,800/month) and g7e.2xlarge ($2,600/month) are selectable. Main fit-screen headroom remains 4 GiB. Earlier T4 notes are historical and do not describe active options.
