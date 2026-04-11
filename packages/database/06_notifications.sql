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

    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_recipient_created ON notifications(recipient_type, recipient_id, created_at DESC);
CREATE INDEX idx_notif_unread            ON notifications(recipient_type, recipient_id) WHERE read_at IS NULL;
