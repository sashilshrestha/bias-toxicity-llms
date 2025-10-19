#!/usr/bin/env python3
"""
prepare_wp1_gui_json.py
-----------------------
Turn the WP1 Excel workbook into a clean, analysis-ready JSON file.

Auto paths (no flags needed):
  • input:  <repo-root>/data/raw/wp1_prompts.xlsx
  • output: <repo-root>/data/interim/wp1_prompts_prepared.json

What this script does:
  • Auto-detects model/variant columns (Gemini/GPT/Grok × Direct/Paraphrased).
  • Expands to ONE row per (prompt × model × variant) present in the sheet.
  • condition does NOT encode success/failure:
      - If a 'Condition' column exists, it's normalized to {baseline, social_eng, unsuccessful}.
      - Otherwise, derived by variant only: direct → baseline, paraphrased → social_eng.
  • refusal_flag is derived ONLY from “Test Result”:
      - fail/failed/no/unsuccessful → 1
      - success/successful/pass/partial → 0
      - unknown → 1 (conservative)
  • Leaves tox_score, has_identity, regard_label blank for later phases.
  • Adds metadata: variant, attack_category, technique, wp1_test_result.
  • --preview prints a few example rows with truncated text.
"""
from __future__ import annotations

import argparse
import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pandas as pd

# ---------- Configuration ----------
MODELS: Dict[str, Dict[str, List[str]]] = {
    "Gemini": {
        "test_prefixes": ["Test Result Gemini", "Test Result (Gemini)"],
        "out_prefixes":  ["Gemini output", "Gemini Output"],
    },
    "GPT": {
        "test_prefixes": ["Test Result (GPT-5)", "Test Result GPT-5", "Test Result (GPT5)", "Test Result GPT5"],
        "out_prefixes":  ["GPT Output"],
    },
    "Grok": {
        "test_prefixes": ["Test Result Grok"],
        "out_prefixes":  ["Grok Output"],
    },
}

VARIANTS: Dict[str, Dict[str, str]] = {
    "direct":      {"header": "Direct",       "suffix": "DIR"},
    "paraphrased": {"header": "paraphrased",  "suffix": "PARA"},
}

REQUIRED_COLUMNS = [
    "attack_id", "condition", "model_name", "prompt_text", "output_text",
    "refusal_flag", "tox_score", "has_identity", "regard_label",
]
META_COLUMNS = ["variant", "attack_category", "technique", "wp1_test_result"]

log = logging.getLogger("prepare_wp1_gui_json")


# ---------- Repo root + default paths ----------
def find_repo_root(start: Path) -> Path:
    """
    Walk upward from `start` until we find a folder containing 'data'.
    Falls back to start if not found.
    """
    for p in [start] + list(start.parents):
        if (p / "data").exists():
            return p
    return start

def default_paths() -> tuple[Path, Path]:
    """
    Compute default input/output paths based on this script's location.
    """
    script_dir = Path(__file__).resolve().parent
    repo_root = find_repo_root(script_dir)
    in_path = repo_root / "data" / "raw" / "wp1_prompts.xlsx"
    out_path = repo_root / "data" / "interim" / "wp1_prompts_prepared.json"
    return in_path, out_path


# ---------- Utilities ----------
def normalize_text(s: str) -> str:
    return re.sub(r"\s+", " ", str(s or "")).strip().lower()

def find_first_present(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    for c in candidates:
        if c in df.columns:
            return c
    return None

def candidate_headers(prefixes: List[str], variant_label: str) -> List[str]:
    return [f"{p} - {variant_label}" for p in prefixes]

def pick_variant_prompt(row: pd.Series, variant_key: str) -> str:
    if variant_key == "paraphrased" and "Paraphrased Prompt" in row.index:
        text = str(row.get("Paraphrased Prompt") or "").strip()
        if text:
            return text
    if variant_key == "direct":
        for col in ("Direct Prompt", "Direct Prompt "):
            if col in row.index:
                text = str(row.get(col) or "").strip()
                if text:
                    return text
    p_para = str(row.get("Paraphrased Prompt", "") or "").strip()
    p_dir  = str(row.get("Direct Prompt", row.get("Direct Prompt ", "")) or "").strip()
    return p_para or p_dir

def map_test_result_to_refusal_flag(raw: str) -> int:
    s = normalize_text(raw)
    if any(k in s for k in ["fail", "failed", "no", "unsuccess"]):
        return 1
    if any(k in s for k in ["success", "successful", "pass", "partial"]):
        return 0
    return 1  # conservative

def normalize_condition_label(raw: str) -> str:
    s = normalize_text(raw)
    if not s:
        return ""
    if "social" in s:
        return "social_eng"
    if "baseline" in s or "base" in s or "control" in s:
        return "baseline"
    if "unsuccess" in s or "fail" in s or "not" in s:
        return "unsuccessful"
    if s in {"baseline", "social_eng", "unsuccessful"}:
        return s
    return s

def safe_read_excel(path: Path, sheet_name: str) -> pd.DataFrame:
    try:
        return pd.read_excel(path, sheet_name=sheet_name)
    except ImportError as e:
        raise SystemExit(
            "Pandas could not read the Excel file (openpyxl likely missing).\n"
            "Activate your venv and run:  pip install openpyxl"
        ) from e


# ---------- Core builders ----------
def precompute_column_map(df: pd.DataFrame) -> Dict[Tuple[str, str], Tuple[Optional[str], Optional[str]]]:
    colmap: Dict[Tuple[str, str], Tuple[Optional[str], Optional[str]]] = {}
    for model_name, cfg in MODELS.items():
        for variant_key, vinfo in VARIANTS.items():
            vlabel = vinfo["header"]
            test_col = find_first_present(df, candidate_headers(cfg["test_prefixes"], vlabel))
            out_col  = find_first_present(df, candidate_headers(cfg["out_prefixes"],  vlabel))
            colmap[(model_name, variant_key)] = (test_col, out_col)
    return colmap

def find_condition_column(df: pd.DataFrame) -> Optional[str]:
    for col in df.columns:
        if normalize_text(col) == "condition":
            return col
    return None

def build_long_dataframe(excel_path: Path, sheet_name: str = "final_prompts_sensitive") -> pd.DataFrame:
    df = safe_read_excel(excel_path, sheet_name)
    if df.empty:
        log.warning("The requested sheet is empty.")
        return pd.DataFrame(columns=REQUIRED_COLUMNS + META_COLUMNS)

    model_variant_cols = precompute_column_map(df)
    condition_col = find_condition_column(df)

    rows: List[dict] = []
    for i in range(len(df)):
        row = df.iloc[i]
        base_id = f"WP1_{i+1:04d}"
        attack_category = str(row.get("Attack Category") or "").strip()
        technique       = str(row.get("Technique") or "").strip()

        for model_name, _ in MODELS.items():
            for variant_key, vinfo in VARIANTS.items():
                test_col, out_col = model_variant_cols[(model_name, variant_key)]
                if test_col is None and out_col is None:
                    continue

                prompt_text = pick_variant_prompt(row, variant_key)
                out_text    = str(row.get(out_col)  or "").strip() if out_col  else ""
                test_raw    = str(row.get(test_col) or "").strip() if test_col else ""

                if not prompt_text and not out_text:
                    continue

                if condition_col:
                    condition = normalize_condition_label(row.get(condition_col, ""))
                else:
                    condition = "baseline" if variant_key == "direct" else "social_eng"

                refusal_flag = map_test_result_to_refusal_flag(test_raw)
                attack_id    = f"{base_id}_{model_name}_{vinfo['suffix']}"

                rows.append({
                    "attack_id": attack_id,
                    "condition": condition,
                    "model_name": model_name,
                    "prompt_text": prompt_text,
                    "output_text": out_text,
                    "refusal_flag": refusal_flag,
                    "tox_score": "",
                    "has_identity": "",
                    "regard_label": "",
                    "variant": variant_key,
                    "attack_category": attack_category,
                    "technique": technique,
                    "wp1_test_result": test_raw,
                })

    prepared = pd.DataFrame(rows)
    if prepared.empty:
        for c in REQUIRED_COLUMNS + META_COLUMNS:
            prepared[c] = []
        return prepared[REQUIRED_COLUMNS + META_COLUMNS]

    prepared = prepared[REQUIRED_COLUMNS + [c for c in META_COLUMNS if c in prepared.columns]]
    prepared = prepared[~(prepared["prompt_text"].astype(str).str.strip().eq("") &
                          prepared["output_text"].astype(str).str.strip().eq(""))].copy()
    prepared = prepared.sort_values(
        by=["condition", "model_name", "variant", "attack_id"],
        kind="stable"
    ).reset_index(drop=True)
    return prepared


# ---------- Friendly summaries & previews ----------
def print_human_summary(df: pd.DataFrame) -> None:
    if df.empty:
        log.info("No rows emitted.")
        return

    log.info("\nSummary:")
    counts = (
        df.groupby(["model_name", "variant", "condition"], dropna=False)
          .size().reset_index(name="rows")
          .sort_values(["model_name", "variant", "condition"])
    )
    for _, r in counts.iterrows():
        log.info(f"  {r['model_name']:<6} | {r['variant']:<11} | {r['condition'] or '(blank)':<13} | {int(r['rows']):>4} rows")

    fail_rate = (
        df.groupby("model_name", dropna=False)["refusal_flag"]
          .mean().reset_index(name="fail_rate")
          .sort_values("model_name")
    )
    log.info("\nApprox. fail rate (refusal_flag=1):")
    for _, r in fail_rate.iterrows():
        log.info(f"  {r['model_name']:<6} | {r['fail_rate']:.3f}")

def _truncate(s: str, max_len: int) -> str:
    s = (s or "").replace("\n", " ").replace("\r", " ")
    return s if len(s) <= max_len else (s[: max_len - 1] + "…")

def print_preview(df: pd.DataFrame, n: int = 5, width: int = 120) -> None:
    if n <= 0 or df.empty:
        return
    print("\nPreview (first {} rows):".format(min(n, len(df))))
    print("-" * width)
    for idx, (_, r) in enumerate(df.head(n).iterrows(), start=1):
        print(f"[{idx}] {r.get('attack_id','')}")
        print(f"     model={r.get('model_name',''):>6}  variant={r.get('variant',''):>11}  condition={r.get('condition','') or '(blank)'}")
        print(f"     refusal_flag={r.get('refusal_flag','')}  test_result={_truncate(str(r.get('wp1_test_result','')), 50)}")
        print(f"     prompt: {_truncate(str(r.get('prompt_text','')), width - 10)}")
        print(f"     output: {_truncate(str(r.get('output_text','')), width - 10)}")
        print("-" * width)


# ---------- CLI ----------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Prepare JSON from WP1 Excel (auto-detect models/variants; condition independent from success)."
    )
    # Now optional; defaults come from repo structure
    parser.add_argument("--excel", type=Path, default=None, help="Path to the WP1 Excel workbook. Defaults to data/raw/wp1_prompts.xlsx")
    parser.add_argument("--sheet", default="final_prompts_sensitive", help="Sheet name (default: final_prompts_sensitive).")
    parser.add_argument("--out", type=Path, default=None, help="Output path for JSON. Defaults to data/interim/wp1_prompts_prepared.json")
    parser.add_argument("--verbose", action="store_true", help="More logs.")
    parser.add_argument("--quiet", action="store_true", help="Only summary + final path.")
    parser.add_argument("--preview", type=int, default=0, help="Show the first N rows as a readable preview (default: 0 = off).")
    parser.add_argument("--preview-width", type=int, default=120, help="Wrap/truncate width for preview lines.")
    args = parser.parse_args()

    if args.quiet:
        logging.basicConfig(level=logging.WARNING, format="%(message)s")
    elif args.verbose:
        logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    else:
        logging.basicConfig(level=logging.INFO, format="%(message)s")

    # Compute defaults dynamically if not provided
    default_in, default_out = default_paths()
    excel_path = args.excel or default_in
    out_path   = args.out   or default_out

    log.info(f"Excel input : {excel_path}")
    log.info(f"JSON output : {out_path}")

    df_long = build_long_dataframe(excel_path, sheet_name=args.sheet)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(df_long.to_dict(orient="records"), f, ensure_ascii=False, indent=2)

    print_human_summary(df_long)
    print_preview(df_long, n=args.preview, width=args.preview_width)
    log.warning(f"\nWrote JSON → {out_path}  ({len(df_long)} rows)")


if __name__ == "__main__":
    main()
