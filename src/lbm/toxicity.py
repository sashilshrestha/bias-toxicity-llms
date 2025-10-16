import pandas as pd
import time
import re
import json
from detoxify import Detoxify
from pathlib import Path

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
    in_path = repo_root / "data" / "interim" / "wp1_prompts_prepared.json"
    out_path = repo_root / "data" / "interim" / "wp1_prompts_with_toxicity.json"
    summary_path = repo_root / "data" / "processed" / "toxicity_summary.json"

    return in_path, out_path, summary_path

def clean_llm_output(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"[*_]{1,3}", "", text)
    text = re.sub(r"^- ", "", text, flags=re.MULTILINE)
    text = re.sub(r"\d+\.\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"`{1,3}.*?`{1,3}", "", text)
    text = re.sub(r"\[.*?\]\(.*?\)", "", text)
    text = re.sub(r"\n+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()

def load_json_as_df(input_path: str) -> pd.DataFrame:
    input_path = Path(input_path)
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    print(f"[INFO] Loaded {len(df)} rows from {input_path}")
    return df

def compute_detoxify_batch(texts):
    detox_model = Detoxify('original')
    out = detox_model.predict(texts)
    keys = list(out.keys())
    n = len(out[keys[0]])
    return [{k: float(out[k][i]) for k in keys} for i in range(n)]

def run_detoxify_scoring(df: pd.DataFrame, batch_size: int = 32) -> pd.DataFrame:
    df["clean_output_text"] = df["output_text"].apply(clean_llm_output)
    rows = []
    t0 = time.time()
    for i in range(0, len(df), batch_size):
        batch_texts = df.loc[i:i+batch_size-1, "clean_output_text"].fillna("").tolist()
        batch_scores = compute_detoxify_batch(batch_texts)
        rows.extend(batch_scores)
        print(f"Processed {min(i+batch_size, len(df))}/{len(df)}", end="\r")
    t1 = time.time()
    print(f"\n[INFO] Detoxify scoring completed in {t1 - t0:.1f}s")

    detox_df = pd.DataFrame(rows)
    df = pd.concat([df.reset_index(drop=True), detox_df.reset_index(drop=True)], axis=1)
    return df

def save_df_as_json(df: pd.DataFrame, output_path: str):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_json(output_path, orient="records", force_ascii=False, indent=2)
    print(f"[INFO] Saved output to: {output_path.resolve()}")


def normalize_fields(df)-> pd.DataFrame:
    df = df.copy()  # to avoid modifying original DataFrame
    
    df['attack_category'] = df['attack_category'].replace({
        'Guns & Illegal Weapons': 'Guns and Illegal Weapons',
        'Guns and Illegal Weapons': 'Guns and Illegal Weapons',
        'Violence & Hate': 'Violence and Hate',
        'Hate and voilence': 'Violence and Hate',
        'Violence and Hate': 'Violence and Hate',
        'Self harm and suicide': 'Self-harm & suicide'
    })
    
    df['technique'] = df['technique'].replace({
        'Attention Grabbing': 'Attention grabbing',
        'Attention grabbing': 'Attention grabbing',
        'Foot-in-the-Door': 'Foot-In-The-Door',
        'Foot-In-The-Door': 'Foot-In-The-Door'
    })
    
    df['wp1_test_result'] = df['wp1_test_result'].replace({
        'partial': 'Partial',
        'Partial': 'Partial',
        'Partial success': 'Partial',
        'Success': 'success',
        'success': 'success'
    })
    
    return df

def normalize_fields(df) -> pd.DataFrame:
    df = df.copy()

    df['attack_category'] = df['attack_category'].replace({
        'Guns & Illegal Weapons': 'Guns and Illegal Weapons',
        'Violence & Hate': 'Violence and Hate',
        'Hate and voilence': 'Violence and Hate',
        'Self harm and suicide': 'Self-harm & suicide'
    })

    df['technique'] = df['technique'].replace({
        'Attention Grabbing': 'Attention grabbing',
        'Foot-in-the-Door': 'Foot-In-The-Door'
    })

    df['wp1_test_result'] = df['wp1_test_result'].replace({
        'Partial': 'partial',
        'Partial success': 'partial',
        'Success': 'success'
    })

    return df

def generate_toxicity_summary(df: pd.DataFrame, output_path: str):
    # Define the toxicity-related columns
    toxicity_columns = [
        "toxicity", "severe_toxicity", "obscene",
        "threat", "insult", "identity_attack"
    ]

    # Check if required columns are present
    missing_cols = [col for col in toxicity_columns + ["model_name", "condition", "output_text"] if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")

    # Group by condition and model_name, compute mean for toxicity columns and count of rows
    summary_df = (
        df.groupby(["condition", "model_name"])
        .agg({**{col: "mean" for col in toxicity_columns}, "output_text": "count"})
        .reset_index()
        .rename(columns={"output_text": "n_rows"})
    )

    # Convert to list of dicts
    results = summary_df.to_dict(orient="records")

    # Ensure output directory exists
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Save to JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"[INFO] Toxicity summary saved to {output_path.resolve()}")

def generate_toxicity_summary(df: pd.DataFrame, output_path: str):
    toxicity_columns = [
        "toxicity", "severe_toxicity", "obscene",
        "threat", "insult", "identity_attack"
    ]

    # Check if required columns are present
    missing_cols = [col for col in toxicity_columns + ["model_name", "condition", "output_text"] if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")

    # Group by condition and model_name, compute mean for toxicity columns and count of rows
    summary_df = (
        df.groupby(["condition", "model_name"])
        .agg({**{col: "mean" for col in toxicity_columns}, "output_text": "count"})
        .reset_index()
        .rename(columns={"output_text": "n_rows"})
    )

    # Convert to list of dicts
    results = summary_df.to_dict(orient="records")

    # Ensure output directory exists
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Save to JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"[INFO] Toxicity summary saved to {output_path.resolve()}")

def main():

    default_in, default_out, summary_path = default_paths()
    df = load_json_as_df(default_in)
    df = run_detoxify_scoring(df, batch_size=32)
    # remove unwanted field: tox_score, clean_output_text 
    df = df.drop(columns=["tox_score", "clean_output_text"], errors="ignore")
    # normalized identified fields
    df_normalized = normalize_fields(df)
    save_df_as_json(df_normalized, default_out)

    # save toxicity summary
    generate_toxicity_summary(df, summary_path)

if __name__ == "__main__":
    main()
