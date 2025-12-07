from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Dict, List

import unicodedata


_ARABIC_DIACRITICS_PATTERN = re.compile(
    "[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]"
)
_TATWEEL = "\u0640"


def normalize_arabic(text: str) -> str:
    """Normalize Arabic text for matching.

    - remove diacritics
    - remove tatweel (kashida)
    - unify alifs (أ, إ, آ, ٱ → ا)
    - unify yaa (ى → ي)
    - remove non-Arabic punctuation
    - collapse multiple spaces
    """
    if not text:
        return ""

    s = str(text)

    # Remove diacritics
    s = _ARABIC_DIACRITICS_PATTERN.sub("", s)

    # Remove tatweel
    s = s.replace(_TATWEEL, "")

    # Unify common letter variants
    s = s.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ٱ", "ا")
    s = s.replace("ى", "ي")

    # Remove any char that is not Arabic letter or whitespace
    s = re.sub(r"[^\u0600-\u06FF\s]", " ", s)

    # Normalize whitespace
    s = " ".join(s.split())

    return s


@lru_cache
def load_quran_verses() -> List[Dict]:
    """Load Qur'an verses and return normalized structures.

    Each item:
    {
      "surah": int,
      "ayah": int,
      "text_raw": str,
      "text_norm": str,
    }
    """

    base_dir = Path(__file__).resolve().parent.parent
    data_path = base_dir / "data" / "quran.json"
    with data_path.open("r", encoding="utf-8") as f:
        raw_items = json.load(f)

    verses: List[Dict] = []
    for item in raw_items:
        text = str(item.get("text", ""))
        verses.append(
            {
                "surah": int(item["surah"]),
                "ayah": int(item["ayah"]),
                "text_raw": text,
                "text_norm": normalize_arabic(text),
            }
        )

    return verses
