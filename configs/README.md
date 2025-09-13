# Configurations

This folder contains YAML configuration files that define parameters for dataset cleaning, sampling, and registry creation.

## Files

- **week6_pilot.yaml**  
  Configuration for the Week 6 pilot study. Defines:
  - Global settings (seed, sample percentage)
  - Dataset-specific sources, outputs, and schema
  - Location of attack prompts file

## Schema

### Top-level keys
- `seed`: Random seed for reproducibility (default: 42).
- `sample_pct`: Fraction of each dataset to sample (e.g., `0.10` = 10%).
- `datasets`: Map of dataset configurations.
- `attacks_out`: Path to where curated attack prompts are saved.

### Per-dataset keys
Each dataset under `datasets:` should have:

- `source`: Path to the raw dataset file(s).
- `out`: Path to the processed 10% JSONL slice.
- `schema`: List of fields expected in the processed JSONL.

### Example

```yaml
seed: 42
sample_pct: 0.10
datasets:
  crows_pairs:
    source: data/raw/crows_pairs/crows_pairs_anonymized.csv
    out: data/processed/crows_pairs_10pct.jsonl
    schema: [id, prompt, targets, label]
  stereoset_intrasentence:
    source: data/raw/stereoset/stereoset_dev.json
    out: data/processed/stereoset_intrasentence_10pct.jsonl
    schema: [id, prompt, targets, label]
  stereoset_intersentence:
    source: data/raw/stereoset/stereoset_dev.json
    out: data/processed/stereoset_intersentence_10pct.jsonl
    schema: [id, prompt, targets, label]
  holisticbias:
    source: data/raw/holisticbias/*
    out: data/processed/holisticbias_10pct.jsonl
    schema: [id, prompt, targets, label]
attacks_out: data/processed/attack_prompts.json
