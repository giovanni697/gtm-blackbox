/**
 * One-shot migration runner — accessible only to giovanni@scient.cc.
 * Creates the manual_emails table if it doesn't exist.
 * Safe to call multiple times (uses IF NOT EXISTS).
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS manual_emails (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id     TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  to_email        TEXT NOT NULL,
  to_name         TEXT NOT NULL,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subject         TEXT NOT NULL,
  body_html       TEXT NOT NULL,
  campaign        TEXT NOT NULL DEFAULT 'manual',
  scheduled_for   TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'scheduled',
  sent_at         TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ,
  clicked_at      TIMESTAMPTZ,
  feedback_text   TEXT,
  feedback_at     TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'manual_emails' AND policyname = 'service_only'
  ) THEN
    ALTER TABLE manual_emails ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS manual_emails_status_idx    ON manual_emails (status, scheduled_for);
CREATE INDEX IF NOT EXISTS manual_emails_tracking_idx  ON manual_emails (tracking_id);
CREATE INDEX IF NOT EXISTS manual_emails_campaign_idx  ON manual_emails (campaign);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_manual_emails_updated_at'
  ) THEN
    CREATE TRIGGER set_manual_emails_updated_at
      BEFORE UPDATE ON manual_emails
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
`

export async function POST() {
  const auth = createClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (user?.email !== 'giovanni@scient.cc') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb = createServiceClient()
  const { error } = await sb.rpc('exec_migration', { sql: MIGRATION_SQL }).maybeSingle()

  // exec_migration RPC may not exist — fall back to raw query via pg extension if available
  if (error) {
    // try pg_net or direct — inform user to run manually
    return NextResponse.json(
      {
        error: 'auto_migration_unavailable',
        message: 'Rode o SQL abaixo no Supabase Dashboard → SQL Editor',
        sql: MIGRATION_SQL,
      },
      { status: 422 },
    )
  }

  return NextResponse.json({ ok: true })
}
