"""SCY / SCM / LCM course conversion engine.

Implements time conversions between the three standard pool courses using
World Aquatics (formerly FINA) conversion factors. The factors account for
both the distance difference (yards vs. metres) and the turn advantage
(shorter pools = more turns = more push-offs).
"""

from __future__ import annotations

from enum import Enum
from typing import Any


class CourseType(Enum):
    """Standard pool course types."""
    SCY = "SCY"   # Short Course Yards (25 yards)
    SCM = "SCM"   # Short Course Metres (25 metres)
    LCM = "LCM"   # Long Course Metres (50 metres)


# ---------------------------------------------------------------------------
# World Aquatics conversion factors
# ---------------------------------------------------------------------------
# Each factor converts a time FROM the source course TO Long Course Metres
# (LCM). To convert between SCY and SCM, we go through LCM as the hub.
#
# Keys: (CourseType, distance_metres, stroke)
# Values: multiplicative factor — multiply source time by this factor to get
#         the LCM-equivalent time.
#
# These factors incorporate:
#   1. Distance ratio (e.g. 100y = 91.44m, so raw ratio ~ 1.0936)
#   2. Turn differential (SCY/SCM have more turns -> push-off advantage)
#
# Stroke key names use canonical forms: "Freestyle", "Backstroke",
# "Breaststroke", "Butterfly", "IM".
#
# Sources: USA Swimming 2024 Conversion Factor Tables, which are derived
# from World Aquatics methodology.
# ---------------------------------------------------------------------------

_FACTORS_TO_LCM: dict[tuple[CourseType, int, str], float] = {
    # ── SCY -> LCM ─────────────────────────────────────────────────────
    # Freestyle
    (CourseType.SCY, 50,   "Freestyle"):   1.1100,
    (CourseType.SCY, 100,  "Freestyle"):   1.1100,
    (CourseType.SCY, 200,  "Freestyle"):   1.1050,
    (CourseType.SCY, 400,  "Freestyle"):   1.1025,   # 500y -> 400m equiv
    (CourseType.SCY, 800,  "Freestyle"):   1.1025,   # 1000y -> 800m equiv
    (CourseType.SCY, 1500, "Freestyle"):   1.1000,   # 1650y -> 1500m equiv
    # Backstroke
    (CourseType.SCY, 50,   "Backstroke"):  1.1150,
    (CourseType.SCY, 100,  "Backstroke"):  1.1150,
    (CourseType.SCY, 200,  "Backstroke"):  1.1100,
    # Breaststroke
    (CourseType.SCY, 50,   "Breaststroke"): 1.1150,
    (CourseType.SCY, 100,  "Breaststroke"): 1.1150,
    (CourseType.SCY, 200,  "Breaststroke"): 1.1100,
    # Butterfly
    (CourseType.SCY, 50,   "Butterfly"):   1.1100,
    (CourseType.SCY, 100,  "Butterfly"):   1.1100,
    (CourseType.SCY, 200,  "Butterfly"):   1.1050,
    # IM
    (CourseType.SCY, 200,  "IM"):          1.1100,
    (CourseType.SCY, 400,  "IM"):          1.1050,

    # ── SCM -> LCM ─────────────────────────────────────────────────────
    # Freestyle
    (CourseType.SCM, 50,   "Freestyle"):   1.0020,
    (CourseType.SCM, 100,  "Freestyle"):   1.0080,
    (CourseType.SCM, 200,  "Freestyle"):   1.0100,
    (CourseType.SCM, 400,  "Freestyle"):   1.0120,
    (CourseType.SCM, 800,  "Freestyle"):   1.0130,
    (CourseType.SCM, 1500, "Freestyle"):   1.0140,
    # Backstroke
    (CourseType.SCM, 50,   "Backstroke"):  1.0020,
    (CourseType.SCM, 100,  "Backstroke"):  1.0080,
    (CourseType.SCM, 200,  "Backstroke"):  1.0100,
    # Breaststroke
    (CourseType.SCM, 50,   "Breaststroke"): 1.0020,
    (CourseType.SCM, 100,  "Breaststroke"): 1.0060,
    (CourseType.SCM, 200,  "Breaststroke"): 1.0080,
    # Butterfly
    (CourseType.SCM, 50,   "Butterfly"):   1.0020,
    (CourseType.SCM, 100,  "Butterfly"):   1.0080,
    (CourseType.SCM, 200,  "Butterfly"):   1.0100,
    # IM
    (CourseType.SCM, 200,  "IM"):          1.0080,
    (CourseType.SCM, 400,  "IM"):          1.0100,
}

# Yard-to-metre distance mappings for SCY events.
_SCY_DISTANCE_MAP: dict[int, int] = {
    50: 50,
    100: 100,
    200: 200,
    500: 400,
    1000: 800,
    1650: 1500,
}


def _get_factor(from_course: CourseType, distance: int, stroke: str) -> float:
    """Look up the conversion factor from *from_course* to LCM.

    Raises KeyError with a descriptive message when the combination is not
    found in the factor table.
    """
    key = (from_course, distance, stroke)
    if key not in _FACTORS_TO_LCM:
        raise KeyError(
            f"No conversion factor for {from_course.value} {distance} {stroke}. "
            f"Check that distance is in metres and stroke is canonical."
        )
    return _FACTORS_TO_LCM[key]


def convert_time(
    seconds: float,
    from_course: CourseType,
    to_course: CourseType,
    distance: int,
    stroke: str,
) -> float:
    """Convert a swim time between course types.

    The conversion uses LCM as a hub: source -> LCM -> target. If both
    source and target are the same course, the original time is returned.

    Args:
        seconds: Time in seconds to convert.
        from_course: The course the time was swum in.
        to_course: The desired target course.
        distance: Event distance **in metres** (use 400 for the 500y Free,
                  800 for 1000y Free, 1500 for 1650y Free).
        stroke: Canonical stroke name — one of "Freestyle", "Backstroke",
                "Breaststroke", "Butterfly", or "IM".

    Returns:
        Converted time in seconds, rounded to two decimal places.

    Raises:
        KeyError: If the event/course combination has no conversion factor.
        ValueError: If seconds is negative.
    """
    if seconds < 0:
        raise ValueError(f"Time cannot be negative: {seconds}")

    if from_course == to_course:
        return round(seconds, 2)

    # Convert source time to LCM.
    if from_course == CourseType.LCM:
        lcm_time = seconds
    else:
        factor = _get_factor(from_course, distance, stroke)
        lcm_time = seconds * factor

    # Convert LCM time to target course.
    if to_course == CourseType.LCM:
        return round(lcm_time, 2)
    else:
        factor = _get_factor(to_course, distance, stroke)
        return round(lcm_time / factor, 2)


def compute_empirical_factors(db_client: Any) -> dict[tuple[str, int, str], float]:
    """Compute empirical conversion factors from the database.

    This is a placeholder that documents the intended methodology. A real
    implementation would:

    1. Query for swimmers who have swum the **same event** in at least two
       different course types within a rolling 12-month window (to control
       for fitness changes).

       Example SQL sketch::

           SELECT s.swimmer_id, e.stroke, e.distance, e.course,
                  MIN(r.time_seconds) AS best_time
           FROM results r
           JOIN events e ON r.event_id = e.id
           JOIN swimmers s ON r.swimmer_id = s.id
           WHERE r.time_seconds IS NOT NULL
           GROUP BY s.swimmer_id, e.stroke, e.distance, e.course

    2. For each (stroke, distance) pair, compute the ratio of LCM time to
       SCY/SCM time for every swimmer who has both, then take the **median**
       ratio (median is more robust to outliers than mean).

    3. Require a minimum sample size (e.g. >= 30 swimmers) before accepting
       the empirical factor; otherwise fall back to the WA table values.

    4. Optionally segment by age group or skill tier, since conversion
       factors can vary (elite swimmers may convert differently than
       age-groupers due to better underwater work off walls).

    Args:
        db_client: A database client / connection object (type depends on
                   the chosen DB backend).

    Returns:
        A dict mapping (course_pair, distance, stroke) to the empirical
        multiplicative factor. E.g. ("SCY_TO_LCM", 100, "Freestyle") -> 1.112
    """
    # Placeholder — not yet implemented.
    raise NotImplementedError(
        "Empirical factor computation requires a populated database. "
        "See docstring for the intended methodology."
    )
