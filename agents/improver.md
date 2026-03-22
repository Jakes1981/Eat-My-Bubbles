# Self-Improvement Agent

## Purpose

Review and improve the codebase, with a focus on scraper reliability, parser accuracy, and data pipeline robustness.

## Assessing Scraper Quality

### Test Against Known Meets

Run the scraper against meet pages with known results and compare output:

```bash
# Scrape a known meet
uv run python -m src.runner --source hytek_web --url "https://example.com/known-meet/"

# Compare result count and spot-check specific results
uv run python -c "
from src.database.client import get_client
client = get_client()
results = client.table('results_full').select('*').eq('meet_id', MEET_ID).execute()
print(f'Total results: {len(results.data)}')
# Compare against expected count
"
```

### Metrics to Track

- **Parse success rate:** Percentage of result rows successfully extracted from HTML. Target: >99%.
- **Results per meet:** Average and median number of results per scraped meet. A sudden drop indicates a parser issue.
- **Scrape error rate:** Percentage of scrape attempts that fail entirely. Target: <5%.
- **Field completeness:** Percentage of results with all expected fields populated (swimmer name, time/status, event, age group).

## Common Improvement Areas

### 1. New Hy-Tek Format Variations

Hy-Tek Meet Manager updates periodically, and different meet hosts may customize the HTML output. Watch for:

- Changed HTML tag structure or CSS class names
- Different table layouts (especially for relays vs. individual events)
- Variations in how prelims/finals are organized
- New status codes or result annotations
- Unicode or encoding issues in swimmer names

**How to diagnose:** When a scrape fails or produces fewer results than expected, download the raw HTML and compare its structure against what the parser expects. Look at `src/scrapers/` for the current parsing logic.

### 2. Time Parsing Edge Cases

Common issues:
- Times with leading zeros omitted (`:02.34` instead of `0:02.34`)
- Times displayed as `NT`, `DQ`, `NS`, `SCR` instead of numeric values
- Split times vs. final times confusion
- Reaction times included in results tables
- Relay leadoff legs vs. individual times
- Times with more or fewer than 2 decimal places

### 3. Swimmer Deduplication

Names appear differently across meets:
- "MacDonald, Alex" vs. "Macdonald, Alex" (capitalization)
- "O'Brien, Pat" vs. "OBrien, Pat" (punctuation)
- "Van Der Berg, Jan" vs. "van der Berg, Jan" vs. "Vanderberg, Jan"
- First name variants: "Will" vs. "William", "Alex" vs. "Alexander"
- Middle names sometimes included, sometimes not

Improve the matching algorithm in `src/processors/` to handle these cases. Consider fuzzy matching with a similarity threshold.

### 4. New Data Sources

Potential new sources to integrate:
- **Swimcloud API or scraper** — Historical results database
- **Swim Alberta rankings pages** — Provincial rankings
- **Swimming Canada results** — National meet results (may use different format than Hy-Tek)
- **Meet Mobile / Active.com** — Live meet results
- **PDF result files** — Some meets publish results as PDFs rather than HTML

Each new source needs its own scraper module under `src/scrapers/`.

## Making Improvements

### Workflow

1. **Create a branch:**
   ```bash
   git checkout -b fix/scraper-table-format
   ```

2. **Make changes** to the relevant module(s) under `src/`.

3. **Add or update tests:**
   ```bash
   # Add test cases that cover the new format/edge case
   uv run pytest tests/ -v
   ```

4. **Run the full test suite:**
   ```bash
   uv run pytest
   ```

5. **Test against real data** if possible:
   ```bash
   uv run python -m src.runner --source hytek_web --url "https://meet-with-new-format/"
   ```

6. **Present the diff for review:**
   ```bash
   git diff
   ```

Do not merge changes without Jaco's review. Present the diff clearly with an explanation of what changed and why.

### Code Standards

- Follow existing code style in the project
- Add docstrings to new functions
- Include type hints
- Keep scraper modules independent — each data source gets its own module
- Processors should be pure functions where possible (input data in, output data out, no side effects)

## Periodic Maintenance

### Check for Website Changes

Data source websites change over time. Periodically (monthly):

1. Visit each data source URL and verify the page structure matches what the scraper expects.
2. Run the scraper against a recent meet page and verify output.
3. Check for new result page formats that other clubs or organizations are using.

### Update Dependencies

```bash
# Check for outdated dependencies
uv pip list --outdated

# Update dependencies
uv lock --upgrade
uv sync
```

### Review Error Logs

Check the `scrape_log` table for patterns:
- Are certain URLs consistently failing?
- Has the error rate increased recently?
- Are there new error types appearing?

```python
from src.database.client import get_client

client = get_client()
failures = client.table('scrape_log').select('*').eq('status', 'failure').order('timestamp', desc=True).limit(20).execute()

for f in failures.data:
    print(f"{f['timestamp']} | {f['url']} | {f.get('error', 'no error message')}")
```

## Priority Order

When deciding what to improve, prioritize:

1. **Broken scrapes** — Fix anything that prevents data collection
2. **Data accuracy** — Fix parsing errors that produce wrong times or misattribute results
3. **Deduplication** — Reduce duplicate swimmer records
4. **New data sources** — Expand coverage
5. **Performance/code quality** — Refactoring, speed improvements, better tests
