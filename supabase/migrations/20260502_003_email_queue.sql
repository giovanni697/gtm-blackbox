-- Migration: email_queue
-- Fila de drip de onboarding. Cada user recebe 7 rows ao criar profile.
-- O dispatcher (cron) lê rows com status='queued' e scheduled_for <= NOW().

CREATE TABLE public.email_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (
    email_type IN (
      'drip_d0_welcome',
      'drip_d2_radar',
      'drip_d5_capitulo',
      'personal_giovanni',
      'drip_d9_template',
      'drip_d14_verification',
      'drip_d30_checkpoint'
    )
  ),
  variant TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'sending', 'sent', 'failed', 'cancelled', 'dry_run')
  ),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  resend_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, email_type)
);

CREATE INDEX email_queue_dispatch_idx ON public.email_queue (status, scheduled_for)
WHERE
  status = 'queued';

CREATE INDEX email_queue_user_idx ON public.email_queue (user_id);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own queue" ON public.email_queue FOR
SELECT
  USING (auth.uid () = user_id);

-- service_role bypassa RLS — cron usa service_role key

-- ---------- helpers de uso (read-only, STABLE) ----------
CREATE OR REPLACE FUNCTION public.user_did_diagnostico (uid UUID) RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.diagnosticos WHERE user_id = uid);
$$;

CREATE OR REPLACE FUNCTION public.user_did_forecast (uid UUID) RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.forecast_sessions WHERE user_id = uid);
$$;

CREATE OR REPLACE FUNCTION public.user_gargalo (uid UUID) RETURNS INT LANGUAGE SQL STABLE AS $$
  SELECT gargalo_pilar FROM public.diagnosticos
  WHERE user_id = uid
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- ---------- trigger: ao criar profile, enfileira os 7 emails ----------
CREATE OR REPLACE FUNCTION public.enqueue_full_drip_on_signup () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.email_queue (user_id, email_type, scheduled_for)
  VALUES
    (NEW.id, 'drip_d0_welcome',        NOW() + INTERVAL '5 minutes'),
    (NEW.id, 'drip_d2_radar',          NOW() + INTERVAL '48 hours'),
    (NEW.id, 'drip_d5_capitulo',       NOW() + INTERVAL '120 hours'),
    (NEW.id, 'personal_giovanni',      NOW() + INTERVAL '168 hours'),
    (NEW.id, 'drip_d9_template',       NOW() + INTERVAL '216 hours'),
    (NEW.id, 'drip_d14_verification',  NOW() + INTERVAL '336 hours'),
    (NEW.id, 'drip_d30_checkpoint',    NOW() + INTERVAL '720 hours')
  ON CONFLICT (user_id, email_type) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS init_drip_after_signup ON public.profiles;

CREATE TRIGGER init_drip_after_signup
AFTER INSERT ON public.profiles FOR EACH ROW
EXECUTE FUNCTION public.enqueue_full_drip_on_signup ();
