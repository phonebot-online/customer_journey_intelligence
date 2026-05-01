---
name: BigQuery access via gcloud CLI
description: Install gcloud + bq locally to enable Claude to run BigQuery queries directly without user copy-paste; per-machine auth
type: reference
originSessionId: 7f03a6f6-333e-4d69-9a8e-e35bdc01ba82
---
User does NOT want to copy-paste BQ queries from Claude into the BigQuery web console. The path to autonomous BQ querying is local `gcloud` + `bq` CLI.

**One-time setup per machine:**
```
brew install --cask google-cloud-sdk
gcloud auth login                              # opens browser, signs in as phonebot3073@gmail.com
gcloud config set project bigquery-api-494711
bq query --use_legacy_sql=false --max_rows=1 "SELECT 1 AS ok"
```

**Once installed, run queries via Bash:**
```
bq query --use_legacy_sql=false --format=json "SELECT ..."
```

**Key project + dataset:**
- Project: `bigquery-api-494711`
- Dataset: `analytics_284223207`
- Views deployed: `vw_events_flat`, `vw_events_items_flat`, `vw_sessions`, `pseudonymous_users`

**Why:** Supermetrics MCP can't query BQ (only writes to it). No BQ MCP exists. gcloud is the standard. ServiceAccount JSON key is cleaner for unattended use (cron / diagnostic AI worker) but interactive-auth-via-browser is fine for human-in-the-loop sessions.

**How to apply:** Before recommending the user run a BQ query, check if `bq` is on PATH. If yes, run it through Bash. If no, prompt user to install. On a new machine the same 4 steps apply.

**Edge case:** auth tokens expire; if `bq query` fails with "credentials expired", run `gcloud auth login` again.
