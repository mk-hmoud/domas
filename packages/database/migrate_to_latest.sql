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

-- ── 13. Audit triggers: drop undo_log, add 14 new tables ─────────────────
-- Undo log was previously audited; now intentionally excluded (internal infra).
DROP TRIGGER IF EXISTS audit_undo_log_change ON audit.undo_log;

-- Guests
DROP TRIGGER IF EXISTS audit_guests_change ON guests;
CREATE TRIGGER audit_guests_change
AFTER INSERT OR UPDATE OR DELETE ON guests
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Guest Stays
DROP TRIGGER IF EXISTS audit_guest_stays_change ON guest_stays;
CREATE TRIGGER audit_guest_stays_change
AFTER INSERT OR UPDATE OR DELETE ON guest_stays
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Room Change Requests
DROP TRIGGER IF EXISTS audit_room_change_requests_change ON room_change_requests;
CREATE TRIGGER audit_room_change_requests_change
AFTER INSERT OR UPDATE OR DELETE ON room_change_requests
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Pre-Reservations
DROP TRIGGER IF EXISTS audit_pre_reservations_change ON pre_reservations;
CREATE TRIGGER audit_pre_reservations_change
AFTER INSERT OR UPDATE OR DELETE ON pre_reservations
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Document Templates
DROP TRIGGER IF EXISTS audit_document_templates_change ON document_templates;
CREATE TRIGGER audit_document_templates_change
AFTER INSERT OR UPDATE OR DELETE ON document_templates
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Inventory Templates
DROP TRIGGER IF EXISTS audit_inventory_templates_change ON inventory_templates;
CREATE TRIGGER audit_inventory_templates_change
AFTER INSERT OR UPDATE OR DELETE ON inventory_templates
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Inventory Template Items
DROP TRIGGER IF EXISTS audit_inventory_template_items_change ON inventory_template_items;
CREATE TRIGGER audit_inventory_template_items_change
AFTER INSERT OR UPDATE OR DELETE ON inventory_template_items
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Room Types
DROP TRIGGER IF EXISTS audit_room_types_change ON room_types;
CREATE TRIGGER audit_room_types_change
AFTER INSERT OR UPDATE OR DELETE ON room_types
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Semester Room Pricing
DROP TRIGGER IF EXISTS audit_semester_room_pricing_change ON semester_room_pricing;
CREATE TRIGGER audit_semester_room_pricing_change
AFTER INSERT OR UPDATE OR DELETE ON semester_room_pricing
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Student Applications
DROP TRIGGER IF EXISTS audit_student_applications_change ON student_applications;
CREATE TRIGGER audit_student_applications_change
AFTER INSERT OR UPDATE OR DELETE ON student_applications
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Student Enrollment Verifications
DROP TRIGGER IF EXISTS audit_student_enrollment_verifications_change ON student_enrollment_verifications;
CREATE TRIGGER audit_student_enrollment_verifications_change
AFTER INSERT OR UPDATE OR DELETE ON student_enrollment_verifications
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Dorm Certificate Requests
DROP TRIGGER IF EXISTS audit_dorm_certificate_requests_change ON dorm_certificate_requests;
CREATE TRIGGER audit_dorm_certificate_requests_change
AFTER INSERT OR UPDATE OR DELETE ON dorm_certificate_requests
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Announcements
DROP TRIGGER IF EXISTS audit_announcements_change ON announcements;
CREATE TRIGGER audit_announcements_change
AFTER INSERT OR UPDATE OR DELETE ON announcements
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Conversations
DROP TRIGGER IF EXISTS audit_conversations_change ON conversations;
CREATE TRIGGER audit_conversations_change
AFTER INSERT OR UPDATE OR DELETE ON conversations
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- ── 14. Audit: capture operation_context + fix bulk_operations view ───────
-- The trigger function previously did not read or write operation_context.
-- The server now sets app.operation_context for bulk operations so we can
-- group related audit rows together in the bulk_operations view.

CREATE OR REPLACE FUNCTION audit.log_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_username TEXT;
    current_ip INET;
    current_user_agent TEXT;
    current_operation_context TEXT;
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    col TEXT;
    pk_column TEXT;
    changed BOOLEAN;
BEGIN
    pk_column := COALESCE(TG_ARGV[0], 'id');

    BEGIN
        current_user_id := current_setting('app.user_id')::UUID;
        current_username := current_setting('app.username', true);
        current_ip := current_setting('app.ip_address', true)::INET;
        current_user_agent := current_setting('app.user_agent', true);
        current_operation_context := current_setting('app.operation_context', true);
    EXCEPTION WHEN OTHERS THEN
        current_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
        current_username := 'system';
    END;

    IF TG_OP = 'UPDATE' THEN
        FOR col IN
            SELECT column_name::TEXT
            FROM information_schema.columns
            WHERE table_schema = TG_TABLE_SCHEMA
            AND table_name = TG_TABLE_NAME
            AND column_name NOT IN ('created_at', 'updated_at')
        LOOP
            EXECUTE format('SELECT ($1).%I IS DISTINCT FROM ($2).%I', col, col)
            USING OLD, NEW
            INTO changed;

            IF changed THEN
                changed_fields := array_append(changed_fields, col);
            END IF;
        END LOOP;
    END IF;

    INSERT INTO audit.event_log (
        user_id,
        username,
        ip_address,
        user_agent,
        event_type,
        action,
        schema_name,
        table_name,
        record_id,
        old_values,
        new_values,
        changed_fields,
        operation_context,
        query_text
    ) VALUES (
        current_user_id,
        current_username,
        current_ip,
        current_user_agent,
        'DATA_CHANGE',
        LEFT(TG_OP, 1),
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        CASE
            WHEN TG_OP = 'DELETE' THEN (to_jsonb(OLD) ->> pk_column)
            ELSE (to_jsonb(NEW) ->> pk_column)
        END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        CASE WHEN TG_OP = 'UPDATE' THEN changed_fields ELSE NULL END,
        NULLIF(current_operation_context, ''),
        current_query()
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the bulk_operations view: the old version queried sensitive_operations
-- (a table nothing ever wrote to). The new version groups event_log rows by
-- operation_context, which is now stamped by the server on every bulk call.
CREATE OR REPLACE VIEW audit.bulk_operations AS
SELECT
    operation_context AS op_id,
    MIN(event_timestamp) AS event_timestamp,
    username,
    action AS operation_type,
    COUNT(*) AS affected_count,
    table_name AS resource_type
FROM audit.event_log
WHERE operation_context IS NOT NULL
GROUP BY operation_context, username, action, table_name
ORDER BY MIN(event_timestamp) DESC;

-- ── POST-MIGRATION CHECKLIST ───────────────────────────────────────────────
-- 1. Update departments.name_tr values (seeded with name_en as placeholder).
-- 2. Update countries.name_tr values (seeded as NULL — must fill before adding NOT NULL).
-- 3. Assign room_type_id to all rooms that still have NULL, then uncomment block 10.
-- 4. Remove the DEFAULT '' from departments.name_tr once all rows have real translations.
