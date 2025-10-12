import json
from pathlib import Path
import ast, json, math, random, glob, yaml


# RUN clean_and_slice.py before running this

CFG_PATH = Path("configs/week6_pilot.yaml")
if not CFG_PATH.exists():
    raise FileNotFoundError(f"Missing config {CFG_PATH}")
cfg = yaml.safe_load(CFG_PATH.read_text())

# Get input paths for sliced datasets
crows_path = Path(cfg["datasets"]["crows_pairs"]["out"])
stereoset_intra_path = Path(cfg["datasets"]["stereoset_intrasentence"]["out"])
stereoset_inter_path = Path(cfg["datasets"]["stereoset_intersentence"]["out"])

# Set output path for combined dataset
combined_out_path = Path("data/processed/combined_datasets.jsonl")



# Mapping of bias types for uniformity
bias_mapping = {
    'race-color': 'race'
}

def map_label(label):
    return bias_mapping.get(label, label)

def read_jsonl(path):
    with path.open(encoding='utf-8') as f:
        return [json.loads(line) for line in f]

def write_jsonl(rows, out_path):
    with out_path.open('w', encoding='utf-8') as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + '\n')
    print(f"Wrote {len(rows)} records to {out_path}")

def generate_dataset_type1():
    combined = []

    # Load CrowS-Pairs
    if crows_path.exists():
        crows_data = read_jsonl(crows_path)
        for entry in crows_data:
            entry["label"] = map_label(entry.get("label",""))
            # Add the new columns
            if "targets" in entry and isinstance(entry["targets"], list) and len(entry["targets"]) >= 2:
                entry["option_1"] = entry["targets"][0]
                entry["option_2"] = entry["targets"][1]
            else:
                entry["option_1"] = None
                entry["option_2"] = None
            entry["stereo_index"] = 1
        combined.extend(crows_data)
    else:
        print(f"Missing {crows_path}")

    # Load StereoSet intrasentence
    if stereoset_intra_path.exists():
        stereoset_intra = read_jsonl(stereoset_intra_path)
        for entry in stereoset_intra:
            entry["label"] = map_label(entry.get("label",""))
            if "targets" in entry and isinstance(entry["targets"], list) and len(entry["targets"]) >= 2:
                entry["option_1"] = entry["targets"][0]
                entry["option_2"] = entry["targets"][1]
            else:
                entry["option_1"] = None
                entry["option_2"] = None
            entry["stereo_index"] = 1
        combined.extend(stereoset_intra)
    else:
        print(f"Missing {stereoset_intra_path}")

    # Load StereoSet intersentence
    if stereoset_inter_path.exists():
        stereoset_inter = read_jsonl(stereoset_inter_path)
        for entry in stereoset_inter:
            entry["label"] = map_label(entry.get("label",""))
            if "targets" in entry and isinstance(entry["targets"], list) and len(entry["targets"]) >= 2:
                entry["option_1"] = entry["targets"][0]
                entry["option_2"] = entry["targets"][1]
            else:
                entry["option_1"] = None
                entry["option_2"] = None
            entry["stereo_index"] = 1
        combined.extend(stereoset_inter)
    else:
        print(f"Missing {stereoset_inter_path}")

    # Write combined output
    combined_out_path.parent.mkdir(parents=True, exist_ok=True)
    write_jsonl(combined, combined_out_path)


if __name__ == "__main__":
    generate_dataset_type1() # combination of and crows pair and stereoset dataset

