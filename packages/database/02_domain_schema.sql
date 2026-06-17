-- =============================================
-- DOMAS - POSTGRESQL SCHEMA
-- =============================================

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

    -- STUDENT YEAR LOCK
    -- 'new' = first-year students only, 'current' = continuing students only, NULL = unrestricted.
    student_year_lock VARCHAR(10) DEFAULT NULL CHECK (student_year_lock IN ('new', 'current')),

    -- Guest Isolation
    is_guest_zone BOOLEAN DEFAULT FALSE,
    is_tr_only BOOLEAN DEFAULT FALSE,
    is_foreigner_only BOOLEAN DEFAULT FALSE,
    ownership location_ownership_type DEFAULT 'dorm',
    
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
    code VARCHAR(10) PRIMARY KEY, -- Supports ISO alpha-2/3 and custom codes (e.g., 'TRNC')
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
    nationality_code VARCHAR(10) NOT NULL REFERENCES countries(code),
    national_id VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    birth_place VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    
    -- 4. Contact (Might differ from User email)
    email VARCHAR(150),
    phone_number VARCHAR(50),
    whatsapp_number VARCHAR(50),
    
    -- 5. Profile Data (Height, weight, habits - strictly domain data)
    profile_data JSONB DEFAULT '{}'::jsonb,
    photo_storage_key VARCHAR(500),
    
    -- 6. Meta
    is_active BOOLEAN DEFAULT TRUE,
    enrollment_status VARCHAR(20) NOT NULL DEFAULT 'enrolled'
        CHECK (enrollment_status IN ('pending', 'enrolled')),
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
    is_foreigner_only BOOLEAN DEFAULT FALSE,
    is_guest_zone BOOLEAN DEFAULT FALSE,
    ownership location_ownership_type DEFAULT 'dorm',
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_bed_room_check CHECK (location_id IS NOT NULL)
);

CREATE INDEX idx_beds_deleted_at ON beds(deleted_at) WHERE deleted_at IS NULL;

-- 1. Inventory Catalog (Base items)
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

-- 2. Inventory Templates (Blueprints)
CREATE TABLE inventory_templates (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    name VARCHAR(100) NOT NULL, -- e.g., "Standard Single Bed"
    description TEXT,
    
    -- Target scope (CRITICAL for UI filtering and backend validation)
    scope inventory_scope NOT NULL, -- 'bed', 'room', 'shared'
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ
);

-- Template Items (Lean and fast)
CREATE TABLE inventory_template_items (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    template_id INT NOT NULL REFERENCES inventory_templates(id) ON DELETE CASCADE,
    catalog_id INT NOT NULL REFERENCES inventory_catalog(id),
    quantity INT NOT NULL DEFAULT 1,
    
    UNIQUE (template_id, catalog_id),
    CONSTRAINT quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_template_items_template ON inventory_template_items(template_id);
CREATE INDEX idx_template_items_catalog ON inventory_template_items(catalog_id);

-- 3. Inventory Assignments (What items exist where)
CREATE TABLE inventory_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_id INT NOT NULL REFERENCES inventory_catalog(id) ON DELETE CASCADE,
    
    -- Targets
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    bed_id INT REFERENCES beds(id) ON DELETE CASCADE,
    
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT check_inventory_target CHECK (
        (location_id IS NOT NULL AND bed_id IS NULL) OR
        (location_id IS NULL AND bed_id IS NOT NULL)
    )
);

CREATE INDEX idx_inventory_assignment_location ON inventory_assignments(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_inventory_assignment_bed ON inventory_assignments(bed_id) WHERE bed_id IS NOT NULL;
CREATE UNIQUE INDEX uq_bed_catalog ON inventory_assignments(bed_id, catalog_id) WHERE bed_id IS NOT NULL;
CREATE UNIQUE INDEX uq_location_catalog ON inventory_assignments(location_id, catalog_id) WHERE location_id IS NOT NULL;

-- =============================================
-- BOOKINGS & CONTRACTS
-- =============================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    bed_id INT NOT NULL REFERENCES beds(id), -- reserve bed
    semester_id INT NOT NULL REFERENCES semesters(id),
    previous_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    
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
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'check_in', -- 'check_in', 'check_out'
    storage_key VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (booking_id, type)
);

-- =============================================
-- DAMAGES SYSTEM
-- =============================================

-- 1. THE INCIDENT (What happened?)
CREATE TABLE damage_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context
    location_id INT NOT NULL REFERENCES locations(id),
    snapshot_id BIGINT REFERENCES booking_inventory_snapshots(id), -- The Link to Prices via Snapshot
    catalog_id INT REFERENCES inventory_catalog(id), -- Direct link to Catalog item
    
    -- Manual Pricing (Used ONLY if snapshot_id and catalog_id are NULL)
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure valid pricing method
    CONSTRAINT chk_damage_pricing CHECK (
        (snapshot_id IS NOT NULL) OR 
        (catalog_id IS NOT NULL) OR 
        (manual_cost_try IS NOT NULL AND manual_cost_try > 0 AND 
         manual_cost_foreign IS NOT NULL AND manual_cost_foreign > 0)
    )
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
    catalog_id INT REFERENCES inventory_catalog(id), -- Optional: enables snapshot + damage tracking
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
    
    -- Inventory bridge: snapshot created at issuance for financial tracking
    snapshot_id BIGINT REFERENCES booking_inventory_snapshots(id),

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
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    action_type VARCHAR(20) CHECK (action_type IN ('issued', 'returned', 'lost', 'void')),
    
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    
    notes TEXT
);

-- =============================================
-- BULK IMPORT SYSTEM
-- =============================================

CREATE TABLE import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    filename VARCHAR(255) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    
    total_rows INT NOT NULL,
    successful_rows INT DEFAULT 0,
    failed_rows INT DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    
    -- Store full results for UI feedback
    -- Array of { index: number, status: 'success' | 'error', error?: string, studentId?: string, bookingId?: string, data: any }
    results JSONB, 
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_import_batches_uploaded_by ON import_batches(uploaded_by);
CREATE INDEX idx_import_batches_uploaded_at ON import_batches(uploaded_at);
-- =============================================
-- GUEST STAYS
-- =============================================

CREATE TABLE guests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    id_number   VARCHAR(100),
    email       VARCHAR(255),
    phone       VARCHAR(50),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE guest_stays (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id         UUID NOT NULL REFERENCES guests(id),
    bed_id           INT  NOT NULL REFERENCES beds(id),

    check_in_date    DATE NOT NULL,
    check_out_date   DATE NOT NULL,
    actual_check_in  TIMESTAMPTZ,
    actual_check_out TIMESTAMPTZ,
    status           guest_stay_status NOT NULL DEFAULT 'confirmed',

    payment_required BOOLEAN      NOT NULL DEFAULT FALSE,
    amount_due       NUMERIC(10,2),
    amount_paid      NUMERIC(10,2) DEFAULT 0,
    currency         VARCHAR(10)   DEFAULT 'TRY',
    payment_notes    TEXT,

    notes            TEXT,
    created_by       UUID NOT NULL REFERENCES users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_guest_stay_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT no_overlapping_guest_stay_for_bed
        EXCLUDE USING GIST (
            bed_id WITH =,
            daterange(check_in_date, check_out_date, '[)') WITH &&
        )
        WHERE (status <> 'cancelled')
);

CREATE INDEX idx_guest_stays_bed    ON guest_stays(bed_id);
CREATE INDEX idx_guest_stays_guest  ON guest_stays(guest_id);
CREATE INDEX idx_guest_stays_active ON guest_stays(status, check_in_date, check_out_date)
    WHERE status IN ('confirmed', 'active');

-- =============================================
-- EXTEND DAMAGE TABLES FOR GUEST ACCOUNTABILITY
-- =============================================

ALTER TABLE damage_reports
    ADD COLUMN IF NOT EXISTS culprit_guest_stay_ids UUID[] DEFAULT '{}';

ALTER TABLE damage_liabilities
    ADD COLUMN IF NOT EXISTS guest_stay_id UUID REFERENCES guest_stays(id) ON DELETE SET NULL;

-- Drop the implicit NOT NULL on student_id so either student or guest can be the liable party
ALTER TABLE damage_liabilities
    ALTER COLUMN student_id DROP NOT NULL;

ALTER TABLE damage_liabilities
    ADD CONSTRAINT chk_liability_culprit CHECK (
        (student_id IS NOT NULL)::int + (guest_stay_id IS NOT NULL)::int = 1
    );

-- =============================================
-- ROOM TYPES (template-level display assets)
-- =============================================

CREATE TABLE room_types (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    description  TEXT,
    gallery_urls TEXT[]       NOT NULL DEFAULT '{}',
    amenities    TEXT[]       NOT NULL DEFAULT '{}',
    -- 1 = Single, 2 = Double, 3 = Triple, 4 = Quad
    capacity     SMALLINT     NOT NULL CHECK (capacity BETWEEN 1 AND 8),
    created_at   TIMESTAMPTZ  DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE locations
    ADD COLUMN IF NOT EXISTS room_type_id INT REFERENCES room_types(id) ON DELETE RESTRICT;

ALTER TABLE locations
    ADD CONSTRAINT room_requires_type
    CHECK (type != 'room' OR room_type_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_locations_room_type_id ON locations (room_type_id);

CREATE TABLE semester_room_pricing (
    semester_id   INT REFERENCES semesters(id)   ON DELETE CASCADE,
    room_type_id  INT REFERENCES room_types(id)  ON DELETE CASCADE,
    price_try     NUMERIC(10,2) NOT NULL,
    price_foreign NUMERIC(10,2),
    PRIMARY KEY (semester_id, room_type_id)
);

-- =============================================
-- ROOM CHANGE REQUESTS
-- =============================================

ALTER TABLE semesters
    ADD COLUMN IF NOT EXISTS max_room_changes INT DEFAULT NULL;

-- Paid room change configuration: requests beyond this count require payment (NULL = always free)
ALTER TABLE semesters
    ADD COLUMN IF NOT EXISTS paid_room_change_after INT DEFAULT NULL;

ALTER TABLE semesters
    ADD COLUMN IF NOT EXISTS room_change_amount_try NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE semesters
    ADD COLUMN IF NOT EXISTS room_change_amount_foreign NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS room_changes_count INT NOT NULL DEFAULT 0;

CREATE TYPE room_change_status_enum AS ENUM ('pending', 'pending_payment', 'approved', 'rejected');

CREATE TABLE room_change_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(id),
    semester_id     INT  NOT NULL REFERENCES semesters(id),

    -- The bed the student wants to move to (NULL = open request, staff assigns at approval)
    requested_bed_id INT REFERENCES beds(id),

    -- Snapshot of the bed they are leaving (set at creation time)
    current_bed_id   INT NOT NULL REFERENCES beds(id),

    status          room_change_status_enum NOT NULL DEFAULT 'pending',
    note            TEXT,

    -- Resolution
    resolved_by     UUID REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Payment fields (set when the request exceeds the free quota)
    requires_payment        BOOLEAN NOT NULL DEFAULT FALSE,
    payment_amount          NUMERIC(10,2),
    payment_currency        CHAR(3),
    is_accounting_approved  BOOLEAN,
    accounting_approved_by  UUID REFERENCES users(id),
    accounting_approved_at  TIMESTAMPTZ,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Only one pending request per booking at a time
    CONSTRAINT uq_one_pending_per_booking
        EXCLUDE USING btree (booking_id WITH =)
        WHERE (status = 'pending')
);

CREATE INDEX idx_room_change_requests_booking   ON room_change_requests(booking_id);
CREATE INDEX idx_room_change_requests_student   ON room_change_requests(student_id);
CREATE INDEX idx_room_change_requests_semester  ON room_change_requests(semester_id);

-- =============================================
-- DAMAGE REPORT IMAGES (Evidence Photos)
-- =============================================

CREATE TABLE damage_report_images (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    damage_report_id UUID         NOT NULL REFERENCES damage_reports(id) ON DELETE CASCADE,
    filename         VARCHAR(255) NOT NULL,
    mime_type        VARCHAR(100) NOT NULL,
    size             INT          NOT NULL,
    storage_key      VARCHAR(500) NOT NULL UNIQUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_damage_report_images_report_id ON damage_report_images(damage_report_id);
CREATE INDEX idx_room_change_requests_status    ON room_change_requests(status);

-- =============================================
-- PRE-RESERVATIONS
-- =============================================

ALTER TABLE semesters
    ADD COLUMN IF NOT EXISTS allow_pre_reservations BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE pre_reservations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id),
    semester_id     INT  NOT NULL REFERENCES semesters(id),

    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,

    -- Optional room type preference (not binding; admin can override)
    room_type_id    INT REFERENCES room_types(id),

    note            TEXT,
    status          pre_reservation_status NOT NULL DEFAULT 'pending',

    -- Filled automatically when admin assigns a bed and a booking is created
    booking_id      UUID REFERENCES bookings(id),

    -- Resolution audit
    resolved_by     UUID REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    rejection_reason TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pre_res_date_order CHECK (end_date > start_date),

    -- One pending pre-reservation per student per semester
    CONSTRAINT uq_one_pending_pre_res_per_student_semester
        EXCLUDE USING btree (student_id WITH =, semester_id WITH =)
        WHERE (status = 'pending')
);

CREATE INDEX idx_pre_reservations_student  ON pre_reservations(student_id);
CREATE INDEX idx_pre_reservations_semester ON pre_reservations(semester_id);
CREATE INDEX idx_pre_reservations_status   ON pre_reservations(status);

CREATE TABLE student_enrollment_verifications (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       UUID         NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    filename         VARCHAR(255) NOT NULL,
    mime_type        VARCHAR(100) NOT NULL,
    size             INT          NOT NULL,
    storage_key      VARCHAR(500) NOT NULL UNIQUE,
    status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    expiry_date      DATE,
    uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    reviewed_at      TIMESTAMPTZ,
    reviewed_by      UUID         REFERENCES users(id)
);

CREATE INDEX idx_enrollment_verifications_student ON student_enrollment_verifications(student_id);

CREATE TABLE student_applications (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Applicant-supplied identity
    student_number       VARCHAR(50)  NOT NULL,
    first_name           VARCHAR(100) NOT NULL,
    last_name            VARCHAR(100) NOT NULL,
    gender               VARCHAR(10)  NOT NULL CHECK (gender IN ('male', 'female')),
    nationality_code     VARCHAR(10)   NOT NULL,
    national_id          VARCHAR(50)  NOT NULL,
    birth_date           DATE         NOT NULL,
    birth_place          VARCHAR(100) NOT NULL,
    department           VARCHAR(200) NOT NULL,
    email                VARCHAR(255),
    phone_number         VARCHAR(50),
    whatsapp_number      VARCHAR(50),
    -- Acceptance letter / student certificate
    document_filename      VARCHAR(255) NOT NULL,
    document_mime_type     VARCHAR(100) NOT NULL,
    document_size          INT          NOT NULL,
    document_storage_key   VARCHAR(500) NOT NULL UNIQUE,
    document_type          VARCHAR(20)  NOT NULL DEFAULT 'freshman'
                                        CHECK (document_type IN ('freshman', 'returning')),
    document_expiry_date   DATE,
    -- Lifecycle
    status               VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason     TEXT,
    submitted_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    reviewed_at          TIMESTAMPTZ,
    reviewed_by          UUID         REFERENCES users(id),
    -- Set on approval
    student_id           UUID         REFERENCES students(id)
);

CREATE INDEX idx_student_applications_status ON student_applications(status);
CREATE UNIQUE INDEX idx_student_applications_student_number_pending
    ON student_applications(student_number)
    WHERE status = 'pending';

-- =============================================
-- DORM CERTIFICATE REQUESTS
-- =============================================

CREATE TABLE dorm_certificate_requests (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                  UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    enrollment_verification_id  UUID        REFERENCES student_enrollment_verifications(id),
    status                      VARCHAR(20) NOT NULL DEFAULT 'pending'
                                            CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason            TEXT,
    certificate_storage_key     VARCHAR(500),
    certificate_filename        VARCHAR(255),
    requested_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at                 TIMESTAMPTZ,
    reviewed_by                 UUID        REFERENCES users(id)
);

CREATE INDEX idx_dorm_cert_requests_student ON dorm_certificate_requests(student_id);
CREATE INDEX idx_dorm_cert_requests_status  ON dorm_certificate_requests(status);
