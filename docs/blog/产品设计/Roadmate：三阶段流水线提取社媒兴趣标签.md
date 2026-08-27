---
title: "Roadmate Concept Product: Three-Stage Pipeline for Social Interest Tags"
createTime: 2026/07/30 21:00:00
permalink: /article/8710aee9/
description: A three-stage pipeline that extracts attributable, weighted concrete interest tags from social content to power icebreaker topic recommendations.
---

<video src="/video/roadmate-show2_compressed.mp4" controls playsinline style="width: 100%; border-radius: 8px;"></video>

> GitHub repo

<CardGrid>
  <RepoCard repo="1nFrastr/roadmate" />
</CardGrid>

## The problem to solve

The product does not need vague categories like “music / travel.” It needs concrete topics you can open with in person.

Examples: “2026 World Cup,” “Xiamen National Day free trip,” “pour-over coffee enthusiasts,” and so on.

It also needs to answer:

1. How often does this interest appear?
2. How fresh is it?
3. Which posts support it?

Without an attribution chain, recency weighting is hard, and so is evaluating whether an inference is trustworthy.

## Why naive approaches fall short

We tried three approaches in sequence.

**Approach A: Per-post parallel extraction**

Good throughput; per-post attribution is clear. But each post emits its own tags — near-duplicates are hard to merge, and there is no global view.

**Approach B: Rolling corpus compression**

You can carry a prior forward and save context. After batch merges it is hard to stably return to a single post; freshness weights become unreliable; intermediate steps are hard to assert.

What we actually need:

> Keep post-level time, do global semantic dedup, and still trace final tags back to source posts.

## Core design

Current approach C splits the work into three stages, then lets code compute weights:

```
Post input
  → Stage 1 parallel preprocess
  → Stage 2 timeline merge
  → Stage 3 tag extraction
  → Code aggregates frequency / sentiment / recency / weight
  → Embedding
  → Word cloud / device matching
```

| Stage | What the model does | What code does |
| --- | --- | --- |
| 1 Preprocess | Detect spam posts; compress to short summaries | Concurrent scheduling; filter noise |
| 2 Timeline merge | Merge semantically similar posts within ~7 days | Merge time = latest post |
| 3 Tag extraction | Emit icebreaker tags, sentiment, source entries | Frequency, recency, weight, eviction |

Product icebreaker rules live mainly in stage 3. The first two stages are engineering preprocess — tunable in isolation without cascading breakage.

Approach A/B code remains for comparison, but the Web UI and `bench:timeline` both run approach C.

## Key mechanisms

### 1. Attribution chain

Tags are not done once bound to post IDs. The chain is:

```
Tag entryIds → timeline entry sourcePostIds → post createdAt
```

So frequency and recency are computed in code from real timestamps — not verbal freshness guesses from the model.

### 2. Timeline merge window

Content that is highly similar within an adjacent 7-day window can merge, to control context length.

Same-theme posts more than 7 days apart do not merge. Frequency can still reflect cross-period repeat interest — e.g. coffee mentioned again weeks later.

If the model fails to merge, fall back to “one post, one entry.” Posts are not dropped; dedup is just weaker.

### 3. Weight formula

Same-name tags merge case-insensitively first, then three dimensions:

- **frequency**: expanded source-post count / total posts
- **sentiment**: mean sentiment across source entries
- **recency**: based on last occurrence, `exp(-λ × days since)`, λ = 0.08

Final:

```
weight = 0.40 × frequency + 0.20 × sentiment × recency + 0.40 × recency
```

Sentiment is multiplied by recency so older interests’ sentiment contribution also decays.

Filters:

- Keep only tags that appear in at least 1 post
- Appear once and older than 60 days → drop
- Take top 20 by weight

Coefficients and windows live in `constants.ts`.

### 4. Full re-run

Every “infer and save” re-runs all three stages — no incremental skip.

That buys reproducibility and avoids rolling-prior drift. Cost: higher latency on long lists.

### 5. Embedding and word cloud

Vectors are built only for aggregated tag names. New tags are generated lazily.

Ball size in the word cloud is relative rank after min-max normalization within the current batch — not a linear map of absolute weight to pixels. Custom tags map from slider weight absolutely.

## Execution flow

```mermaid
flowchart LR
  P[Post list / X fetch] --> S1[Stage 1 preprocess]
  S1 --> S2[Stage 2 merge]
  S2 --> S3[Stage 3 extract]
  S3 --> A[Code aggregate]
  A --> E[Embedding]
  E --> U[Word cloud / match score]
```

Two input modes:

- Post list: paste, or import/export as `roadmate-posts/1` text
- X username: pull original tweets via twitterapi.io into the same post structure

Post lists are not written to localStorage. After refresh, re-import or re-fetch. Profiles store only tags and embeddings.

## Deliberately not doing

- Do not treat A/B as the main path — comparison only.
- Do not let the model emit final weight. Frequency and recency are code’s job.
- No incremental inference yet — reproducibility and evaluability first.
- Do not persist raw post text into the browser profile.

## Relation to other modules

After inference is written to the local profile, Playground scores match via embedding cosine and tag overlap.

The device side does not care about the three stages — only final tag vectors. The split lets “who is worth approaching” and “how to respond when close” iterate separately.

## Evaluation

CLI and Web UI share one pipeline:

```bash
npm run bench:timeline
npm run bench:timeline -- --verbose
npm run bench:timeline -- --case multi-theme-user
```

Cases live in `scripts/fixtures/corpus-cases/`. Assertions can check keyword hits, banned words, tag counts, and a floor on valid posts.

`--verbose` prints per-post noise judgments, merge entries, and the final weight table — useful for locating which stage failed.

## Tuning knobs

| Constant | Role |
| --- | --- |
| `WEIGHT_FACTORS` | Three-way weight mix |
| `RECENCY_DECAY_LAMBDA` | How steep time decay is |
| `TIMELINE_MERGE_WINDOW_DAYS` | Merge window |
| `MAX_INFERRED_TAGS` / `STALE_TAG_DAYS` / `LLM_CONCURRENCY` | Output cap, stale eviction, concurrency |

Orchestration and prompts mainly live in:

- `server/timelineInference.ts`
- `prompts.ts`
- `tagUtils.ts`
- `api/openrouter.ts`

## Summary

The core of this inference design:

> Preserve post-level time attribution first, then global semantic dedup, then reproducible interest weights in code.

Concretely:

- Stage 1: throughput and noise detection
- Stage 2: control duplicates and context length
- Stage 3: icebreaker-ready tags
- Code owns frequency / recency / weight and feeds embeddings

Result: tags that are more concrete, explainable, and evaluable — and that stably drive near-field matching.
