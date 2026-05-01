---
name: Phonebot order status — "Fraud" is a risk rating, not confirmed fraud
description: How to interpret the Status column on Phonebot website/store order exports — Fraud and Fraud Review should NOT be excluded from revenue cohort by default
type: feedback
originSessionId: d958c794-740f-407a-8155-47c7f0871ef2
---
When analyzing Phonebot order exports (website orders / store orders xlsx), the `Status` column values map as follows:

- `Complete` → fulfilled, count as revenue
- `Shipped` → fulfilled (online), count as revenue
- `Fraud` → **risk rating only, NOT confirmed fraud**. These orders were largely fulfilled. Count as revenue.
- `Fraud Review` → same — risk rating, not exclusion. Count as revenue.
- `Returned & refunded` → genuine refund. Net out of revenue.

**Why:** The fraud-detection system flags orders by score, not by ground truth. The user manually reviews and most "Fraud"-tagged orders ship anyway. A small minority (e.g. cheap accessory bait orders like $19 screen protectors, or last-minute high-value items like iPhone 17s) are real fraud and end up in the refunded bucket once caught — so the refund cohort already captures the truly fraudulent ones.

**How to apply:** When computing April/monthly revenue from order exports, the revenue cohort is `Complete + Shipped + Fraud + Fraud Review`. Subtract `Returned & refunded` for net. Do NOT silently drop Fraud rows. If a particular Fraud-tagged order looks suspicious (very high value, very recent date, no shipping yet), flag it for the user to verify rather than excluding it.
