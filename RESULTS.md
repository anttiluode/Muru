# First measured results — 2026-11-09

These are **small, synthetic, in-repository measurements**, not a demonstration of general intelligence, animal-like learning, or an advantage over active-sensing baselines.

## Preregistered-style question for the next version

Does reciprocal, bounded cross-writing of two 16×16 attention value-weight matrices cause a repeatable behavior absent from an otherwise identical frozen-weight control, when the **external sensory input sequence is kept identical**?

Current implementation verifies cross-writing and freezing, but **does not yet establish a new autonomous attractor**, since the two conditions can choose different observations and thereby encounter different inputs. A decisive test needs matched inputs and fixed streams.

## Experiment A: active reconstruction

Five independently seeded synthetic 24×16 worlds, seeds `17,29,41,53,67`, 12 looks each. The world class belongs to one of five prototype families; the observer's prior contains the exact prototype candidates but not the hidden noisy truth. Means are computed across worlds. Equal measurement budgets; each look reveals one pixel.

| Brain coupling | Policy | Mean PSNR (dB) |
|---|---|---:|
| Mutual | Seeded random | 22.51 |
| Mutual | Raster | **22.53** |
| Mutual | Bayesian variance | 22.52 |
| Mutual | Muru | 22.51 |
| Clamped | Seeded random | 22.51 |
| Clamped | Raster | **22.53** |
| Clamped | Bayesian variance | 22.52 |
| Clamped | Muru | 22.51 |

**Result:** essentially a tie. The original five-way classification problem becomes easy after a few measurements, and remaining PSNR is dominated by unmodeled pixel noise. This task is too simple to meaningfully test the value of long-term habits or a coupled matrix system. Stronger evaluation needs independent held-out worlds and meaningful ambiguity throughout a longer exploration.

## Experiment B: does coupling affect decisions?

Same seeds and 12-look Muru policy, compared with coupling disabled from the first tick. The number of differing look locations in matching step positions was:

| World seed | Changed look locations / 12 | Eye fast-weight drift (mutual, RMS) | Eye drift (clamped) |
|---:|---:|---:|---:|
| 17 | 7 | 0.0759 | 0.0000 |
| 29 | 0 | 0.0731 | 0.0000 |
| 41 | 0 | 0.0790 | 0.0000 |
| 53 | 0 | 0.0774 | 0.0000 |
| 67 | 0 | 0.0781 | 0.0000 |

**Result:** cross-writing measurably changes the weights, but alters the action sequence in only one of five cases at this setting. This is a **negative result for a strong behavioral influence claim**, not evidence of emergent intelligence. It also suggests the explicit Bayesian score dominates the neural perturbation.

## Reproduce

```bash
node --test tests/core.test.cjs
node - <<'JS'
const {benchmark}=require('./core.js');
console.table(benchmark({seeds:[17,29,41,53,67],looks:12}));
JS
```

Each run is deterministic for the specified seeds. The browser button runs Experiment A locally. The browser is an instrument, not a pretrained AI or a replacement for controlled science.

