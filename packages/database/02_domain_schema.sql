-- =============================================
-- DOMAS - POSTGRESQL SCHEMA
-- =============================================

-- =============================================
-- 1. ENUM DEFINITIONS
-- =============================================

CREATE TYPE user_role AS ENUM ('admin', 'dorm_manager', 'dorm_staff', 'accounting_staff', 'student');
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE bed_status AS ENUM ('available', 'occupied', 'maintenance');
CREATE TYPE occupancy_status AS ENUM (
    'pending_payment',
    'paid',
    'approved',
    'active',
    'checked_out'
);
CREATE TYPE location_type AS ENUM ('university', 'campus', 'building', 'block', 'floor', 'room');

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
    
    -- Room Specifics (Only used if type = 'room')
    capacity INT DEFAULT 0,
    base_price MONEY DEFAULT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_path ON locations USING GIST (tree_path);

-- =============================================
-- 2.1 TIME DIMENSION (Semesters)
-- =============================================
CREATE TABLE semesters (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- e.g., "Fall 2024", "Spring 2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE, -- Only one should be true at a time
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_date_order CHECK (end_date > start_date)
);

-- Ensure only one active semester (optional, handled by app logic usually, but partial index helps)
CREATE UNIQUE INDEX idx_one_active_semester ON semesters (is_active) WHERE is_active = TRUE;


-- =============================================
-- 3. INVENTORY
-- =============================================
CREATE TABLE beds (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    label VARCHAR(10) NOT NULL, -- "A", "B"
    status bed_status DEFAULT 'available',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_bed_room_check CHECK (location_id IS NOT NULL)
);

-- =============================================
-- 3. ACTORS (Users & Profiles)
-- =============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender gender_type NOT NULL, -- Matched against location.gender_lock
    nationality_code CHAR(2),    -- ISO Code (US, TR, DE)
    
    -- Student Information
    profile_data JSONB DEFAULT '{}'::jsonb,
    
    -- risk_score INT DEFAULT 0, -- do we need this?
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. BOOKING & FINANCE
-- =============================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id),
    bed_id INT REFERENCES beds(id),
    semester_id INT REFERENCES semesters(id), -- Link booking to a specific business cycle
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    status occupancy_status DEFAULT 'pending_payment',
    
    -- Wet Signature Tracking
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure booking dates are logical
    CONSTRAINT chk_booking_dates CHECK (end_date > start_date)
);

-- Prevent overlapping bookings for the same bed
CREATE UNIQUE INDEX idx_no_overlapping_bookings 
ON bookings(bed_id, semester_id) 
WHERE status IN ('active', 'approved', 'paid', 'pending_payment');

CREATE INDEX idx_bookings_semester ON bookings(semester_id);

-- Accounting transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    payer_id UUID REFERENCES users(id),
    
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


CREATE INDEX idx_student_profiles_gender ON student_profiles(gender);
CREATE INDEX idx_student_profiles_name ON student_profiles(last_name, first_name);
CREATE INDEX idx_beds_status ON beds(status) WHERE status = 'available';
CREATE INDEX idx_bookings_student ON bookings(student_id, status);
CREATE INDEX idx_bookings_active ON bookings(status, start_date, end_date) 
    WHERE status IN ('active', 'approved');
CREATE INDEX idx_transactions_pending ON transactions(is_approved, created_at) 
    WHERE is_approved = FALSE;
CREATE INDEX idx_locations_gender_lock ON locations(gender_lock) 
    WHERE gender_lock IS NOT NULL;

