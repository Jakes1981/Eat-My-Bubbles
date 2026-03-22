# Building a Domain-Specific Data Platform with Claude Code

A step-by-step process and context guide for building data collection, analysis, and application platforms in any domain — documented through the lens of competitive swimming, but applicable to any field where scattered data needs to be unified, enriched, and made actionable.

---

## 1. The Pattern: What We're Building and Why

### The Problem (Universal)

In many domains, valuable performance/research data exists but is:
- **Fragmented** across multiple systems, websites, and formats
- **Inaccessible** for analysis (locked in apps, PDFs, or proprietary systems)
- **Disconnected** from the science and context that makes it meaningful

### The Solution Pattern

Build a **progressive data platform** that:
1. Collects data from public sources (ethically, respecting terms of service)
2. Normalizes it into a clean, queryable schema
3. Enriches it with domain expertise (conversions, analysis, context)
4. Exposes it through apps and tools that serve the community

### Why This Works

The person building this has **domain expertise** (sport science, S&C, coaching) but is non-technical. Claude Code bridges the gap — providing the engineering while the builder provides the domain knowledge, strategic vision, and quality judgment.

---

## 2. Phase 1: Strategic Discovery

Before writing any code, answer these questions:

### 2.1 Map the Data Landscape

**Key question:** Where does the data you want actually originate?

In our case, we discovered that Meet Mobile (the app everyone uses) is NOT the original data source. The data flows:

```
Timing System → Meet Management Software (Hy-Tek) → publishes to:
  → Private app APIs (Meet Mobile)
  → Public web pages (Hy-Tek HTML results)  ← accessible
  → Federation databases (Swimming Canada)   ← accessible
  → Third-party aggregators (Swimcloud)      ← accessible
  → Standardized files (CL2/SD3)            ← accessible
```

**Action:** Trace the data back to its origin. You'll often find that the "obvious" source is just a consumer of data that's available through more accessible channels.

**For your domain:** Draw the equivalent data flow diagram. Where does your data originate? Who publishes it? What formats does it come in? Which sources are publicly accessible vs. behind paywalls or terms of service?

### 2.2 Legal and Ethical Assessment

Before scraping anything, classify each data source:

| Category | Description | Action |
|----------|-------------|--------|
| Clearly fine | Publicly published for consumption (Hy-Tek web results, federation websites) | Scrape politely with delays |
| Caution needed | Public but high-volume or containing personal data (minors' birth dates) | Rate limit, minimize personal data |
| Do not touch | Behind paywalls, login walls, or explicit ToS prohibitions (Meet Mobile API) | Find alternative sources or pursue partnerships |

### 2.3 Identify Your Differentiator

What makes your platform valuable beyond just collecting data?

**Our differentiator:** Cross-course time conversion (SCY↔SCM↔LCM). This is a real unsolved problem in swimming — comparing US swimmers (yards) with international swimmers (meters) for scholarship decisions. We start with published conversion factors but architect for data-driven empirical factors that improve as our dataset grows.

**For your domain:** What transformation, analysis, or connection can you provide that the raw data sources can't? This is where your domain expertise creates unique value.

---

## 3. Phase 2: Architecture Decisions

### 3.1 Choose Your Stack Based on Your Profile

We chose:
- **Python** — best ecosystem for scraping and data processing
- **Supabase (PostgreSQL)** — managed database with built-in API for future apps
- **uv** — modern Python package manager, fast and reliable
- **Modular pipeline** — not too simple (single script) or too complex (full platform)

**Decision framework:**

| Builder Profile | Recommended Stack |
|----------------|-------------------|
| Non-technical, building with AI | Python + Supabase + simple CLI |
| Technical developer | Whatever you're fastest in + appropriate DB |
| Team with DevOps | Full platform (Docker, queues, CI/CD) |

### 3.2 Schema Design Principles

Design your database schema with these principles:

1. **UUIDs over sequential IDs** — safer when merging data from multiple sources
2. **Store both raw and processed values** — e.g., time as seconds (for math) AND original text (for display)
3. **JSONB for extensible fields** — `external_ids` lets you track identifiers from any source without schema changes
4. **Source tracking on every record** — always know where data came from (`source_url`, `source_name`)
5. **Pipeline logging** — a `scrape_log` table to track every collection run
6. **Domain-specific constraints** — in swimming, `course` type (SCY/SCM/LCM) is mandatory because the same time means very different things in different pool lengths

### 3.3 Project Structure

Organize for clarity and extensibility:

```
project/
├── src/
│   ├── scrapers/      # One file per data source
│   ├── processors/    # Domain-specific transformations
│   └── database/      # Storage operations
├── agents/            # Autonomous agent instructions
├── scripts/           # One-time setup scripts
├── tests/             # Fixtures + unit tests
└── docs/              # This document and others
```

**Why this matters:** A non-technical builder (or any future collaborator) should be able to look at the directory structure and understand what each part does without reading any code.

---

## 4. Phase 3: Build the Foundation First

### 4.1 Build Order

This order minimizes rework:

1. **Project config** — package manager, dependencies, environment variables
2. **Database schema** — tables, indexes, views (version-controlled as SQL)
3. **Domain processors** — the transformations specific to your field (time parsing, name normalization, etc.)
4. **Database operations** — upsert logic with deduplication
5. **First scraper** — start with the most accessible data source
6. **CLI runner** — orchestrate the pipeline with a simple command
7. **Agent instructions** — teach Claude about your domain
8. **Tests** — verify processors and scraper parsing

### 4.2 Domain Processors are Your Moat

The processors module is where domain expertise lives in code:

- **Swimming:** Time parsing ("1:02.34" ↔ 62.34s), course conversions, event normalization, swimmer deduplication
- **Your domain:** Whatever transformations are needed to make raw data comparable, queryable, and meaningful

These processors are reused by every scraper, every analysis, and every future app. Get them right early.

### 4.3 Scraper Design

Key principles for ethical, reliable scraping:

- **Polite delays** between requests (2-3 seconds minimum)
- **Descriptive User-Agent** string
- **Idempotent** — running the same scrape twice should not create duplicates
- **Logged** — every run recorded for debugging and audit
- **Fixture-tested** — save sample HTML and test parsing offline (no network in tests)

---

## 5. Phase 4: Autonomous Agents

Build agent capabilities from day one, not as an afterthought. Four types:

### 5.1 Data Collection Agent
- Discovers new data to collect
- Runs scrapers against discovered sources
- Reports what was collected and any failures

### 5.2 Data Quality Agent
- Checks for duplicates, anomalies, and missing data
- Runs domain-specific validation (e.g., "no 100m time should be under 15 seconds")
- Suggests and performs fixes

### 5.3 Research Agent
- Answers analytical questions using the collected data
- Applies domain expertise to interpret results
- Generates reports with context

### 5.4 Improvement Agent
- Reviews scraper quality and parsing accuracy
- Identifies new edge cases and format variations
- Suggests and implements code improvements

**Why from day one:** These agents make the system self-maintaining. Without them, the platform degrades as data sources change format, new edge cases appear, and the dataset grows beyond manual quality checks.

---

## 6. Phase 5: Progressive Growth

The platform grows in layers:

```
Layer 1: Data Collection (where we start)
  → Scrapers, processors, database, CLI

Layer 2: Personal Tools
  → Dashboards, performance tracking, analysis

Layer 3: Community Tools
  → Public apps, APIs, comparative analytics

Layer 4: Intelligence
  → Data-driven models, predictions, recommendations
```

Each layer builds on the one below. The schema, processors, and agent infrastructure designed in Layer 1 support all future layers without rearchitecting.

---

## 7. Key Lessons

### What Worked
- **Tracing data to its source** — found more accessible alternatives to the "obvious" data provider
- **Schema-first design** — thinking about what data we need before building scrapers
- **Modular pipeline** — right level of complexity for the stage we're at
- **Agent instructions alongside code** — not an afterthought
- **Fixture-based testing** — fast, reliable, no network dependencies

### What to Watch For
- **Scope creep** — it's tempting to build apps before the data foundation is solid
- **Over-engineering** — start simple, grow as needed
- **Data quality** — garbage in, garbage out. Invest in processors and quality checks early
- **Legal/ethical boundaries** — always check ToS before scraping. If in doubt, find a partnership path

---

## 8. Applying This to Other Domains

This same pattern works for:

| Domain | Data Sources | Key Processors | Differentiator |
|--------|-------------|----------------|----------------|
| **Swimming** | Hy-Tek results, Swimcloud, federations | Time parsing, course conversion, swimmer dedup | Cross-course comparison |
| **Track & Field** | World Athletics, Tilastopaja, meet results | Time/distance parsing, wind correction, altitude adjustment | Combined event scoring |
| **Cycling** | Strava API, race results, power data | Power normalization, altitude correction | Training load analytics |
| **Academic Research** | PubMed, arXiv, conference proceedings | Citation parsing, topic extraction | Cross-discipline synthesis |
| **Real Estate** | MLS, county records, census data | Address normalization, price adjustment | Neighborhood trend prediction |

The pattern is always:
1. **Map** the data landscape
2. **Design** a clean schema
3. **Build** scrapers + domain processors
4. **Deploy** autonomous agents
5. **Grow** from personal tools to community platform

---

## Appendix: Technical Reference

### Tools Used
- **Claude Code** — AI-assisted development (primary development tool)
- **Python 3.13** — programming language
- **uv** — Python package manager
- **Supabase** — managed PostgreSQL database with REST API
- **httpx** — HTTP client for scraping
- **BeautifulSoup4** — HTML parsing
- **pytest** — testing framework

### Commands Cheatsheet
```bash
# Run the scraper
uv run python -m src.runner --source hytek_web --url "URL"

# Run tests
uv run pytest tests/ -v

# Test database connection
uv run python -m src.runner --test-connection
```

---

*This document is a living guide. It will be updated as the platform grows and new lessons are learned.*
