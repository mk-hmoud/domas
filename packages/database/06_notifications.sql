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
    data            BYTEA        NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcement_attachments_ann_id
    ON announcement_attachments(announcement_id);
