# make_summary_report.py
# Build a one-page Markdown (and optional HTML) summary from stats artefacts.

import argparse, os, json
import pandas as pd
import numpy as np

def safe_read(path):
    return pd.read_csv(path) if os.path.exists(path) else None

def fmt_pct(x):
    return f"{100*x:.1f}%" if pd.notnull(x) else "—"

def section(title): return f"\n## {title}\n"

def main():
    ap = argparse.ArgumentParser(description="Generate Markdown/HTML summary from stats artefacts.")
    ap.add_argument("--prefix", required=True,
                    help="Path prefix used when saving artefacts (e.g., results/stats_run)")
    ap.add_argument("--out_md", default=None, help="Output markdown path (default: <prefix>_summary.md)")
    ap.add_argument("--out_html", default=None, help="Optional HTML output (requires 'markdown' package)")
    args = ap.parse_args()

    base = args.prefix
    paths = {
        "tox": f"{base}_tox_sweep.csv",
        "dlp": f"{base}_delta_logp_sweep.csv",
        "bin": f"{base}_binary_counts.csv",
        "asp": f"{base}_asp_grid.csv",
        "wil": f"{base}_wilcoxon.csv",
    }
    tox = safe_read(paths["tox"])
    dlp = safe_read(paths["dlp"])
    binm = safe_read(paths["bin"])
    asp = safe_read(paths["asp"])
    wil = safe_read(paths["wil"])

    # ---------- Quick facts ----------
    lines = ["# Bias & Safety Threshold Analysis — Summary",
             f"*Prefix:* `{base}`"]

    # Binary metrics
    if binm is not None and not binm.empty:
        lines.append(section("Binary Metrics (Counts)"))
        for _, r in binm.iterrows():
            lines.append(
                f"- **{r['metric']}**: baseline {fmt_pct(r['rate_baseline'])} "
                f"(n={int(r['sum_baseline'])}) vs attack {fmt_pct(r['rate_attack'])} "
                f"(n={int(r['sum_attack'])}); pairs={int(r['n_pairs'])}"
            )

    # Wilcoxon (continuous, no thresholds)
    if wil is not None and not wil.empty:
        lines.append(section("Wilcoxon (Continuous Scores)"))
        for _, r in wil.iterrows():
            note = f" _({r['note']})_" if isinstance(r.get("note",""), str) and r["note"] else ""
            lines.append(
                f"- **{r['metric']}**: n_pairs={int(r['n_pairs'])}, used={int(r['n_used'])}, "
                f"medianΔ={r['median_delta']:.4f}, statistic={r['statistic']:.3g}, p={r['p_value']:.3g}{note}"
            )

    # Threshold sweeps (McNemar)
    def sweep_summary(df, name):
        if df is None or df.empty: return []
        # where attack flag rate > baseline
        worse = df[df["flag_rate_attack"] > df["flag_rate_baseline"]]
        # best (smallest) p-value
        i_min = df["p_mcnemar"].idxmin()
        r_min = df.loc[i_min]
        msgs = []
        msgs.append(f"- **{name}**: {len(worse)}/{len(df)} thresholds had higher attack flag rate than baseline.")
        msgs.append(
            f"  - strongest signal at threshold **{r_min['threshold']}**: "
            f"attack {fmt_pct(r_min['flag_rate_attack'])} vs baseline {fmt_pct(r_min['flag_rate_baseline'])}, "
            f"b={int(r_min['b_0to1'])}, c={int(r_min['c_1to0'])}, p={r_min['p_mcnemar']:.3g}"
        )
        sig = df[df["p_mcnemar"] < 0.05]
        if len(sig):
            tr = ", ".join([str(x) for x in sig["threshold"].tolist()])
            msgs.append(f"  - **significant** differences at thresholds: {tr}")
        else:
            msgs.append("  - No thresholds reached p < 0.05 (likely small sample).")
        return msgs

    sm = []
    sm += sweep_summary(tox, "Toxicity")
    sm += sweep_summary(dlp, "ΔlogP")
    if sm:
        lines.append(section("Threshold Sweeps (McNemar)"))
        lines.extend(sm)

    # ASP grid overview
    if asp is not None and not asp.empty:
        lines.append(section("ASP Grid (Robustness over Toxicity × ΔlogP thresholds)"))
        # headline metrics
        asp_mean = asp["asp_success_rate"].mean()
        asp_min = asp.iloc[asp["asp_success_rate"].idxmin()]
        asp_max = asp.iloc[asp["asp_success_rate"].idxmax()]
        lines.append(f"- Mean ASP success rate across grid: **{fmt_pct(asp_mean)}**.")
        lines.append(
            f"- Best ASP: **{fmt_pct(asp_max['asp_success_rate'])}** at "
            f"tox={asp_max['tox_threshold']}, ΔlogP={asp_max['delta_logp_threshold']}."
        )
        lines.append(
            f"- Worst ASP: **{fmt_pct(asp_min['asp_success_rate'])}** at "
            f"tox={asp_min['tox_threshold']}, ΔlogP={asp_min['delta_logp_threshold']}."
        )
        # robustness statement: fraction of grid points where attack <= baseline on BOTH dims (ignoring binary)
        both_better = (
            (asp["tox_flag_rate_attk"] <= asp["tox_flag_rate_base"]) &
            (asp["bias_flag_rate_attk"] <= asp["bias_flag_rate_base"])
        ).mean()
        lines.append(f"- Robustness (ignoring refusals/ICAT): attack ≤ baseline on both dims at **{fmt_pct(both_better)}** of grid points.")
        # quick recommendation rule-of-thumb
        stable = asp.groupby("tox_threshold")["asp_success_rate"].mean().idxmax()
        # pick delta_logp threshold with max mean ASP at that tox threshold
        slice_max = asp[asp["tox_threshold"] == stable]
        best_d = slice_max.iloc[slice_max["asp_success_rate"].idxmax()]["delta_logp_threshold"]
        lines.append(
            f"- **Suggested operating point** (stability heuristic): tox={stable}, ΔlogP={best_d} "
            f"(maximizes average ASP on the selected tox row)."
        )

    # Save markdown
    out_md = args.out_md or f"{base}_summary.md"
    md_text = "\n".join(lines).strip() + "\n"
    with open(out_md, "w", encoding="utf-8") as f:
        f.write(md_text)

    # Optional HTML
    if args.out_html:
        try:
            import markdown as md
            html = md.markdown(md_text, extensions=["tables"])
        except Exception:
            # super-minimal fallback
            html = "<html><body><pre>" + md_text.replace("&","&amp;").replace("<","&lt;") + "</pre></body></html>"
        with open(args.out_html, "w", encoding="utf-8") as f:
            f.write(html)

    print(f"[ok] wrote {out_md}")
    if args.out_html:
        print(f"[ok] wrote {args.out_html}")

if __name__ == "__main__":
    main()
