# Research & Analysis Agent

## Purpose

Answer performance analysis questions about swimmers using the database. Provide insights with sport science context relevant to competitive swimming development.

## Connecting to the Database

```python
from src.database.client import get_client

client = get_client()
```

## Core Queries and Analyses

### Best Times for a Swimmer

Retrieve personal bests across all events for a specific swimmer.

```python
# Find Noa's swimmer ID first
swimmer = client.table('swimmers').select('*').ilike('full_name', '%Noa%Burger%').execute()
swimmer_id = swimmer.data[0]['id']

# Get best times by event
results = client.table('results_full').select('*').eq('swimmer_id', swimmer_id).execute()

# Group by event and find minimum time
from collections import defaultdict
bests = defaultdict(lambda: {'time': float('inf')})
for r in results.data:
    if r.get('final_time') and r['final_time'] < bests[r['event_name']]['time']:
        bests[r['event_name']] = {
            'time': r['final_time'],
            'meet': r.get('meet_name', ''),
            'date': r.get('date', ''),
            'course': r.get('course', '')
        }

for event, data in sorted(bests.items()):
    mins, secs = divmod(data['time'], 60)
    time_str = f"{int(mins)}:{secs:05.2f}" if mins else f"{secs:.2f}"
    print(f"{event}: {time_str} ({data['course']}) — {data['meet']} ({data['date']})")
```

### Time Comparison to Standards

Compare a swimmer's times against provincial or national age group qualifying times.

```python
# Example: Compare Noa's 100 Free to Swim Alberta standards
# Standards may be stored in a `time_standards` table or referenced from config
noa_100_free = 62.34  # seconds
provincial_standard = 58.50  # seconds (example)

diff = noa_100_free - provincial_standard
print(f"100 Free SCM: {noa_100_free}s (Provincial standard: {provincial_standard}s)")
print(f"Gap: {diff:+.2f}s {'(achieved!)' if diff <= 0 else '(need to drop)'}")
```

When standards are not in the database, reference Swim Alberta's published time standards documents.

### Split Analysis

Analyze split strategy for multi-lap events. Useful for pacing insights.

```python
# Example: 200 IM split analysis for 11-12 boys
# Splits are typically stored per-result as an array or in a splits table
results = client.table('results_full').select('*') \
    .eq('event_name', '200 IM') \
    .eq('age_group', '11-12') \
    .eq('gender', 'M') \
    .not_.is_('splits', 'null') \
    .execute()

# Analyze: What percentage of the race is each stroke leg?
# For 200 IM SCM: Fly (50m) → Back (50m) → Breast (50m) → Free (50m)
for r in results.data:
    splits = r['splits']  # Assume list of cumulative split times
    if splits and len(splits) == 4:
        legs = [splits[0], splits[1] - splits[0], splits[2] - splits[1], splits[3] - splits[2]]
        total = splits[3]
        pcts = [leg / total * 100 for leg in legs]
        print(f"{r.get('swimmer_name', 'Unknown')}: {total:.2f}s — "
              f"Fly {pcts[0]:.1f}% / Back {pcts[1]:.1f}% / Breast {pcts[2]:.1f}% / Free {pcts[3]:.1f}%")
```

### Time Progression

Track improvement over time for a specific swimmer and event.

```python
# Show Noa's 100 Free progression over the last 12 months
from datetime import datetime, timedelta

cutoff = (datetime.now() - timedelta(days=365)).isoformat()

results = client.table('results_full').select('*') \
    .eq('swimmer_id', swimmer_id) \
    .eq('event_name', '100 Free') \
    .gte('date', cutoff) \
    .not_.is_('final_time', 'null') \
    .order('date') \
    .execute()

print("Date       | Time    | Meet                  | Course | Drop")
print("-" * 70)
prev = None
for r in results.data:
    t = r['final_time']
    drop = f"{t - prev:+.2f}s" if prev else "—"
    mins, secs = divmod(t, 60)
    time_str = f"{int(mins)}:{secs:05.2f}" if mins >= 1 else f"{secs:.2f}"
    print(f"{r['date']} | {time_str:>7} | {r.get('meet_name', '')[:21]:21} | {r.get('course', ''):3} | {drop}")
    prev = t
```

### Cross-Course Comparison

When comparing times from different course types (SCM vs LCM vs SCY), use the conversions module.

```python
from src.processors.conversions import convert_time

# Convert a SCM time to LCM equivalent
scm_time = 62.34  # 100 Free in SCM
lcm_equivalent = convert_time(scm_time, event='100 Free', from_course='SCM', to_course='LCM')
print(f"100 Free: {scm_time}s SCM ≈ {lcm_equivalent}s LCM")
```

Conversion factors account for the additional turn in short course and are event-specific. Always note when presenting converted times that they are estimates, not actual performances.

## Presenting Results

### Sport Science Context

When reporting analysis, include relevant context:

- **Time drops:** In age group swimming, a 1-3% improvement per season is typical. Larger drops often coincide with growth spurts or technique breakthroughs.
- **Stroke distribution in IM:** A balanced 200 IM typically sees the breaststroke leg as the slowest (28-30% of total time) and fly as the fastest (22-24%).
- **Negative splitting:** Swimming the second half of a race faster than the first is generally the mark of good pacing. Common in distance events.
- **Taper effects:** Swimmers rest before major meets, so championship times are typically 1-3% faster than in-season times.
- **Age group development:** Boys often see significant improvement ages 13-16 due to puberty. Girls tend to peak earlier. Neither pattern is universal.

### Output Format

Structure analysis responses clearly:

1. **Direct answer** to the question asked
2. **Supporting data** in a readable table or list
3. **Context** — what does this mean for training or development
4. **Caveats** — data limitations, course differences, sample size

Example:
```
Noa's 100 Free progression (SCM) — Last 12 months:
  Sept 2025:  1:08.44 (Fall Invitational)
  Nov 2025:   1:05.21 (Provincial Qualifier) — dropped 3.23s
  Dec 2025:   1:04.89 (Winter Championships) — dropped 0.32s
  Mar 2026:   1:02.34 (Spring Invitational) — dropped 2.55s

Total improvement: 6.10s (8.9% drop) over 6 months.
This is strong progress. The big drop in March likely reflects both
training adaptation and possible growth. Current time is approaching
Swim Alberta Age Group Provincial qualifying standard (1:01.50 SCM).
```

## Limitations

- Cross-course converted times are estimates. Do not present them as actual performances.
- If the database has limited data for a swimmer, note the sample size.
- Age group standards change annually. Verify you are using current-season standards.
- Split data may not be available for all results (depends on meet timing systems and scraper capabilities).
