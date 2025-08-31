# LLM Bias Benchmarking & Mitigation

Benchmarking and evaluating bias in large language models (LLMs) using **Jupyter Notebooks**.  
This project explores model behavior across bias-sensitive datasets (e.g., HolisticBias, CrowS-Pairs, StereoSet) and evaluates mitigation strategies.  

The repository is designed for **collaborative experimentation**: notebooks handle the core workflow, while optional helper modules keep code reusable and clean. Future extensions (e.g., a dashboard or API) can plug in without restructuring.

---

## 🚀 Goals

- **Benchmark** multiple LLMs (DeepSeek-R1, Llama-3.1, Qwen-3, Gemma-3)  
- **Audit bias** using standard datasets (HolisticBias, CrowS-Pairs, StereoSet)  
- **Simulate attacks** (e.g., social engineering, prompt injection)  
- **Evaluate mitigation strategies** and record their effect on metrics  
- **Aggregate results** into structured exports for reporting or dashboards  

---

## 📂 Repository Layout

📦 llm-bias-benchmark
┣ 📒 notebooks/ # Jupyter notebooks for experiments
┃ ┣ 📘 00_setup.ipynb # environment checks, imports, API keys
┃ ┣ 📘 10_datasets.ipynb # dataset loading & preprocessing
┃ ┣ 📘 20_baseline_eval.ipynb # initial bias evaluation on models
┃ ┣ 📘 30_mitigation_eval.ipynb # test mitigation strategies
┃ ┣ 📘 40_stats_and_plots.ipynb # aggregate metrics, generate charts
┃ ┗ 📘 90_export_results.ipynb # prepare data for reporting/dashboard
┣ 📂 data/ # (gitignored) datasets
┃ ┣ 📂 raw/ # original downloads
┃ ┣ 📂 interim/ # cleaned/intermediate data
┃ ┗ 📂 processed/ # ready-to-use datasets
┣ 📂 results/ # (gitignored) outputs
┃ ┣ 📂 runs/ # per-run artifacts (metrics, logs, plots)
┃ ┗ 📂 exports/ # aggregated results for dashboards/reports
┣ 📂 src/ # optional Python helpers
┃ ┗ 📂 lbm/
┃ ┣ 📄 datasets.py # dataset loaders
┃ ┣ 📄 attacks.py # attack templates
┃ ┣ 📄 models.py # model API wrappers
┃ ┣ 📄 metrics.py # bias/fairness metrics
┃ ┗ 📄 eval.py # evaluation loops
┣ 📂 tests/ # unit tests for metrics/helpers
┣ 📂 dashboard/ (optional) # placeholder for future visualisation
┣ 📄 .gitignore
┣ 📄 README.md
┗ 📄 requirements.txt or pyproject.toml

---

## 📊 Workflow

1. **Setup notebook** (`00_setup.ipynb`) → check dependencies & keys  
2. **Load datasets** (`10_datasets.ipynb`) → preprocess bias benchmarks  
3. **Baseline evaluation** (`20_baseline_eval.ipynb`) → test raw model behavior  
4. **Apply attacks & mitigations** (`30_mitigation_eval.ipynb`)  
5. **Aggregate metrics & plots** (`40_stats_and_plots.ipynb`)  
6. **Export results** (`90_export_results.ipynb`) → JSON/CSV for reporting/dashboard  

---

## 📈 Optional/Future Extensions

- **Dashboard** (React/Chakra UI, Next.js, or Streamlit) to visualise results interactively  
- **API layer** (FastAPI or Flask) to serve metrics to external tools  
- **Additional datasets** for fairness and robustness evaluation  
- **Expanded attacks** (more prompt-injection and social engineering templates)  

---

## 📝 License
MIT
