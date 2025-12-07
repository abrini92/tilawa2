"""Fetch the full Qur'an (uthmani script) from AlQuran.Cloud and
write it as app/data/quran.json for tilawa-core-ai.

This script is intended to be run manually when setting up or refreshing
the local mushaf used by quran_normalize.load_quran_verses().

Usage (from project root):

    python scripts/fetch_mushaf_from_api.py
    python scripts/fetch_mushaf_from_api.py --output custom/path/quran.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List

import requests

API_URL = "https://api.alquran.cloud/v1/surah/{surah}/quran-uthmani"


def _fetch_surah(surah_number: int) -> List[Dict[str, Any]]:
    """Fetch a single surah from the AlQuran.Cloud API.

    Returns a list of ayah dicts with keys: surah, ayah, text.
    Raises RuntimeError on HTTP or payload errors.
    """
    url = API_URL.format(surah=surah_number)
    print(f"Fetching surah {surah_number} from {url}…")

    resp = requests.get(url, timeout=20)
    if resp.status_code != 200:
        raise RuntimeError(f"HTTP {resp.status_code} when fetching surah {surah_number}: {resp.text}")

    payload: Dict[str, Any] = resp.json()
    status = payload.get("status")
    if status != "OK":
        raise RuntimeError(f"Unexpected API status for surah {surah_number}: {status!r}")

    data = payload.get("data") or {}
    ayahs = data.get("ayahs")
    if not isinstance(ayahs, list):
        raise RuntimeError(f"No 'ayahs' list in API response for surah {surah_number}")

    verses: List[Dict[str, Any]] = []
    for ayah in ayahs:
        try:
            number_in_surah = int(ayah["numberInSurah"])
            text = str(ayah["text"])
        except Exception as exc:  # pragma: no cover - defensive
            raise RuntimeError(f"Invalid ayah structure in surah {surah_number}: {ayah!r}") from exc

        verses.append({"surah": surah_number, "ayah": number_in_surah, "text": text})

    return verses


def fetch_full_quran(output_path: Path) -> None:
    """Fetch all 114 surahs and write them as a single JSON file.

    The resulting file is a list of {"surah", "ayah", "text"} objects,
    ordered by surah then ayah.
    """
    all_verses: List[Dict[str, Any]] = []

    for surah in range(1, 115):
        verses = _fetch_surah(surah)
        all_verses.extend(verses)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Fetched {len(all_verses)} verses total, writing to {output_path}…")

    with output_path.open("w", encoding="utf-8") as f:
        json.dump(all_verses, f, ensure_ascii=False, indent=2)

    print("Done.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch full Qur'an mushaf (uthmani) into app/data/quran.json")
    parser.add_argument(
        "--output",
        type=str,
        default="app/data/quran.json",
        help="Path to write the generated Qur'an JSON file (default: app/data/quran.json)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_path = Path(args.output)
    fetch_full_quran(output_path)


if __name__ == "__main__":
    main()
