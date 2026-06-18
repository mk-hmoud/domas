-- =============================================
-- NOTIFICATIONS  (recipient-agnostic)
-- =============================================
-- recipient_type + recipient_id form a polymorphic FK so the same table
-- can serve students, staff, and admins without further schema migrations.
-- Referential integrity is enforced at the application layer.

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 'student' → students.id  |  'user' → users.id  |  ... extensible
    recipient_type  VARCHAR(20)  NOT NULL,
    recipient_id    UUID         NOT NULL,

    -- Content
    type        VARCHAR(60)  NOT NULL,   -- e.g. 'booking_approved', 'checkin_confirmed'
    title       VARCHAR(200) NOT NULL,
    body        TEXT         NOT NULL,
    metadata    JSONB        NOT NULL DEFAULT '{}'::jsonb,

    -- State
    read_at     TIMESTAMPTZ  DEFAULT NULL,

    -- Link back to the undo log entry that can revert this notification.
    -- No FK constraint: audit.undo_log is a partitioned table with a composite PK.
    source_undo_log_id  BIGINT  DEFAULT NULL,

    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_recipient_created ON notifications(recipient_type, recipient_id, created_at DESC);
CREATE INDEX idx_notif_unread            ON notifications(recipient_type, recipient_id) WHERE read_at IS NULL;

-- =============================================
-- ANNOUNCEMENTS
-- =============================================
-- Management posts announcements visible to all students in the portal.
-- Separate from event-driven notifications — this is a bulletin board.

CREATE TABLE announcements (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title        VARCHAR(200) NOT NULL,
    body         TEXT         NOT NULL,

    -- Pinned announcements float to the top of the portal feed
    pinned       BOOLEAN      NOT NULL DEFAULT FALSE,

    -- Lifecycle
    is_published BOOLEAN      NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    expires_at   TIMESTAMPTZ,  -- NULL = never expires

    -- Audit
    created_by   UUID         NOT NULL REFERENCES users(id),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_portal
    ON announcements(is_published, pinned DESC, published_at DESC)
    WHERE is_published = TRUE;

-- =============================================
-- ANNOUNCEMENT ATTACHMENTS
-- =============================================

CREATE TABLE announcement_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID         NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    filename        VARCHAR(255) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
    size            INT          NOT NULL,
    storage_key     VARCHAR(500) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcement_attachments_ann_id
    ON announcement_attachments(announcement_id);

-- =============================================
-- ANNOUNCEMENT TARGETING
-- =============================================
-- Adds optional audience scoping to announcements. 'all' (default) preserves
-- the existing broadcast-to-everyone behavior; 'targeted' restricts visibility
-- to students matching at least one row in announcement_targets.

ALTER TABLE announcements
    ADD COLUMN audience_mode VARCHAR(10) NOT NULL DEFAULT 'all'
        CHECK (audience_mode IN ('all', 'targeted'));

-- One row per targeting criterion selected by the admin. A student matches an
-- announcement if they satisfy ANY row (OR semantics across rows).
CREATE TABLE announcement_targets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,

    target_type     VARCHAR(20) NOT NULL
        CHECK (target_type IN ('student', 'semester', 'location')),

    -- Exactly one of these is set, matching target_type. location_id matches
    -- the targeted node and its entire subtree (building, floor, or room).
    student_id      UUID REFERENCES students(id) ON DELETE CASCADE,
    semester_id     INT  REFERENCES semesters(id) ON DELETE CASCADE,
    location_id     INT  REFERENCES locations(id) ON DELETE CASCADE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_target_shape CHECK (
        (target_type = 'student'  AND student_id  IS NOT NULL AND semester_id IS NULL AND location_id IS NULL) OR
        (target_type = 'semester' AND semester_id IS NOT NULL AND student_id  IS NULL AND location_id IS NULL) OR
        (target_type = 'location' AND location_id IS NOT NULL AND student_id  IS NULL AND semester_id IS NULL)
    )
);

CREATE INDEX idx_ann_targets_announcement ON announcement_targets(announcement_id);
CREATE INDEX idx_ann_targets_student       ON announcement_targets(student_id)  WHERE student_id  IS NOT NULL;
CREATE INDEX idx_ann_targets_semester      ON announcement_targets(semester_id) WHERE semester_id IS NOT NULL;
CREATE INDEX idx_ann_targets_location      ON announcement_targets(location_id) WHERE location_id IS NOT NULL;

-- =============================================
-- MESSAGING (Admin <-> Student support inbox)
-- =============================================
-- One conversation per student. Any admin with messages.manage can see/reply
-- to any conversation — not locked to a single assignee.

CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

    subject         VARCHAR(200),
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'closed')),

    -- Denormalized for fast inbox list sorting/badges; kept in sync in the
    -- same transaction as each message insert.
    last_message_at      TIMESTAMPTZ,
    last_message_preview VARCHAR(200),
    unread_by_admin       BOOLEAN NOT NULL DEFAULT FALSE,  -- student sent the last message, no admin has read it
    unread_by_student      BOOLEAN NOT NULL DEFAULT FALSE, -- admin sent the last message, student hasn't read it

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one OPEN conversation per student at a time (support-inbox model). A
-- partial unique index — not a table-level UNIQUE(student_id, status) — so a
-- student can still have multiple CLOSED conversations in their history.
CREATE UNIQUE INDEX idx_one_open_conversation_per_student
    ON conversations(student_id) WHERE status = 'open';

CREATE INDEX idx_conversations_student      ON conversations(student_id);
CREATE INDEX idx_conversations_unread_admin ON conversations(last_message_at DESC) WHERE unread_by_admin = TRUE;

CREATE TABLE conversation_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Polymorphic sender, mirroring notifications.recipient_type/recipient_id.
    -- 'student' -> students.id | 'user' -> users.id. Referential integrity is
    -- enforced at the application layer.
    sender_type     VARCHAR(10) NOT NULL CHECK (sender_type IN ('student', 'user')),
    sender_id       UUID NOT NULL,

    body            TEXT NOT NULL,
    read_at         TIMESTAMPTZ,  -- read by the OTHER party

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conv_messages_conversation ON conversation_messages(conversation_id, created_at);
