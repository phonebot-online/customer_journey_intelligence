---
name: Email-based alerting via Brevo
description: User prefers email over Slack for alerts; both anomaly worker and weekly diagnostic AI use Brevo transactional API
type: project
originSessionId: 7f03a6f6-333e-4d69-9a8e-e35bdc01ba82
---
User explicitly chose email over Slack for the alerting layer (asked to swap mid-build, 2026-04-29). Reason: already has Brevo account for marketing email — no new vendor signup, free transactional tier covers their volume.

**Required env vars** for both workers:
- `BREVO_API_KEY` (xkeysib-...)
- `ALERT_EMAIL_TO` (defaults to user's email erroorfree@yahoo.com per their setup)
- `ALERT_EMAIL_FROM` (must be a Brevo-verified sender like alerts@phonebot.com.au)
- `ANOMALY_Z_THRESHOLD` (optional, anomaly worker only)
- `ANTHROPIC_API_KEY` (diagnostic AI worker only)

**Workers:**
- `scripts/anomaly/anomaly_worker.ts` — daily cron, 28d z-score scan, HTML email
- `scripts/diagnostic_ai/weekly_diagnostic.ts` — weekly Monday cron, Claude-synthesized memo, markdown→HTML email
- Setup detailed in `scripts/anomaly/README.md` and `scripts/diagnostic_ai/README.md`

**Why:** User wants signals pushed to inbox where they already manage business correspondence, not yet-another-Slack-channel. Reuses existing Brevo billing relationship.

**How to apply:** When adding new alert types, mirror the existing pattern in `anomaly_worker.ts` — Brevo's `/v3/smtp/email` endpoint with `htmlContent` + `textContent` and SHA-256-style sender object. Don't suggest Slack/Resend/SendGrid as alternatives unless user asks.
