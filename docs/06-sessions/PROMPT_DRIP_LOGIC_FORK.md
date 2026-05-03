# PROMPT-FORK — Infraestrutura de drip: lógica condicional + fila assíncrona + email pessoal Giovanni + testes

## ESTE DOCUMENTO É UM FORK

- **Documento pai:** `PROMPT_AUTH_ONBOARDING.md` (mesmo diretório raiz do projeto)
- **Escopo deste fork:** implementar SOMENTE a infraestrutura técnica do drip de onboarding. NÃO cuida de:
  - Validação de work email (fica no pai)
  - Migração de users (fica no pai)
  - Customização de templates Supabase Auth (fica no pai)
  - Conteúdo/copy dos emails (fica em fork separado, ainda não criado)
- **Pré-requisito:** features 1-3 do prompt pai já implementadas e em produção. Conta Resend criada, domínio `mail.scient.cc` (subdomain) verificado, `RESEND_API_KEY` em prod.

## CONTEXTO MÍNIMO PARA AGENT QUE NUNCA VIU O PROJETO

- **GTM BlackBox** — plataforma freemium open-source da SCIENT
- **Stack:** Next.js 14.2.35 (App Router) + Supabase (Auth + Postgres) + Vercel
- **Diretório local:** `/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/`
- **Repo:** github.com/giovanni697/gtm-blackbox
- **Provider transacional:** Resend
- **From de TODOS os emails:** `Giovanni Salvador <giovanni@mail.scient.cc>` (subdomain `mail.scient.cc` verificado no Resend — Giovanni preferiu manter caixa única para replies; o subdomain foi necessário porque o domain root `scient.cc` está reservado em outro account Resend).
  - **Trick:** o user vê From ligeiramente diferente (`@mail.scient.cc`), mas o **Reply-To é `giovanni@scient.cc`** — quando ele clica Reply, cai direto na caixa pessoal de Giovanni no Google Workspace.
  - Display name uniforme em todos os fluxos (Supabase Auth, drip SCIENT D0-D30, email pessoal D7, migration notice): `Giovanni Salvador <giovanni@mail.scient.cc>`
- **Reply-To em todos:** `giovanni@scient.cc` (caixa pessoal real, no Google Workspace)
- **Cron infra:** Vercel Cron Jobs (configurado em `vercel.json`)
- **Tom de voz:** ao escrever copy, sempre invocar a skill `marketing:email-sequence` que carrega o tom de voz do Giovanni Salvador / SCIENT

## ESCOPO DESTE FORK (4 ENTREGAS)

### Entrega 1: Fila assíncrona (`email_queue`)

Tabela + cron dispatcher + retry logic + observabilidade.

### Entrega 2: Decisores condicionais

Funções que rodam ANTES de cada email ser gerado, escolhem variant + populam payload.

### Entrega 3: Email pessoal Giovanni

Plain text gerado dinamicamente, 5 variants baseadas em uso, sai do email pessoal dele.

### Entrega 4: Plano de testes

5 user states canônicos + dry-run mode + preview env + smoke test pre-launch.

### Entrega 5: Webhook de eventos (bounce/complaint sem caixa nova)

Resend webhook → tabela `email_events` → página `/admin/email-health` (gated pelo user Giovanni). Zero inbox novo. Hard bounces auto-suprimidos pelo Resend. Visibilidade dentro do app.

## SEQUÊNCIA DE EMAILS (ESCOPO COMPLETO)

| #   | Tipo                    | Dia            | Variant logic                                                                  | Tom                     |
| --- | ----------------------- | -------------- | ------------------------------------------------------------------------------ | ----------------------- |
| 1   | `drip_d0_welcome`       | D0 + 5min      | Linear (1 variant)                                                             | Drip formal SCIENT      |
| 2   | `drip_d2_radar`         | D0 + 48h       | 2 variants: `fez_diagnostico` / `nao_fez`                                      | Drip formal SCIENT      |
| 3   | `drip_d5_capitulo`      | D0 + 120h      | 6 variants: `cap_p1` / `cap_p2` / `cap_p3` / `cap_p4` / `cap_p5` / `nao_fez`   | Drip formal SCIENT      |
| 4   | `personal_giovanni`     | D0 + 168h (D7) | 5 variants: `fez_tudo` / `so_diag` / `so_template` / `so_ebook` / `zero_ativo` | **Plain text Giovanni** |
| 5   | `drip_d9_template`      | D0 + 216h      | 6 variants: `tpl_p1` / `tpl_p2` / `tpl_p3` / `tpl_p4` / `tpl_p5` / `nao_fez`   | Drip formal SCIENT      |
| 6   | `drip_d14_verification` | D0 + 336h      | Linear (1 variant)                                                             | Drip formal SCIENT      |
| 7   | `drip_d30_checkpoint`   | D0 + 720h      | Linear (1 variant)                                                             | Drip formal SCIENT      |

## ARQUITETURA TÉCNICA

### Tabelas

```sql
-- supabase/migrations/20260502_003_email_queue.sql

-- ---------- email_queue (fila principal) ----------
CREATE TABLE public.email_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN (
    'drip_d0_welcome',
    'drip_d2_radar',
    'drip_d5_capitulo',
    'personal_giovanni',
    'drip_d9_template',
    'drip_d14_verification',
    'drip_d30_checkpoint'
  )),
  variant TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','failed','cancelled','dry_run')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  resend_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, email_type)
);

CREATE INDEX email_queue_dispatch_idx
  ON public.email_queue (status, scheduled_for)
  WHERE status = 'queued';

CREATE INDEX email_queue_user_idx
  ON public.email_queue (user_id);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own queue" ON public.email_queue
  FOR SELECT USING (auth.uid() = user_id);

-- service_role bypassa RLS, então cron consegue ler/escrever sem problema

-- ---------- helpers de uso (read-only, STABLE) ----------
CREATE OR REPLACE FUNCTION public.user_did_diagnostico(uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.diagnosticos WHERE user_id = uid);
$$;

CREATE OR REPLACE FUNCTION public.user_did_forecast(uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.forecast_sessions WHERE user_id = uid);
$$;

CREATE OR REPLACE FUNCTION public.user_gargalo(uid UUID)
RETURNS INT LANGUAGE SQL STABLE AS $$
  SELECT gargalo FROM public.diagnosticos
  WHERE user_id = uid
  ORDER BY created_at DESC LIMIT 1;
$$;

-- ---------- trigger: ao criar profile, enfileirar D0 + agendar próximos ----------
CREATE OR REPLACE FUNCTION public.enqueue_full_drip_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- D0 welcome (linear, fixo)
  INSERT INTO public.email_queue (user_id, email_type, scheduled_for)
  VALUES (NEW.id, 'drip_d0_welcome', NOW() + INTERVAL '5 minutes')
  ON CONFLICT (user_id, email_type) DO NOTHING;

  -- D2 radar (variant decidida na hora do disparo)
  INSERT INTO public.email_queue (user_id, email_type, scheduled_for)
  VALUES (NEW.id, 'drip_d2_radar', NOW() + INTERVAL '48 hours')
  ON CONFLICT (user_id, email_type) DO NOTHING;

  -- D5 capítulo
  INSERT INTO public.email_queue (user_id, email_type, scheduled_for)
  VALUES (NEW.id, 'drip_d5_capitulo', NOW() + INTERVAL '120 hours')
  ON CONFLICT (user_id, email_type) DO NOTHING;

  -- D7 pessoal Giovanni
  INSERT INTO public.email_queue (user_id, email_type, scheduled_for)
  VALUES (NEW.id, 'personal_giovanni', NOW() + INTERVAL '168 hours')
  ON CONFLICT (user_id, email_type) DO NOTHING;

  -- D9 template
  INSERT INTO public.email_queue (user_id, email_type, scheduled_for)
  VALUES (NEW.id, 'drip_d9_template', NOW() + INTERVAL '216 hours')
  ON CONFLICT (user_id, email_type) DO NOTHING;

  -- D14 verification
  INSERT INTO public.email_queue (user_id, email_type, scheduled_for)
  VALUES (NEW.id, 'drip_d14_verification', NOW() + INTERVAL '336 hours')
  ON CONFLICT (user_id, email_type) DO NOTHING;

  -- D30 checkpoint
  INSERT INTO public.email_queue (user_id, email_type, scheduled_for)
  VALUES (NEW.id, 'drip_d30_checkpoint', NOW() + INTERVAL '720 hours')
  ON CONFLICT (user_id, email_type) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS init_drip_after_signup ON public.profiles;
CREATE TRIGGER init_drip_after_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_full_drip_on_signup();
```

### Componentes TypeScript

#### `src/lib/email/types.ts`

```ts
export type EmailType =
  | 'drip_d0_welcome'
  | 'drip_d2_radar'
  | 'drip_d5_capitulo'
  | 'personal_giovanni'
  | 'drip_d9_template'
  | 'drip_d14_verification'
  | 'drip_d30_checkpoint'

export type EmailStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'cancelled' | 'dry_run'

export interface QueuedEmail {
  id: number
  user_id: string
  email_type: EmailType
  variant: string | null
  payload: Record<string, unknown>
  scheduled_for: string
  status: EmailStatus
  attempts: number
  max_attempts: number
  last_error: string | null
  sent_at: string | null
  resend_message_id: string | null
}

export interface UserUsage {
  userId: string
  email: string
  nome: string
  didDiagnostico: boolean
  didForecast: boolean
  openedTemplates: string[]
  readChapters: number
  gargalo: 1 | 2 | 3 | 4 | 5 | null
}

export interface RenderedEmail {
  subject: string
  html?: string
  text?: string
  from: string
  replyTo?: string
}
```

#### `src/lib/email/usage-fetcher.ts`

```ts
import { createServiceClient } from '@/lib/supabase/service'
import type { UserUsage } from './types'

export async function fetchUserUsage(userId: string): Promise<UserUsage | null> {
  const sb = createServiceClient()

  const [{ data: profile }, { data: diag }, { data: forecast }] = await Promise.all([
    sb.from('profiles').select('id, nome').eq('id', userId).single(),
    sb
      .from('diagnosticos')
      .select('gargalo')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb.from('forecast_sessions').select('id').eq('user_id', userId).limit(1).maybeSingle(),
  ])

  const { data: authUser } = await sb.auth.admin.getUserById(userId)
  if (!profile || !authUser?.user) return null

  // openedTemplates e readChapters precisam de telemetria que não temos hoje.
  // Por ora retorne arrays/zero. Adicionar telemetria é fora-de-escopo deste fork.
  return {
    userId,
    email: authUser.user.email ?? '',
    nome: profile.nome,
    didDiagnostico: !!diag,
    didForecast: !!forecast,
    openedTemplates: [],
    readChapters: 0,
    gargalo: (diag?.gargalo ?? null) as UserUsage['gargalo'],
  }
}
```

#### `src/lib/email/decisores.ts`

```ts
import type { EmailType, UserUsage } from './types'

export interface Decision {
  variant: string
  payload: Record<string, unknown>
}

const PILAR_NAMES: Record<number, string> = {
  1: 'Arquitetura de Dados',
  2: 'Metodologia Unificada',
  3: 'Processos Padronizados',
  4: 'Stack Parametrizada',
  5: 'Loop de Melhoria Contínua',
}

const PILAR_TO_CHAPTER: Record<number, string> = {
  1: '03-pilar-1-arquitetura-de-dados',
  2: '04-pilar-2-metodologia-unificada',
  3: '05-pilar-3-processos-padronizados',
  4: '06-pilar-4-stack-parametrizada',
  5: '07-pilar-5-loop-de-melhoria-continua',
}

const PILAR_TO_TEMPLATE: Record<number, string> = {
  1: '01-arquitetura-de-dados',
  2: '02-workflow-de-gtm',
  3: '04-roadmap-de-gtm',
  4: '08-parametrizacao-de-stack',
  5: '06-identificacao-de-gargalos',
}

export function decideEmail(type: EmailType, usage: UserUsage): Decision {
  switch (type) {
    case 'drip_d0_welcome':
      return { variant: 'default', payload: { nome: usage.nome } }

    case 'drip_d2_radar':
      if (usage.didDiagnostico && usage.gargalo) {
        return {
          variant: 'fez_diagnostico',
          payload: {
            nome: usage.nome,
            gargaloPilar: usage.gargalo,
            gargaloNome: PILAR_NAMES[usage.gargalo],
          },
        }
      }
      return { variant: 'nao_fez', payload: { nome: usage.nome } }

    case 'drip_d5_capitulo':
      if (usage.didDiagnostico && usage.gargalo) {
        return {
          variant: `cap_p${usage.gargalo}`,
          payload: {
            nome: usage.nome,
            chapterSlug: PILAR_TO_CHAPTER[usage.gargalo],
            pilarNome: PILAR_NAMES[usage.gargalo],
          },
        }
      }
      return {
        variant: 'nao_fez',
        payload: { nome: usage.nome, chapterSlug: '01-principios-edson-rigonatti' },
      }

    case 'personal_giovanni': {
      const matrix = pickGiovanniVariant(usage)
      return matrix
    }

    case 'drip_d9_template':
      if (usage.didDiagnostico && usage.gargalo) {
        return {
          variant: `tpl_p${usage.gargalo}`,
          payload: {
            nome: usage.nome,
            templateSlug: PILAR_TO_TEMPLATE[usage.gargalo],
            pilarNome: PILAR_NAMES[usage.gargalo],
          },
        }
      }
      return {
        variant: 'nao_fez',
        payload: { nome: usage.nome, templateSlug: '01-arquitetura-de-dados' },
      }

    case 'drip_d14_verification':
      return { variant: 'default', payload: { nome: usage.nome, didForecast: usage.didForecast } }

    case 'drip_d30_checkpoint':
      return {
        variant: 'default',
        payload: {
          nome: usage.nome,
          didDiagnostico: usage.didDiagnostico,
          didForecast: usage.didForecast,
          gargalo: usage.gargalo,
        },
      }
  }
}

function pickGiovanniVariant(usage: UserUsage): Decision {
  const { didDiagnostico, didForecast, openedTemplates, readChapters } = usage

  if (didDiagnostico && didForecast) {
    return { variant: 'fez_tudo', payload: { nome: usage.nome, gargaloPilar: usage.gargalo } }
  }
  if (didDiagnostico) {
    return { variant: 'so_diag', payload: { nome: usage.nome, gargaloPilar: usage.gargalo } }
  }
  if (openedTemplates.length > 0) {
    return { variant: 'so_template', payload: { nome: usage.nome } }
  }
  if (readChapters > 0) {
    return { variant: 'so_ebook', payload: { nome: usage.nome, readChapters } }
  }
  return { variant: 'zero_ativo', payload: { nome: usage.nome } }
}
```

#### `src/lib/email/giovanni-email-renderer.ts`

```ts
// Plain text. SEM HTML. SEM markdown. Apenas string.
// O tom é casual, lowercase, frase curta.
// Quando for escrever os bodies, INVOCAR a skill `marketing:email-sequence`
// para garantir aderência ao tom Giovanni.

import type { Decision, RenderedEmail } from './types'

const PILAR_NAMES: Record<number, string> = {
  1: 'arquitetura de dados',
  2: 'metodologia unificada',
  3: 'processos padronizados',
  4: 'stack parametrizada',
  5: 'loop de melhoria',
}

export function renderGiovanniEmail(decision: Decision): RenderedEmail {
  const firstName = String(decision.payload.nome).split(' ')[0].toLowerCase()
  const subject = pickSubject(decision.variant)

  let body = `oi ${firstName},\n\n`

  switch (decision.variant) {
    case 'fez_tudo':
      body += `vi que você fez o diagnóstico (gargalo em ${PILAR_NAMES[decision.payload.gargaloPilar as number] || 'pilar não identificado'}) e o forecast.\n\nqueria entender duas coisas — o roadmap fez sentido pro seu trimestre? e o capacity verdict, bateu com sua percepção do time atual?`
      break
    case 'so_diag':
      body += `vi que você fez o diagnóstico (gargalo em ${PILAR_NAMES[decision.payload.gargaloPilar as number] || 'pilar não identificado'}).\n\nantes de você implementar — o radar bateu com sua percepção do negócio? algum pilar que ficou sub ou sobre estimado?`
      break
    case 'so_template':
      body += `vi que você abriu um dos templates antes de rodar o diagnóstico.\n\nfaz sentido pro seu momento ou está só explorando? se quiser, me conta em 2-3 linhas onde está hoje (faturamento, time, motion principal) e te aponto por onde começar.`
      break
    case 'so_ebook':
      body += `vi que você leu ${decision.payload.readChapters} ${(decision.payload.readChapters as number) === 1 ? 'capítulo' : 'capítulos'} do ebook mas não rodou o diagnóstico ainda.\n\ntem algum tema específico que ressoou? ou ainda está mapeando o que serve pro seu momento?`
      break
    case 'zero_ativo':
      body += `vi que você se cadastrou faz uma semana mas ainda não rodou nenhum módulo.\n\nqueria entender se tem algum bloqueio — falta tempo, achou que ia ser outra coisa, ou só não foi prioridade ainda?`
      break
  }

  body +=
    '\n\nresponde aqui mesmo, eu leio.\n\ngiovanni\nCEO @ SCIENT\nlinkedin.com/in/giovannibsalvador'

  return {
    subject,
    text: body,
    from: 'Giovanni Salvador <giovanni@mail.scient.cc>',
    replyTo: 'giovanni@scient.cc',
  }
}

function pickSubject(variant: string): string {
  const map: Record<string, string> = {
    fez_tudo: 'fez sentido?',
    so_diag: 'rapidinho sobre seu radar',
    so_template: 'antes de implementar',
    so_ebook: 'qual capítulo bateu?',
    zero_ativo: 'tudo bem por aí?',
  }
  return map[variant] ?? 'rapidinho'
}
```

#### `src/lib/email/scient-email-renderer.ts`

```ts
// Renderer dos emails formais com identidade SCIENT.
// Os HTMLs vivem em content/emails/onboarding/ como MDX (frontmatter + body).
// Aplica template HTML SCIENT com variáveis substituídas.

import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import type { Decision, EmailType, RenderedEmail } from './types'

const EMAILS_DIR = path.join(process.cwd(), 'content', 'emails', 'onboarding')

const SCIENT_HTML_SHELL = (subject: string, bodyHtml: string, ctaText: string, ctaUrl: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Sora,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:48px 24px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#585858;">SCIENT · GTM BlackBox</p>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:28px;font-weight:300;line-height:1.2;color:#111111;">${escapeHtml(subject)}</h1>
        </td></tr>
        <tr><td style="padding-bottom:32px;font-size:14px;line-height:1.6;color:#111111;">${bodyHtml}</td></tr>
        <tr><td style="padding-bottom:32px;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#0030E8;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:13px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">${escapeHtml(ctaText)}</a>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:13px;line-height:1.5;color:#111111;">Giovanni Salvador<br><span style="color:#585858;">CEO @ SCIENT</span></p>
          <p style="margin:6px 0 0;font-size:12px;color:#585858;">
            <a href="https://linkedin.com/in/giovannibsalvador" style="color:#0030E8;text-decoration:none;">linkedin.com/in/giovannibsalvador</a>
          </p>
        </td></tr>
        <tr><td style="border-top:1px solid #E6E6E6;padding-top:24px;">
          <p style="margin:0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#585858;">Scientific AI Native GTM</p>
          <p style="margin:8px 0 0;font-size:10px;color:#585858;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/email-preferences" style="color:#585858;">não quero mais receber</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function renderScientEmail(
  type: EmailType,
  decision: Decision,
): Promise<RenderedEmail> {
  const filename = `${type}__${decision.variant}.mdx`
  const filepath = path.join(EMAILS_DIR, filename)

  let raw: string
  try {
    raw = await fs.readFile(filepath, 'utf-8')
  } catch {
    // fallback para variant default se específica não existir
    const fallback = path.join(EMAILS_DIR, `${type}__default.mdx`)
    raw = await fs.readFile(fallback, 'utf-8')
  }

  const parsed = matter(raw)
  const { subject, ctaText, ctaUrl } = parsed.data as {
    subject: string
    ctaText: string
    ctaUrl: string
  }

  // Substituir placeholders {{nome}}, {{gargaloNome}}, etc. no body MDX
  let bodyHtml = parsed.content
  for (const [key, value] of Object.entries(decision.payload)) {
    bodyHtml = bodyHtml.replaceAll(`{{${key}}}`, String(value ?? ''))
  }
  // Converter parágrafos simples em <p>
  bodyHtml = bodyHtml
    .trim()
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  // Substituir placeholders no subject e CTA url
  let finalSubject = subject
  let finalCtaUrl = ctaUrl
  for (const [key, value] of Object.entries(decision.payload)) {
    finalSubject = finalSubject.replaceAll(`{{${key}}}`, String(value ?? ''))
    finalCtaUrl = finalCtaUrl.replaceAll(`{{${key}}}`, String(value ?? ''))
  }

  return {
    subject: finalSubject,
    html: SCIENT_HTML_SHELL(finalSubject, bodyHtml, ctaText, finalCtaUrl),
    from: 'Giovanni Salvador <giovanni@mail.scient.cc>',
    replyTo: 'giovanni@scient.cc',
  }
}
```

#### `src/app/api/cron/email-dispatcher/route.ts`

```ts
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchUserUsage } from '@/lib/email/usage-fetcher'
import { decideEmail } from '@/lib/email/decisores'
import { renderScientEmail } from '@/lib/email/scient-email-renderer'
import { renderGiovanniEmail } from '@/lib/email/giovanni-email-renderer'
import type { QueuedEmail } from '@/lib/email/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  // Auth: só Vercel Cron pode chamar
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const sb = createServiceClient()
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const dryRun = process.env.DRIP_DRY_RUN === 'true'

  // Pega até 50 emails para enviar
  const { data: emails, error } = await sb
    .from('email_queue')
    .select('*')
    .eq('status', 'queued')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(50)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const results: { id: number; status: string; error?: string }[] = []

  for (const email of (emails ?? []) as QueuedEmail[]) {
    // Marca como sending para evitar duplo envio se o cron rodar em paralelo
    await sb
      .from('email_queue')
      .update({ status: 'sending' })
      .eq('id', email.id)
      .eq('status', 'queued')

    try {
      const usage = await fetchUserUsage(email.user_id)
      if (!usage) throw new Error('user not found')

      const decision = decideEmail(email.email_type, usage)

      const rendered =
        email.email_type === 'personal_giovanni'
          ? renderGiovanniEmail(decision)
          : await renderScientEmail(email.email_type, decision)

      if (dryRun) {
        await sb
          .from('email_queue')
          .update({
            status: 'dry_run',
            variant: decision.variant,
            payload: decision.payload,
            sent_at: new Date().toISOString(),
            last_error: `DRY RUN — would send to ${usage.email} from ${rendered.from} subj="${rendered.subject}"`,
          })
          .eq('id', email.id)
        results.push({ id: email.id, status: 'dry_run' })
        continue
      }

      const sendRes = await resend.emails.send({
        from: rendered.from,
        to: usage.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        replyTo: rendered.replyTo,
      })

      if (sendRes.error) throw new Error(sendRes.error.message)

      await sb
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          variant: decision.variant,
          payload: decision.payload,
          resend_message_id: sendRes.data?.id ?? null,
        })
        .eq('id', email.id)

      results.push({ id: email.id, status: 'sent' })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const newAttempts = email.attempts + 1
      const finalStatus = newAttempts >= email.max_attempts ? 'failed' : 'queued'
      const nextSchedule =
        finalStatus === 'queued'
          ? new Date(Date.now() + 30 * 60 * 1000).toISOString() // retry em 30min
          : email.scheduled_for

      await sb
        .from('email_queue')
        .update({
          status: finalStatus,
          attempts: newAttempts,
          last_error: message,
          scheduled_for: nextSchedule,
        })
        .eq('id', email.id)

      results.push({ id: email.id, status: finalStatus, error: message })
    }
  }

  return Response.json({ processed: results.length, results })
}
```

#### `src/lib/supabase/service.ts`

```ts
import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
```

### `vercel.json`

```json
{
  "crons": [{ "path": "/api/cron/email-dispatcher", "schedule": "*/15 * * * *" }]
}
```

Roda a cada 15 minutos. Plano Hobby do Vercel permite até 2 cron jobs com schedule >= 1 hora; **nesse caso usar `0 * * * *` (a cada hora)** ou upgradar pro plano Pro. Confirmar com Giovanni.

### Variáveis de ambiente novas

```
RESEND_API_KEY=re_...
RESEND_WEBHOOK_SECRET=whsec_...   # do Resend Dashboard → Webhooks
CRON_SECRET=<gerar com openssl rand -hex 32>
DRIP_DRY_RUN=false                # true em preview/staging
```

## ESTRUTURA DE ARQUIVOS

```
src/
├── app/api/cron/email-dispatcher/route.ts   ← NOVO
├── lib/
│   ├── email/
│   │   ├── types.ts                         ← NOVO
│   │   ├── usage-fetcher.ts                 ← NOVO
│   │   ├── decisores.ts                     ← NOVO
│   │   ├── scient-email-renderer.ts         ← NOVO
│   │   └── giovanni-email-renderer.ts       ← NOVO
│   └── supabase/
│       └── service.ts                       ← NOVO
content/
└── emails/
    └── onboarding/                          ← NOVO (corpos serão escritos em outro fork)
        ├── drip_d0_welcome__default.mdx     (placeholder com TODO)
        ├── drip_d2_radar__fez_diagnostico.mdx
        ├── drip_d2_radar__nao_fez.mdx
        ├── drip_d5_capitulo__cap_p1.mdx     ... cap_p5.mdx + nao_fez.mdx
        ├── drip_d9_template__tpl_p1.mdx     ... tpl_p5.mdx + nao_fez.mdx
        ├── drip_d14_verification__default.mdx
        └── drip_d30_checkpoint__default.mdx
supabase/migrations/
├── 20260502_003_email_queue.sql             ← NOVO
└── 20260502_004_email_events.sql            ← NOVO (webhook events)
vercel.json                                  ← NOVO

src/app/api/webhooks/resend/route.ts         ← NOVO (entrega 5)
src/app/(app)/admin/email-health/page.tsx    ← NOVO (entrega 5, gated por user_id)
src/lib/email/admin-guard.ts                 ← NOVO (entrega 5)
```

## ENTREGA 5 — WEBHOOK + EMAIL HEALTH ADMIN (sem caixa nova)

### Por que webhook em vez de caixa de bounces

Giovanni decidiu: TODOS os emails saem de `giovanni@mail.scient.cc` (Reply-To `giovanni@scient.cc`). Para não poluir a caixa pessoal com bounces/complaints e ainda ter visibilidade de saúde do envio:

- **Resend Webhooks** disparam em cada evento: `email.sent`, `email.delivered`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`
- Endpoint nosso recebe, valida assinatura HMAC, salva em `email_events`
- Página `/admin/email-health` (gated apenas para `user_id` do Giovanni) mostra dashboard
- Resend automaticamente suprime hard bounces (não envia mais para esse endereço, sem precisar de lógica nossa)
- **Zero caixas novas**, zero filtros de Gmail, tudo dentro do app

### Migration `20260502_004_email_events.sql`

```sql
CREATE TABLE public.email_events (
  id BIGSERIAL PRIMARY KEY,
  resend_message_id TEXT NOT NULL,
  email_queue_id BIGINT REFERENCES public.email_queue(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'email.sent','email.delivered','email.delivery_delayed',
    'email.bounced','email.complained','email.opened','email.clicked','email.failed'
  )),
  to_email TEXT NOT NULL,
  bounce_type TEXT,         -- hard | soft | undetermined
  complaint_type TEXT,      -- abuse | fraud | etc.
  subject TEXT,
  raw JSONB NOT NULL,       -- payload original do Resend para debug
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX email_events_message_idx ON public.email_events (resend_message_id);
CREATE INDEX email_events_user_idx    ON public.email_events (user_id);
CREATE INDEX email_events_type_idx    ON public.email_events (event_type, created_at DESC);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
-- só service_role acessa via webhook; admin page usa service-role server-side
CREATE POLICY "no client access" ON public.email_events FOR SELECT USING (false);
```

### `src/app/api/webhooks/resend/route.ts`

```ts
import { createServiceClient } from '@/lib/supabase/service'
import { createHmac, timingSafeEqual } from 'node:crypto'

export const dynamic = 'force-dynamic'

interface ResendWebhookPayload {
  type: string
  created_at: string
  data: {
    email_id: string
    to: string[]
    subject?: string
    bounce?: { type?: string }
    complaint?: { type?: string }
    [key: string]: unknown
  }
}

// Resend manda assinatura via header `svix-signature` (Resend usa Svix por baixo)
function verifySignature(rawBody: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return false
  const id = headers.get('svix-id')
  const timestamp = headers.get('svix-timestamp')
  const signature = headers.get('svix-signature')
  if (!id || !timestamp || !signature) return false

  const signedPayload = `${id}.${timestamp}.${rawBody}`
  const secretBytes = Buffer.from(secret.split('_')[1] ?? '', 'base64')
  const expected = createHmac('sha256', secretBytes).update(signedPayload).digest('base64')

  // signature header tem formato "v1,<sig> v1,<sig>" — tenta cada um
  return signature.split(' ').some((s) => {
    const [, sig] = s.split(',')
    if (!sig) return false
    try {
      return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    } catch {
      return false
    }
  })
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  if (!verifySignature(rawBody, request.headers)) {
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(rawBody) as ResendWebhookPayload
  const sb = createServiceClient()

  // Tenta achar email_queue_id e user_id pelo resend_message_id
  const { data: queueRow } = await sb
    .from('email_queue')
    .select('id, user_id')
    .eq('resend_message_id', event.data.email_id)
    .maybeSingle()

  await sb.from('email_events').insert({
    resend_message_id: event.data.email_id,
    email_queue_id: queueRow?.id ?? null,
    user_id: queueRow?.user_id ?? null,
    event_type: event.type,
    to_email: event.data.to[0] ?? '',
    bounce_type: event.data.bounce?.type ?? null,
    complaint_type: event.data.complaint?.type ?? null,
    subject: event.data.subject ?? null,
    raw: event as unknown as Record<string, unknown>,
  })

  return Response.json({ ok: true })
}
```

### `src/lib/email/admin-guard.ts`

```ts
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = new Set(['giovanni@scient.cc'])

export async function requireAdmin() {
  const sb = createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user || !user.email || !ADMIN_EMAILS.has(user.email)) {
    redirect('/hub')
  }
  return user
}
```

### `src/app/(app)/admin/email-health/page.tsx`

```tsx
import { requireAdmin } from '@/lib/email/admin-guard'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export default async function EmailHealthPage() {
  await requireAdmin()
  const sb = createServiceClient()

  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString()

  const [{ data: counts }, { data: bounces }, { data: complaints }, { data: queueStats }] =
    await Promise.all([
      sb.rpc('email_event_counts', { since_ts: since }), // criar SQL function
      sb
        .from('email_events')
        .select('to_email, bounce_type, subject, created_at')
        .eq('event_type', 'email.bounced')
        .order('created_at', { ascending: false })
        .limit(50),
      sb
        .from('email_events')
        .select('to_email, complaint_type, subject, created_at')
        .eq('event_type', 'email.complained')
        .order('created_at', { ascending: false })
        .limit(50),
      sb.from('email_queue').select('status').gte('created_at', since),
    ])

  const queueByStatus = (queueStats ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-sora text-3xl font-light">Email Health · 30 dias</h1>

      <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Cards: sent / delivered / bounced / complained */}
      </section>

      <section className="mt-12">
        <h2 className="font-sora text-xl font-medium">Bounces recentes</h2>
        <table className="mt-4 w-full text-xs">{/* render bounces */}</table>
      </section>

      <section className="mt-12">
        <h2 className="font-sora text-xl font-medium">Complaints recentes</h2>
        {/* render complaints */}
      </section>

      <section className="mt-12">
        <h2 className="font-sora text-xl font-medium">Fila</h2>
        <pre className="mt-4 text-xs">{JSON.stringify(queueByStatus, null, 2)}</pre>
      </section>
    </div>
  )
}
```

E a SQL function helper:

```sql
CREATE OR REPLACE FUNCTION public.email_event_counts(since_ts TIMESTAMPTZ)
RETURNS TABLE(event_type TEXT, count BIGINT)
LANGUAGE SQL STABLE AS $$
  SELECT event_type, COUNT(*)::BIGINT
  FROM public.email_events
  WHERE created_at >= since_ts
  GROUP BY event_type;
$$;
```

### Setup do webhook (manual, Giovanni faz uma vez)

1. Resend Dashboard → Webhooks → Add Endpoint
2. URL: `https://gtm-blackbox.vercel.app/api/webhooks/resend`
3. Events: marcar TODOS os 8 (sent, delivered, delivery_delayed, bounced, complained, opened, clicked, failed)
4. Salvar e copiar o **Signing Secret** (formato `whsec_...`)
5. Adicionar em Vercel env vars: `RESEND_WEBHOOK_SECRET=whsec_...`

### Hard bounce auto-suppression

Resend faz isso nativamente — quando um endereço dá hard bounce, é adicionado à `Suppression List` automaticamente e os próximos sends para esse endereço são bloqueados sem cobrança. Você consegue ver/remover endereços da suppression list no Resend Dashboard se precisar.

**Não precisa lógica nossa** — só monitorar via `/admin/email-health`.

## PLANO DE TESTES (entrega 4)

### Test users canônicos

Criar 5 users de teste em `staging`/preview com perfis distintos. Use Supabase service-role pra criar diretamente:

| #      | Estado                          | Como criar                                                                    |
| ------ | ------------------------------- | ----------------------------------------------------------------------------- |
| **U1** | Zero ativo                      | Signup. Não fazer nada.                                                       |
| **U2** | Só leu ebook                    | Signup + abrir 3 capítulos (vai precisar de telemetria — placeholder por ora) |
| **U3** | Só fez diagnóstico (gargalo P3) | Signup + completar diagnóstico com respostas que produzem gargalo P3          |
| **U4** | Diagnóstico + abriu template    | U3 + abrir 1 template                                                         |
| **U5** | Fez tudo                        | U3 + completar forecast                                                       |

### Dry-run

1. Setar `DRIP_DRY_RUN=true` em `.env.local` e em Vercel preview env
2. Rodar dispatcher manualmente: `curl -H "Authorization: Bearer $CRON_SECRET" $SITE/api/cron/email-dispatcher`
3. Verificar `email_queue` rows: status deve virar `dry_run`, last_error deve conter "DRY RUN — would send to X from Y subj="Z""
4. Conferir que cada user_state produz a variant esperada (matriz abaixo)

### Matriz de validação esperada

Cada linha = (user, email_type) → variant esperada.

| user | drip_d0 | drip_d2         | drip_d5 | personal_giovanni                             | drip_d9 | drip_d14 | drip_d30 |
| ---- | ------- | --------------- | ------- | --------------------------------------------- | ------- | -------- | -------- |
| U1   | default | nao_fez         | nao_fez | zero_ativo                                    | nao_fez | default  | default  |
| U2   | default | nao_fez         | nao_fez | so_ebook                                      | nao_fez | default  | default  |
| U3   | default | fez_diagnostico | cap_p3  | so_diag                                       | tpl_p3  | default  | default  |
| U4   | default | fez_diagnostico | cap_p3  | so_template OR so_diag (ambíguo, escolher um) | tpl_p3  | default  | default  |
| U5   | default | fez_diagnostico | cap_p3  | fez_tudo                                      | tpl_p3  | default  | default  |

Nota sobre U4: a matriz `so_diag` vs `so_template` precisa de regra de prioridade. Decisão sugerida: se `didDiagnostico` então `so_diag` (sempre vence sobre `so_template`). Documentar e implementar.

### Smoke test pre-launch (real send, mas só pra equipe)

1. Voltar `DRIP_DRY_RUN=false` em preview env
2. Criar 1 user com email `giovanni@scient.cc` em preview
3. UPDATE manual: `UPDATE email_queue SET scheduled_for = NOW() WHERE user_id = '<id>'`
4. Aguardar próximo cron (até 15min) ou disparar manualmente
5. Verificar inbox de `giovanni@scient.cc`: deve ter recebido todos os 7 emails
6. Validar visualmente:
   - Identidade SCIENT correta nos 6 formais
   - Plain text limpo no email pessoal
   - CTAs apontam pra URLs corretas
   - Link "não quero mais receber" funciona
7. Se OK → push para main → deploy prod

### Observabilidade

- Vercel function logs do `email-dispatcher` mostram `processed: N, results: [...]`
- Tabela `email_queue` é a fonte da verdade. Criar query de monitoramento:
  ```sql
  SELECT status, COUNT(*) FROM email_queue
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY status;
  ```
- Resend Dashboard mostra delivered/bounced/complained — checar 1x/dia na primeira semana

## CONSTRAINTS

1. ❌ Não escrever os corpos dos emails neste fork. Os MDX em `content/emails/onboarding/` ficam como placeholder com TODO. O copy real virá em outro fork usando `marketing:email-sequence` skill.
2. ❌ Não rodar com `DRIP_DRY_RUN=false` em produção até passar todos os testes em preview
3. ❌ Não enviar email pessoal Giovanni de qualquer outro endereço além de `giovanni@scient.cc`
4. ❌ Não colocar Reply-To diferente de `giovanni@scient.cc` no email pessoal (precisa cair direto na caixa dele)
5. ❌ Não usar `react-email` ou similar — HTML inline simples
6. ❌ Não comitar `RESEND_API_KEY` ou `CRON_SECRET`
7. ❌ Não permitir emails duplicados ao mesmo user para o mesmo `email_type` (UNIQUE constraint já cuida disso)
8. ❌ Não enviar para users com `unsubscribed = true` na tabela `email_drip_state` (verificar antes do send) — adicionar essa checagem no dispatcher
9. ❌ Não enviar para users com `email_migrations.status IN ('blocked', 'migrated')` (eles não devem mais receber)
10. ❌ Não fazer SELECT \* em produção — sempre projetar colunas

## CRITÉRIO DE SUCESSO

1. ✅ Migration `20260502_003_email_queue.sql` aplicada com sucesso
2. ✅ Trigger `init_drip_after_signup` enfileira 7 rows ao criar profile
3. ✅ Dispatcher rodando a cada 15min via Vercel Cron
4. ✅ Dry-run em preview produz `variant` correto para os 5 user states (matriz acima)
5. ✅ Real send em preview entrega os 7 emails na inbox de teste
6. ✅ Email pessoal Giovanni vem em plain text, com From `giovanni@mail.scient.cc` e Reply-To `giovanni@scient.cc`, tom casual
7. ✅ Emails formais vêm com identidade SCIENT (cor #0030E8, fonte Sora fallback)
8. ✅ Link "não quero mais receber" leva pra `/email-preferences` e funciona
9. ✅ Retry funciona (forçar erro derrubando `RESEND_API_KEY`, ver attempts incrementar, eventualmente status `failed`)
10. ✅ `npm run lint` zero, `npm run build` zero warnings
11. ✅ Pre-commit hook não bloqueia
12. ✅ Tabela `email_queue` em prod tem rows com status `sent` para os 50 testers de amanhã
13. ✅ Webhook Resend recebendo eventos: tabela `email_events` populada com `email.delivered` minutos após smoke test
14. ✅ `/admin/email-health` acessível por `giovanni@scient.cc`, bloqueado para qualquer outro user
15. ✅ Tentativa de POST em `/api/webhooks/resend` sem `svix-signature` retorna 401

## ORDEM DE EXECUÇÃO

1. Aplicar migrations SQL via painel Supabase (Giovanni cola SQL: `20260502_003_email_queue.sql` + `20260502_004_email_events.sql`)
2. Implementar `service.ts`, `types.ts`, `usage-fetcher.ts`, `decisores.ts`
3. Implementar renderers (Giovanni + SCIENT) com assinatura `Giovanni Salvador / CEO @ SCIENT / linkedin.com/in/giovannibsalvador`
4. Criar dispatcher route + `vercel.json`
5. Implementar webhook handler `/api/webhooks/resend` + `admin-guard.ts` + `/admin/email-health`
6. Giovanni adiciona env vars em Vercel: `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `CRON_SECRET`
7. Giovanni configura webhook no Resend Dashboard apontando para `https://gtm-blackbox.vercel.app/api/webhooks/resend`
8. Criar 7 placeholders MDX em `content/emails/onboarding/` (com TODO no body)
9. Criar 5 test users em preview env (ou local) — script `scripts/seed-test-users.ts`
10. Rodar dispatcher com `DRIP_DRY_RUN=true`, validar matriz de variants
11. Real send em preview com inbox `giovanni@scient.cc` → validar visual + validar webhook está recebendo eventos
12. Implementar página `/email-preferences` (opt-out)
13. Smoke test final: signup novo → recebe D0 → checa `/admin/email-health` mostrando event `email.delivered`
14. Commit + push pra `main`

## CONTEXTO ADICIONAL

- O agent que pegar este fork pode rodar testes locais sem precisar do Vercel Cron — basta chamar a route com `Authorization: Bearer $CRON_SECRET` localmente
- Se o `CRON_SECRET` não estiver setado, o dispatcher retorna 401. Isso é proposital
- A tabela `email_queue` tem `UNIQUE (user_id, email_type)` — se o trigger rodar duas vezes (raro, mas pode), não duplica
- O `personal_giovanni` precisa de fallback se `usage` retornar null (raro, mas defensivo): logar erro e marcar email como `failed`
- A telemetria de `openedTemplates` e `readChapters` ainda não existe. Os decisores usam arrays vazios / zero. Não bloquear o fork por causa disso — funciona, só com fidelidade reduzida no email D7

## REPORTE FINAL ESPERADO

Ao terminar, reporte:

- Lista de commits criados
- Resultado da matriz de testes em preview (tabela)
- Screenshot dos 7 emails na inbox de teste
- Métricas dos primeiros 50 envios em prod (após launch dos testers): delivered/bounced/complained do Resend dashboard
- Qualquer ajuste de scheduled_for que precisou ser feito (ex: spacing entre emails)

---

**Tese final:** este fork sozinho destrava o drip. Os corpos dos emails (copy SCIENT + tom Giovanni via skill `marketing:email-sequence`) vêm em fork separado e podem ser iterados sem mexer na infra. Separação de concerns: infra robusta + copy iterável.
