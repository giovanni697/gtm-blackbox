-- Migration: email_opt_out
-- Adiciona flag persistente de descadastro na tabela profiles.
-- Quando TRUE, o usuário não recebe nenhum e-mail de marketing
-- (drip queue já é cancelada pelo unsubscribeEmails; weekly dispatch filtra pela coluna).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_opted_out BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS profiles_opted_out_idx
  ON public.profiles (email_opted_out)
  WHERE email_opted_out = TRUE;

-- Para remover miguel.vieira@v4company.com dos e-mails:
-- 1. Descobre o user_id pelo e-mail na tabela auth.users
-- 2. Cancela a fila de drip
-- 3. Marca o perfil como opted_out para não receber e-mails futuros

-- Para remover um usuário manualmente, rodar no SQL Editor do Supabase Dashboard:
-- (substituir '<email>' pelo endereço desejado)
--
-- UPDATE public.email_queue eq
-- SET status = 'cancelled'
-- FROM auth.users u
-- WHERE u.email = '<email>'
--   AND eq.user_id = u.id
--   AND eq.status = 'queued';
--
-- UPDATE public.profiles p
-- SET email_opted_out = TRUE
-- FROM auth.users u
-- WHERE u.email = '<email>'
--   AND p.id = u.id;
