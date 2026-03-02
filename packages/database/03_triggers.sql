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
CREATE OR REPLACE FUNCTION audit.maintain_partitions()
RETURNS void AS $$
DECLARE
    current_q_start DATE;
    q_end DATE;
    partition_suffix TEXT;
    i INT;
    target_date DATE;
    -- Centralized list of tables to manage
    target_tables TEXT[] := ARRAY[
        'audit.event_log', 
        'audit.auth_log', 
        'audit.sensitive_operations', 
        'public.access_logs'
    ];
    t TEXT;
BEGIN
    -- Start of current quarter
    current_q_start := date_trunc('quarter', CURRENT_DATE);
    
    -- Create partitions for Current (0) and Next (1) Quarter
    FOR i IN 0..1 LOOP
        target_date := current_q_start + (i * INTERVAL '3 months');
        q_end := target_date + INTERVAL '3 months';
        
        -- Suffix example: _y2024_q1
        partition_suffix := '_y' || to_char(target_date, 'YYYY') || '_q' || to_char(target_date, 'Q');
        
        FOREACH t IN ARRAY target_tables
        LOOP
            EXECUTE format(
                'CREATE TABLE IF NOT EXISTS %I.%I%s PARTITION OF %s FOR VALUES FROM (%L) TO (%L)',
                split_part(t, '.', 1), -- Schema
                split_part(t, '.', 2), -- Table Name
                partition_suffix,      -- Suffix
                t,                     -- Full Parent Name
                target_date, 
                q_end
            );
        END LOOP;
        
        RAISE NOTICE 'Ensured partitions exist for suffix %', partition_suffix;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ARCHIVE OLD PARTITIONS
-- =============================================
CREATE OR REPLACE FUNCTION audit.archive_old_partitions(years_to_keep INT DEFAULT 3)
RETURNS void AS $$
DECLARE
    archive_year INT;
    partition_suffix TEXT;
    q INT;
    -- Same target tables list
    target_tables TEXT[] := ARRAY[
        'audit.event_log', 
        'audit.auth_log', 
        'audit.sensitive_operations', 
        'public.access_logs'
    ];
    t TEXT;
    schema_name TEXT;
    parent_table_name TEXT;
    full_partition_name TEXT;
    short_partition_name TEXT;
BEGIN
    -- Determine the specific year to archive
    archive_year := EXTRACT(YEAR FROM CURRENT_DATE) - years_to_keep;
    
    FOR q IN 1..4 LOOP
        partition_suffix := '_y' || archive_year || '_q' || q;
        
        FOREACH t IN ARRAY target_tables
        LOOP
            schema_name := split_part(t, '.', 1);
            parent_table_name := split_part(t, '.', 2);
            short_partition_name := parent_table_name || partition_suffix;
            full_partition_name := schema_name || '.' || short_partition_name;
            
            -- 1. Check if the active partition exists
            IF EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = schema_name 
                AND c.relname = short_partition_name
            ) THEN
                -- 2. Check if it already exists in the ARCHIVE (Collision prevention)
                IF EXISTS (
                    SELECT 1 FROM pg_class c
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'audit_archive' 
                    AND c.relname = short_partition_name
                ) THEN
                    RAISE WARNING 'Table % already exists in audit_archive. Skipping move.', short_partition_name;
                ELSE
                    -- 3. Detach
                    EXECUTE format('ALTER TABLE %s DETACH PARTITION %s', t, full_partition_name);
                    
                    -- 4. Move to Archive
                    EXECUTE format('ALTER TABLE %s SET SCHEMA audit_archive', full_partition_name);
                    
                    RAISE NOTICE 'Archived: % -> audit_archive.%', full_partition_name, short_partition_name;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
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
