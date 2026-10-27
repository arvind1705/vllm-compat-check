# Fitcheck · vLLM model comparison

A static, dependency-free comparison of non-Chinese text-generation model candidates for **g6.2xlarge (L4)** and **g6e.2xlarge (L40S)**. The primary goal is 128K total context per request; 64K is shown as a reference. The page shows only models estimated to fit at least one 128K request. No GPU execution or AWS resources are created.

## Run

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Open http://127.0.0.1:5173. The site loads JSON locally and needs HTTP; it does not send data to a server.

## How to read the results

The highest-scored candidate is the eligible checkpoint with the highest available Artificial Analysis Intelligence Index in the local snapshot. Scores are base-model references, not checkpoint-specific quantization evaluations; models without scores cannot be ranked and may be better. The public snapshot was captured on 2026-10-27; evaluation modes are identified in the score link. Cost figures ($900 and $1,800 per month) were user-provided and are not live AWS prices.

Candidates must be under 50B total parameters, explicitly text-capable, pass the project's conservative non-Chinese origin policy, have a known recipe context limit at least as large as the selected context, and use BF16 or FP8. Latest recognized family versions are selected within the sub-50B snapshot before the other filters; sizes and precision variants of that version remain. Unrecognized versions are retained rather than guessed. NVIDIA-developed Nemotron 3 Nano is included. Its model card reports improvement using Qwen, which is disclosed in the results. The origin policy does not certify all dependencies or training data.

The recipe minimum is converted from GB to GiB and must fit alongside a 4 GiB cushion on the AWS planning capacity (22 GiB for L4, 44 GiB for L40S). Recipe memory and model context limits do **not** establish the VRAM needed to serve that context, host startup fit, vLLM/kernel support, or model quality. FP8 compatibility must be verified for the exact checkpoint and GPU. Diffusion, translation and Gemma 4 E2B models are excluded at the user’s request. Checkpoints with matching provider, basename, precision, recipe memory, context and score are grouped; alternate publishers remain accessible and are not assumed to be technically identical. A known mixed-size TranslateGemma metadata mismatch is withheld until corrected upstream or in the importer.

Where an exact BF16 checkpoint has curated architecture data, a separate concurrency calculation uses 95% GPU utilization, 4.1 GiB runtime allowance, FP16 full-attention KV and 15% KV margin. The 4.1 GiB is an approximate non-weight figure from one Qwen3.5 FP8 L4 startup log, with measurements from different stages; it is not universal. Hybrid caches and model-specific allocations require profiling. Where architecture data is unavailable, a rough proxy uses the Qwen log’s 301,115 tokens per 11.44 GiB cache on remaining memory after the recipe minimum and 4 GiB cushion. This is not measured for the displayed model and may differ substantially due to cache layout, allocation and other model-specific overhead. Test with the intended context and concurrent requests. The 95% budget leaves little margin for estimation error.

## Refresh and checks

`python3 scripts/import_recipes.py` refreshes the public recipe snapshot, and `python3 scripts/sync_data.py` refreshes curated metadata. Both use public sources; the bounded allowlist and lineage policy are not comprehensive certification. Review changes and failures before use. Refresh the public score snapshot by downloading the public leaderboard HTML and running `python3 scripts/capture_aa_snapshot.py /path/to/leaderboard.html`. Scores can also be updated with `scripts/sync_aa.py`; keep API keys outside Git and browser code.

```sh
for f in scripts/test-*.mjs; do node "$f" || exit; done
python3 scripts/test-catalog.py
```

The shortlist links to Microsoft’s MATH-500 result for Phi-4 Mini Reasoning separately from AA scores. It is a developer-reported task-specific benchmark, not an AA Intelligence Index value; the model card says its synthetic training data came from DeepSeek-R1. Llama 3.2 1B Instruct links to its AA page, but has no verified comparable score in the current snapshot.

Manual AA scores can be entered from the candidate list. They override the sourced score for the exact checkpoint, are saved in browser local storage and affect the ranking; use the reset button to restore the sourced value. Clearing browser data removes them.
