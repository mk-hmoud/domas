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
    
    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(50),
    
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
    
    -- constraints
    is_tr_only BOOLEAN DEFAULT FALSE,
    is_guest_zone BOOLEAN DEFAULT FALSE,
    ownership location_ownership_type DEFAULT 'dorm',
    
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
CREATE INDEX idx_transactions_booking ON transactions(booking_id);
CREATE INDEX idx_locations_gender_lock ON locations(gender_lock) 
    WHERE gender_lock IS NOT NULL;

-- =============================================
-- INVENTORY SYSTEM
-- =============================================

-- Inventory scope
CREATE TYPE inventory_scope AS ENUM ('bed', 'room', 'shared');

-- 1. Inventory Catalog (Templates)
CREATE TABLE inventory_catalog (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Names
    name_tr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    
    -- Descriptions
    description_tr TEXT,
    description_en TEXT,
    
    -- Scope
    scope inventory_scope NOT NULL,
    
    -- Pricing
    base_price_try NUMERIC(12, 2) NOT NULL DEFAULT 0,
    base_price_foreign NUMERIC(12, 2) NOT NULL DEFAULT 0,
    foreign_currency_code CHAR(3) NOT NULL DEFAULT 'EUR',
    
    -- Visibility
    is_active BOOLEAN DEFAULT TRUE,

    is_optional BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_inventory_catalog_active ON inventory_catalog(is_active) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_catalog_scope ON inventory_catalog(scope) 
    WHERE deleted_at IS NULL AND is_active = TRUE;

-- 2. Inventory Assignments (What items exist where)
CREATE TABLE inventory_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_id INT NOT NULL REFERENCES inventory_catalog(id) ON DELETE CASCADE,
    
    -- Targets (exactly one must be set)
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    bed_id INT REFERENCES beds(id) ON DELETE CASCADE,
    
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure exactly one target AND respect scope rules
    CONSTRAINT check_inventory_target CHECK (
        (location_id IS NOT NULL AND bed_id IS NULL) OR
        (location_id IS NULL AND bed_id IS NOT NULL)
    )
);

CREATE INDEX idx_inventory_assignment_location ON inventory_assignments(location_id) 
    WHERE location_id IS NOT NULL;
CREATE INDEX idx_inventory_assignment_bed ON inventory_assignments(bed_id) 
    WHERE bed_id IS NOT NULL;

-- Prevent duplicate assignments (e.g. assigning "Desk" to "Bed A" twice)
CREATE UNIQUE INDEX uq_bed_catalog ON inventory_assignments(bed_id, catalog_id) 
    WHERE bed_id IS NOT NULL;
CREATE UNIQUE INDEX uq_location_catalog ON inventory_assignments(location_id, catalog_id) 
    WHERE location_id IS NOT NULL;

-- 3. Contract Snapshots (Frozen inventory list)
CREATE TABLE booking_inventory_snapshots (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    
    -- Snapshot of catalog item
    catalog_id INT NOT NULL REFERENCES inventory_catalog(id),
    name_tr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_tr TEXT,
    description_en TEXT,
    scope inventory_scope NOT NULL,
    
    -- Pricing at time of contract
    price_try NUMERIC(12, 2) NOT NULL,
    price_foreign NUMERIC(12, 2) NOT NULL,
    foreign_currency_code CHAR(3) NOT NULL,
    
    quantity INT NOT NULL DEFAULT 1,
    
    -- Assignment context (e.g. "Room 301", "Block A Kitchen")
    location_name TEXT, 
    
    -- LEAN CHECK-OUT LOGIC
    checkin_recorded_at TIMESTAMPTZ,
    checkin_recorded_by UUID REFERENCES users(id),
    
    checkout_recorded_at TIMESTAMPTZ,
    checkout_recorded_by UUID REFERENCES users(id),
    
    -- Minimal Damage Flag
    is_damaged BOOLEAN DEFAULT FALSE,
    damage_note TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_snapshots_booking ON booking_inventory_snapshots(booking_id);

-- =============================================
-- CONTRACTS SYSTEM
-- =============================================

CREATE TABLE booking_contracts (
    booking_id UUID PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
    pdf_data BYTEA NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DAMAGES SYSTEM
-- =============================================

-- 1. THE INCIDENT (What happened?)
CREATE TABLE damage_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context
    location_id INT NOT NULL REFERENCES locations(id),
    snapshot_id BIGINT REFERENCES booking_inventory_snapshots(id), -- The Link to Prices
    
    -- Manual Pricing (Used ONLY if snapshot_id is NULL)
    manual_cost_try NUMERIC(12, 2), 
    manual_cost_foreign NUMERIC(12, 2),
    manual_currency_code CHAR(3) DEFAULT 'EUR',
    
    -- Details
    description TEXT NOT NULL,
    culprit_ids UUID[], -- Specific students to charge
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Audit
    reported_by UUID NOT NULL REFERENCES users(id),
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. THE DEBT (Per Student)
CREATE TABLE damage_liabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    damage_report_id UUID REFERENCES damage_reports(id) ON DELETE CASCADE,
    
    student_id UUID REFERENCES students(id),
    
    -- The Calculated Cost for THIS student
    amount NUMERIC(12, 2) NOT NULL,
    currency CHAR(3) NOT NULL, -- 'TRY', 'USD', 'EUR'
    
    transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_liabilities_student ON damage_liabilities(student_id);
CREATE INDEX idx_liabilities_report ON damage_liabilities(damage_report_id);

-- =============================================
-- TURNSTILE CARD SYSTEM
-- =============================================

-- 1. Configuration (Metadata for ranges)
CREATE TABLE card_batches (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    location_id INT REFERENCES locations(id), -- Optional: Link batch to a building
    name VARCHAR(100) NOT NULL, -- e.g. "2024 Fall - Block A"
    range_start INT NOT NULL,
    range_end INT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT chk_batch_range CHECK (range_end >= range_start)
);

-- 2. Physical Inventory (Every card exists as a row here)
CREATE TABLE access_cards (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    batch_id INT REFERENCES card_batches(id) ON DELETE CASCADE,
    
    -- Identity
    card_number INT NOT NULL,
    
    -- State
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'active', 'lost', 'void')),
    
    -- Current Assignment (Who has it right now?)
    current_holder_id UUID REFERENCES students(id),
    current_booking_id UUID REFERENCES bookings(id),
    
    -- Tracking (Requested Columns)
    issued_at TIMESTAMPTZ,
    issued_by UUID REFERENCES users(id),
    returned_at TIMESTAMPTZ, -- Usually NULL while active, populated upon return
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: Global Uniqueness across all batches
    CONSTRAINT uq_card_number UNIQUE (card_number)
);

-- 3. Optimization: Instant "Random Pick" Index
CREATE INDEX idx_cards_available ON access_cards(status) 
    WHERE status = 'available';

-- 4. History Log
CREATE TABLE access_card_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    card_id INT NOT NULL REFERENCES access_cards(id),
    student_id UUID REFERENCES students(id),
    booking_id UUID REFERENCES bookings(id),
    
    action_type VARCHAR(20) CHECK (action_type IN ('issued', 'returned', 'lost', 'void')),
    
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    
    notes TEXT
);