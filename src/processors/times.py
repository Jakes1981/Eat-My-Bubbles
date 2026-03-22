"""Time parsing and formatting for competitive swimming.

Handles standard swimming time formats (e.g. "1:02.34", "32.10") and
status codes (NT, DQ, NS, SCR).
"""

from __future__ import annotations

import re

_STATUS_CODES = frozenset({"NT", "DQ", "NS", "SCR"})

_TIME_PATTERN = re.compile(
    r"^(?:(\d{1,2}):)?(\d{1,2})\.(\d{1,2})$"
)


def parse_time(time_str: str) -> float | None:
    """Convert a swimming time string to seconds.

    Supported formats:
        "32.10"     -> 32.10  (seconds only)
        "1:02.34"   -> 62.34  (min:sec.hundredths)
        "15:02.34"  -> 902.34 (for distance events like the 1500m)
        "NT" / "DQ" / "NS" / "SCR" -> None

    Args:
        time_str: The time string to parse.

    Returns:
        Time in seconds as a float, or None for status codes and
        unparseable strings.
    """
    cleaned = time_str.strip().upper()

    if cleaned in _STATUS_CODES:
        return None

    match = _TIME_PATTERN.match(cleaned)
    if not match:
        return None

    minutes_str, seconds_str, hundredths_str = match.groups()

    minutes = int(minutes_str) if minutes_str else 0
    seconds = int(seconds_str)
    # Pad or truncate hundredths to two digits for consistent handling.
    hundredths_str = hundredths_str.ljust(2, "0")[:2]
    hundredths = int(hundredths_str)

    total = minutes * 60.0 + seconds + hundredths / 100.0
    return round(total, 2)


def format_time(seconds: float) -> str:
    """Convert seconds back to a standard swimming time string.

    Args:
        seconds: Non-negative time in seconds.

    Returns:
        Formatted time string. Examples:
            32.1   -> "32.10"
            62.34  -> "1:02.34"
            902.34 -> "15:02.34"

    Raises:
        ValueError: If seconds is negative.
    """
    if seconds < 0:
        raise ValueError(f"Time cannot be negative: {seconds}")

    total_hundredths = round(seconds * 100)
    minutes, remainder = divmod(total_hundredths, 6000)
    secs, hundredths = divmod(remainder, 100)

    if minutes == 0:
        return f"{secs}.{hundredths:02d}"
    else:
        return f"{minutes}:{secs:02d}.{hundredths:02d}"


def is_valid_time(time_str: str) -> bool:
    """Check whether a string represents a parseable swim time.

    Returns True for numeric time strings ("32.10", "1:02.34") and
    False for status codes ("NT", "DQ", "NS", "SCR") or garbage input.
    """
    return parse_time(time_str) is not None
