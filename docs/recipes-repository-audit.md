# vLLM recipes repository audit

Inspected 2026-10-23. Read-only checkout: `/tmp/vllm-recipes-inspect`.
Repository: https://github.com/vllm-project/recipes
Commit: `609f86bf98dca297336fbd12b7e869f6d74dc117`.

## Content and source resolution

The checkout has 215 local model YAML files across 45 provider directories. These are not the total assembled site catalog. `sources.yaml` declares pinned vLLM (`recipes/`) and vLLM-Omni (`recipes/`) owners, with local recipes as an owner that defers to both upstream sources. `sources.lock.json` pins the upstream commits. The renderer assembles content and applies precedence; simply scanning this checkout misses source-owned recipes and updates.

The existing app downloaded 495 index entries from models.json. That count is an API snapshot, not a count of locally cloned YAML files or a count of assessed checkpoints.

## Useful fields

- Model ID, total and active parameters, architecture class, context limit, minimum vLLM version.
- Exact precision variants, checkpoint overrides, minimum VRAM and hardware support.
- Hardware/strategy overrides, tensor parallel requirements, environment and arguments.
- Features including text-only, reasoning, tool calling and speculative decoding.
- Guides and benchmark-specific configurations.
- Resolved recipe JSON carries source repository, commit and path provenance.

Example: `models/Google/gemma-4-E2B-it.yaml` declares 131072 context and variants for native BF16, RedHatAI FP8, Google W4A16 and mixed mobile QAT. Its description explicitly notes alternating local/global attention with different head dimensions. An effective-2B label is insufficient to estimate its memory.

## Limits for our checker

`SCHEMA.md` defines minimum VRAM primarily as total params × precision bytes × 1.2, with explicit exceptions for mixed-precision checkpoints using real checkpoint size. This is not a measured 64K/96K/128K KV capacity guarantee. Hardware lists/profiles and command benchmarks need exact GPU matching; Hopper/Blackwell datacenter recipes do not automatically validate L4, L40S or RTX PRO 6000 kernels.

The schema does not supply a uniform per-layer KV-head/head-dimension/cache-policy description or exhaustive measured context-concurrency matrices for all checkpoints. Those still require model-config enrichment, version-aware handling of hybrid caches and/or startup/workload measurements. Origin filtering also needs original model lineage, not only checkpoint publisher.

## Integration direction

Import the assembled API recipe detail payloads (not only models.json), or assemble pinned upstream sources with the repository's own merge pipeline. Preserve every checkpoint variant and source SHA. Track all entries as assessed, excluded by policy/hardware, or needs metadata. Use recipe minimum VRAM only as a preliminary screen; compute long-context concurrency only when architecture/cache metadata is sufficient. Keep the existing comparison labeled as a curated calculated subset until this import is implemented.
