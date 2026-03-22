-- ============================================================================
-- Noa Swimming — Supabase Schema
-- Competitive swimming data platform
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- 1. SWIMMERS
-- ============================================================================

CREATE TABLE swimmers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    birth_year      INTEGER,
    gender          TEXT CHECK (gender IN ('M', 'F')),
    country         TEXT,
    province_state  TEXT,
    club_name       TEXT,
    external_ids    JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- 2. MEETS
-- ============================================================================

CREATE TABLE meets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    location        TEXT,
    city            TEXT,
    province_state  TEXT,
    country         TEXT,
    start_date      DATE NOT NULL,
    end_date        DATE,
    course          TEXT CHECK (course IN ('SCY', 'SCM', 'LCM')),
    meet_type       TEXT,
    sanction_number TEXT,
    source_url      TEXT,
    source_name     TEXT,
    external_ids    JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- 3. EVENTS
-- ============================================================================

CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meet_id         UUID NOT NULL REFERENCES meets(id) ON DELETE CASCADE,
    event_number    INTEGER,
    distance        INTEGER NOT NULL,
    stroke          TEXT NOT NULL CHECK (stroke IN (
                        'Freestyle', 'Backstroke', 'Breaststroke',
                        'Butterfly', 'IM', 'Medley Relay', 'Freestyle Relay'
                    )),
    gender          TEXT CHECK (gender IN ('M', 'F', 'X')),
    age_group       TEXT,
    round           TEXT DEFAULT 'Finals',
    is_relay        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (meet_id, event_number, round)
);


-- ============================================================================
-- 4. RESULTS
-- ============================================================================

CREATE TABLE results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    swimmer_id          UUID REFERENCES swimmers(id),
    team_name           TEXT,
    seed_time_seconds   NUMERIC(8, 2),
    final_time_seconds  NUMERIC(8, 2),
    final_time_text     TEXT,
    place               INTEGER,
    heat                INTEGER,
    lane                INTEGER,
    points              NUMERIC(6, 2),
    status              TEXT,
    dq_description      TEXT,
    is_personal_best    BOOLEAN,
    created_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (event_id, swimmer_id)
);


-- ============================================================================
-- 5. SPLITS
-- ============================================================================

CREATE TABLE splits (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id               UUID NOT NULL REFERENCES results(id) ON DELETE CASCADE,
    distance                INTEGER NOT NULL,
    cumulative_time_seconds NUMERIC(8, 2),
    split_time_seconds      NUMERIC(8, 2),
    created_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (result_id, distance)
);


-- ============================================================================
-- 6. SCRAPE LOG
-- ============================================================================

CREATE TABLE scrape_log (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name       TEXT NOT NULL,
    source_url        TEXT,
    status            TEXT CHECK (status IN ('started', 'success', 'partial', 'failed')),
    records_found     INTEGER DEFAULT 0,
    records_inserted  INTEGER DEFAULT 0,
    records_updated   INTEGER DEFAULT 0,
    error_message     TEXT,
    started_at        TIMESTAMPTZ DEFAULT NOW(),
    completed_at      TIMESTAMPTZ
);


-- ============================================================================
-- 7. CONVERSION FACTORS
-- ============================================================================

CREATE TABLE conversion_factors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distance            INTEGER NOT NULL,
    stroke              TEXT NOT NULL,
    scy_to_lcm_factor   NUMERIC(10, 6),
    scm_to_lcm_factor   NUMERIC(10, 6),
    source              TEXT CHECK (source IN ('wa_standard', 'empirical')),
    sample_size         INTEGER,
    last_updated        TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (distance, stroke, source)
);


-- ============================================================================
-- INDEXES
-- ============================================================================

-- Results indexes
CREATE INDEX idx_results_swimmer_id        ON results (swimmer_id);
CREATE INDEX idx_results_event_id          ON results (event_id);
CREATE INDEX idx_results_final_time        ON results (final_time_seconds);

-- Events indexes
CREATE INDEX idx_events_meet_id            ON events (meet_id);
CREATE INDEX idx_events_stroke_distance    ON events (stroke, distance);

-- Meets indexes
CREATE INDEX idx_meets_dates               ON meets (start_date, end_date);

-- Swimmers indexes
CREATE INDEX idx_swimmers_name             ON swimmers (last_name, first_name);

-- Splits indexes
CREATE INDEX idx_splits_result_id          ON splits (result_id);


-- ============================================================================
-- VIEWS
-- ============================================================================

-- Convenience view joining results with swimmer, event, and meet details
CREATE OR REPLACE VIEW results_full AS
SELECT
    r.id              AS result_id,
    r.place,
    r.heat,
    r.lane,
    r.seed_time_seconds,
    r.final_time_seconds,
    r.final_time_text,
    r.points,
    r.status,
    r.dq_description,
    r.is_personal_best,
    r.team_name,

    -- Swimmer
    s.id              AS swimmer_id,
    s.first_name,
    s.last_name,
    s.birth_year,
    s.gender          AS swimmer_gender,
    s.country         AS swimmer_country,
    s.club_name,

    -- Event
    e.id              AS event_id,
    e.event_number,
    e.distance,
    e.stroke,
    e.gender          AS event_gender,
    e.age_group,
    e.round,
    e.is_relay,

    -- Meet
    m.id              AS meet_id,
    m.name            AS meet_name,
    m.location        AS meet_location,
    m.city            AS meet_city,
    m.province_state  AS meet_province_state,
    m.country         AS meet_country,
    m.start_date      AS meet_start_date,
    m.end_date        AS meet_end_date,
    m.course

FROM results r
LEFT JOIN swimmers s ON s.id = r.swimmer_id
JOIN events e        ON e.id = r.event_id
JOIN meets m         ON m.id = e.meet_id;


-- ============================================================================
-- TRIGGERS — auto-update updated_at on swimmers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_swimmers_updated_at
    BEFORE UPDATE ON swimmers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
