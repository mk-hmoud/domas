-- =============================================
-- STUDENT NOTIFICATIONS
-- =============================================

CREATE TABLE student_notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

    -- Content
    type        VARCHAR(60)  NOT NULL,   -- e.g. 'booking_approved', 'checkin_confirmed'
    title       VARCHAR(200) NOT NULL,
    body        TEXT         NOT NULL,
    metadata    JSONB        NOT NULL DEFAULT '{}'::jsonb,  -- bookingId, semesterName, etc.

    -- State
    read_at     TIMESTAMPTZ  DEFAULT NULL,

    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_student_created ON student_notifications(student_id, created_at DESC);
CREATE INDEX idx_notif_unread          ON student_notifications(student_id) WHERE read_at IS NULL;
