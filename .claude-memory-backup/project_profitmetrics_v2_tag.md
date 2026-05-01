---
name: ProfitMetrics Conversion Booster V2 deployed 2026-04-29 (accidentally)
description: User accidentally published a dormant Pat Singleton draft to live on 2026-04-29 01:55 AM; Pat's authoring date unknown
type: project
originSessionId: 7f03a6f6-333e-4d69-9a8e-e35bdc01ba82
---
GTM Version 86 — "PM | Adding ProfitMetrics Conversion Booster V2" — went live on phonebot.com.au at 2026-04-29 01:55 AM. Initially I assumed Pat published it from today's access, but the user clarified: Pat's NEW Publish access was granted only 2026-04-29 and he hadn't accepted the invite yet. The draft was authored by Pat during some PRIOR access engagement (date unknown), sat dormant in the workspace, and the user accidentally hit Publish/Submit while clicking around the Container Diagnostics screen.

**What's now live on production:**
- Tag: "Profitmetrics - Conversion Booster v2 Purchase"
- Custom Template: same name
- Both authored by Pat Singleton at some prior unknown date

**Risk:** Low-to-moderate. It's a tracking tag (not a UI/checkout tag), from a known paid vendor (ProfitMetrics). Worst case is degraded tracking quality if Pat's draft is outdated relative to current ProfitMetrics tag spec. Will not visibly break the site.

**Why:** User was unfamiliar with GTM UI and didn't realise that clicking certain buttons in the diagnostics flow would publish a dormant draft.

**How to apply:** Wait for Pat's response to the email sent 2026-04-29 confirming whether Version 86 is still current or outdated. If outdated, roll back via Versions → previous version → Set as Latest → Publish, then let Pat redeploy cleanly. Do not roll back unilaterally — Pat's answer dictates the move. Future-Claude on this project: if user asks about ProfitMetrics tracking changes after 2026-04-29, this incident is the context.

**Lesson for guidance:** When advising on GTM operations, warn explicitly that any "Submit" / "Publish" / "Update Workspace" + Submit chain pushes whatever is in the workspace to LIVE — including dormant drafts the user didn't author.
