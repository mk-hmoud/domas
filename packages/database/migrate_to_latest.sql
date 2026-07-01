-- =============================================
-- MIGRATION: Apply schema changes from merged commits
-- Run this ONCE against the cloud database.
-- Safe to run multiple times (IF NOT EXISTS / IF EXISTS guards).
-- =============================================

BEGIN;

-- ── 1. locations: add name_tr ──────────────────────────────────────────────
ALTER TABLE locations
    ADD COLUMN IF NOT EXISTS name_tr VARCHAR(100);

-- ── 2. locations: ownership → is_rectorate ────────────────────────────────
-- Add the new boolean first (nullable so existing rows don't error)
ALTER TABLE locations
    ADD COLUMN IF NOT EXISTS is_rectorate BOOLEAN DEFAULT FALSE;

-- Migrate data: rows with ownership='rectorate' become is_rectorate=true
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'locations' AND column_name = 'ownership'
    ) THEN
        UPDATE locations SET is_rectorate = TRUE WHERE ownership = 'rectorate';
        ALTER TABLE locations DROP COLUMN ownership;
    END IF;
END $$;

-- ── 3. beds: same ownership → is_rectorate swap ───────────────────────────
ALTER TABLE beds
    ADD COLUMN IF NOT EXISTS is_rectorate BOOLEAN DEFAULT FALSE;

DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'beds' AND column_name = 'ownership'
    ) THEN
        UPDATE beds SET is_rectorate = TRUE WHERE ownership = 'rectorate';
        ALTER TABLE beds DROP COLUMN ownership;
    END IF;
END $$;

-- ── 4. Drop location_ownership_type enum (all references gone now) ─────────
DROP TYPE IF EXISTS location_ownership_type;

-- ── 5. countries: rename name → name_en, add name_tr ─────────────────────
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'countries' AND column_name = 'name'
    ) THEN
        ALTER TABLE countries RENAME COLUMN name TO name_en;
    END IF;
END $$;

-- Add name_tr as nullable (you can populate and tighten to NOT NULL later)
ALTER TABLE countries
    ADD COLUMN IF NOT EXISTS name_tr VARCHAR(100);

-- ── 6. departments table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    name_en VARCHAR(150) PRIMARY KEY,
    name_tr VARCHAR(150) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed departments from existing student data so the FK below won't fail.
-- Rows already present (via IF NOT EXISTS on the PRIMARY KEY) are skipped.
INSERT INTO departments (name_en, name_tr)
SELECT DISTINCT department, department   -- name_tr defaults to same value; update manually after
FROM students
WHERE department IS NOT NULL
ON CONFLICT (name_en) DO NOTHING;

-- Now it's safe to add the FK on students (if it isn't there already)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'students_department_fkey'
          AND table_name = 'students'
    ) THEN
        ALTER TABLE students
            ADD CONSTRAINT students_department_fkey
            FOREIGN KEY (department) REFERENCES departments(name_en) ON UPDATE CASCADE;
    END IF;
END $$;

-- ── 7. room_types: new columns ────────────────────────────────────────────
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS name_tr          VARCHAR(100);
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS description_tr   TEXT;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS gender_lock      gender_type DEFAULT NULL;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS student_year_lock VARCHAR(10) DEFAULT NULL;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS is_guest_zone    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS is_tr_only       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS is_foreigner_only BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS is_rectorate     BOOLEAN NOT NULL DEFAULT FALSE;

-- Add CHECK on student_year_lock if not present
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'room_types' AND column_name = 'student_year_lock'
    ) THEN
        ALTER TABLE room_types
            ADD CONSTRAINT room_types_student_year_lock_check
            CHECK (student_year_lock IN ('new', 'current'));
    END IF;
END $$;

-- ── 8. access_cards: expand status CHECK to include 'broken' ─────────────
ALTER TABLE access_cards DROP CONSTRAINT IF EXISTS access_cards_status_check;
ALTER TABLE access_cards
    ADD CONSTRAINT access_cards_status_check
    CHECK (status IN ('available', 'active', 'lost', 'broken', 'void'));

-- ── 9. access_card_logs: expand action_type CHECK ─────────────────────────
ALTER TABLE access_card_logs DROP CONSTRAINT IF EXISTS access_card_logs_action_type_check;
ALTER TABLE access_card_logs
    ADD CONSTRAINT access_card_logs_action_type_check
    CHECK (action_type IN ('issued', 'returned', 'lost', 'broken', 'void', 'reinstated', 'reversed'));

-- ── 10. room_requires_type constraint ─────────────────────────────────────
-- WARNING: This will FAIL if any existing rooms have room_type_id = NULL.
-- Before enabling, verify with:
--   SELECT id, name FROM locations WHERE type = 'room' AND room_type_id IS NULL;
-- If any rows are returned, assign room types to them first, then uncomment:
--
-- DO $$ BEGIN
--     IF NOT EXISTS (
--         SELECT 1 FROM information_schema.table_constraints
--         WHERE constraint_name = 'room_requires_type' AND table_name = 'locations'
--     ) THEN
--         ALTER TABLE locations
--             ADD CONSTRAINT room_requires_type
--             CHECK (type != 'room' OR room_type_id IS NOT NULL);
--     END IF;
-- END $$;

-- ── 11. tickets: add photo_keys ───────────────────────────────────────────
ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS photo_keys TEXT[] NOT NULL DEFAULT '{}';

-- ── 12. Mutual exclusion: is_tr_only vs is_foreigner_only ─────────────────
ALTER TABLE locations
    DROP CONSTRAINT IF EXISTS locations_no_tr_and_foreigner,
    ADD CONSTRAINT locations_no_tr_and_foreigner
        CHECK (NOT (is_tr_only = TRUE AND is_foreigner_only = TRUE));

ALTER TABLE beds
    DROP CONSTRAINT IF EXISTS beds_no_tr_and_foreigner,
    ADD CONSTRAINT beds_no_tr_and_foreigner
        CHECK (NOT (is_tr_only = TRUE AND is_foreigner_only = TRUE));

ALTER TABLE room_types
    DROP CONSTRAINT IF EXISTS room_types_no_tr_and_foreigner,
    ADD CONSTRAINT room_types_no_tr_and_foreigner
        CHECK (NOT (is_tr_only = TRUE AND is_foreigner_only = TRUE));

COMMIT;

-- ── POST-MIGRATION CHECKLIST ───────────────────────────────────────────────
-- 1. Update departments.name_tr values (seeded with name_en as placeholder).
-- 2. Update countries.name_tr values (seeded as NULL — must fill before adding NOT NULL).
-- 3. Assign room_type_id to all rooms that still have NULL, then uncomment block 10.
-- 4. Remove the DEFAULT '' from departments.name_tr once all rows have real translations.
