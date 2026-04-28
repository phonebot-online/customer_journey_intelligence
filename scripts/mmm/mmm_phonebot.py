#!/usr/bin/env python3
"""
Phonebot Media Mix Model — first-pass scaffold.

Fits a Bayesian MMM using 90 days of daily channel spend + revenue from existing CSVs.
Produces:
  outputs/mmm_results.json   — channel contributions, ROAS, fit metrics
  outputs/mmm_diagnostic.png — posterior predictive checks
  outputs/mmm_decomp.png     — daily revenue decomposed by source

Read the README first. Three months of data is the floor — wide credible intervals are expected.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = Path(__file__).resolve().parent / "outputs"
OUT.mkdir(exist_ok=True)


def load_data() -> pd.DataFrame:
    """Build a daily long-format frame: date × {google_spend, fb_spend, bing_spend, revenue}."""
    google = pd.read_csv(ROOT / "3_month/google_ads/account_daily_3m.csv", parse_dates=["Date"])
    google = google.rename(columns={"Date": "date", "Cost": "google_spend"})[["date", "google_spend"]]

    fb = pd.read_csv(ROOT / "3_month/facebook_ads/account_daily_3m.csv", parse_dates=["Date"])
    fb = fb.rename(columns={"Date": "date", "Cost": "fb_spend"})[["date", "fb_spend"]]

    bing = pd.read_csv(ROOT / "3_month/bing_ads/account_daily_3m.csv", parse_dates=["Date"])
    bing = bing.rename(columns={"Date": "date", "Spend": "bing_spend"})[["date", "bing_spend"]]

    cms = pd.read_csv(ROOT / "12_month/cms_manual/cms_daily_full_history.csv", parse_dates=["Date"])
    cms = cms.rename(columns={"Date": "date", "revenue": "revenue"})[["date", "revenue"]]

    df = google.merge(fb, on="date", how="outer").merge(bing, on="date", how="outer").merge(cms, on="date", how="left")
    df = df.sort_values("date").reset_index(drop=True)
    df = df.dropna(subset=["revenue"]).fillna(0.0)
    return df


def fit_mmm(df: pd.DataFrame):
    """Fit the MMM. Imports inside function so the script still runs partially without pymc-marketing."""
    try:
        from pymc_marketing.mmm import MMM, GeometricAdstock, LogisticSaturation
    except ImportError as e:
        raise SystemExit(
            "pymc-marketing not installed. Run: pip install -r requirements.txt"
        ) from e

    spend_cols = ["google_spend", "fb_spend", "bing_spend"]

    mmm = MMM(
        date_column="date",
        channel_columns=spend_cols,
        adstock=GeometricAdstock(l_max=8),
        saturation=LogisticSaturation(),
        # No additional controls in this scaffold. Add seasonality / events when more data is available.
    )

    X = df[["date"] + spend_cols].copy()
    y = df["revenue"].values

    mmm.fit(X=X, y=y, target_accept=0.9, chains=2, draws=1000, tune=1000, random_seed=42)
    return mmm, df, spend_cols


def summarise(mmm, df: pd.DataFrame, spend_cols: list[str]) -> dict:
    """Pull the key numbers out of the posterior for the dashboard."""
    contributions = mmm.compute_channel_contribution_original_scale().mean(dim=["chain", "draw"]).values  # (T, C)
    contrib_total = contributions.sum(axis=0)  # per channel

    spend_total = df[spend_cols].sum().values
    roas = np.divide(contrib_total, spend_total, out=np.zeros_like(contrib_total), where=spend_total > 0)

    # Posterior credible intervals on per-channel contribution
    cont_xr = mmm.compute_channel_contribution_original_scale().sum(dim="date")
    ci_low = cont_xr.quantile(0.05, dim=["chain", "draw"]).values
    ci_high = cont_xr.quantile(0.95, dim=["chain", "draw"]).values

    fit_summary = {
        "window_days": int(len(df)),
        "date_min": df["date"].min().strftime("%Y-%m-%d"),
        "date_max": df["date"].max().strftime("%Y-%m-%d"),
        "total_revenue": float(df["revenue"].sum()),
        "total_spend": {c: float(df[c].sum()) for c in spend_cols},
        "channels": [
            {
                "channel": c,
                "spend": float(spend_total[i]),
                "contribution_mean": float(contrib_total[i]),
                "contribution_ci_low": float(ci_low[i]),
                "contribution_ci_high": float(ci_high[i]),
                "roas_mean": float(roas[i]),
                "ci_crosses_zero": bool(ci_low[i] <= 0 <= ci_high[i]),
            }
            for i, c in enumerate(spend_cols)
        ],
        "warnings": [],
    }

    # Sanity checks
    for ch in fit_summary["channels"]:
        if ch["ci_crosses_zero"]:
            fit_summary["warnings"].append(
                f"{ch['channel']}: 90% credible interval crosses zero — model is not confident this channel has a non-zero effect. "
                "Likely needs more data or a holdout test to identify."
            )
        if ch["roas_mean"] < 0.5:
            fit_summary["warnings"].append(
                f"{ch['channel']}: incremental ROAS estimate is {ch['roas_mean']:.2f}x — much lower than reported in-platform. "
                "Either the platform overstates last-click contribution OR the MMM is mis-fit. Investigate."
            )

    return fit_summary


def plot_decomp(mmm, df: pd.DataFrame, spend_cols: list[str]):
    """Stacked area: daily revenue decomposed into baseline + each channel's contribution."""
    contributions = mmm.compute_channel_contribution_original_scale().mean(dim=["chain", "draw"]).values
    fig, ax = plt.subplots(figsize=(12, 5))
    bottom = np.zeros(len(df))
    for i, c in enumerate(spend_cols):
        ax.fill_between(df["date"], bottom, bottom + contributions[:, i], label=c, alpha=0.7)
        bottom += contributions[:, i]
    ax.plot(df["date"], df["revenue"], color="black", linewidth=1.5, label="Actual revenue")
    ax.set_ylabel("Daily revenue (AUD)")
    ax.set_title("Phonebot MMM — daily revenue decomposition")
    ax.legend()
    fig.tight_layout()
    fig.savefig(OUT / "mmm_decomp.png", dpi=150)
    plt.close(fig)


def plot_diagnostic(mmm):
    """Posterior predictive check."""
    fig = mmm.plot_posterior_predictive()
    fig.tight_layout()
    fig.savefig(OUT / "mmm_diagnostic.png", dpi=150)
    plt.close(fig)


def main():
    print("Loading data...")
    df = load_data()
    print(f"  {len(df)} days from {df['date'].min().date()} to {df['date'].max().date()}")
    print(f"  Total spend: ${df[['google_spend', 'fb_spend', 'bing_spend']].sum().sum():,.0f}")
    print(f"  Total revenue: ${df['revenue'].sum():,.0f}")

    if len(df) < 60:
        print("WARNING: <60 days of data. MMM results will be near-uninformative.")

    print("Fitting MMM (this takes a few minutes)...")
    mmm, df, spend_cols = fit_mmm(df)

    print("Summarising posterior...")
    summary = summarise(mmm, df, spend_cols)

    out_path = OUT / "mmm_results.json"
    out_path.write_text(json.dumps(summary, indent=2))
    print(f"  Wrote {out_path}")

    print("Plotting...")
    plot_decomp(mmm, df, spend_cols)
    plot_diagnostic(mmm)
    print(f"  Wrote {OUT / 'mmm_decomp.png'}, {OUT / 'mmm_diagnostic.png'}")

    print("\n=== Channel contributions ===")
    for ch in summary["channels"]:
        flag = " ⚠️" if ch["ci_crosses_zero"] else ""
        print(
            f"  {ch['channel']:>15} | spend ${ch['spend']:>9,.0f} | "
            f"contribution ${ch['contribution_mean']:>10,.0f} "
            f"[${ch['contribution_ci_low']:>10,.0f}, ${ch['contribution_ci_high']:>10,.0f}] | "
            f"ROAS {ch['roas_mean']:.2f}x{flag}"
        )

    if summary["warnings"]:
        print("\n=== Warnings ===")
        for w in summary["warnings"]:
            print(f"  - {w}")

    print(f"\nDone. Drop outputs/mmm_results.json into app/data/ to surface in dashboard.")


if __name__ == "__main__":
    main()


# TODO (when MMM results are trusted enough to surface):
#   1. Copy outputs/mmm_results.json -> app/data/mmm_results.json
#   2. Add a tRPC procedure in api/routers/profit_ops.ts that reads it
#   3. Add an "MMM Contribution" panel to ProfitOps.tsx that visualises:
#      - Bar chart: spend vs incremental contribution per channel (with CI error bars)
#      - "Last-click vs incremental" delta — shows where attribution is over/understated
#      - Reallocation calculator: "if I move $X from channel A to channel B, what happens?"
