---
name: GA4 → BigQuery export
description: GA4 raw event export to BigQuery set up 2026-04-28; data lands ~24h after but no historical backfill exists
type: project
originSessionId: 7f03a6f6-333e-4d69-9a8e-e35bdc01ba82
---
GA4 → BigQuery link created on 2026-04-28.

- GCP project: `bigquery-api-494711` (fresh project, no freelancer IAM exposure — created specifically for this export)
- Dataset (auto-created on first export): `analytics_284223207` (matches the GA4 property ID for Phonebot AU; the earlier `_2765078625` figure was the web stream ID, not the dataset name)
- Web stream: "Phonebot - GA4" (stream ID 2765078625, GA4 property 284223207), ~25,182 events/day, ~3% of 1M free daily limit
- Daily shards confirmed as of 2026-04-30: `events_20260428`, `events_20260429` (52,572 events total). New shard typically lands ~24-48h after the day closes.
- `pseudonymous_users_*` tables also present per shard
- Export type: Daily (not Streaming) for both event data and user data
- Region: australia-southeast1 (Sydney)
- BigQuery API enabled. Google Analytics API also enabled but unused/harmless.

**Why:** User wanted conversion funnel analysis (their own confirmation) plus broader profit-driven analytics that Supermetrics CSV summaries can't answer (user-level joins, unsampled events, SKU-level browse-to-buy, LTV by channel).

**How to apply:** Dashboard reads BQ live via `app/api/lib/bq.ts` (5-min in-process cache). 5 procedures wired in `profit_ops` router: `bqStatus`, `bqClickIdCapture`, `bqChannelAttribution`, `bqFunnelByChannel`, `bqSessionCapture`, `bqLandingPages`. For analysis needing 30d+ history, blend with Supermetrics CSVs in `1_month/ga4/`. Per-procedure logic should pull window stats and tailor caveat copy by `windowDays` rather than hardcoding "1 day of data".
