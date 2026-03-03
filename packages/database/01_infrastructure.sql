-- =============================================
-- INFRASTRUCTURE I.E SETUP
-- =============================================

-- =============================================
-- ENUM DEFINITIONS (Early Setup)
-- =============================================

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE bed_status AS ENUM ('available', 'occupied', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM ('draft', 'pending_accounting', 'ready_for_checkin', 'active', 'completed', 'cancelled', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'partial', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE location_type AS ENUM ('university', 'campus', 'building', 'block', 'floor', 'room', 'bed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE location_ownership_type AS ENUM ('dorm', 'rectorate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE semester_status_enum AS ENUM ('planned', 'open', 'active', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE semester_type_enum AS ENUM ('fall', 'spring', 'summer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE inventory_scope AS ENUM ('bed', 'room', 'shared');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- EXTENSIONS
-- =============================================

CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =============================================
-- AUDIT SCHEMA 
-- =============================================
CREATE SCHEMA IF NOT EXISTS audit;

-- Main audit table
CREATE TABLE audit.event_log (
    event_id BIGINT GENERATED ALWAYS AS IDENTITY,
    
    -- WHO
    user_id UUID NOT NULL,
    username VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    
    -- WHAT
    event_type VARCHAR(50) NOT NULL, -- 'DATA_CHANGE', 'AUTH', 'EXPORT', 'BULK_OP'
    action CHAR(1) CHECK (action IN ('I', 'U', 'D', 'T')), -- Insert, Update, Delete, Truncate
    
    -- WHERE
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT, -- The primary key of affected record (as text for flexibility)
    
    -- WHEN
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- DATA (The diff)
    old_values JSONB, -- Before state
    new_values JSONB, -- After state
    changed_fields TEXT[], -- Array of field names that changed
    
    -- CONTEXT
    operation_context TEXT, -- e.g., "Excel import batch #123", "Semester end bulk checkout"
    query_text TEXT,
    
    -- METADATA
    session_id UUID,
    request_id UUID, -- For correlating related operations
    is_system_operation BOOLEAN DEFAULT FALSE,
    
    PRIMARY KEY (event_id, event_timestamp)
) PARTITION BY RANGE (event_timestamp);

-- Create indexes on the parent table (inherited by partitions)
CREATE INDEX idx_audit_user ON audit.event_log(user_id, event_timestamp DESC);
CREATE INDEX idx_audit_table ON audit.event_log(schema_name, table_name, event_timestamp DESC);
CREATE INDEX idx_audit_record ON audit.event_log(record_id, event_timestamp DESC);
CREATE INDEX idx_audit_event_type ON audit.event_log(event_type, event_timestamp DESC);

-- GIN index for JSONB queries
CREATE INDEX idx_audit_old_values ON audit.event_log USING GIN(old_values);
CREATE INDEX idx_audit_new_values ON audit.event_log USING GIN(new_values);

-- Default partition (Catches data during breaks or before semester setup)
CREATE TABLE audit.event_log_default PARTITION OF audit.event_log DEFAULT;

-- =============================================
-- IMMUTABILITY: RBAC
-- =============================================

GRANT USAGE ON SCHEMA audit TO audit_writer;
GRANT INSERT ON audit.event_log TO audit_writer;

-- Deny modifications (requires superuser to override)
REVOKE UPDATE, DELETE, TRUNCATE ON audit.event_log FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA audit FROM PUBLIC;

-- =============================================
-- AUTHENTICATION AUDIT (Separate table for performance)
-- =============================================
CREATE TABLE audit.auth_log (
    auth_id BIGINT GENERATED ALWAYS AS IDENTITY,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    user_id UUID,
    username VARCHAR(100),
    email VARCHAR(255),
    
    event_type VARCHAR(50) NOT NULL, -- 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_ENABLED'
    
    ip_address INET,
    user_agent TEXT,
    location_info JSONB, -- GeoIP data if available
    
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    
    session_id UUID,
    
    PRIMARY KEY (auth_id, event_timestamp)
) PARTITION BY RANGE (event_timestamp);

CREATE INDEX idx_auth_user ON audit.auth_log(user_id, event_timestamp DESC);
CREATE INDEX idx_auth_ip ON audit.auth_log(ip_address, event_timestamp DESC);
CREATE INDEX idx_auth_failures ON audit.auth_log(success, event_timestamp DESC) WHERE success = false;

-- Default partition
CREATE TABLE audit.auth_log_default PARTITION OF audit.auth_log DEFAULT;

-- =============================================
-- SENSITIVE OPERATIONS AUDIT
-- =============================================
CREATE TABLE audit.sensitive_operations (
    op_id BIGINT GENERATED ALWAYS AS IDENTITY,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    user_id UUID NOT NULL,
    username VARCHAR(100),
    operation_type VARCHAR(100) NOT NULL, -- 'BULK_DELETE', 'DATA_EXPORT', 'PERMISSION_CHANGE', 'PAYMENT_MODIFY'
    
    affected_count INT, -- How many records affected
    resource_type VARCHAR(100), -- 'students', 'payments', 'assignments'
    resource_ids TEXT[], -- Array of affected IDs
    
    justification TEXT, -- Required for certain operations
    approved_by UUID, -- For operations requiring approval
    
    request_data JSONB,
    result_summary JSONB,
    
    PRIMARY KEY (op_id, event_timestamp)
) PARTITION BY RANGE (event_timestamp);

CREATE TABLE audit.sensitive_operations_default PARTITION OF audit.sensitive_operations DEFAULT;

-- =============================================
-- UNDO SYSTEM
-- =============================================

CREATE TABLE audit.undo_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Who and when
  user_id UUID NOT NULL, -- References users(id) in domain schema
  session_id UUID, 
  
  -- What action
  action_type VARCHAR(50) NOT NULL, -- 'create_location', 'update_assignment', 'delete_user', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'location', 'assignment', 'user', etc.
  entity_id TEXT, -- UUID or Int ID stored as text for flexibility
  
  -- How to undo
  undo_data JSONB NOT NULL, -- Snapshot of old state OR instructions to undo
  redo_data JSONB, -- Optional: snapshot of new state for redo
  
  -- Metadata
  description TEXT, -- Human-readable: "Updated gender lock on Campus A"
  
  -- Undo state
  undone_at TIMESTAMPTZ,
  undone_by UUID, -- References users(id)
  
  -- Prevent undo after certain time
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  deleted_at TIMESTAMPTZ,

  PRIMARY KEY (id, event_timestamp)
) PARTITION BY RANGE (event_timestamp);

-- Default partition
CREATE TABLE audit.undo_log_default PARTITION OF audit.undo_log DEFAULT;

CREATE INDEX idx_undo_log_user_recent ON audit.undo_log(user_id, event_timestamp DESC) 
  WHERE undone_at IS NULL AND deleted_at IS NULL;

CREATE INDEX idx_undo_log_session ON audit.undo_log(session_id, event_timestamp DESC) 
  WHERE session_id IS NOT NULL AND deleted_at IS NULL;
