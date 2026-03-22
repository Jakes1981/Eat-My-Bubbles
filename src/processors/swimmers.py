"""Swimmer name handling and deduplication.

Provides utilities for normalizing swimmer names across different data
sources and detecting likely duplicate swimmer records.
"""

from __future__ import annotations

import re
from difflib import SequenceMatcher


def normalize_name(name: str) -> str:
    """Normalize a swimmer name to a consistent format.

    - Strips leading/trailing whitespace and collapses internal whitespace.
    - Converts "Last, First" to "First Last".
    - Applies title case.

    Args:
        name: Raw name string.

    Returns:
        Normalized name in "First Last" title-case format.

    Examples::

        >>> normalize_name("  DOE,  JANE  ")
        "Jane Doe"
        >>> normalize_name("john smith")
        "John Smith"
    """
    cleaned = re.sub(r"\s+", " ", name.strip())

    if "," in cleaned:
        parts = cleaned.split(",", 1)
        last = parts[0].strip()
        first = parts[1].strip()
        cleaned = f"{first} {last}"

    return cleaned.title()


def parse_full_name(name: str) -> tuple[str, str]:
    """Parse a name into (first_name, last_name).

    Handles two formats:
        - "Last, First [Middle ...]" -> (First, Last)
        - "First [Middle ...] Last"  -> (First, Last)

    Middle names are included with the first name.

    Args:
        name: Raw name string.

    Returns:
        Tuple of (first_name, last_name), both stripped and title-cased.

    Raises:
        ValueError: If the name cannot be split into at least two parts.
    """
    cleaned = re.sub(r"\s+", " ", name.strip())

    if "," in cleaned:
        parts = cleaned.split(",", 1)
        last = parts[0].strip().title()
        first = parts[1].strip().title()
        return (first, last)

    parts = cleaned.split()
    if len(parts) < 2:
        raise ValueError(
            f"Cannot parse name into first and last: {name!r}"
        )

    first = " ".join(parts[:-1]).title()
    last = parts[-1].title()
    return (first, last)


def name_similarity(name1: str, name2: str) -> float:
    """Compute a similarity score between two names.

    Uses Python's built-in SequenceMatcher on the normalized, lowered names.
    The score ranges from 0.0 (completely different) to 1.0 (identical).

    This intentionally avoids external dependencies like python-Levenshtein;
    SequenceMatcher is adequate for name-matching purposes.

    Args:
        name1: First name string.
        name2: Second name string.

    Returns:
        Similarity score between 0.0 and 1.0.
    """
    n1 = normalize_name(name1).lower()
    n2 = normalize_name(name2).lower()
    return SequenceMatcher(None, n1, n2).ratio()


def is_likely_same_swimmer(swimmer1: dict, swimmer2: dict) -> bool:
    """Determine whether two swimmer records likely represent the same person.

    Compares three fields when available:
        - **name**: fuzzy string similarity (required).
        - **birth_year**: exact match (optional but strong signal).
        - **club**: fuzzy match (optional, supportive signal).

    Decision logic:
        1. If name similarity >= 0.90 *and* birth_year matches -> True
        2. If name similarity >= 0.90 *and* birth_year is missing from
           either record *and* club similarity >= 0.80 -> True
        3. If name similarity >= 0.95 *and* both birth_year and club are
           missing -> True (high-confidence name match alone)
        4. Otherwise -> False

    Args:
        swimmer1: Dict with at least ``"name"`` (str). Optionally
                  ``"birth_year"`` (int) and ``"club"`` (str).
        swimmer2: Same schema as swimmer1.

    Returns:
        True if the two records likely represent the same swimmer.
    """
    # Name comparison (required field).
    name_sim = name_similarity(swimmer1["name"], swimmer2["name"])

    # Birth year comparison.
    by1 = swimmer1.get("birth_year")
    by2 = swimmer2.get("birth_year")
    has_birth_year = by1 is not None and by2 is not None
    birth_year_match = has_birth_year and by1 == by2

    # Club comparison.
    club1 = swimmer1.get("club")
    club2 = swimmer2.get("club")
    has_club = bool(club1) and bool(club2)
    club_sim = 0.0
    if has_club:
        club_sim = SequenceMatcher(
            None, club1.strip().lower(), club2.strip().lower()
        ).ratio()

    # Decision rules.
    if name_sim >= 0.90 and birth_year_match:
        return True

    if name_sim >= 0.90 and not has_birth_year and has_club and club_sim >= 0.80:
        return True

    if name_sim >= 0.95 and not has_birth_year and not has_club:
        return True

    return False
