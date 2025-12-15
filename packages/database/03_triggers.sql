-- =============================================
-- TRIGGER DEFINITIONS
-- =============================================

-- =============================================
-- UPDATE TIMESTAMP TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- GENERIC AUDIT TRIGGER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION audit.log_change() 
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_username TEXT;
    current_ip INET;
    current_user_agent TEXT;
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    col TEXT;
    pk_column TEXT;
    changed BOOLEAN;
BEGIN
    -- Determine Primary Key column (default to 'id' if not provided in trigger args)
    pk_column := COALESCE(TG_ARGV[0], 'id');

    -- Get session variables (set by application)
    BEGIN
        current_user_id := current_setting('app.user_id')::UUID;
        current_username := current_setting('app.username', true);
        current_ip := current_setting('app.ip_address', true)::INET;
        current_user_agent := current_setting('app.user_agent', true);
    EXCEPTION WHEN OTHERS THEN
        current_user_id := '00000000-0000-0000-0000-000000000000'::UUID; -- System UUID
        current_username := 'system';
    END;
    
    -- Detect changed fields for UPDATE
    IF TG_OP = 'UPDATE' THEN
        FOR col IN 
            SELECT column_name::TEXT 
            FROM information_schema.columns 
            WHERE table_schema = TG_TABLE_SCHEMA 
            AND table_name = TG_TABLE_NAME
            AND column_name NOT IN ('created_at', 'updated_at') -- Skip timestamps
        LOOP
            EXECUTE format('SELECT ($1).%I IS DISTINCT FROM ($2).%I', col, col)
            USING OLD, NEW
            INTO changed;
            
            IF changed THEN
                changed_fields := array_append(changed_fields, col);
            END IF;
        END LOOP;
    END IF;
    
    -- Insert audit record
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
        current_query()
    );
    
    RETURN NULL; -- AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- PARTITION MANAGEMENT
-- =============================================
CREATE OR REPLACE FUNCTION audit.create_semester_partition(
    semester_name TEXT, 
    p_start_date DATE, 
    p_end_date DATE
)
RETURNS void AS $$
DECLARE
    safe_name TEXT;
    partition_suffix TEXT;
    
    event_log_name TEXT;
    auth_log_name TEXT;
    ops_log_name TEXT;
    access_log_name TEXT;
BEGIN
    -- Validation
    IF p_start_date >= p_end_date THEN
        RAISE EXCEPTION 'Semester start date must be before end date';
    END IF;

    -- Sanitize name: "Fall 2024" -> "fall_2024"
    safe_name := lower(regexp_replace(semester_name, '[^a-zA-Z0-9]', '_', 'g'));
    
    -- Ensure uniqueness (e.g., prevent collision if "Fall 2024" is created twice)
    partition_suffix := safe_name;

    event_log_name := 'event_log_' || partition_suffix;
    auth_log_name  := 'auth_log_' || partition_suffix;
    ops_log_name   := 'sensitive_operations_' || partition_suffix;
    access_log_name := 'access_logs_' || partition_suffix;
    
    -- 1. Create event_log partition
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS audit.%I PARTITION OF audit.event_log FOR VALUES FROM (%L) TO (%L)',
        event_log_name, p_start_date, p_end_date
    );
    
    -- 2. Create auth_log partition
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS audit.%I PARTITION OF audit.auth_log FOR VALUES FROM (%L) TO (%L)',
        auth_log_name, p_start_date, p_end_date
    );
    
    -- 3. Create sensitive_operations partition
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS audit.%I PARTITION OF audit.sensitive_operations FOR VALUES FROM (%L) TO (%L)',
        ops_log_name, p_start_date, p_end_date
    );

    -- 4. Create access_logs partition (Public Schema)
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.access_logs FOR VALUES FROM (%L) TO (%L)',
        access_log_name, p_start_date, p_end_date
    );
    
    RAISE NOTICE 'Created partitions for semester: % (Audit Tables: %, %, % | Public: %)', 
        semester_name, event_log_name, auth_log_name, ops_log_name, access_log_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ARCHIVE OLD PARTITIONS (Run yearly)
-- =============================================
CREATE OR REPLACE FUNCTION audit.archive_old_partition(years_to_keep INT DEFAULT 3)
RETURNS void AS $$
DECLARE
    archive_year INT;
    partition_name TEXT;
BEGIN
    archive_year := EXTRACT(YEAR FROM CURRENT_DATE) - years_to_keep;
    
    -- Detach old partitions (they remain as regular tables)
    partition_name := 'audit.event_log_' || archive_year;
    EXECUTE format('ALTER TABLE audit.event_log DETACH PARTITION %s', partition_name);
    
    -- Export to external storage?
    
    -- Or compress and move to archive schema
    EXECUTE format('ALTER TABLE %s SET SCHEMA audit_archive', partition_name);
    
    RAISE NOTICE 'Archived partition: %', partition_name;
END;
$$ LANGUAGE plpgsql;

-- Create archive schema
CREATE SCHEMA IF NOT EXISTS audit_archive;

-- =============================================
-- USEFUL AUDIT QUERIES
-- =============================================

-- Who changed what, when
CREATE VIEW audit.recent_changes AS
SELECT 
    e.event_timestamp,
    e.username,
    e.table_name,
    e.action,
    e.record_id,
    e.changed_fields,
    e.ip_address
FROM audit.event_log e
WHERE e.event_timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY e.event_timestamp DESC;

-- Suspicious activity
CREATE VIEW audit.suspicious_activity AS
SELECT 
    user_id,
    username,
    COUNT(*) as failure_count,
    array_agg(DISTINCT ip_address) as ip_addresses,
    MAX(event_timestamp) as last_attempt
FROM audit.auth_log
WHERE success = false 
    AND event_timestamp > CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY user_id, username
HAVING COUNT(*) >= 5;

-- Bulk operations log
CREATE VIEW audit.bulk_operations AS
SELECT 
    op_id,
    event_timestamp,
    username,
    operation_type,
    affected_count,
    resource_type
FROM audit.sensitive_operations
ORDER BY event_timestamp DESC;

-- =============================================
-- BUSINESS LOGIC TRIGGERS
-- =============================================

-- Validate booking dates against semester dates
CREATE OR REPLACE FUNCTION validate_booking_dates()
RETURNS TRIGGER AS $$
DECLARE
    sem_start DATE;
    sem_end DATE;
BEGIN
    SELECT start_date, end_date INTO sem_start, sem_end
    FROM semesters
    WHERE id = NEW.semester_id;
    
    IF NEW.start_date < sem_start OR NEW.end_date > sem_end THEN
        RAISE EXCEPTION 'Booking dates (% to %) must be within semester dates (% to %)',
            NEW.start_date, NEW.end_date, sem_start, sem_end;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Ensure beds can only be assigned to locations of type 'room'
CREATE OR REPLACE FUNCTION validate_bed_location()
RETURNS TRIGGER AS $$
DECLARE
    loc_type location_type;
BEGIN
    SELECT type INTO loc_type
    FROM locations
    WHERE id = NEW.location_id;
    
    IF loc_type IS NULL OR loc_type != 'room' THEN
        RAISE EXCEPTION 'Beds can only be assigned to locations of type "room". Location % is type "%"',
            NEW.location_id, COALESCE(loc_type::text, 'NULL');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
