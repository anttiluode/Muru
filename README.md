# Muru v2 · An Eye that forgets, a Body that remembers

**[Open Muru](https://anttiluode.github.io/Muru/)** · [Offline entry point](index.html) · [v2 measurements](RESULTS_V2.md) · [v1 measurements](RESULTS.md)

Muru is an **offline research pet**, not an LLM pretending to have feelings. Two small, *untrained* attention networks now have asymmetrical jobs: the Eye briefly senses the outside world; the Body retains only processed signals received from the Eye, and can regulate the Eye's future attention and fast-weight plasticity. Every mechanism is inspectable in plain JavaScript.

## Try it

Open `index.html` in Chrome, Edge or Firefox. No build tools, network, cloud GPU, API keys, or packages are required. Or use the [GitHub Pages laboratory](https://anttiluode.github.io/Muru/) if Pages is enabled.

1. **Look once / Explore 20:** reveal a pixel and advance both organs. Compare the two weight heatmaps with the **Body / slow memory** heatmap below them.
2. **New world:** Eye loses its recent sensory buffer and fast-weight changes; Body retains its slow state and changed weights.
3. **Switch coupling:** `mutual`, `eye → body`, `body → eye`, `clamped`. Clamping stops cross-writes and disables Body steering. Eye→Body *sensory communication stays on*, even when weight coupling is clamped.
4. **Dream 20:** run the internal loop and rehearse the simple preference trace without reading any new pixels. Dreams **do not** inject archived pixels back into the Eye or Body memory.
5. **Run 5-world comparison:** benchmark random, raster, Bayesian variance, and Muru on equal observation budgets. **Do not assume that Muru beats the baseline.**

### Architecture: the missing division of labor

```text
                        HIDDEN 24 × 16 WORLD
                          │ read one pixel
                          ▼
                   EYE — FAST (16×16)
                 latest 4 events, no older
                 sensor history in input
                          │
                  compressed 16D message
                          ▼
           BODY — PRIVATE SLOW TRACE (16×16)
          16 EMA timescales ≈ 8–115 looks
                  │              │
          Body's value matrix      │
          stores long-term state   │
                  │              │
                  └── feedback ────┘
                    Eye's next-look bias
                    + gated fast plasticity
```

- **Eye:** one 16-token, 16-channel, **two-head causal attention** block. Its first 12 tokens are fixed spatial probes; the last four carry only the four latest sensed pixel values and their locations. Earlier observations, posterior beliefs, saved archive, and Body memory are **not passed to the Eye tokens**. Its `W_V` fast matrix relaxes toward its random base at each tick and resets when a new world starts.
- **Sensory uplink:** the Eye's 16×16 *processed activation sheet* is pooled to one 16D signal. No raw pixel, `world.peek()`, posterior or hypothesis map is passed directly into the Body. The `look()` sensor closure is still the only access to the chosen hidden pixel.
- **Body:** a second independent 16-token, 16-channel, two-head attention block. It receives only a bank of 16 exponential moving averages of the Eye's processed messages, updated at different rates: faster top rows, slower bottom rows. The Body's own `W_V` is changed **more slowly** than the Eye's. Body memory and weights survive new worlds.
- **Controller:** Body activations generate an eight-channel bias in Muru's spatial look-scoring formula and a bounded multiplier for Body→Eye fast-weight updates. The random controller is **not trained** to be optimal. Body regulation is switched off when Body→Eye is clamped or coupling is zero.
- **Separate statistical notebook:** for controlled comparisons, Muru retains an explicit Bayesian posterior over five known synthetic world templates and a simple eight-value preference heuristic. Those mathematical state variables can remember all observed pixels; **they are not the Eye's sensory token memory and they are not direct Body inputs**. The variance baseline uses the same posterior. This is not a fully autonomous, end-to-end learned agent.

### Read the three matrix displays correctly

`EYE / value-weight change` and `BODY / value-weight change` show `current W_V − initial W_V`, *not* the absolute weights and not activity moving vertically between layers. **Rows are token/feature positions.** `BODY / slow memory (not weights)` shows the actual internal EMA memory used as the Body's input: row 1 changes quickly, row 16 retains older processed impressions. It is a separate object from the Body's `W_V`.

A transition to `clamped` stops new cross-writes and Body steering, but the Eye's existing fast changes still **decay**. `eye → body` writes only Body weights; `body → eye` writes only Eye weights, though the one-way sensory uplink to Body remains present in every setting.

## Experiments and scientific caution

The former *twin inputs* shortcut is gone. [RESULTS_V2.md](RESULTS_V2.md) records the deterministic local checks, a fixed-observation clamp intervention, and the first v2 benchmark. [RESULTS.md](RESULTS.md) retains the original v1 baseline. The `Muru` policy is still approximately tied with a very simple statistical selection rule. Differences in heatmaps or chosen locations do **not** prove learning, animal-like cognition, or a biologically realistic nervous system.

| Property | What is established |
|---|---|
| Eye takes only four recent observations | Encoded and unit-tested |
| Body gets no direct sensor samples | Encoded and unit-tested at its `forward()` input |
| Body maintains state across new worlds | Implemented and tested |
| Eye forgets fast weights on new worlds | Implemented and tested |
| Body steers the Eye only with feedback enabled | Implemented and tested |
| True coupled dynamics and memory traces | Observable; **not proof of emergence** |
| Cognitive curiosity, emotion, consciousness | **Not claimed** |
| A measured advantage over Bayesian selection | **Not established** |

**Browser persistence:** `saveHabit()` v2 includes the Body's memory and Body value-weight matrix, plus the prior small preference summary. Prior v1 browser saves load without discarding old habits. Fast Eye weights and live sensory observations do not persist across reloads. Saved measurements in the research archive are already observed values, never hidden/unobserved pixels. Reset Mind clears them.

## Reproduce

```bash
node --check core.js
node --check app.js
node --test tests/core.test.cjs
```

Node 22+ recommended for tests; browser works without Node. GitHub Actions runs the same checks. Sources: [`core.js`](core.js) (simulation), [`app.js`](app.js) (UI), [`tests/core.test.cjs`](tests/core.test.cjs).

Built from the SihtiSilma active-eye experiments, OneTinyTransformer, feedback homeostasis, and Denis Noble's cardiac clamp thought experiment. The artificial pet is not a biological heart or evidence of artificial consciousness.

MIT license.
