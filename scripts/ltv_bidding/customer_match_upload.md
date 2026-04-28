# Google Customer Match upload — step-by-step

## Once-off setup (10 min)

1. **Google Ads → Tools → Audience Manager → Your Data → Customer Lists**
2. Click **+** → **Upload customer list**
3. Name: `phonebot_high_ltv_top20`
4. List type: **emails**
5. Membership duration: **540 days** (max)
6. Upload type: **Plain text data, hashed by Google** (Google does the SHA-256 for you, or pre-hash if you prefer — they recommend pre-hashing for privacy)

## Pre-hashing (recommended)

```python
import hashlib, csv

with open('outputs/customer_ltv.csv') as f, open('outputs/top20_hashed.csv', 'w') as out:
    reader = csv.DictReader(f)
    writer = csv.writer(out)
    writer.writerow(['Email'])
    for row in reader:
        if row['ltv_tier'] == 'top_20':
            email = row['email'].strip().lower()
            writer.writerow([hashlib.sha256(email.encode()).hexdigest()])
```

Run this then upload `top20_hashed.csv`.

## Apply value-based bidding

1. Google Ads → Campaigns → pick a Performance Max or Search campaign
2. **Settings → Bid strategy → Maximize conversion value**
3. **Audiences → Add audience segments → Customer list → `phonebot_high_ltv_top20`**
4. **Bid adjustments**: at the audience level, set +30% bid modifier
5. **(Optional) Negative**: also create a `phonebot_one_and_done` audience for past one-time-only buyers, set -50% modifier. They convert once and don't come back; you don't want to pay full bid to acquire them.

## Repeat for Meta

In Meta Business Manager:
1. **Audiences → Create audience → Custom audience → Customer list**
2. Upload the same hashed CSV
3. Source name: `phonebot_high_ltv_top20`
4. **Lookalike audiences → Create lookalike → Source: top20 → 1% AU lookalike**
5. Use the lookalike as a primary cold audience in TOF campaigns

## Refresh cadence

Customer Match lists refresh every 540 days max but **performance degrades after ~30 days** because new high-LTV customers are missing.

Set a recurring monthly task:
```
/schedule run scripts/ltv_bidding/refresh_customer_match.py on the 1st of every month
```

(Refresh script not yet built — placeholder. When you're ready to automate, the Google Ads API + Meta Marketing API can do incremental list updates programmatically.)

## Measuring incrementality (don't skip this)

You need to know if the +30% bid modifier on the top-LTV segment actually drives more revenue, or if those customers were going to convert anyway.

**Holdout approach:**
1. Random-sample 10% of the `phonebot_high_ltv_top20` list. Save as `phonebot_high_ltv_top20_HOLDOUT`.
2. In Google Ads, exclude the holdout from the +30% modifier campaign.
3. After 60 days, compare conversion rate of the modifier-affected 90% vs the holdout 10%.
4. If conversion rate is the same, the modifier isn't doing anything — drop it.
5. If conversion rate is meaningfully higher, the lift × audience size = your real incremental gain.

This is the only way to know if the work is paying off. Skip it and you're flying blind.
