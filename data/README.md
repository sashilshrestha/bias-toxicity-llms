# data/

This directory holds all datasets and artifacts for the Weeks 10–11 pipeline.  
We use a simple, reproducible **three-tier** layout:

## Layout
- `raw/` — Source data as received (e.g., `wp1_prompts.xlsx` from WP1). **Do not edit by hand.**
- `interim/` — Cleaned/reshaped artifacts for analysis (e.g., `wp1_prompts_prepared.json`).
- `processed/` — Final metrics & stats (e.g., `toxicity_summary.csv`, `bias_metrics.csv`, `stats_results.csv`).

## Canonical files
- **Input:** `raw/wp1_prompts.xlsx`
- **Prepared:** `interim/wp1_prompts_prepared.json`
- **Processed (expected later):**
  - `processed/toxicity_summary.csv`
  - `processed/bias_metrics.csv`
  - `processed/stats_results.csv`

## Generate the prepared JSON
From the repo root:
```bash
python src/lbm/prepare_wp1_gui_json.py --preview 5
```

**Reads:** `data/raw/wp1_prompts.xlsx`  
**Writes:** `data/interim/wp1_prompts_prepared.json`  
`--preview N` prints a readable sample of N rows.

### Optional overrides
```bash
python src/lbm/prepare_wp1_gui_json.py \
  --excel data/raw/wp1_prompts.xlsx \
  --out data/interim/wp1_prompts_prepared.json \
  --sheet "final_prompts_sensitive" \
  --preview 3 --preview-width 120
```

### Prepared JSON schema
| Column            | Type      | Meaning                                                                 |
|-------------------|-----------|-------------------------------------------------------------------------|
| `attack_id`       | string    | Unique per (prompt × model × variant), e.g., `WP1_0001_Gemini_PARA`     |
| `condition`       | string    | Prompt type: `baseline` (direct) / `social_eng` (paraphrased) / `unsuccessful` |
| `model_name`      | string    | One of: `Gemini`, `GPT`, `Grok`                                         |
| `prompt_text`     | string    | Variant-specific prompt                                                 |
| `output_text`     | string    | Model output from WP1                                                   |
| `refusal_flag`    | int       | `1 = fail`, `0 = success/partial` (derived from WP1 test result)        |
| `tox_score`       | float/""  | Placeholder for toxicity score (computed later)                         |
| `has_identity`    | int/""    | Placeholder: `1` if output mentions an identity group                   |
| `regard_label`    | string/"" | Placeholder: `{pos, neu, neg}` (only when `has_identity==1`)            |
| `variant`         | string    | `direct` or `paraphrased`                                               |
| `attack_category` | string    | From sheet (if present)                                                 |
| `technique`       | string    | From sheet (if present)                                                 |
| `wp1_test_result` | string    | Raw WP1 result used to derive `refusal_flag`                            |

### Conventions
- Scripts **read from** `raw/`, **write to** `interim/`, and **publish to** `processed/`.
- Keep filenames stable where possible (automation expects them).
- If you replace `raw/wp1_prompts.xlsx`, re-run the prep script to refresh `interim/`.

### Troubleshooting
- `ImportError: openpyxl` → `pip install openpyxl`
- “File not found” → confirm `raw/wp1_prompts.xlsx` exists (or pass `--excel` to the script)
