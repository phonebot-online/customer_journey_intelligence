# STEP 0 — Data Source Inventory
**Date:** 2026-04-25 (UTC) — analysis day
**Discovery method:** Supermetrics MCP (`phonebot3073@gmail.com`, team_id 846100, license expires 2026-05-09 — DEMO)
**Companion files in this folder:**
- `00_step0_accounts.json` — raw accounts_discovery results per source
- `00_step0_authenticated_sources.json` — raw auth status per checked ds_id

---

## A. CONFIRMED data sources (authenticated + accounts present)

| User-stated label | Supermetrics ds_id | Display name | Auth | Account(s) | Critical notes |
|---|---|---|---|---|---|
| Facebook Ads | `FA` | Facebook Ads | AUTHENTICATED | `act_14359173` Phonebot (main); `act_1141970792623135` Fahad Zafar (personal — flag, may be noise) | 2 accounts. Personal account is likely test/personal — do **not** blend with Phonebot in cross-channel reconciliation without separation. Auth via Fahad Zafar (id 10161601735525350). |
| Instagram Ads | (via `FA`) | — paid IG sits inside FA | AUTHENTICATED via FA | `act_14359173` only | **There is NO separate "Instagram Ads" connector.** Paid IG = Facebook Ads with placement filter (`publisher_platform=instagram`). The user's stated source list conflated this. IGI (Instagram Insights, organic) has NO accounts connected. |
| Google Ads | `AW` | Google Ads | AUTHENTICATED | `3900249467` Phonebot | Single account. Authoritative for paid search/PMax/Demand Gen. |
| GA4 | `GAWA` | Google Analytics 4 | AUTHENTICATED | 5 properties: `284223207` Phonebot - GA4 (main AU), `434168263` Phonebot AE (main), `433775991` Phonebot AE (likely duplicate — investigate), `488590631` Phonebot - ProfitMetrics Revenue, `488618020` Phonebot - ProfitMetrics Gross Profit | The 2 ProfitMetrics properties are how "Profit Metrics" is exposed — they are GA4 properties wired with ProfitMetrics-derived fields, NOT a separate platform feed. AE has TWO properties — one is a duplicate; pick the main one and document. |
| Search Console | `GW` (NOT `SC` — `SC` is Snapchat) | Google Search Console | AUTHENTICATED | **AU only (in scope per user)**: `https://www.phonebot.com.au/` (URL property). Out of scope: `sc-domain:phonebot.ae`, `sc-domain:phonebot.co.uk`. | User directed AU-only for Search Console. UK + AE held out of this analysis. |
| Brevo | `SIB` | Brevo (Sendinblue) | AUTHENTICATED | Single login (no account list) | Campaign-level send/engagement only — no $, no contact-level, no flows/automations, no transactional. History from 2025-10-27 (per memory). |
| Profit Metrics | (via `GAWA` properties `488590631` + `488618020`) | — | AUTHENTICATED via GA4 | 2 GA4 properties | NOT a standalone connector. Treat as derived/transformed layer surfaced through GA4. Cross-check vs CMS for commercial truth. |

## B. ADDITIONAL discovered data sources (NOT in user's stated list)

| ds_id | Name | Auth | Account(s) | Why this matters |
|---|---|---|---|---|
| `AC` | Microsoft Advertising (Bing) | AUTHENTICATED | `180388397` phonebot (auth via phonebot3073@outlook.com.au) | **Significant:** Memory & GA4 already show Bing delivering 9,159 sessions / 140 purchases / A$83k in 90d. User listed it nowhere. Treat as a primary paid-search source alongside Google Ads. |
| `GMB` | Google My Business | AUTHENTICATED | (account list to query later) | Local search / Maps. Relevant especially for the UAE Burjuman walk-in store and any AU foot-traffic. Closes one of the open attribution gaps from prior FB UAE campaign analysis. |
| `GW` (3rd site) | Search Console — `sc-domain:phonebot.co.uk` | AUTHENTICATED | UK domain | UK store presence wasn't in the brief. Worth a separate look at SC and potential cross-store cannibalisation. |

## C. Source GAPS / MISSING access

| Gap | Status | Remediation |
|---|---|---|
| **CMS first-party orders + refunds** | **FULLY DELIVERED.** 14 monthly xlsx files (Mar 2025–Apr 2026) + 1 refunds-since-Mar-2025 file. **17,659 unique orders after Villawood fraud exclusion. 1,155 refunds (6.52% count / 5.66% revenue rate). A$8.05M gross revenue / A$7.60M net.** | **Coverage:** 2025-03-01 → 2026-04-24 (420 days, no missing days). **Powers 1m, 3m, 6m, AND 12m windows.** GP=0 outliers (709 orders) imputed via Method B (brand × condition median margin). |
| **CMS customer / product / inventory / refund / attribution fields** | **MISSING in current export.** Available fields: Order ID, Email, City (march/april only), Postcode, State, Products, Total Quantity, Total, Cost Price, Gross Profit, Date Added, Payment Method, Platform. **Not present:** utm_source/medium/campaign, gclid, fbclid, ms_click_id, is_first_order, is_returned, refund_amount, customer_id, line-item COGS. | **Cannot tie individual orders back to specific ad clicks** from this export — channel attribution at order level is impossible without joining via email or augmented export. Repeat-customer detection works via Email. Refund detection impossible. |
| **GP=0 + tiny Cost Price on 70 premium-phone orders** | Suspected COGS-not-yet-set for sealed/brand-new inventory. ~2.74% of orders, but they're high-value (iPhone 17 Pro Max etc.) so revenue exposure is larger. | Flag to user. Exclude from margin analysis OR replace 0 with category-typical margin proxy. Do NOT silently include — would understate true blended margin. |
| Shopify (SHP) | NOT_AUTHENTICATED | The CMS spec referenced Shopify as one possible CMS path. If Phonebot is on Shopify, connecting SHP would close most of the CMS gap. Login link available. |
| Klaviyo (KLAV) | NOT_AUTHENTICATED | User said Brevo is the email tool — Klaviyo is irrelevant unless they have a parallel one. |
| LinkedIn Ads, TikTok, Snapchat, YouTube | NOT_AUTHENTICATED | User listed none of these. Skip unless they later say otherwise. |
| BigQuery | NOT_AUTHENTICATED | If GA4 is exporting to BQ, this would unlock event-level granularity. Worth flagging as future upgrade. |
| FB Insights / IG Insights (organic) | AUTHENTICATED but NO accounts | Organic page/profile insights not wired. Low priority — paid is the focus. |
| Personal `act_1141970792623135` on FA | Authenticated but personal account | **Filter out in queries** — pulling it into Phonebot blended would corrupt cross-channel numbers. Document the exclusion. |

## D. Initial trust level per source

| Source | Trust tier | Reason |
|---|---|---|
| **Google Ads (AW)** | HIGH | Click-/conversion-time data direct from auction. Cross-validates well vs GA4 source/medium. |
| **GA4 main AU (GAWA / 284223207)** | HIGH for sessions/users/source-medium; MED for purchase $ (last-click attribution model can mis-credit) | Use as the funnel/journey backbone, not as the revenue truth source. |
| **GA4 AE main (GAWA / 434168263)** | MED — confirm which AE property is "main" before relying. Currently two AE properties present. |
| **Search Console (GW)** | HIGH for clicks/impressions/queries; MED for split totals (use discrepancy_correction setting) |
| **Bing (AC)** | HIGH within its small footprint | Authoritative platform feed. |
| **Facebook Ads (FA, Phonebot account only)** | MED — platform-reported conversions are heavily over-attributed (memory: 42x over GA4 last-click) | Use for spend/impressions/CTR/CPC as truth; treat platform purchases/ROAS with explicit caveat. |
| **Brevo (SIB)** | MED — solid for sends/opens/clicks/unsubs. NO $. | Need GA4 source/medium=email or CMS to attach revenue. |
| **ProfitMetrics GA4 (488590631 / 488618020)** | MED — derived. Field semantics need verification (is "revenue" gross of refunds? is "gross profit" net of COGS only or net of ops too?) | Treat as best-available margin proxy until CMS arrives; verify field meaning in field_discovery before relying. |
| **GMB** | LOW–MED — useful directional, local | Not in journey path for most online conversions. |
| **CMS (manual)** | UNKNOWN — not delivered | Should be HIGHEST trust once attached; until then, a known unknown. |

## E. Raw vs transformed vs derived classification

| Source | Layer |
|---|---|
| FA (Phonebot only), AW, AC | **Raw** — direct platform feed (impressions/clicks/spend/conversions) |
| GAWA (main AU + main AE) | **Transformed** — GA4 applies modeling, attribution, and sessionization to event stream |
| GAWA ProfitMetrics properties (488590631 / 488618020) | **Derived** — third-party-injected fields layered onto GA4 events |
| GW | **Raw** within the discrepancy-corrected boundary; otherwise transformed |
| SIB | **Raw** for sends; downstream effects (revenue from email) are not present |
| FA personal account `act_1141970792623135` | **Excluded** (noise) |
| GA4 AE duplicate `433775991` | **Pending classification** — needs row-count comparison vs `434168263` to decide which is canonical |
| CMS | **Commercial truth** (when delivered) |

---

## Future / pending sources (provision created)

| Source | Status | Where it goes when attached |
|---|---|---|
| **Melbourne store sales (physical POS)** | **PENDING — user will attach later via manual CSV** | drop in `/customer_journey_intelligence/manual_data_drops/`; I parse and place clean output under `/<window>/melbourne_store_sales/melbourne_pos_clean_<window>.csv` per time window. See `manual_data_drops/README.md` for required fields. Critical to close the GMB-phone/directions → in-store-revenue loop and to validate the FB "Engagement store +10km radius" campaign. |
| **CMS older history (pre-Feb 2026)** | PENDING — needed for 6m/12m commercial-truth cross-checks | same drop zone; integrates into existing `/3_month/`, `/6_month/`, `/12_month/cms_manual/` folders. |

## Open questions for the user (raised at Step 0)
1. **CMS data delivery** — is the user attaching CSV/JSON in chat, or do we proceed Step 7 using GA4+ProfitMetrics GA4 as a commercial-truth proxy and flag the CMS gap throughout?
2. **GA4 AE property** — `434168263` vs `433775991`: which is the live one? Or is one a staging clone?
3. **FB account** — should we exclude `act_1141970792623135` (Fahad Zafar personal) outright, or is that the UAE/secondary business? (Memory implies main Phonebot is `act_14359173`.)
4. **UK store** — `sc-domain:phonebot.co.uk` exists; should it be in scope for this analysis or out of scope?
5. **Bing & GMB** — confirmed they're in scope (treat as primary paid-search and local-presence respectively)?

These do not block Step 1 (storage structure) or Step 2 (raw pulls of confirmed sources). They DO need answers before Step 7 cross-checks lock in.
