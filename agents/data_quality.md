# Data Quality Agent

## Purpose

Monitor and maintain data quality in the Supabase database. Run quality checks regularly, flag issues, and apply safe automated fixes where possible.

## Connecting to the Database

```python
from src.database.client import get_client

client = get_client()
```

For raw SQL queries, use the Supabase `rpc` method or query views/tables directly.

## Quality Checks

Run these checks regularly (at minimum after every new scrape, and weekly as a full sweep).

### 1. Duplicate Swimmers

Swimmers who appear with the same name and birth year but different IDs. This happens when different meets format names differently (e.g., "MacDonald" vs "Macdonald").

```sql
SELECT s1.id AS id_1, s2.id AS id_2, s1.full_name, s1.birth_year
FROM swimmers s1
JOIN swimmers s2
  ON LOWER(s1.full_name) = LOWER(s2.full_name)
  AND s1.birth_year = s2.birth_year
  AND s1.id < s2.id;
```

Also check for near-matches (common misspellings, hyphenation differences):
```sql
-- Swimmers with same last name, same birth year, similar first name
SELECT s1.id, s1.full_name, s2.id, s2.full_name, s1.birth_year
FROM swimmers s1
JOIN swimmers s2
  ON s1.birth_year = s2.birth_year
  AND s1.id < s2.id
  AND SPLIT_PART(LOWER(s1.full_name), ' ', 2) = SPLIT_PART(LOWER(s2.full_name), ' ', 2)
  AND SIMILARITY(s1.full_name, s2.full_name) > 0.7;
```

### 2. Suspicious Times

Times that are physically impossible or extremely unlikely for the event.

```sql
-- Times under 15 seconds for 100m+ events (likely a parse error)
SELECT r.id, r.final_time, e.event_name, s.full_name
FROM results r
JOIN events e ON r.event_id = e.id
JOIN swimmers s ON r.swimmer_id = s.id
WHERE r.final_time < 15
  AND e.distance >= 100;

-- Times over 1800 seconds for any event (30 minutes — likely a parse error)
SELECT r.id, r.final_time, e.event_name, s.full_name
FROM results r
JOIN events e ON r.event_id = e.id
JOIN swimmers s ON r.swimmer_id = s.id
WHERE r.final_time > 1800;

-- Age-group sanity: 10&U swimmers with times faster than senior records
-- (Use known record times as thresholds — these should be configurable)
```

### 3. Events with No Results

Events that were created but have zero associated results, indicating a scrape failure.

```sql
SELECT e.id, e.event_name, m.meet_name
FROM events e
JOIN meets m ON e.meet_id = m.id
LEFT JOIN results r ON r.event_id = e.id
WHERE r.id IS NULL;
```

### 4. Results Missing Both Time and Status

Every result should have either a `final_time` or a status (DQ, NS, SCR). If neither is present, the data is incomplete.

```sql
SELECT r.id, s.full_name, e.event_name, m.meet_name
FROM results r
JOIN events e ON r.event_id = e.id
JOIN meets m ON e.meet_id = m.id
JOIN swimmers s ON r.swimmer_id = s.id
WHERE r.final_time IS NULL
  AND (r.status IS NULL OR r.status = '');
```

### 5. Missing Course Type on Meets

Every meet must have a course type (SCY, SCM, or LCM). Missing course types break conversions and comparisons.

```sql
SELECT id, meet_name, start_date
FROM meets
WHERE course IS NULL OR course = '';
```

### 6. Inconsistent Gender

Results where the swimmer's gender does not match the event's gender designation.

```sql
SELECT r.id, s.full_name, s.gender AS swimmer_gender, e.gender AS event_gender, e.event_name
FROM results r
JOIN swimmers s ON r.swimmer_id = s.id
JOIN events e ON r.event_id = e.id
WHERE s.gender IS NOT NULL
  AND e.gender IS NOT NULL
  AND s.gender != e.gender
  AND e.gender != 'Mixed';
```

## Fixing Issues

### Merging Duplicate Swimmers

This is the most common fix. Always keep the swimmer record with more results or more complete data.

```python
def merge_swimmers(keep_id, remove_id):
    """Merge remove_id into keep_id. Update all results, then delete the duplicate."""
    client = get_client()

    # Update all results from the duplicate to point to the keeper
    client.table('results').update({'swimmer_id': keep_id}).eq('swimmer_id', remove_id).execute()

    # Verify no results remain on the old ID
    remaining = client.table('results').select('id').eq('swimmer_id', remove_id).execute()
    if remaining.data:
        raise RuntimeError(f"Results still linked to {remove_id} after merge — aborting delete")

    # Delete the duplicate swimmer record
    client.table('swimmers').delete().eq('id', remove_id).execute()
    print(f"Merged swimmer {remove_id} into {keep_id}")
```

**Important:** Never delete a swimmer record without first confirming all their results have been reassigned.

### Flagging Suspicious Times

Do not auto-delete or auto-fix times. Instead, flag them for human review:

```python
# Add a flag or log entry for suspicious results
client.table('data_quality_flags').insert({
    'result_id': result_id,
    'flag_type': 'suspicious_time',
    'description': f'Time {time}s seems too fast/slow for {event_name}',
    'status': 'pending_review'
}).execute()
```

If no `data_quality_flags` table exists, report findings to stdout in a structured format for Jaco to review.

### Missing Course Type

If the course type can be inferred from the meet name (e.g., "LC" or "Long Course" in the name) or from the times (SCM vs LCM standard ranges), suggest it but require confirmation before updating.

## Report Format

After running checks, produce a summary:

```
Data Quality Report — [Date]
================================

Duplicate Swimmers:     3 pairs found
Suspicious Times:       1 result flagged
Empty Events:           0
Missing Time+Status:    5 results
Missing Course Type:    1 meet
Gender Inconsistencies: 0

Details:
--------
DUPLICATES:
  - "Smith, John" (ID 42) and "Smith, John" (ID 108), birth year 2012 — 42 has 15 results, 108 has 3 results
  ...

SUSPICIOUS TIMES:
  - Result 991: 8.2s for Girls 100 Free (swimmer: Jane Doe) — likely a parse error
  ...

MISSING TIME+STATUS:
  - 5 results from "Winter Invitational 2025" have no time and no status
  ...

MISSING COURSE:
  - Meet "Spring Sprint Meet" (ID 77) has no course type set
```

## Automation Safety

- Never delete data without verification.
- Always check row counts before and after bulk updates.
- If any fix would affect more than 50 records, stop and report to Jaco for manual review.
- Keep a log of all automated fixes applied.
