from pathlib import Path
from urllib.request import urlretrieve

BASE = Path("data/raw")
(BASE / "crows_pairs").mkdir(parents=True, exist_ok=True)
(BASE / "stereoset").mkdir(parents=True, exist_ok=True)
(BASE / "holisticbias").mkdir(parents=True, exist_ok=True)

def fetch(url: str, out: Path):
    out.parent.mkdir(parents=True, exist_ok=True)
    print(f"↓ {url}\n→ {out}")
    urlretrieve(url, out.as_posix())

def main():
    # --- CrowS-Pairs (authors’ GitHub) ---
    fetch(
        "https://raw.githubusercontent.com/nyu-mll/crows-pairs/master/data/crows_pairs_anonymized.csv",
        BASE / "crows_pairs" / "crows_pairs_anonymized.csv",
    )

    # --- StereoSet (official GitHub JSON) ---
    fetch(
        "https://raw.githubusercontent.com/moinnadeem/StereoSet/master/data/dev.json",
        BASE / "stereoset" / "stereoset_dev.json",
    )

    # --- HolisticBias (official FB Research repo) ---
    fetch(
        "https://raw.githubusercontent.com/facebookresearch/ResponsibleNLP/main/holistic_bias/dataset/v1.1/descriptors.json",
        BASE / "holisticbias" / "descriptors.json",
    )
    fetch(
        "https://raw.githubusercontent.com/facebookresearch/ResponsibleNLP/main/holistic_bias/dataset/v1.1/nouns.json",
        BASE / "holisticbias" / "nouns.json",
    )
    fetch(
        "https://raw.githubusercontent.com/facebookresearch/ResponsibleNLP/main/holistic_bias/dataset/v1.1/sentence_templates.json",
        BASE / "holisticbias" / "sentence_templates.json",
    )
    fetch(
        "https://raw.githubusercontent.com/facebookresearch/ResponsibleNLP/main/holistic_bias/dataset/v1.1/standalone_noun_phrases.json",
        BASE / "holisticbias" / "standalone_noun_phrases.json",
    )

    print("\n✅ Downloads complete. Raw files are in data/raw/")

if __name__ == "__main__":
    main()
