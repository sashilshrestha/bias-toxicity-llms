## Datasets

- **CrowS-Pairs**
  - Source: [NYU MLL GitHub](https://github.com/nyu-mll/crows-pairs)
  - Raw: `data/raw/crows_pairs/crows_pairs_anonymized.csv`
  - Processed: `data/processed/crows_pairs_10pct.jsonl`

- **StereoSet**
  - Source: [StereoSet GitHub](https://github.com/moinnadeem/StereoSet)
  - Raw: `data/raw/stereoset/stereoset_dev.json`
  - Processed:
    - `data/processed/stereoset_intrasentence_10pct.jsonl`
    - `data/processed/stereoset_intersentence_10pct.jsonl`

- **HolisticBias**
  - Source: [Facebook Responsible NLP](https://github.com/facebookresearch/ResponsibleNLP)
  - Raw JSON files in `data/raw/holisticbias/`
  - Processed: `data/processed/holisticbias_10pct.jsonl`

## Schema

All processed datasets follow the same schema:

```json
{
  "id": "unique_id",
  "prompt": "Text prompt given to the model",
  "targets": ["anti", "stereo"],  // may be [] for free-generation datasets
  "label": "bias_type or source"
}

---

## 🔹 2. `registry.json`
This is a **machine-readable index** of datasets, useful if you want scripts or dashboards to dynamically load what’s available. Think of it as the “manifest” for your processed datasets.

Example (`data/registry.json`):

```json
{
  "crows_pairs": {
    "raw": "data/raw/crows_pairs/crows_pairs_anonymized.csv",
    "processed": "data/processed/crows_pairs_10pct.jsonl",
    "size_total": 1508,
    "size_sampled": 150
  },
  "stereoset_intrasentence": {
    "raw": "data/raw/stereoset/stereoset_dev.json",
    "processed": "data/processed/stereoset_intrasentence_10pct.jsonl",
    "size_total": 2106,
    "size_sampled": 210
  },
  "stereoset_intersentence": {
    "raw": "data/raw/stereoset/stereoset_dev.json",
    "processed": "data/processed/stereoset_intersentence_10pct.jsonl",
    "size_total": 2123,
    "size_sampled": 212
  },
  "holisticbias": {
    "raw": "data/raw/holisticbias/*",
    "processed": "data/processed/holisticbias_10pct.jsonl",
    "size_total": 18528,
    "size_sampled": 1852
  }
}
