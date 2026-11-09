# Muru · A little artificial curiosity

**[Open the offline laboratory](index.html)** · [GitHub repository](https://github.com/anttiluode/Muru) · [Research constraints](#what-is-real-and-what-is-not)

An experiment in building a *pet* from computation rather than a character-playing chatbot. Muru lives in a 24×16 hidden world, chooses individual pixels to measure, learns a modest preference from useful observations, and has two tiny attention networks that can rewrite each other's fast weights.

![No dependencies](https://img.shields.io/badge/dependencies-none-6bdfbb) ![Offline](https://img.shields.io/badge/offline-yes-6bdfbb)

## Run

Download this repository and **open `index.html` in your browser**. No server, GPU, framework, account, internet, or installation required. Browsers that restrict `localStorage` for `file://` still run the simulation; persistence may be disabled.

- **Look once / Explore 20:** Muru makes actual measurements and updates its belief among five world hypotheses.
- **Dream 20:** replays a tiny summary of prior measurements, changing the fast weights and preference trace without receiving new sensory evidence.
- **New world:** preserves learned habits and fast weights, clears this world's observations.
- **Reset mind:** discards fast weights and habits and restarts seeded networks.
- **Show actual world:** human-only debug view; it does not feed the observation policy.
- **Coupling:** choose mutual, either one-way direction, or clamp both. Adjust its write strength.
- **Policy:** switch between Muru, pure statistical disagreement, random, and raster. Click any tile to override the chosen next look.
- **Run comparison:** a reproducible five-world, equal-budget check of four policies under mutual vs clamped coupling. Results are computed locally, not pre-rendered.

## What is implemented

- **Two independent 16-channel transformer-style blocks,** each with 16 time-position tokens, two causal scaled-dot-product attention heads (8 channels each), learned-*looking* but initially **random** Q, K, V, O projections, layer normalization, and a small MLP. These weights are not pretrained on language.
- **Matrix-to-matrix coupling:** each network produces a 16×16 activation matrix. At a tick, the Eye's activation matrix moves the Body's 16×16 value projection (`W_V`) toward `base + gain × tanh-like activity` by a bounded exponential update, and vice versa. Clamp prohibits further cross-writes. This is **fast-weight modulation, not backpropagation**.
- **One-pixel eye:** five known synthetic prototype maps are the agent's hypotheses. The environment privately chooses one and adds unmodeled pixel noise. Muru sees only its prior hypothesis maps and revealed observations; the hidden picture is held in a sensor closure. Posterior beliefs update with an explicit Gaussian likelihood.
- **A strong mathematical baseline:** next-observation score is weighted variance of the competing hypotheses, with a small coarse-detail term. Muru adds an attention-derived bias and a persistent, eight-component preference trace strengthened only when a look actually reduces hypothesis entropy. Preference learning is a deliberately simple heuristic, not a claim of a new cognitive learning law.
- **Inspectability:** posterior bars, PSNR, uncertainty history, and separate Eye/Body fast-weight delta heat maps. Tiny habits save in browser local storage and can be exported as JSON.

## The precise question

> Can mutually coupled changing weight matrices influence where an active sensing agent chooses to look, and can their coupled dynamics exhibit behavior that disappears when a feedback direction is clamped?

**A visual difference between mutual and clamped behavior alone is not evidence of emergent intelligence or autonomous learning.** It can simply result from an explicit state perturbation. The included controls make this distinction inspectable. A stronger follow-up experiment should isolate the coupled subsystem, replay an *identical fixed input stream*, compare attractors and clamp interventions, and report results over many seeds.

## What is real and what is not

| Claim | Status |
|---|---|
| Two working multi-head attention networks | Implemented, untrained |
| Matrix-to-matrix cross-writes | Implemented and bounded |
| Chooses where to measure using previously visible information | Implemented, boundary tested |
| An explicit posterior with a variance baseline | Implemented for a five-prototype synthetic world |
| Habit changes from useful observations | Implemented as simple hand-designed update |
| Memories persist between new worlds | Small browser preference trace; **fast weights do not persist across reloads** |
| Genuine emotion, consciousness, autonomous goals | **Not claimed** |
| Proven benefit of cross-wiring over statistical sensing | **Not established** |
| Generalization to unknown real photographs | **Not tested** |

The "mood" display is a visualization derived from measured information gain and reconstruction surprise, not a report of subjective experience. Dreams are deterministic-ish rehearsal under a seeded local PRNG, not sleep, and do not deliver new information.

## Reproducible checks

```bash
node --check core.js
node --check app.js
node --test tests/core.test.cjs
```

Node 22+ suggested. The GitHub Actions workflow repeats these checks. Browser logic is vanilla JavaScript and Canvas; no hosted dependencies are loaded. All evaluation reads of ground truth occur in the environment's scoring path, separate from the agent's selection path.

## Lineage

Built as a playful experimental continuation of [SihtiSilma](https://github.com/anttiluode/SihtiSilma), the OneTinyTransformer loop experiments, the homeostatic ECG reduction, and the discussion of two transformers coupled through each other's matrices. The idea also invites the sort of clamp intervention discussed in Denis Noble's *A Theory of Biological Relativity: No Privileged Level of Causation* (Interface Focus, 2012). The artificial ring is **not** an implementation of cardiac physiology.

MIT license; no model downloads and no online inference.

