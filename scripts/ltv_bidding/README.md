# LTV-aware bidding — Phonebot playbook

Goal: stop bidding on first-order ROAS and start bidding on customer lifetime value (LTV) by acquisition channel.
Expected outcome at your scale: 15–25% net profit improvement at flat or lower spend.

## Why this matters for Phonebot specifically

Phones have a 2–3 year repurchase cycle, but accessories/cases/cables/repairs are immediate. A customer
acquired via Meta might have lower first-order ROAS than Google Shopping, but if they buy three accessories
in the next 60 days and replace their phone in 18 months, their 36-month LTV could be 2–3× higher.

Killing Meta because first-order ROAS is poor would kill your highest-value channel. LTV-aware bidding
fixes this by telling the ad platforms which customers are worth bidding harder for.

## Prerequisites (in order)

1. ✅ GA4 → BigQuery export (set up 2026-04-28). At least 14 days of data needed before joins are useful.
2. ⏳ Match GA4 events to your CMS orders. Two paths:
   - **Path A (preferred):** push the CMS order ID into GA4's `purchase` event as a custom parameter (`transaction_id` is the GA4 standard). After deployment, you can join `events` BQ table on `event_params.value.string_value WHERE event_params.key = 'transaction_id'` to your CMS orders.
   - **Path B (fallback):** match by hashed email. Push `user_id` (a SHA-256 hash of the customer's email) to GA4 from your checkout. Then join GA4's `user_id` to CMS `Email` (also SHA-256 hashed).
3. ⏳ Backfill historical LTV from CMS. Compute 12-month LTV per customer from `fact_web_orders` joined by Email. This is where you live without a BQ join — see `historical_ltv.sql`.

## Files in this folder

- `historical_ltv.sql` — DuckDB query against your existing 12-month CMS data. Computes LTV per customer.
- `bq_ga4_to_cms_join.sql` — BigQuery query to join GA4 events to CMS orders once both paths above are set up.
- `bq_ltv_by_acquisition_channel.sql` — once joined, produces LTV by first-touch channel × campaign × geography.
- `customer_match_upload.md` — step-by-step Google Ads Customer Match upload guide.
- `meta_capi_value_rules.md` — same for Meta value-based bidding.

## The end-to-end loop

```
[GA4 BQ events]  ─┐
                  ├─ JOIN ON user_id ──→ [LTV by acquisition channel]
[CMS orders]    ──┘                              │
                                                 ▼
                                  [LTV-tier customer list per channel]
                                                 │
                            ┌───────────────────┴───────────────────┐
                            ▼                                       ▼
                  [Google Customer Match upload]         [Meta Custom Audience upload]
                            │                                       │
                            ▼                                       ▼
                  [Smart Bidding value rules]          [Value-based lookalikes]
                            │                                       │
                            └────────── Bid more for predicted-high-LTV ──────────┘
```

## What you do every week, manually, until automated

1. **Tuesday:** export your top-LTV customers from `historical_ltv.sql` (top 20% LTV).
2. **Tuesday:** upload that segment to Google Ads Customer Match as `phonebot_high_ltv_top20`. Same to Meta.
3. **Wednesday:** in Google Ads → Smart Bidding → value rules: add a +30% bid modifier when audience matches `phonebot_high_ltv_top20`.
4. **Wednesday:** in Meta: create a 1% lookalike of the top-LTV segment, scale that audience.
5. **Friday:** check ROAS of the value-rule-affected campaigns vs. baseline. Expect 10–25% improvement after 2–3 weeks.

## What automation looks like later

- A nightly script reads `historical_ltv.sql`, slices customers into LTV tiers (`top_20`, `next_30`, `next_30`, `bottom_20`)
- Pushes each tier as a separate Customer Match list via Google Ads API + Meta Marketing API
- The platforms' bidding algos do the rest

## Risks to watch

- **Privacy:** make sure email hashing is SHA-256 with a project-wide salt (or no salt — Google's Customer Match wants raw SHA-256, not salted). Don't upload PII in plaintext, ever.
- **Recency bias:** if "high LTV" means "spent a lot in the last 90 days," your bidding will chase recent buyers and miss long-cycle phone replacers. Use 12+ month windows for LTV calc.
- **Over-attribution:** Customer Match audiences can show as spending more because they spend more anyway, not because of the bid modifier. Run a holdout (10% of the segment with no modifier) for the first 60 days to measure incrementality.
