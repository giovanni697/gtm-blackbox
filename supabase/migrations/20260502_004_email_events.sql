-- Migration: email_events
-- Recebe eventos do webhook Resend (sent, delivered, bounced, complained, etc.).
-- Usado pela página /admin/email-health para observabilidade.

CREATE TABLE public.email_events (
  id BIGSERIAL PRIMARY KEY,
  resend_message_id TEXT NOT NULL,
  email_queue_id BIGINT REFERENCES public.email_queue (id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'email.sent',
      'email.delivered',
      'email.delivery_delayed',
      'email.bounced',
      'email.complained',
      'email.opened',
      'email.clicked',
      'email.failed'
    )
  ),
  to_email TEXT NOT NULL,
  bounce_type TEXT,
  complaint_type TEXT,
  subject TEXT,
  raw JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX email_events_message_idx ON public.email_events (resend_message_id);

CREATE INDEX email_events_user_idx ON public.email_events (user_id);

CREATE INDEX email_events_type_idx ON public.email_events (event_type, created_at DESC);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Apenas service_role acessa (webhook + admin page usam service_role server-side)
CREATE POLICY "no client access" ON public.email_events FOR
SELECT
  USING (false);

-- Função helper para contagem de eventos (usada em /admin/email-health)
CREATE OR REPLACE FUNCTION public.email_event_counts (since_ts TIMESTAMPTZ) RETURNS TABLE (event_type TEXT, count BIGINT) LANGUAGE SQL STABLE AS $$
  SELECT event_type, COUNT(*)::BIGINT
  FROM public.email_events
  WHERE created_at >= since_ts
  GROUP BY event_type;
$$;
