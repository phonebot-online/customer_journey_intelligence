# Meta value-based bidding — Phonebot setup

Two layers: (1) get Meta higher-quality conversion signals via CAPI; (2) tell Meta which conversions are worth more.

## Layer 1: Conversion API (CAPI) for resilience

iOS 14.5+ broke browser pixel tracking for ~50% of your Meta-driven traffic. CAPI is server-side — your backend tells Meta "user X bought $500 of stuff" directly, bypassing browser tracking blockers.

If you don't have CAPI, your Meta ROAS is probably understated by 30–50%. Set this up FIRST before bidding optimizations.

### Quick CAPI setup options

- **Shopify**: native Meta CAPI integration. Connect in Shopify Admin → Sales channels → Facebook & Instagram.
- **WooCommerce**: PixelYourSite plugin or Meta's official plugin.
- **Custom (Phonebot uses Laravel?)**: implement via Meta's CAPI Gateway or roll your own webhook posting purchase events. Docs: https://developers.facebook.com/docs/marketing-api/conversions-api

Test with Meta's Test Events tool. Look for **Event Match Quality (EMQ) score ≥ 7.0** — anything below means you're losing attribution.

## Layer 2: Value-based bidding rules

Once Meta is receiving full-fidelity purchase events, you can shape its bidding by passing custom signals:

### Approach A: Pass the customer's predicted LTV in the purchase event

In your purchase webhook, include a `custom_data.value_tier` parameter:
- `top_20` → Meta knows this is a high-value segment, will optimize toward similar prospects
- `bottom_20` → Meta deprioritizes lookalikes of this segment

```javascript
// CAPI purchase event payload
{
  "event_name": "Purchase",
  "event_time": 1714512000,
  "event_source_url": "https://phonebot.com/checkout/complete",
  "user_data": {
    "em": ["<sha256 of email>"],
    "ph": ["<sha256 of phone>"],
    "client_ip_address": "1.2.3.4",
    "client_user_agent": "..."
  },
  "custom_data": {
    "currency": "AUD",
    "value": 1044.00,                 // first-order revenue
    "predicted_ltv": 1850.00,         // your model's 18-month LTV estimate
    "ltv_tier": "top_20",
    "customer_segment": "loyal"
  }
}
```

### Approach B: Use Meta's "Highest Value" optimization goal

In ad set setup:
- **Campaign objective**: Sales
- **Optimization for ad delivery**: **Conversions: Purchase value** (not just "purchase count")
- **Bid strategy**: **Highest value** with optional value cap

Meta's algorithm now optimizes for total $ value, not just conversion count. Combined with CAPI passing real purchase value (not just $0 events), this is the single highest-leverage Meta change for a $500k-spend retailer.

## Layer 3: Value rules on lookalikes

Build lookalike audiences from your top-LTV segments (see `customer_match_upload.md`):

- 1% Lookalike of `phonebot_high_ltv_top20` → use as primary TOF audience, bid normally
- 1% Lookalike of `phonebot_one_and_done` → exclude from TOF (or run as a separate cheap-CPM audience)
- 1% Lookalike of `phonebot_repeat_within_60d` → use as TOF priority for accessory campaigns

## What to measure

After 30 days of value-based bidding live:
- **Cost per high-LTV customer acquired** (from your CMS data, attributed to Meta via the GA4 BQ join)
- vs. **Cost per first-order purchase** (what Meta Ads Manager shows you natively)
- The gap is what you're recovering by optimizing on LTV instead of first-order revenue.

Expected: 15–30% improvement in cost-per-high-LTV-customer at flat or slightly higher cost-per-first-order. That's the trade you want.
