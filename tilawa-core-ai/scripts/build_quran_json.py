"""Build app/data/quran.json from a plain-text mushaf file.

Expected input format (per line), e.g. from Tanzil uthmani:
    1|1|بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
    1|2|الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
    ...

Usage:
    python scripts/build_quran_json.py --src path/to/quran-uthmani.txt

This will write app/data/quran.json in the format expected by load_quran_verses():
    [
      {"surah": 1, "ayah": 1, "text": "..."},
      ...
    ]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import List, Dict


def parse_line(line: str) -> Dict:
    line = line.strip()
    if not line or line.startswith("#"):
        raise ValueError("Empty or comment line")

    try:
        surah_str, ayah_str, text = line.split("|", maxsplit=2)
    except ValueError as exc:
        raise ValueError(f"Invalid line format: {line!r}") from exc

    return {
        "surah": int(surah_str.strip()),
        "ayah": int(ayah_str.strip()),
        "text": text.strip(),
    }


def build_quran_json(src: Path, dst: Path) -> None:
    verses: List[Dict] = []
    with src.open("r", encoding="utf-8") as f:
        for raw in f:
            raw = raw.strip("\n")
            if not raw or raw.lstrip().startswith("#"):
                continue
            verse = parse_line(raw)
            verses.append(verse)

    dst.parent.mkdir(parents=True, exist_ok=True)
    with dst.open("w", encoding="utf-8") as f:
        json.dump(verses, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(verses)} verses to {dst}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", type=str, required=True, help="Path to quran-uthmani.txt (surah|ayah|text)")
    parser.add_argument(
        "--dst",
        type=str,
        default=str(Path(__file__).resolve().parents[1] / "app" / "data" / "quran.json"),
        help="Output JSON path (default: app/data/quran.json)",
    )
    args = parser.parse_args()

    src_path = Path(args.src)
    dst_path = Path(args.dst)
    build_quran_json(src_path, dst_path)


if __name__ == "__main__":
    main()
