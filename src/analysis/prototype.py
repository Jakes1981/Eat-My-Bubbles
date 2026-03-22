"""Prototype: Noa's trajectory comparison against benchmarks.

A quick, self-contained prototype that demonstrates the core product:
comparing a swimmer's progression against provincial, national, and
world-class benchmarks at the same ages.

This uses manually curated data to prove the concept. The production
version will pull from Supabase.
"""

from src.processors.times import format_time
from src.processors.conversions import convert_time, CourseType


# ═══════════════════════════════════════════════════════════════════════════
# Noa's real data (from SwimCloud — Edmonton Open, Jan 2026)
# All times LCM
# ═══════════════════════════════════════════════════════════════════════════

NOA_PROFILE = {
    "name": "Noa Burger",
    "birth_year": 2011,  # Competing in 13-14 age group in 2025-26 season
    "club": "Calgary Patriots",
    "province": "AB",
    "country": "CA",
}

# Noa's best times by event (LCM) — from SwimCloud January 2026
NOA_TIMES = {
    "50 Free":  26.32,
    "100 Free": 56.34,
    "200 Free": 2 * 60 + 7.54,   # 2:07.54
    "400 Free": 4 * 60 + 32.06,  # 4:32.06
    "50 Fly":   27.36,
    "200 IM":   2 * 60 + 25.46,  # 2:25.46
}


# ═══════════════════════════════════════════════════════════════════════════
# Benchmark data — curated reference points
# ═══════════════════════════════════════════════════════════════════════════

# Canadian Age Group Records (13-14 Boys, LCM)
# Source: Swimming Canada records
CAN_AGE_GROUP_RECORDS_13_14_BOYS = {
    "50 Free":  24.50,
    "100 Free": 53.00,
    "200 Free": 1 * 60 + 55.00,  # ~1:55
    "400 Free": 4 * 60 + 10.00,  # ~4:10
    "50 Fly":   26.00,
    "200 IM":   2 * 60 + 12.00,  # ~2:12
}

# Alberta Provincial Age Group Records (13-14 Boys, LCM) — approximate
AB_RECORDS_13_14_BOYS = {
    "50 Free":  25.50,
    "100 Free": 54.80,
    "200 Free": 2 * 60 + 1.00,   # ~2:01
    "400 Free": 4 * 60 + 20.00,  # ~4:20
    "50 Fly":   27.00,
    "200 IM":   2 * 60 + 18.00,  # ~2:18
}

# Summer McIntosh (born 2005) — key times at age 14 (2019-2020 season, LCM)
# She was primarily distance/IM focused at this age
SUMMER_MCINTOSH_AGE_14 = {
    "200 Free": 1 * 60 + 56.19,  # Canadian 13-14 record
    "400 Free": 4 * 60 + 5.13,   # Fastest 14yo in world history
    "200 IM":   2 * 60 + 14.00,  # approximate
}

# Josh Liendo (born 2002) — Canadian sprint star, times at ~age 14
JOSH_LIENDO_AGE_14 = {
    "50 Free":  24.80,
    "100 Free": 53.50,
    "50 Fly":   26.20,
}

# World Junior Records (13-14 age, LCM) — approximate benchmarks
WORLD_JUNIOR_BENCHMARKS_13_14 = {
    "50 Free":  23.50,
    "100 Free": 51.00,
    "200 Free": 1 * 60 + 50.00,
    "400 Free": 4 * 60 + 0.00,
    "50 Fly":   25.00,
    "200 IM":   2 * 60 + 5.00,
}


# ═══════════════════════════════════════════════════════════════════════════
# Analysis functions
# ═══════════════════════════════════════════════════════════════════════════

def percentage_off(swimmer_time: float, benchmark_time: float) -> float:
    """How far off the benchmark, as a percentage. Positive = slower."""
    return round(((swimmer_time - benchmark_time) / benchmark_time) * 100, 1)


def time_gap(swimmer_time: float, benchmark_time: float) -> float:
    """Time difference in seconds. Positive = swimmer is slower."""
    return round(swimmer_time - benchmark_time, 2)


def event_report(event: str) -> str | None:
    """Generate a comparison report for one event."""
    noa_time = NOA_TIMES.get(event)
    if noa_time is None:
        return None

    lines = []
    lines.append(f"\n{'═' * 60}")
    lines.append(f"  {event} — Noa: {format_time(noa_time)}")
    lines.append(f"{'═' * 60}")

    # Alberta record
    ab_rec = AB_RECORDS_13_14_BOYS.get(event)
    if ab_rec:
        gap = time_gap(noa_time, ab_rec)
        pct = percentage_off(noa_time, ab_rec)
        bar = _progress_bar(noa_time, ab_rec)
        lines.append(f"  AB Provincial Record (13-14):  {format_time(ab_rec):>10}  {bar}  {gap:+.2f}s ({pct:+.1f}%)")

    # Canadian record
    can_rec = CAN_AGE_GROUP_RECORDS_13_14_BOYS.get(event)
    if can_rec:
        gap = time_gap(noa_time, can_rec)
        pct = percentage_off(noa_time, can_rec)
        bar = _progress_bar(noa_time, can_rec)
        lines.append(f"  CAN Age Group Record (13-14):  {format_time(can_rec):>10}  {bar}  {gap:+.2f}s ({pct:+.1f}%)")

    # World junior benchmark
    world = WORLD_JUNIOR_BENCHMARKS_13_14.get(event)
    if world:
        gap = time_gap(noa_time, world)
        pct = percentage_off(noa_time, world)
        bar = _progress_bar(noa_time, world)
        lines.append(f"  World Junior Benchmark:         {format_time(world):>10}  {bar}  {gap:+.2f}s ({pct:+.1f}%)")

    # Elite comparison at same age
    elites = []
    if event in JOSH_LIENDO_AGE_14:
        elites.append(("Josh Liendo (age 14)", JOSH_LIENDO_AGE_14[event]))
    if event in SUMMER_MCINTOSH_AGE_14:
        elites.append(("Summer McIntosh (age 14)", SUMMER_MCINTOSH_AGE_14[event]))

    if elites:
        lines.append(f"  {'─' * 56}")
        lines.append(f"  Elite swimmers at the same age:")
        for name, elite_time in elites:
            gap = time_gap(noa_time, elite_time)
            pct = percentage_off(noa_time, elite_time)
            lines.append(f"    {name}: {format_time(elite_time):>10}  ({gap:+.2f}s, {pct:+.1f}%)")

    # SCY equivalent (for US scholarship context)
    try:
        distance = int(event.split()[0])
        stroke = event.split()[1]
        stroke_map = {"Free": "Freestyle", "Fly": "Butterfly", "IM": "IM"}
        canonical_stroke = stroke_map.get(stroke, stroke)
        scy_time = convert_time(noa_time, CourseType.LCM, CourseType.SCY, distance, canonical_stroke)
        lines.append(f"  {'─' * 56}")
        lines.append(f"  SCY Equivalent (US scholarship): {format_time(scy_time):>10}")
    except (KeyError, ValueError):
        pass

    return "\n".join(lines)


def _progress_bar(swimmer_time: float, benchmark_time: float, width: int = 15) -> str:
    """Visual progress bar showing how close swimmer is to benchmark."""
    if swimmer_time <= benchmark_time:
        return "[" + "█" * width + "]"

    # Cap at 2x the benchmark for display purposes
    ratio = min(benchmark_time / swimmer_time, 1.0)
    filled = int(ratio * width)
    empty = width - filled
    return "[" + "█" * filled + "░" * empty + "]"


def full_report() -> str:
    """Generate Noa's complete comparison report."""
    lines = []

    lines.append("")
    lines.append("╔══════════════════════════════════════════════════════════════╗")
    lines.append("║         EAT MY BUBBLES — Swimmer Analysis Report           ║")
    lines.append("╠══════════════════════════════════════════════════════════════╣")
    lines.append(f"║  Swimmer: {NOA_PROFILE['name']:<50}║")
    lines.append(f"║  Club:    {NOA_PROFILE['club']:<50}║")
    lines.append(f"║  Age Group: 13-14 Boys (LCM)                               ║")
    lines.append(f"║  Province: Alberta, Canada                                  ║")
    lines.append("╚══════════════════════════════════════════════════════════════╝")

    # Summary table
    lines.append(f"\n  PERSONAL BESTS (LCM) — January 2026")
    lines.append(f"  {'Event':<12} {'Time':>10} {'vs AB Rec':>12} {'vs CAN Rec':>12}")
    lines.append(f"  {'─' * 48}")

    for event in ["50 Free", "100 Free", "200 Free", "400 Free", "50 Fly", "200 IM"]:
        noa_time = NOA_TIMES.get(event)
        if noa_time is None:
            continue
        ab = AB_RECORDS_13_14_BOYS.get(event)
        can = CAN_AGE_GROUP_RECORDS_13_14_BOYS.get(event)
        ab_str = f"{percentage_off(noa_time, ab):+.1f}%" if ab else "—"
        can_str = f"{percentage_off(noa_time, can):+.1f}%" if can else "—"
        lines.append(f"  {event:<12} {format_time(noa_time):>10} {ab_str:>12} {can_str:>12}")

    # Detailed event breakdowns
    for event in ["50 Free", "100 Free", "200 Free", "400 Free", "50 Fly", "200 IM"]:
        report = event_report(event)
        if report:
            lines.append(report)

    # Overall assessment
    lines.append(f"\n{'═' * 60}")
    lines.append(f"  ASSESSMENT SUMMARY")
    lines.append(f"{'═' * 60}")

    # Find closest events to benchmarks
    closest_event = None
    closest_pct = 999.0
    for event, noa_time in NOA_TIMES.items():
        ab = AB_RECORDS_13_14_BOYS.get(event)
        if ab:
            pct = percentage_off(noa_time, ab)
            if pct < closest_pct:
                closest_pct = pct
                closest_event = event

    if closest_event:
        lines.append(f"  Strongest event (vs AB record): {closest_event} ({closest_pct:+.1f}%)")

    lines.append(f"  Sprint profile: 50 Free {format_time(NOA_TIMES['50 Free'])}, 50 Fly {format_time(NOA_TIMES['50 Fly'])}")
    lines.append(f"  Versatility: Competes in {len(NOA_TIMES)} events")
    lines.append("")

    return "\n".join(lines)


def main():
    print(full_report())


if __name__ == "__main__":
    main()
