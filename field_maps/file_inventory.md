# File Inventory — Phonebot Customer Journey Intelligence
**As-of:** 2026-04-25
**Convention:** every file's source, granularity, time-window, key fields, and known caveats are listed.
**Used by:** Kimi (dashboard build), Step 9 conclusions, future maintenance.

## Top-level layout
```
CJI/
├── 1_month/, 3_month/, 6_month/, 12_month/   ← rolling N-day windows anchored 2026-04-24
├── source_maps/                               ← inventory + pull plan + tracking ledgers
├── field_maps/                                ← THIS FOLDER — schema + metric definitions
├── memory_snapshots/                          ← Claude's working memory (3 snapshots)
├── qa_checks/                                 ← data-quality decisions (read FIRST)
├── cross_checks/                              ← Step 7 triangulation outputs
├── regression_checks/                         ← (currently empty)
├── dashboard_connection/                      ← Kimi handoff prompt + future dashboard build
├── final_conclusions/                         ← (currently empty — Step 9 will populate)
└── manual_data_drops/                         ← README only; future user uploads land here
```

## Source maps
| File | Contents |
|---|---|
| `source_maps/00_step0_inventory.md` | All 7 confirmed sources + 2 discovered (Bing, GMB) + 1 future (Melbourne POS provisioned), trust levels, scope decisions (UK out, AE out, AU only) |
| `source_maps/00_step0_accounts.json` | Account IDs per source (FA `act_14359173`, AW `3900249467`, GAWA `284223207` AU + `488590631` PM Rev + `488618020` PM GP, etc.) |
| `source_maps/step2_pull_plan.md` | Original pull strategy across 1m/3m/6m/12m |
| `source_maps/step2_landed_summary.md` | Inventory of what's actually on disk vs persisted-only |
| `source_maps/step2_landed_schedule_ids.json` | Wave 1 Supermetrics schedule IDs (re-pollable) |
| `source_maps/step2_persisted_schedule_ids.json` | Wave 3+4 schedule IDs (data too big for context, re-poll with smaller field set) |
| `source_maps/step2_wave1_schedule_ids.json` | Wave 1 schedule IDs |
| `source_maps/step2_wave34_schedule_ids.json` | Wave 3+4 schedule IDs |

## QA checks (read these first)
| File | Purpose |
|---|---|
| `qa_checks/cms_qa_step3_initial.md` | Initial CMS QA — superseded |
| `qa_checks/cms_qa_step3_v2_full_history.md` | **CANONICAL CMS QA** — fraud exclusion, GP imputation Method B, refund handling, monthly trends |
| `qa_checks/store_data_qa.md` | **CANONICAL STORE QA** — Reservoir VIC store, refund file mismatch, accessory/repair GP caveats, web-vs-store separation |
| `qa_checks/cms_fraud_excluded_villawood.csv` | 50 Villawood-2163 fraud orders excluded (46 screen-protector + 4 premium phones) |
| `qa_checks/cms_gp_zero_orders_to_review.csv` | 709 web orders with imputed GP — for user manual review |
| `qa_checks/cms_gp_zero_with_calculated_gp_options.csv` | Same GP=0 orders with 4 method options compared |
| `qa_checks/cms_margin_lookup_by_brand_condition.csv` | The lookup table behind Method B (Brand × Condition median margin) |
| `qa_checks/gw_organic_finding_contradicts_hypothesis.md` | Aggregate Search Console data does NOT support "lost organic rankings" cliff hypothesis. Validation needed. |

## Cross-checks (Step 7 triangulation)
| File | Window | Contents |
|---|---|---|
| `cross_checks/MASTER_daily_1m.csv` | 30d | Day × CMS orders/rev/GP × FA spend/purch/value × AW spend/conv/value × Bing spend/conv/rev × GMB views/actions |
| `cross_checks/daily_cross_source_1m.csv` | 30d | Earlier daily merge (kept for context) |
| `cross_checks/daily_paid_vs_cms_1m.csv` | 30d | Daily paid spend vs CMS orders |
| `cross_checks/campaign_triangulation_30d.csv` | 30d | **Campaign-level: 22 AW+Bing campaigns × spend × platform claim × GA4 last-click × PM rev × PM GP × net profit** |
| `cross_checks/step7_paid_vs_cms_30d.md` | 30d | Pre-triangulation paid vs CMS analysis |
| `cross_checks/step7_LOCKED_triangulation_30d.md` | 30d | **Channel-level locked finding: FB 65× over-attrib, AW honest at 1.35×** |
| `cross_checks/step7_LOCKED_campaign_triangulation_30d.md` | 30d | **Campaign-level locked finding: brand harvest dominates, 6 unprofitable campaigns to pause** |
| `cross_checks/step7_LOCKED_yoy_triangulation_sep2025_vs_apr2026.md` | Sep 25 vs Apr 26 | **YoY locked: FB 0.08× real-ROAS BOTH periods, AW efficiency ↑ as spend ↓** |
| `cross_checks/step7_LOCKED_multiwindow_triangulation.md` | 1m/3m/6m/12m | **Multi-window stability: FB 0.08-0.10× real-ROAS in ALL windows; AW returns diminish at scale** |

## Per-window data files

### 1_month/ (last 30 days, anchored 2026-04-24)
| File | Source | Granularity | Rows |
|---|---|---|---|
| `cms_manual/cms_orders_v3_clean.csv` | CMS web | Order-level | 763 |
| `cms_manual/cms_orders_v4_clean.csv` | CMS web (with refund flag) | Order-level | 763 |
| `cms_manual/cms_orders_clean_1m.csv` | CMS web (older version) | Order-level | 813 |
| `cms_manual/cms_orders_clean_1m_excl_gp0.csv` | CMS web (GP=0 excluded) | Order-level | 798 |
| `melbourne_store_sales/store_orders_clean.csv` | Store POS | Order-level | 296 |
| `melbourne_store_sales/store_refunds_clean.csv` | Store refunds | Order-level | 6 |
| `facebook_ads/account_daily_1m.csv` | FA `act_14359173` | Date | 30 |
| `facebook_ads/campaign_summary_30d_act14359173.csv` | FA | Campaign aggregate | 5 |
| `facebook_ads/placement_summary_30d_act14359173.csv` | FA | Placement aggregate | 56 |
| `google_ads/account_daily_1m.csv` | AW `3900249467` | Date | 30 |
| `google_ads/campaign_summary_30d.csv` | AW | Campaign aggregate | 18 |
| `bing_ads/campaign_daily_1m.csv` | AC `180388397` | Date × Campaign | 119 |
| `bing_ads/campaign_summary_30d.csv` | AC | Campaign aggregate | 4 |
| `ga4/channel_summary_30d_AU.csv` | GAWA `284223207` AU | Channel aggregate | 12 |
| `ga4/campaign_x_sourcemedium_30d_AU.csv` | GAWA AU | Source/Medium × Campaign | 33 |
| `profit_metrics/channel_revenue_30d.csv` | GAWA `488590631` (PM Rev) | Channel aggregate | 12 |
| `profit_metrics/channel_gp_30d.csv` | GAWA `488618020` (PM GP) | Channel aggregate | 12 |
| `profit_metrics/campaign_x_sourcemedium_revenue_30d.csv` | GAWA PM Rev | Source/Medium × Campaign | 19 |
| `profit_metrics/campaign_x_sourcemedium_gp_30d.csv` | GAWA PM GP | Source/Medium × Campaign | 19 |
| `search_console/branded_daily_1m.csv` | GW phonebot.com.au | Date × branded vs non-branded | 90 |
| `brevo/campaigns_1m.csv` | SIB | Campaign aggregate | 3 |
| `gmb/locations_daily_1m.csv` | GMB AU + AE | Date × Location | 60 |

### 3_month/ (last 90 days)
| File | Source | Granularity | Rows |
|---|---|---|---|
| `cms_manual/cms_orders_v3_clean.csv` | CMS web | Order-level | 2,700 |
| `cms_manual/cms_orders_v4_clean.csv` | CMS web (refund-flag) | Order-level | 2,700 |
| `cms_manual/cms_daily_3m.csv` | CMS web | Date | ~83 |
| `cms_manual/cms_orders_clean_3m_excl_gp0.csv` | CMS web (GP=0 excl) | Order-level | 2,679 |
| `melbourne_store_sales/store_orders_clean.csv` | Store POS | Order-level | 890 |

### 6_month/ (last 180 days)
| File | Source | Rows |
|---|---|---|
| `cms_manual/cms_orders_v3_clean.csv` | CMS web | 6,875 |
| `cms_manual/cms_orders_v4_clean.csv` | CMS web (refund-flag) | 6,875 |
| `cms_manual/cms_orders_clean_6month_excl_gp0.csv` | CMS web (GP=0 excl) | 4,570 |
| `melbourne_store_sales/store_orders_clean.csv` | Store POS | 1,848 |
| `brevo/campaigns_6m.csv` | SIB | 33 |

### 12_month/ (last 365 days + full 14-month CMS history)
| File | Source | Rows |
|---|---|---|
| `cms_manual/cms_orders_v4_with_refunds.csv` | **CMS web canonical full history** | 17,659 |
| `cms_manual/cms_orders_v3_full_history.csv` | CMS web full history (older) | 17,659 |
| `cms_manual/cms_orders_full_history.csv` | CMS web (older — pre v4) | 9,583 |
| `cms_manual/cms_orders_v4_clean.csv` | CMS web (last 365d only) | 15,684 |
| `cms_manual/cms_refunds_parsed.csv` | CMS web refunds | 1,155 |
| `cms_manual/cms_monthly_summary.csv` | CMS web | 14 months |
| `cms_manual/cms_monthly_summary_net.csv` | CMS web (refund-net per month) | 14 months |
| `cms_manual/combined_web_store_monthly.csv` | **CMS web + Store combined monthly** | 14 months |
| `cms_manual/cms_daily_full_history.csv` | CMS web | 420 days |
| `melbourne_store_sales/store_orders_full_history.csv` | **Store POS canonical full** | 4,522 |
| `melbourne_store_sales/store_refunds_full_history.csv` | Store refunds | 187 |
| `melbourne_store_sales/store_monthly_summary.csv` | Store POS | 14 months |
| `melbourne_store_sales/store_daily.csv` | Store POS | 413 days |
| `search_console/branded_weekly_12m.csv` | GW phonebot.com.au | 53 weeks × 3 buckets |
| `brevo/campaigns_12m.csv` | SIB (since 2025-10-27) | 33 |
| `brevo/brevo_monthly_summary.csv` | SIB | 7 months |
| `snapshots_yoy/aw_campaign_sep2025.csv` | AW Sep 2025 reference | 13 |
| `snapshots_yoy/pm_gp_channel_sep2025.csv` | PM GP Sep 2025 reference | 10 |

## Memory snapshots
| File | When written |
|---|---|
| `memory_snapshots/snapshot_001_step0.md` | After source discovery |
| `memory_snapshots/snapshot_002_after_cms_ingest.md` | After CMS web parse |
| `memory_snapshots/snapshot_003_after_wave1_landings.md` | After paid 1m wave landed |

## Files NOT yet on disk (data exists in Supermetrics cache only)
Re-pollable via the schedule IDs in `source_maps/step2_persisted_schedule_ids.json`:
- AW campaign × week × 12m (saved analysis only, raw weekly data not on disk)
- GAWA channel × day × 6m (persisted from earlier; saved analysis instead)
- GAWA channel × day × 12m (persisted)
- GW × query × time (NEVER PULLED — task #20 pending)

## Convention notes
- `_v4` files are the latest/canonical version. `_v3`/older preserved for reference.
- Files prefixed `step7_LOCKED_` are finalized analysis docs — don't override without flagging.
- Per-window subfolders contain rolling-N-day extracts; only `12_month/cms_manual/` contains the full 14-month history.
- All money is AUD; all timestamps are Australia/Perth.
