-- manual_emails: one-off personalized emails with per-recipient tracking
CREATE TABLE manual_emails (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id     TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  to_email        TEXT NOT NULL,
  to_name         TEXT NOT NULL,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subject         TEXT NOT NULL,
  body_html       TEXT NOT NULL,
  campaign        TEXT NOT NULL DEFAULT 'manual',    -- group label
  scheduled_for   TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | sent | failed
  sent_at         TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ,
  clicked_at      TIMESTAMPTZ,
  feedback_text   TEXT,
  feedback_at     TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE manual_emails ENABLE ROW LEVEL SECURITY;
-- only service role can access (admin pages use service client)

CREATE INDEX ON manual_emails (status, scheduled_for);
CREATE INDEX ON manual_emails (campaign);
CREATE INDEX ON manual_emails (tracking_id);

CREATE TRIGGER set_manual_emails_updated_at
  BEFORE UPDATE ON manual_emails
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
