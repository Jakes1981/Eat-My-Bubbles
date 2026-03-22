-- ============================================================================
-- Noa Swimming — Tiered Storage Schema Addition
-- Adds ranking system, trajectory tracking, and app user support
-- ============================================================================

-- ============================================================================
-- 1. EXTEND SWIMMERS TABLE
-- ============================================================================

ALTER TABLE swimmers
    ADD COLUMN tracking_tier TEXT DEFAULT 'minimal'
        CHECK (tracking_tier IN ('full', 'on_demand', 'minimal')),
    ADD COLUMN app_user_id UUID,
    ADD COLUMN last_ranked_at TIMESTAMPTZ;


-- ============================================================================
-- 2. SWIMMER RANKINGS — current top 3 per event/level
-- ============================================================================

CREATE TABLE swimmer_rankings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event identity
    distance            INTEGER NOT NULL,
    stroke              TEXT NOT NULL,
    course              TEXT NOT NULL CHECK (course IN ('SCY', 'SCM', 'LCM')),
    gender              TEXT NOT NULL CHECK (gender IN ('M', 'F')),
    age_group           TEXT NOT NULL,       -- e.g., '13-14', 'Open'

    -- Ranking identity
    ranking_level       TEXT NOT NULL CHECK (ranking_level IN ('club', 'province', 'country', 'world')),
    ranking_scope       TEXT NOT NULL,        -- club name, province code, country code, or 'world'
    rank_position       INTEGER NOT NULL CHECK (rank_position BETWEEN 1 AND 3),

    -- Who holds this rank
    swimmer_id          UUID NOT NULL REFERENCES swimmers(id),
    best_time_seconds   NUMERIC(8, 2) NOT NULL,
    best_time_text      TEXT,
    best_time_result_id UUID REFERENCES results(id),

    -- Metadata
    as_of_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (distance, stroke, course, gender, age_group,
            ranking_level, ranking_scope, rank_position)
);

CREATE INDEX idx_rankings_event
    ON swimmer_rankings (distance, stroke, course, gender, age_group);
CREATE INDEX idx_rankings_level_scope
    ON swimmer_rankings (ranking_level, ranking_scope);
CREATE INDEX idx_rankings_swimmer
    ON swimmer_rankings (swimmer_id);


-- ============================================================================
-- 3. RANKING SNAPSHOTS — weekly historical record
-- ============================================================================

CREATE TABLE ranking_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    snapshot_date       DATE NOT NULL,
    distance            INTEGER NOT NULL,
    stroke              TEXT NOT NULL,
    course              TEXT NOT NULL CHECK (course IN ('SCY', 'SCM', 'LCM')),
    gender              TEXT NOT NULL CHECK (gender IN ('M', 'F')),
    age_group           TEXT NOT NULL,
    ranking_level       TEXT NOT NULL CHECK (ranking_level IN ('club', 'province', 'country', 'world')),
    ranking_scope       TEXT NOT NULL,
    rank_position       INTEGER NOT NULL CHECK (rank_position BETWEEN 1 AND 3),

    swimmer_id          UUID NOT NULL REFERENCES swimmers(id),
    best_time_seconds   NUMERIC(8, 2) NOT NULL,

    created_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (snapshot_date, distance, stroke, course, gender, age_group,
            ranking_level, ranking_scope, rank_position)
);

CREATE INDEX idx_snapshots_date ON ranking_snapshots (snapshot_date);
CREATE INDEX idx_snapshots_swimmer ON ranking_snapshots (swimmer_id);


-- ============================================================================
-- 4. SWIMMER TRAJECTORIES — best time per event per age
-- ============================================================================

CREATE TABLE swimmer_trajectories (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    swimmer_id              UUID NOT NULL REFERENCES swimmers(id),
    distance                INTEGER NOT NULL,
    stroke                  TEXT NOT NULL,
    course                  TEXT NOT NULL CHECK (course IN ('SCY', 'SCM', 'LCM')),

    swimming_age            INTEGER NOT NULL,    -- age on Dec 31 of season year
    season_year             INTEGER NOT NULL,

    best_time_seconds       NUMERIC(8, 2) NOT NULL,
    best_time_text          TEXT,
    best_time_result_id     UUID REFERENCES results(id),
    best_time_date          DATE,

    race_count              INTEGER DEFAULT 0,

    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (swimmer_id, distance, stroke, course, swimming_age, season_year)
);

CREATE INDEX idx_trajectories_swimmer ON swimmer_trajectories (swimmer_id);
CREATE INDEX idx_trajectories_event ON swimmer_trajectories (distance, stroke, course);
CREATE INDEX idx_trajectories_age ON swimmer_trajectories (swimming_age);


-- ============================================================================
-- 5. APP USERS — future sign-up support
-- ============================================================================

CREATE TABLE app_users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id        UUID UNIQUE NOT NULL,   -- from Supabase auth.users
    swimmer_id          UUID REFERENCES swimmers(id),
    display_name        TEXT,
    email               TEXT,

    club_name           TEXT,
    province_state      TEXT,
    country             TEXT,

    preferred_course    TEXT CHECK (preferred_course IN ('SCY', 'SCM', 'LCM')),
    tracked_events      JSONB DEFAULT '[]',

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_users_auth ON app_users (auth_user_id);
CREATE INDEX idx_app_users_swimmer ON app_users (swimmer_id);
