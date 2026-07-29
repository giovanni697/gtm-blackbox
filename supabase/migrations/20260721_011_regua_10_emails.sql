-- Migration: régua_10_emails
-- Substitui o drip de 6 e-mails por uma cadência fixa de 10 e-mails em 30 dias úteis.
-- Os tipos legados (drip_d*) são mantidos no CHECK para preservar o histórico de rows existentes.

-- ── 1. Atualizar CHECK constraint ─────────────────────────────────────────────
ALTER TABLE public.email_queue
  DROP CONSTRAINT IF EXISTS email_queue_email_type_check;

ALTER TABLE public.email_queue
  ADD CONSTRAINT email_queue_email_type_check CHECK (
    email_type IN (
      -- Legado (histórico)
      'drip_d0_welcome',
      'drip_d2_radar',
      'drip_d5_capitulo',
      'personal_giovanni',
      'drip_d9_template',
      'drip_d14_verification',
      'drip_d30_checkpoint',
      -- Régua nova
      'cad_du01_welcome',
      'cad_du03_radar',
      'cad_du05_capitulo',
      'cad_du07_template',
      'cad_du10_forecast',
      'cad_du13_certificacao',
      'cad_du15_checkpoint',
      'cad_du18_giovanni',
      'cad_du22_certificacao',
      'cad_du30_final'
    )
  );

-- ── 2. Função: enfileira N dias úteis a partir de agora ───────────────────────
CREATE OR REPLACE FUNCTION public.nth_business_day(n INT)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result TIMESTAMPTZ := NOW();
  counted INT := 0;
BEGIN
  WHILE counted < n LOOP
    result := result + INTERVAL '1 day';
    -- 0 = domingo, 6 = sábado
    IF EXTRACT(DOW FROM result) NOT IN (0, 6) THEN
      counted := counted + 1;
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- ── 3. Trocar o trigger de signup ─────────────────────────────────────────────
DROP TRIGGER IF EXISTS init_drip_after_signup ON public.profiles;
DROP FUNCTION IF EXISTS public.enqueue_full_drip_on_signup();

CREATE OR REPLACE FUNCTION public.enqueue_10_email_cadence_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.email_queue (user_id, email_type, scheduled_for)
  VALUES
    (NEW.id, 'cad_du01_welcome',      NOW() + INTERVAL '5 minutes'),
    (NEW.id, 'cad_du03_radar',         public.nth_business_day(3)),
    (NEW.id, 'cad_du05_capitulo',      public.nth_business_day(5)),
    (NEW.id, 'cad_du07_template',      public.nth_business_day(7)),
    (NEW.id, 'cad_du10_forecast',      public.nth_business_day(10)),
    (NEW.id, 'cad_du13_certificacao',  public.nth_business_day(13)),
    (NEW.id, 'cad_du15_checkpoint',    public.nth_business_day(15)),
    (NEW.id, 'cad_du18_giovanni',      public.nth_business_day(18)),
    (NEW.id, 'cad_du22_certificacao',  public.nth_business_day(22)),
    (NEW.id, 'cad_du30_final',         public.nth_business_day(30))
  ON CONFLICT (user_id, email_type) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER init_cadence_after_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_10_email_cadence_on_signup();

-- ── 4. Suspender e-mails legados dos usuários atuais (Opção B) ───────────────
-- Cancela todos os e-mails drip ainda na fila. Usuários atuais NÃO entram
-- na nova régua — apenas novos signups recebem a cadência de 10 e-mails.
-- Rodar MANUALMENTE no Supabase Dashboard > SQL Editor após aplicar a migration:
--
-- UPDATE public.email_queue
-- SET status = 'cancelled'
-- WHERE status = 'queued'
--   AND email_type IN (
--     'drip_d0_welcome', 'drip_d2_radar', 'drip_d5_capitulo',
--     'personal_giovanni', 'drip_d9_template',
--     'drip_d14_verification', 'drip_d30_checkpoint'
--   );
