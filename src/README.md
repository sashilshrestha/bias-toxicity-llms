# Source Code (`src/`)

This folder contains the scripts for downloading, cleaning, and managing datasets used in the bias evaluation project.

## Scripts

### 1. `download_datasets.py`
- **Purpose:** Downloads raw datasets into `data/raw/`.
- **Datasets:**
  - CrowS-Pairs (`crows_pairs_anonymized.csv`)
  - StereoSet (`stereoset_dev.json`)
  - HolisticBias (`descriptors.json`, `nouns.json`, `sentence_templates.json`, `standalone_noun_phrases.json`)
- **Output:** Raw files under `data/raw/` (ignored by Git).
- **Usage:**
  ```bash
  python src/download_datasets.py

### 2. `clean_and_slice.py`

**Purpose:**  
Cleans raw datasets, samples 10% (or the value specified in `configs/week6_pilot.yaml`), and saves processed slices.

**Config:**  
Reads parameters from `configs/week6_pilot.yaml`, including:
- `seed`: Random seed  
- `sample_pct`: Fraction of dataset to keep  
- `datasets`: Raw + processed paths  

**Output:**  
- Processed JSONLs in `data/processed/`  
- Registry manifest in `data/registry.json`  

**Schema:**  
All processed JSONL files share the same keys:

```json
{
  "id": "unique_id",
  "prompt": "Text prompt for the model",
  "targets": ["anti", "stereo"],
  "label": "bias_type or source"
}
