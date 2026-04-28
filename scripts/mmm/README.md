# Media Mix Modeling (MMM) — Phonebot

Bayesian regression that estimates each paid channel's *incremental* contribution to revenue
(beyond what last-click attribution shows). Tells you, for example, that Meta is driving 1.8x
what Meta Ads Manager reports, because some of those impressions seed Google branded searches.

## What this scaffold gives you

- `mmm_phonebot.py` — fully runnable PyMC-Marketing model using your existing 3-month daily CSVs.
- Output: a JSON file the dashboard can render, with channel contributions, ROAS, and adstock/saturation curves.
- Output: PNG plots for sanity-checking the fit.

## Limitations you should know about before trusting any number

1. **Three months of daily data is the bare minimum.** Robyn's docs recommend 24–36 months, Meridian wants 18+.
   At 90 days you have ~90 observations × ~3 spend variables. Coefficient estimates will have wide
   credible intervals. Treat the output as **directional**, not as a hard reallocation prescription.
2. **No control variables.** Real MMM controls for seasonality, holidays, competitor activity, weather,
   stock availability. We don't have all of these. The model will absorb their effects into channel
   coefficients, biasing the result.
3. **No incrementality test data.** The gold standard is a geo holdout: pause Meta in Tasmania for 3 weeks,
   measure the lift gap. Without that, the MMM is fitting historical correlation. It can be confidently
   wrong if a confounder is missing.
4. **No saturation calibration.** The model fits a Hill saturation curve per channel. Without geo-level
   spend variation, the saturation point is poorly identified.

## Recommended workflow

1. **Run this scaffold first** to get a baseline reading. It will tell you whether your data has any
   signal at all (look at posterior credible intervals — if they cross zero for all channels, MMM
   isn't going to help you yet).
2. **Run a geo holdout test** for 2–4 weeks. Pause one channel in one Australian state. Measure
   uplift in the others (i.e. does Google revenue rise when Meta is off in VIC?).
3. **Refit MMM with the holdout period** as a known intervention. The model can identify saturation
   and adstock far better with a manipulation event in the data.
4. **Iterate quarterly.** MMM is a continuous calibration loop, not a one-off.

## Setup

```bash
cd scripts/mmm
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python mmm_phonebot.py
```

Outputs land in `outputs/`. Drop `outputs/mmm_results.json` into `app/data/` and the dashboard
"MMM Results" panel will pick it up (panel is scaffolded but not yet wired — see TODO at bottom of script).

## Going further

When you're ready for serious MMM:

- **Robyn (Meta open-source, R)** — the most battle-tested. https://github.com/facebookexperimental/Robyn
- **Meridian (Google open-source, Python)** — newer, more flexible. https://github.com/google/meridian
- **PyMC-Marketing (this scaffold)** — Pythonic, hackable. Less polished UX than the above.

You'd need ~24 months of daily data per channel (spend, impressions, clicks, conversions) plus
control variables (calendar effects, weather, holidays, big inventory drops). At your scale, this
is worth a junior data scientist's time once the data is in BQ and well-organized.
