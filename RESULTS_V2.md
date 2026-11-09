# Muru v2 — asymmetric Eye / Body checks

**Date:** 2026-11-09. Deterministic CPU-only JavaScript, `node --test tests/core.test.cjs`. These are checks of the implemented wiring, **not** generalization or evidence of a new learning algorithm.

## The architectural intervention

Compared to v1, the Body no longer receives a transformed copy of the Eye's observation tokens. Instead, it receives a 16×16 private memory bank constructed solely from a pooled 16D Eye *activation* message. Rates range from `0.12` to `0.12 × 0.84^15` (an exponential memory time constant of roughly 8–114 ticks). The Eye tokens contain the latest four observed pixel events plus fixed positional probes; its value weights leak toward their random starting point each tick and reset on a new world. Body weights update more slowly and remain across worlds. The Body's output controls a spatial bias for the next look and its Eye fast-write rate.

**Boundary caveat:** the explicit Bayesian posterior and eight-dimensional preference policy remain outside these two organs. They can retain older observations for the baseline and scoring policy. This proves no biological autonomy.

## Five-world comparison

Five fixed synthetic worlds (`seeds: 17,29,41,53,67`), 12 revealed pixels per world. Mean *PSNR* in dB, larger is better. The same hidden worlds and observation budget are used for each row. A 0.01 dB difference is not meaningful evidence of a performance gain on this small set.

| Policy | Mutual coupling | Clamped |
|---|---:|---:|
| Random | 22.561 | 22.561 |
| Raster | 22.574 | 22.574 |
| Bayesian variance | 22.591 | 22.591 |
| **Muru v2** | **22.592** | **22.583** |

There is **no demonstrated performance advantage** over the simple Bayesian formula.

## Fixed-observation feedback control

Two clones start from identical random seeds and receive the **same 14 observation indices**, while one has Body↔Eye feedback enabled and the other is clamped. Their measured values, Bayesian posteriors, and observation maps are identical. The coupled clone develops nonzero Eye and Body `W_V` drifts and a nonzero Body steering vector; the clamped clone has zero cross-write drift and zero Body steering. This verifies causal *implementation of the intervention*, not a novel cognitive ability.

**New-world control:** after 20 looks, Eye and Body fast-weight RMS drifts in the seeded example were about 0.043 and 0.049, respectively, while Body slow-memory RMS was about 0.252. Immediately switching to a new world reset the Eye drift to exactly zero but retained the Body drift and slow-memory contents. This is persistence by design, not a spontaneously discovered habit.

**Longer-term question:** does storing only processed Eye signals (rather than raw values) improve navigation on unfamiliar worlds and under concept shifts? Test on new procedural families and random seeds. Also compare an identically parameterized Body with its memory erased each world. Do **not** tune on this five-scene diagnostic benchmark.
