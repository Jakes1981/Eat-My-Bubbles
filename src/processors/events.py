"""Event name normalization for competitive swimming.

Maps the many variations of stroke names, event descriptions, and age-group
labels found across different meet-management systems into a single canonical
representation.
"""

from __future__ import annotations

import re

# ---------------------------------------------------------------------------
# Stroke normalization lookup
# ---------------------------------------------------------------------------
# Maps lowercased abbreviations / variations to canonical stroke names.

_STROKE_MAP: dict[str, str] = {
    # Freestyle
    "free":       "Freestyle",
    "fr":         "Freestyle",
    "freestyle":  "Freestyle",
    "f":          "Freestyle",
    "frstyl":     "Freestyle",
    # Backstroke
    "back":       "Backstroke",
    "bk":         "Backstroke",
    "backstroke": "Backstroke",
    "b":          "Backstroke",
    "bkstk":      "Backstroke",
    # Breaststroke
    "breast":       "Breaststroke",
    "br":           "Breaststroke",
    "breaststroke":  "Breaststroke",
    "brst":         "Breaststroke",
    "brstk":        "Breaststroke",
    # Butterfly
    "fly":        "Butterfly",
    "fl":         "Butterfly",
    "butterfly":  "Butterfly",
    "bt":         "Butterfly",
    # Individual Medley
    "im":         "IM",
    "medley":     "IM",
    "individual medley": "IM",
    # Relay strokes
    "free relay":      "Freestyle Relay",
    "freestyle relay": "Freestyle Relay",
    "fr relay":        "Freestyle Relay",
    "medley relay":    "Medley Relay",
    "mr":              "Medley Relay",
}

# Canonical stroke names (non-relay individual events).
CANONICAL_STROKES = frozenset({
    "Freestyle", "Backstroke", "Breaststroke", "Butterfly", "IM",
})

# All canonical stroke names including relays.
ALL_CANONICAL_STROKES = CANONICAL_STROKES | {"Freestyle Relay", "Medley Relay"}


def normalize_stroke(stroke: str) -> str:
    """Map a stroke name or abbreviation to its canonical form.

    Args:
        stroke: Raw stroke string (e.g. "FR", "Free", "Freestyle", "f").

    Returns:
        Canonical stroke name (e.g. "Freestyle").

    Raises:
        ValueError: If the stroke string cannot be mapped.
    """
    key = stroke.strip().lower()
    canonical = _STROKE_MAP.get(key)
    if canonical is None:
        raise ValueError(
            f"Unknown stroke: {stroke!r}. "
            f"Expected one of the known abbreviations or canonical names."
        )
    return canonical


def normalize_event(distance: int, stroke: str) -> tuple[int, str]:
    """Normalize both event components.

    Args:
        distance: Event distance (e.g. 100, 200). Passed through as-is.
        stroke: Raw stroke string.

    Returns:
        A (distance, canonical_stroke) tuple.
    """
    return (distance, normalize_stroke(stroke))


# ---------------------------------------------------------------------------
# Event description parsing
# ---------------------------------------------------------------------------

_GENDER_MAP: dict[str, str] = {
    "boys":   "M",
    "boy":    "M",
    "men":    "M",
    "mens":   "M",
    "men's":  "M",
    "male":   "M",
    "m":      "M",
    "girls":  "F",
    "girl":   "F",
    "women":  "F",
    "womens": "F",
    "women's": "F",
    "female": "F",
    "w":      "F",
    "mixed":  "X",
    "mix":    "X",
}

# Matches event descriptions like:
#   "Boys 11-12 100 Freestyle"
#   "Girls 13&Over 200 IM"
#   "Men 50 Free"
#   "100 Backstroke"
_EVENT_PATTERN = re.compile(
    r"^"
    r"(?:(?P<gender>\w+(?:'s)?)\s+)?"          # optional gender word
    r"(?:(?P<age_group>\d+[-&]\S+)\s+)?"       # optional age group
    r"(?P<distance>\d+)\s+"                     # distance (required)
    r"(?P<stroke>.+?)"                          # stroke (required, rest of string)
    r"$",
    re.IGNORECASE,
)


def parse_event_description(desc: str) -> dict[str, str | int | None]:
    """Parse a full event description into structured components.

    Examples::

        >>> parse_event_description("Boys 11-12 100 Freestyle")
        {"gender": "M", "age_group": "11-12", "distance": 100, "stroke": "Freestyle"}

        >>> parse_event_description("200 IM")
        {"gender": None, "age_group": None, "distance": 200, "stroke": "IM"}

    Args:
        desc: Free-text event description.

    Returns:
        Dict with keys ``gender`` (str|None), ``age_group`` (str|None),
        ``distance`` (int), and ``stroke`` (str, canonical form).

    Raises:
        ValueError: If the description cannot be parsed.
    """
    cleaned = desc.strip()
    match = _EVENT_PATTERN.match(cleaned)
    if not match:
        raise ValueError(f"Cannot parse event description: {desc!r}")

    raw_gender = match.group("gender")
    age_group = match.group("age_group")
    distance = int(match.group("distance"))
    raw_stroke = match.group("stroke")

    # Resolve gender.
    gender: str | None = None
    if raw_gender:
        gender_key = raw_gender.strip().lower()
        gender = _GENDER_MAP.get(gender_key)
        # If the "gender" token is not actually a gender word, it might be
        # part of a malformed description. We leave gender as None rather
        # than raising, to be lenient.

    # Strip course-type qualifiers that Hy-Tek embeds in event names
    # e.g. "LC Meter Freestyle" → "Freestyle", "SC Yard Backstroke" → "Backstroke"
    raw_stroke = re.sub(
        r"\b(?:LC|SC)\s+(?:Met(?:er|re)s?|Yards?)\s*",
        "",
        raw_stroke,
        flags=re.IGNORECASE,
    ).strip()

    # Normalize stroke.
    stroke = normalize_stroke(raw_stroke)

    return {
        "gender": gender,
        "age_group": age_group,
        "distance": distance,
        "stroke": stroke,
    }
