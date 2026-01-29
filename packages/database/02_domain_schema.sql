-- =============================================
-- DOMAS - POSTGRESQL SCHEMA
-- =============================================

-- =============================================
-- 1. ENUM DEFINITIONS
-- =============================================

CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE bed_status AS ENUM ('available', 'occupied', 'maintenance');

-- Booking Statuses
CREATE TYPE booking_status_enum AS ENUM (
    'draft',
    'pending_accounting',
    'ready_for_checkin',
    'active',
    'completed',
    'cancelled',
    'rejected'
);

CREATE TYPE payment_status_enum AS ENUM (
    'pending',
    'partial',
    'paid',
    'failed',
    'refunded'
);

CREATE TYPE location_type AS ENUM ('university', 'campus', 'building', 'block', 'floor', 'room');
CREATE TYPE location_ownership_type AS ENUM ('dorm', 'rectorate');

-- Semester Statuses
CREATE TYPE semester_status_enum AS ENUM (
    'planned',
    'open',
    'active',
    'closed',
    'archived'
);

CREATE TYPE semester_type_enum AS ENUM ('fall', 'spring', 'summer');

-- =============================================
-- 2. PHYSICAL HIERARCHY (The Assets)
-- =============================================

CREATE TABLE locations (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g., "Campus", "Block A", "Room 101"
    
    -- The Hierarchical Path (Campus.BlockA.Floor1.Room101)
    tree_path ltree NOT NULL,
    
    -- Hierarchy Level
    type location_type,
    
    -- GENDER LOCK
    -- Can be set at ANY level. If NULL, it is open/inherited.
    gender_lock gender_type DEFAULT NULL,
    
    -- Guest Isolation
    is_guest_zone BOOLEAN DEFAULT FALSE,
    is_tr_only BOOLEAN DEFAULT FALSE,
    ownership location_ownership_type DEFAULT 'dorm',
    
    -- Room Specifics (Only used if type = 'room')
    capacity INT DEFAULT 0,
    base_price MONEY DEFAULT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_locations_path ON locations USING GIST (tree_path);
CREATE INDEX idx_locations_deleted_at ON locations(deleted_at) WHERE deleted_at IS NULL;

-- =============================================
-- 3. ACTORS (Users & Profiles)
-- =============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_recovery_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE UNIQUE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_one_recovery_admin ON users (is_recovery_admin) WHERE is_recovery_admin = TRUE;
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- RBAC Tables
CREATE TABLE permissions (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE roles (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE
);

CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- =============================================
-- 3.1 GEOGRAPHY (Countries)
-- =============================================
CREATE TABLE countries (
    code CHAR(2) PRIMARY KEY, -- ISO 3166-1 alpha-2 (e.g., 'TR', 'US', 'DE')
    name VARCHAR(100) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 2. Optional Link to Auth System
    -- If NULL: Staff entered this student manually. They cannot log in yet.
    -- If SET: This student has a portal account.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- 3. Core Info
    student_number VARCHAR(50) NOT NULL, -- The University ID (e.g. 2024001)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender gender_type NOT NULL,
    nationality_code CHAR(2) NOT NULL REFERENCES countries(code),
    national_id VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    birth_place VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    
    -- 4. Contact (Might differ from User email)
    email VARCHAR(150), 
    phone_number VARCHAR(50),
    
    -- 5. Profile Data (Height, weight, habits - strictly domain data)
    profile_data JSONB DEFAULT '{}'::jsonb,
    
    -- 6. Meta
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Audit: Who created this profile? (Important for Manual Entry)
    created_by_user_id UUID REFERENCES users(id)
);

-- Constraint: A User account can only claim ONE Student profile
CREATE UNIQUE INDEX idx_students_student_number_active ON students(student_number) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_students_user_link ON students(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_students_deleted_at ON students(deleted_at) WHERE deleted_at IS NULL;

-- Index for searching manual students
CREATE INDEX idx_students_search ON students(student_number, last_name, email);
CREATE UNIQUE INDEX idx_students_national_id ON students(national_id);

-- =============================================
-- 2.1 TIME DIMENSION (Semesters)
-- =============================================
CREATE TABLE semesters (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- 1. Identity
    type semester_type_enum NOT NULL,            
    academic_year VARCHAR(20) NOT NULL,     -- "2024-2025"
    display_name VARCHAR(100),              -- "2024-2025 Fall"

    -- 2. Living Window (Physical Dates)
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- 3. Booking Window (Application Dates)
    booking_start_date DATE,           
    booking_end_date DATE,             
    
    -- 4. Financials (Deposits)
    deposit_amount_try NUMERIC(10, 2) NOT NULL DEFAULT 0,
    deposit_amount_foreign NUMERIC(10, 2) NOT NULL DEFAULT 0,
    foreign_currency_code CHAR(3) NOT NULL DEFAULT 'EUR',
    
    payment_deadline_date DATE,             
    
    -- 5. Lifecycle
    status semester_status_enum DEFAULT 'planned',
    auto_activate BOOLEAN DEFAULT TRUE,    
    auto_close BOOLEAN DEFAULT TRUE,       
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT uq_semester_term UNIQUE (academic_year, type),
    CONSTRAINT chk_semester_dates CHECK (end_date > start_date),
    CONSTRAINT chk_booking_window CHECK (
        (booking_start_date IS NULL OR booking_end_date IS NULL) OR
        (booking_start_date <= booking_end_date)
    )
);

-- Ensure only one active semester (optional)
CREATE UNIQUE INDEX idx_one_active_semester ON semesters (status) WHERE status = 'active';


-- =============================================
-- 3. INVENTORY
-- =============================================
CREATE TABLE beds (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    label VARCHAR(10) NOT NULL, -- "A", "B"
    status bed_status DEFAULT 'available',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_bed_room_check CHECK (location_id IS NOT NULL)
);

CREATE INDEX idx_beds_deleted_at ON beds(deleted_at) WHERE deleted_at IS NULL;


-- =============================================
-- 5. BOOKING & FINANCE
-- =============================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    bed_id INT NOT NULL REFERENCES beds(id), -- reserve bed
    semester_id INT REFERENCES semesters(id),
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- states
    status booking_status_enum DEFAULT 'draft',
    payment_status payment_status_enum DEFAULT 'pending',
    
    -- accounting gatekeeper
    is_accounting_approved BOOLEAN DEFAULT FALSE,
    accounting_approved_at TIMESTAMPTZ,
    accounting_approved_by UUID REFERENCES users(id),
    
    -- Access Control Timing
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    
    -- Wet Signature Tracking
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_booking_dates CHECK (end_date > start_date),

    -- Prevent overlapping bookings for the same bed using GIST Exclusion
    CONSTRAINT no_overlapping_dates_for_bed
    EXCLUDE USING GIST (
        bed_id WITH =,
        -- '[)' to allow checkout/checkin on the same day
        daterange(start_date, end_date, '[)') WITH &&
    )
    WHERE (status NOT IN ('cancelled', 'rejected', 'draft'))
);

CREATE INDEX idx_bookings_semester ON bookings(semester_id);

-- Accounting transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    payer_id UUID REFERENCES students(id),
    
    amount NUMERIC(10, 2) NOT NULL,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('rent', 'deposit', 'fine')),
    
    proof_document_url TEXT,
    
    -- The Gatekeeper
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================
-- 6. LOGGING 
-- =============================================

CREATE TABLE access_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    card_id VARCHAR(50),
    user_id UUID REFERENCES users(id),
    location_id INT REFERENCES locations(id),
    direction VARCHAR(10) CHECK (direction IN ('in', 'out')),
    scan_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (scan_timestamp, id)
) PARTITION BY RANGE (scan_timestamp);

CREATE TABLE access_logs_default PARTITION OF access_logs DEFAULT;


CREATE INDEX idx_students_gender ON students(gender);
CREATE INDEX idx_students_name ON students(last_name, first_name);
CREATE INDEX idx_beds_status ON beds(status) WHERE status = 'available';
CREATE INDEX idx_bookings_student ON bookings(student_id, status);
CREATE INDEX idx_bookings_active ON bookings(status, start_date, end_date) 
    WHERE status IN ('active', 'ready_for_checkin');
CREATE INDEX idx_transactions_pending ON transactions(is_approved, created_at) 
    WHERE is_approved = FALSE;
CREATE INDEX idx_locations_gender_lock ON locations(gender_lock) 
    WHERE gender_lock IS NOT NULL;

