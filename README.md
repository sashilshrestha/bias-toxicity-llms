# xc3-bias-mitigation-llm
Mitigating bias in LLMs via LoRA fine‑tuning and RLHF. Includes bias audits, metrics, evaluations, and reproducible pipelines.

llm-bias-benchmark/
├─ notebooks/                         # Jupyter pipeline (EDA → baseline → mitigations → stats → export)
│  ├─ 00_setup.ipynb
│  ├─ 10_datasets.ipynb
│  ├─ 20_baseline_eval.ipynb
│  ├─ 30_mitigation_eval.ipynb
│  ├─ 40_stats_and_plots.ipynb
│  └─ 90_export_dashboard_data.ipynb  # writes JSON/CSV for dashboard
├─ src/                               # Python package (reusable logic for notebooks & tests)
│  └─ lbm/
│     ├─ __init__.py
│     ├─ config.py
│     ├─ datasets.py
│     ├─ attacks.py
│     ├─ models.py
│     ├─ eval.py
│     ├─ metrics.py
│     ├─ plotting.py
│     └─ io.py
├─ results/                           # Generated artifacts (gitignored)
│  ├─ runs/
│  └─ dashboard/                      # JSON/CSV the dashboard reads
├─ dashboard/                         # Frontend app (your choice; see options below)
│  ├─ (framework files…)
│  └─ public/data/                    # (optional) mount/serve results files
├─ tests/                             # Unit tests for Python logic
│  ├─ test_metrics.py
│  └─ test_attacks.py
├─ .github/workflows/                 # CI for both sides
│  ├─ ci-python.yml
│  └─ ci-frontend.yml
├─ .env.sample                        # Example secrets (copy → .env; never commit .env)
├─ .gitignore
├─ pyproject.toml                     # Python/Poetry config (or requirements.txt if you prefer pip)
├─ Makefile                           # Dev shortcuts
└─ README.md
