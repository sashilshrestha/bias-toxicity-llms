# src/lbm/

Utilities for the Weeks 9–11 pipeline.  
This folder currently contains the **data preparation** script that converts the WP1 Excel into a clean, long-format JSON for analysis.

---

## Scripts

### `prepare_wp1_gui_json.py`
Turns `data/raw/wp1_prompts.xlsx` into `data/interim/wp1_prompts_prepared.json`.

**Key behavior**
- Auto-detects columns for **Gemini / GPT / Grok × Direct / Paraphrased**.
- Emits **one row per (prompt × model × variant)** actually present in the sheet.
- `condition` reflects **prompt type** only:
  - If a `Condition` column exists, it’s normalized to: `baseline`, `social_eng`, or `unsuccessful`.
  - Otherwise: `direct → baseline`, `paraphrased → social_eng`.
- `refusal_flag` comes **only** from WP1 “Test Result”:
  - `fail/failed/no/unsuccessful → 1`
  - `success/successful/pass/partial → 0`
  - unknown → `1` (conservative).
- Adds `--preview` to print a few readable sample rows with truncation.

---

## Quickstart

From the repo root:
```bash
python src/lbm/prepare_wp1_gui_json.py --preview 5
```

### Defaults
**Reads:** `data/raw/wp1_prompts.xlsx`  
**Writes:** `data/interim/wp1_prompts_prepared.json`

### Preview
- `--preview N` prints the first N rows with truncated `prompt_text`/`output_text`.
- `--preview-width W` controls truncation width (default: `120`).

### CLI Options
```text
--excel <path>            # override input Excel (default: data/raw/wp1_prompts.xlsx)
--out <path>              # override output JSON (default: data/interim/wp1_prompts_prepared.json)
--sheet <name>            # sheet name (default: final_prompts_sensitive)
--preview N               # print first N rows as human-readable preview
--preview-width W         # truncation width for preview lines (default: 120)
--verbose                 # more logs
--quiet                   # minimal logs
```

### Examples
```bash
# Custom sheet + 3-row preview
python src/lbm/prepare_wp1_gui_json.py \
  --sheet "final_prompts_sensitive" \
  --preview 3 --preview-width 100

# Fully explicit paths
python src/lbm/prepare_wp1_gui_json.py \
  --excel data/raw/wp1_prompts.xlsx \
  --out data/interim/wp1_prompts_prepared.json \
  --preview 5
```

### Output schema (summary)

`data/interim/wp1_prompts_prepared.json` contains:

| Column            | Type      | Meaning                                                                          |
|-------------------|-----------|----------------------------------------------------------------------------------|
| `attack_id`       | string    | Unique per (prompt × model × variant), e.g., `WP1_0001_Gemini_PARA`              |
| `condition`       | string    | `baseline` (direct) / `social_eng` (paraphrased) / `unsuccessful`                |
| `model_name`      | string    | One of: `Gemini`, `GPT`, `Grok`                                                  |
| `prompt_text`     | string    | Variant-specific prompt                                                          |
| `output_text`     | string    | Model output from WP1                                                            |
| `refusal_flag`    | int       | `1 = fail`, `0 = success/partial` (from WP1 test result)                         |
| `tox_score`       | float/""  | Placeholder (computed later)                                                     |
| `has_identity`    | int/""    | Placeholder: `1` if output mentions an identity group                            |
| `regard_label`    | string/"" | Placeholder: `{pos, neu, neg}` (only when `has_identity==1`)                     |
| `variant`         | string    | `direct` or `paraphrased`                                                        |
| `attack_category` | string    | From sheet (if present)                                                          |
| `technique`       | string    | From sheet (if present)                                                          |
| `wp1_test_result` | string    | Raw WP1 result used to derive `refusal_flag`                                     |

---

### How to extend (dev notes)

- **Add a new model** (e.g., DeepSeek): update the `MODELS` mapping in the script with:
  - `test_prefixes` for “Test Result …” columns
  - `out_prefixes` for “<Model> Output …” columns
- **Different sheet name**: pass `--sheet "<name>"`.
- **Explicit condition column**: if the Excel has `Condition`, it overrides variant-derived labels and is normalized to `{baseline, social_eng, unsuccessful}`.
- **Override paths**: use `--excel` and `--out` to ignore the defaults.

---

### Troubleshooting

- **Excel engine missing**  
  `ImportError: openpyxl` → `pip install openpyxl`
- **File not found**  
  Ensure `data/raw/wp1_prompts.xlsx` exists, or pass `--excel <path>`.
- **PowerShell blocked venv activation**  
  `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` then `.\.venv\Scripts\Activate.ps1`.
