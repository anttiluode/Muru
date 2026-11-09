# Muru v3 — the pillar experiment

**Measured:** 2026-11-09. **Reproduce:** `node scripts/rank_report.cjs` and `node --test tests/*.test.cjs`. The deterministic five-seed experiment also runs in [GitHub Actions](https://github.com/anttiluode/Muru/actions/workflows/check.yml). [View in the browser](https://anttiluode.github.io/Muru/) in the **04 / Pillar Experiment** panel.

## Question

Are the vertical stripes in Muru's Eye weights and Body memory signs of distinct, dynamically organized information, or are rows converging toward the same vector? Does reciprocal coupling itself cause the pillars, and what changes when feedback is clamped or the world is switched?

## Controlled procedure

- Five seeds: **17, 29, 41, 53, 67**; three interventions for every seed.
- The interventions are **mutual throughout**, **mutual through look 24 then clamped**, and **clamped from the start**.
- Replay **48 fixed-position sensor observations** in the first 24×16 procedural world, change everyone to the **same new world** (seed + 10000), and replay another **48**. Every arm receives **identical observation locations, values, and Bayesian posterior updates**; the intervention is internal. These are forced observations, not free-running choices.
- Sample all three matrices every four looks, including checkpoints **just before and immediately after the new-world reset at look 48**. Each rank is computed from the full 16×16 matrix.
- `Eye ΔW` and `Body ΔW` are their *value-weight matrices minus the initial random matrices*, not the complete weight matrices; `Body memory` is the actual slow 16×16 EMA bank.

**Effective rank** is `exp(−sum pᵢ log pᵢ)` where `pᵢ = sᵢ² / sum(sⱼ²)`, with `sᵢ` the singular values. Exactly zero matrices are defined to have effective rank 0; an equal-energy rank-16 matrix has effective rank 16. **Row uniformity** is `n × ||mean row||² / ||matrix||²`, ranging from 0 to 1; identical rows produce 1. We also measure top singular-energy share and RMS magnitude. A near-rank-one matrix need *not* have identical rows, so both statistics are necessary.

## Results

Five-seed mean results, reported to three decimals. Each group below is measured at look 24, just before the switch at look 48, immediately after the switch, and at look 96.

| Matrix / intervention | Rank 24 | Rank 48 before | Rank 48 reset | Rank 96 | Row uniformity 96 | Top singular share 96 |
|---|---:|---:|---:|---:|---:|---:|
| **Eye ΔW / mutual** | 1.056 | 1.052 | **0** | **1.041** | **0.993** | 0.993 |
| Eye ΔW / clamp at 24 | 1.056 | 1.056 | **0** | **0** | 0 | 0 |
| Eye ΔW / clamped from start | 0 | 0 | 0 | 0 | 0 | 0 |
| **Body ΔW / mutual** | 5.440 | 5.440 | **5.440** | **5.454** | **0.284** | 0.310 |
| Body ΔW / clamp at 24 | 5.440 | 5.440 | 5.440 | 5.440 | 0.286 | 0.313 |
| Body ΔW / clamped from start | 0 | 0 | 0 | 0 | 0 | 0 |
| **Body memory / mutual** | 1.058 | 1.059 | **1.059** | **1.058** | **0.961** | 0.990 |
| Body memory / clamp at 24 | 1.058 | 1.059 | 1.059 | 1.058 | 0.961 | 0.990 |
| Body memory / clamped from start | 1.058 | 1.059 | 1.059 | 1.058 | 0.961 | 0.990 |

Other context at look 96: mutual **Eye ΔW RMS 0.051**, **Body ΔW RMS 0.098**, and **Body memory RMS 0.270**; Body ΔW RMS after clamping at look 24 was **0.053**. Rank and RMS are different measurements, and a persistent fixed matrix can retain its rank while its update rate is zero.

## What the intervention establishes

1. **The Eye's weight-change pillars are genuinely near rank one:** 1.041 effective rank, 0.993 row uniformity. They come from the particular low-dimensional feedback signal used to update its `W_V`, not from all the original Eye weights suddenly becoming rank one.
2. **The Body has substantially richer changed weights:** 5.454 effective rank and only 0.284 row uniformity. The matrices may visually share colors yet have very different geometry.
3. **The slow-memory pillars do not require reciprocal weight feedback.** The memory's rank of about 1.058 and its row uniformity of about 0.961 are nearly identical across all three arms, including the always-clamped arm. This follows naturally from the implementation: every memory row averages the *same* compressed Eye message, with a different time constant.
4. **A new world resets Eye weight changes to exactly zero, but not Body weights or memory.** The discontinuity at look 48 is explicitly programmed. Clamping after look 24 stops new Body weight updates, so it retains the earlier structure. When subsequently changing worlds, the Eye loses any remaining weight change.
5. **Useful knowledge is not established.** A high effective rank can encode noise or a static random artifact; a low effective rank can encode a useful sufficient statistic. None of these rank measurements demonstrates generalization, spontaneous learned habits, attractor stability, or better perception. The existing performance comparison remains essentially tied with the Bayesian variance baseline.

## Interpretive boundary and next experiment

This is a *geometry audit*, not a new cognitive ability. The strong similarity of Body-memory ranks in all three arms is especially informative: the system's *built-in broadcast/EMA organization* explains much of the visual convergence without invoking emergent intelligence. The Eye's weight-change rank is also strongly shaped by the Body's shared-message structure.

For a sharper causal test, hold fixed the **same actual stream of processed Eye messages** while varying the memory mechanism: broadcast EMA versus position-specific messages (e.g. distinct learned projections). Keep the same parameters and compare the effective-rank curves, as well as **held-out new-world prediction quality**. That would test whether allowing the Body to store distinct information across rows makes the memory more useful, not merely more complex.

## Inspect and reproduce

- [`diagnostics.js`](diagnostics.js) computes a dependency-free symmetric-Jacobi singular spectrum and all three matched-observation trajectories.
- [`scripts/rank_report.cjs`](scripts/rank_report.cjs) prints the table directly. Use `node scripts/rank_report.cjs --json` to export all per-seed measurements.
- [`tests/diagnostics.test.cjs`](tests/diagnostics.test.cjs) verifies analytic rank-zero, rank-one, rank-two and full-rank matrices and the world-switch/clamp replay invariants.
- The **Pillar Experiment** browser panel plots effective rank, row uniformity, and top singular-energy share. It can export complete seed-level JSON without changing the on-screen pet.

All software remains static and offline. No pretrained neural network or training is involved.
