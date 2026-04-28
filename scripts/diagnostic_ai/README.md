# Diagnostic AI — weekly synthesis report

A Claude-powered worker that runs weekly, ingests every dashboard signal, and produces:
- Top 5 things that broke this week (anomalies + likely causes)
- Top 3 opportunities (where to invest more)
- 1 strategic recommendation for next week

## Why this is the highest-leverage piece in the stack

Your dashboard already shows you everything. The bottleneck isn't data — it's synthesis. A senior analyst
spends ~5 hours per week reading the dashboards and writing a memo. Claude does the same job in 5 minutes
for ~$1 in API costs. That's the core thesis.

What this gives you that the dashboard alone doesn't:
- **Causal explanation, not just detection.** "Meta ROAS dropped 18%" → "because audience saturation;
  3 ad creatives are showing 12 impressions/user, fatigue threshold is 5–8."
- **Cross-signal correlation.** Anomalies in two metrics correlated in time matter more than either alone.
- **Memory.** Last week the AI flagged X. This week it tracks whether your action moved the needle.
- **One paragraph instead of 15 dashboards.** You read it Monday morning over coffee. Decisions in 10 min.

## Architecture

```
                    [Cron: Monday 06:00 AEST]
                              │
                              ▼
           ┌────────────────────────────────────┐
           │   weekly_diagnostic.ts (this dir)  │
           └────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  [Pull from tRPC]    [Pull from BQ]      [Pull from CSVs]
  - profitOps.*       - GA4 events         - latest CMS export
  - diagnostics.*     - LTV by channel     - GMC snapshot
  - dashboard.*
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │  Render to compact JSON │
                │  (~5–10kb of structured │
                │   findings)             │
                └─────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │  Claude API call        │
                │  (model: claude-opus-4-7│
                │   with prompt caching)  │
                └─────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │  Write to:              │
                │  - app/data/weekly_*.md │
                │  - Slack channel        │
                │  - Email (optional)     │
                └─────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │  Dashboard panel reads  │
                │  the latest weekly_*.md │
                └─────────────────────────┘
```

## Files

- `weekly_diagnostic.ts` — main worker (scaffolded, needs API key + tuning)
- `prompts/system.md` — the prompt that turns data into insight
- `prompts/example_output.md` — what good looks like
- `dashboard_panel/` — TODO: the React panel that renders the latest report

## What I need from you to make this work

### 1. Anthropic API key

Sign up for the Anthropic API: https://console.anthropic.com
Add to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Cost estimate: ~$1–3/week per report at current pricing (Claude Opus 4.7 with prompt caching).

### 1b. Brevo API key + verified sender (same as anomaly worker)

```
BREVO_API_KEY=xkeysib-...
ALERT_EMAIL_TO=erroorfree@yahoo.com
ALERT_EMAIL_FROM=alerts@phonebot.com.au   # Brevo-verified
```

Reuse the values you set up for the anomaly worker — same account.

### 2. Decision: which data goes into the prompt

The worker template assembles data from the dashboard's tRPC procedures. Defaults included:
- `profitOps.wasteHeadline` (top-line waste estimate)
- `profitOps.anomalyScan` (this week's anomalies)
- `profitOps.shouldNotAdvertise` (loss-making SKUs)
- `diagnostics.brandConditionMixShift` (brand revenue trends)
- `diagnostics.shoppingSkuPerformance` (SKU performance)
- `dashboard.headlineKpis` (revenue, GP, orders, ROAS)

You can add/remove. Each adds context but also tokens. Keep total prompt under ~50k tokens for sane latency + cost.

### 3. Tone calibration

Read the first 2–3 outputs critically. If Claude is being too cautious ("you might consider..."), too confident ("definitely pause Meta"), or missing your business context ("recommend doing X" when X is obviously not feasible for Phonebot), edit `prompts/system.md` to push back.

The prompt is the product. Iterate on it.

### 4. Where the output goes

- **Markdown file** → `app/data/weekly_diagnostic_<date>.md` for archive
- **Email** → via Brevo, same env vars as the anomaly worker
- **Dashboard panel** → reads the latest md and renders. Easy add later.

## Why this isn't done yet

I don't want to ship a half-baked AI feature that will produce garbage on its first run and erode your trust in the rest of the dashboard. The scaffold is here. The right way to bring it online is:

1. You provide the API key
2. Run the worker manually with `--dry-run` 5–10 times
3. We tune the prompt together based on what comes back
4. Then enable the cron + Slack output

This is a 1–2 hour collaborative session, not a code-and-ship. Tell me when you've got the key and we'll do it.
