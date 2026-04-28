# Anomaly worker — daily statistical alerting via email

Runs once per day, emails every metric that moved >2σ from its 28-day baseline using your existing Brevo account.

## Why Brevo

You already use Brevo for marketing campaigns — the same account exposes a transactional-email API. No new vendor signup, free tier covers 300 emails/day (way more than you'd send), and your sender domain is already verified.

## Setup

1. **Get a Brevo API key.** Brevo dashboard → top-right profile → SMTP & API → API keys → Generate a new API key. Name it `phonebot-dashboard-alerts`.
2. **Confirm a verified sender email.** Brevo dashboard → Senders & IP → Senders. Pick or add the email you want alerts to come *from* (e.g. `alerts@phonebot.com.au`). Brevo has to verify the domain or address before it'll send.
3. **Set env vars.** Add to your shell profile (`~/.zshrc`) or a `.env`:
   ```bash
   export BREVO_API_KEY='xkeysib-...'
   export ALERT_EMAIL_TO='erroorfree@yahoo.com'
   export ALERT_EMAIL_FROM='alerts@phonebot.com.au'   # must be Brevo-verified
   export ANOMALY_Z_THRESHOLD='2.0'                    # optional
   ```
4. **Test it.**
   ```
   tsx scripts/anomaly/anomaly_worker.ts
   ```
   You should see a console log + an email in your inbox if anomalies were detected.
5. **Cron it (macOS).**
   ```
   crontab -e
   # add:
   0 6 * * * cd "/Users/admin/Desktop/Customer Intelligence Dashboard" && /usr/local/bin/tsx scripts/anomaly/anomaly_worker.ts >> logs/anomaly.log 2>&1
   ```

## Or run via Claude Code scheduled agent

```
/schedule run scripts/anomaly/anomaly_worker.ts every weekday at 6am AEST
```

## What gets flagged

For each (channel, metric) pair, the trailing 28-day rolling mean and stddev define normal.
A z-score is computed for the most recent day's value. Anything ≥ 2σ is reported.

Channels and metrics covered:
- Google Ads: cost, conversions, conv_value, ROAS
- Facebook: cost, purchases, purchase_value, ROAS
- Bing: cost, conversions, revenue
- CMS web orders: orders, revenue, gp

The email lands as a clean HTML table — channel, metric, today's value, 28-day mean, %Δ, z-score. Anomalies ≥3σ are flagged 🚨; 2–3σ are ⚠️.

## Tuning

- **Threshold too sensitive?** Raise `ANOMALY_Z_THRESHOLD` to 2.5 (~1% of normal days flagged) or 3.0 (~0.3%).
- **Want weekly summaries instead of daily?** Modify the SQL `WHERE date = MAX(date)` clause to include the full week.
- **Need a metric that isn't here?** Add a `UNION ALL` line in the unioned CTE in `anomaly_worker.ts`.
- **False positives on weekends?** Switch to weekday-of-week-aware baselines. Current model doesn't account for weekly seasonality.

## Why this is "v1"

- No causal explanation. The worker tells you what changed, not why.
- No correlation tracking. If FB ROAS and Google CVR drop together, that's a stronger signal than either alone — currently they're flagged independently.
- No quiet hours. Boxing Day will look like an anomaly because revenue spikes.

The diagnostic AI scaffold (see `scripts/diagnostic_ai/`) is the v2: ingest the anomalies, query underlying data, and write a paragraph explaining what likely caused each one.
