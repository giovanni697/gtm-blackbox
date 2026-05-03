# PROMPT — Reformular Login + Onboarding (work email + magic link + drip de e-mails + migração de usuários atuais)

## CONTEXTO DO PROJETO

Você está trabalhando no **GTM BlackBox** — plataforma freemium open-source da SCIENT.

- **Stack:** Next.js 14.2.35 (App Router) + Supabase (Auth + Postgres) + Tailwind + MDX
- **Deploy:** Vercel — automático via push em `main` no GitHub
- **Repositório:** github.com/giovanni697/gtm-blackbox
- **URL produção:** https://gtm-blackbox.vercel.app
- **Diretório local:** `/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/`
- **Domínio próprio (futuro):** `blackbox.scient.cc` (ainda não conectado, mas vai ser)

A plataforma tem 4 módulos:

1. **Ebook** (`/ebook`) — 12 capítulos MDX
2. **Diagnóstico** (`/diagnostico`) — wizard de 5 pilares + roadmap por TOC
3. **Templates** (`/templates`) — 8 templates implementáveis
4. **Forecast** (`/forecast`) — capacity multi-motion

**Identidade visual SCIENT (importante para emails):**

- Cor primária: `#0030E8` (azul)
- Cor texto principal: `#111111` (preto)
- Cor texto secundário: `#585858` (cinza)
- Cor fundo: `#FFFFFF`
- Fonte primária: `Sora` (com fallback `-apple-system, sans-serif`)
- Layout: minimalista, alinhado à esquerda, muito espaço negativo
- Logo: pode usar texto "SCIENT" em Lexend/sans-serif bold se SVG não tiver na asset library

**Assinatura padrão (em TODOS os emails — formais, pessoal D7, transacionais):**

```
Giovanni Salvador
CEO @ SCIENT
linkedin.com/in/giovannibsalvador
```

Nos emails formais SCIENT a assinatura aparece logo antes do footer "Scientific AI Native GTM". No email pessoal D7 (plain text), aparece como `\n\ngiovanni\nCEO @ SCIENT\nlinkedin.com/in/giovannibsalvador` (lowercase no nome porque é plain).

## ESTADO ATUAL (DEZ ÚLTIMOS DADOS DE USO)

- **31 sign-ups totais** — quase todos com e-mail pessoal (gmail, hotmail, etc.)
- **2 onboarding completados** — drop-off de 94% no onboarding
- **2 diagnósticos completos**
- **3 sessões de forecast**
- Todos os 2 diagnósticos completos: `ARMV`, gargalo P1, 19% maturidade

**Cadastro atual:** email + senha + nome. Confirmação de email via Supabase default (template padrão Supabase, sem identidade SCIENT).

## OS 4 OBJETIVOS DESTA SESSÃO

### Objetivo 1 — Aceitar APENAS work email no signup novo

- Lista de domínios pessoais que devem ser BLOQUEADOS (gmail, hotmail, yahoo, outlook, icloud, aol, proton, etc.)
- Validação client-side (UX) + server-side (segurança)
- Mensagem de erro clara: "Use seu e-mail corporativo (ex: nome@suaempresa.com.br)"
- Tooltip ou link "Por que pedimos e-mail corporativo?" explicando
- Login (não signup) também deve bloquear emails pessoais para users que tentarem entrar

### Objetivo 2 — Avisar usuários atuais com e-mail pessoal que perderão acesso

- Os 31 users existentes que se cadastraram com gmail/hotmail/etc precisam migrar para e-mail corporativo
- **Email transacional** (com identidade SCIENT) explicando:
  - Que precisam recadastrar com e-mail corporativo
  - Prazo (sugiro 14 dias)
  - Como fazer (criar nova conta no mesmo email corp + suporte transfere dados)
  - Por que (compromisso com qualidade, conteúdo é para profissionais GTM)
- **Banner persistente no app** (depois do login) para esses users:
  - Cor amarela/atenção (não é erro, é aviso)
  - Mostra dias restantes
  - CTA: "Migrar agora" → guia passo a passo OU contato com suporte
- **Após o cutoff date:** bloquear login desses users com mensagem clara + CTA para migrar
- **Decisão a confirmar com Giovanni:** auto-bloquear ou só avisar e deixar manual?

### Objetivo 3 — Magic link com identidade visual SCIENT

- **Hoje:** Supabase manda email default ("Confirm your email" do Supabase, branded "Supabase")
- **Queremos:** email com cabeçalho SCIENT, fonte Sora, cor primária `#0030E8`
- Customizar templates no Supabase Dashboard (Auth → Email Templates):
  - **Confirm signup** — usado quando usuário se cadastra
  - **Magic Link** — usado para login passwordless
  - **Reset Password**
  - **Change Email Address**
  - **Invite User** (caso queira no futuro)
- Versionar HTML em `supabase/email-templates/` no repo (boa prática, não fica só no Dashboard)
- **Decisão a confirmar:** quer mudar o fluxo de login para magic link only (sem senha)? OU oferecer ambos? OU só usar magic link para confirmação de email no signup?
  - **Recomendação:** magic link como método principal (passwordless) — reduz fricção e drop-off. Usuário coloca email, recebe link, entra. Acabou senha.

### Objetivo 4 — Trilha de e-mails de onboarding (drip + email pessoal Giovanni)

**ATENÇÃO:** infra técnica deste objetivo está especificada em `PROMPT_DRIP_LOGIC_FORK.md` (mesmo diretório). Este objetivo NESTE arquivo cobre apenas o conceito + o copy. A engenharia (fila, decisores, cron, testes) fica no fork.

**Fluxo final aprovado por Giovanni:**

| #   | Dia       | Tipo                                              | Função CS                                                     | Variant logic                                                            |
| --- | --------- | ------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | D0 (5min) | Drip formal SCIENT                                | **Primeiro valor óbvio** (TTV explícito)                      | Linear                                                                   |
| 2   | D2        | Drip formal SCIENT                                | Activation (radar + gargalo) ou nudge                         | Condicional: fez_diagnostico / nao_fez                                   |
| 3   | D5        | Drip formal SCIENT                                | Knowledge anchor (capítulo do gargalo)                        | Condicional: cap_p1..p5 / nao_fez                                        |
| 4   | **D7**    | **Pessoal Giovanni** (plain text, sem formatação) | Touch humano + descoberta                                     | **5 variants:** fez_tudo / so_diag / so_template / so_ebook / zero_ativo |
| 5   | D9        | Drip formal SCIENT                                | Hand-off (templates do gargalo)                               | Condicional: tpl_p1..p5 / nao_fez                                        |
| 6   | D14       | Drip formal SCIENT                                | Verification + Forecast (capacity multi-motion)               | Linear                                                                   |
| 7   | **D30**   | Drip formal SCIENT                                | **Checkpoint de valor** (radar antes/depois, gate ARMV→ARPE?) | Linear                                                                   |

**Princípios CS aplicados:**

- TTV explícito desde D0 ("90min" — não "boas-vindas")
- Activation milestones progressivos (Diagnóstico → Conhecimento → Implementação → Verificação)
- Lógica condicional baseada em comportamento real (queries no banco antes do envio)
- Touch humano no D7 do email pessoal Giovanni
- Verificação de OUTCOME no D30 (não satisfação — "o que mudou?")

**Email pessoal Giovanni (D7) — especial:**

- Plain text (sem HTML, sem markdown, sem formatação)
- Sai de `giovanni@scient.cc`, Reply-To `giovanni@scient.cc`
- Subject lowercase casual ("rapidinho", "como tá indo?", "fez sentido?")
- 5 ramificações de copy baseadas em uso (matriz didDiagnostico × didForecast × openedTemplates × readChapters)
- Quando responder: cai direto na caixa do Giovanni (não fila de suporte)

**Tom de voz para escrita dos copies:** invocar a skill `marketing:email-sequence` que carrega o tom Giovanni Salvador / SCIENT. Os corpos dos 6 emails formais ficam em `content/emails/onboarding/{type}__{variant}.mdx`. O email pessoal é gerado em código (`giovanni-email-renderer.ts`).

**Identidade visual SCIENT** (apenas para os 6 formais, não para o pessoal):

- Cor primária: `#0030E8`
- Fonte: `Sora` (com fallback `-apple-system, sans-serif`)
- Layout limpo, alinhado à esquerda
- Logo: texto "SCIENT · GTM BlackBox" no cabeçalho
- Footer: "Scientific AI Native GTM" + link "não quero mais receber"

**Provider:** Resend (decidido). Setup: criar conta → DNS records SPF/DKIM/DMARC pra `scient.cc` (Giovanni faz) → API key em `.env.local` e Vercel.

**Opt-out funcional** em cada email formal (LGPD/anti-spam). Email pessoal não precisa de opt-out (é 1:1).

## ESTADO ATUAL DOS ARQUIVOS DE AUTH

### `src/app/(auth)/signup/page.tsx`

Form com 3 campos: nome, email, password (min 8 chars). Usa `useFormState` + Server Action `signup`. Após submit bem-sucedido com confirmação de email habilitada, mostra mensagem "Confirme seu e-mail".

### `src/app/(auth)/signup/actions.ts`

```ts
const SignupSchema = z.object({
  nome: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function signup(_prev, formData) {
  const parsed = SignupSchema.safeParse({...})
  if (!parsed.success) return { error: ... }
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { nome: parsed.data.nome },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  // ...
}
```

### `src/app/(auth)/login/page.tsx` e `actions.ts`

Padrão similar: email + password.

### `src/app/(auth)/reset/page.tsx`

Reset de senha via email do Supabase.

### `src/middleware.ts`

Refresh de sessão Supabase em todas as rotas exceto `/`.

### `supabase/migrations/20260427_001_init_schema.sql`

Schema com `profiles`, `diagnosticos`, `checklist_respostas`, `roadmap_itens`, `wizard_sessions`, `forecast_sessions`. Trigger `on_auth_user_created` cria row em `profiles` automaticamente no signup.

## IMPLEMENTAÇÃO POR OBJETIVO (PROPOSTA TÉCNICA)

### Implementação 1 — Work email validator

**Criar `src/lib/auth/personal-email-domains.ts`:**

```ts
// Lista canônica de domínios de e-mail PESSOAL bloqueados.
// Edite via PR. Mantida ordenada alfabeticamente por categoria.
export const PERSONAL_EMAIL_DOMAINS = new Set([
  // Google
  'gmail.com',
  'googlemail.com',
  // Microsoft
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'hotmail.com.br',
  'hotmail.es',
  'outlook.com',
  'outlook.com.br',
  'outlook.fr',
  'outlook.es',
  'live.com',
  'live.com.br',
  'live.fr',
  'msn.com',
  // Yahoo
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.com.br',
  'yahoo.es',
  'ymail.com',
  'rocketmail.com',
  // Apple
  'icloud.com',
  'me.com',
  'mac.com',
  // AOL
  'aol.com',
  'aim.com',
  // Privacy-focused
  'protonmail.com',
  'proton.me',
  'pm.me',
  'tutanota.com',
  'tutanota.de',
  'tutamail.com',
  // German/EU
  'gmx.com',
  'gmx.de',
  'gmx.net',
  'gmx.at',
  'web.de',
  't-online.de',
  // Russian
  'yandex.com',
  'yandex.ru',
  'mail.ru',
  'inbox.ru',
  // Chinese
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'foxmail.com',
  // BR providers
  'uol.com.br',
  'bol.com.br',
  'terra.com.br',
  'ig.com.br',
  'r7.com',
  'oi.com.br',
  'globo.com',
  'globomail.com',
  // Outros
  'mail.com',
  'zoho.com',
  'fastmail.com',
  'fastmail.fm',
  'hey.com',
  'hushmail.com',
  'rediffmail.com',
  'naver.com',
  'daum.net',
])

export function isPersonalEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1]
  if (!domain) return true // sem @, considera inválido
  return PERSONAL_EMAIL_DOMAINS.has(domain)
}

export function getEmailDomain(email: string): string | null {
  const parts = email.toLowerCase().split('@')
  if (parts.length !== 2) return null
  return parts[1] || null
}
```

**Atualizar `src/app/(auth)/signup/actions.ts`:**

```ts
import { isPersonalEmail } from '@/lib/auth/personal-email-domains'

const SignupSchema = z.object({
  nome: z.string().min(2).max(80),
  email: z
    .string()
    .email()
    .refine(
      (e) => !isPersonalEmail(e),
      'Use seu e-mail corporativo (ex: nome@suaempresa.com.br). E-mails pessoais não são aceitos.',
    ),
  password: z.string().min(8),
})
```

**Mesma validação em `login/actions.ts`** — bloquear login se email for pessoal (depois do cutoff date) com mensagem específica orientando a migrar.

**UX no formulário (`signup/page.tsx`):**

- Adicionar abaixo do input de email: "Use seu e-mail corporativo. [ⓘ Por quê?]"
- Tooltip ou modal: "GTM BlackBox é uma plataforma profissional. Aceitamos apenas e-mails corporativos para garantir comunidade de qualidade e habilitar integrações futuras (SSO, Slack workspace, etc.)."

### Implementação 2 — Migração de usuários existentes

**Migration SQL:**

```sql
-- supabase/migrations/20260502_001_email_migration.sql

-- Tabela para rastrear status de migração
CREATE TABLE public.email_migrations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  old_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | notified | migrated | blocked
  cutoff_date TIMESTAMPTZ NOT NULL,
  notified_at TIMESTAMPTZ,
  migrated_at TIMESTAMPTZ,
  migrated_to_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own migration" ON public.email_migrations
  FOR SELECT USING (auth.uid() = user_id);

-- Identificar e marcar todos os users existentes com email pessoal
INSERT INTO public.email_migrations (user_id, old_email, status, cutoff_date)
SELECT id, email, 'pending', NOW() + INTERVAL '14 days'
FROM auth.users
WHERE email ~* '@(gmail|hotmail|yahoo|outlook|live|msn|icloud|me|mac|aol|protonmail|proton|tutanota|gmx|yandex|mail\.ru|qq|163|126|sina|uol|bol|terra|ig\.com|r7|oi|globo|mail\.com|zoho|fastmail|hey|hushmail)\.'
ON CONFLICT (user_id) DO NOTHING;

-- Helper para checar se user precisa migrar
CREATE OR REPLACE FUNCTION public.needs_email_migration(uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.email_migrations
    WHERE user_id = uid AND status IN ('pending', 'notified')
  );
$$;
```

**Componente Banner (`src/components/auth/MigrationBanner.tsx`):**

```tsx
'use client'

interface Props {
  daysLeft: number
  cutoffDate: string
}

export function MigrationBanner({ daysLeft, cutoffDate }: Props) {
  return (
    <div className="border-l-4 border-yellow-500 bg-yellow-50 px-6 py-4">
      <p className="font-sora text-3xs uppercase tracking-widest text-yellow-700">
        Ação necessária — {daysLeft} dia{daysLeft === 1 ? '' : 's'} restante
        {daysLeft === 1 ? '' : 's'}
      </p>
      <p className="mt-2 font-sora text-xs text-yellow-900">
        Seu cadastro usa e-mail pessoal. Para manter o acesso, migre para um e-mail corporativo até{' '}
        {cutoffDate}.
      </p>
      <a
        href="/migrar-email"
        className="mt-2 inline-block font-sora text-2xs uppercase tracking-widest text-scient-primary underline"
      >
        Como migrar →
      </a>
    </div>
  )
}
```

**Adicionar no `(app)/layout.tsx`:**

```tsx
const { data: migration } = await supabase
  .from('email_migrations')
  .select('cutoff_date, status')
  .eq('user_id', user.id)
  .maybeSingle()

const needsMigration = migration && ['pending', 'notified'].includes(migration.status)
const daysLeft = needsMigration
  ? Math.ceil((new Date(migration.cutoff_date).getTime() - Date.now()) / 86400000)
  : 0
```

**Página `/migrar-email/page.tsx`:**
Instruções passo a passo + form de contato com suporte (giovanni@scient.cc + matheus@scient.cc).

**Bloqueio após cutoff:**
No `login/actions.ts`, depois do `signInWithPassword`, checar:

```ts
const { data: mig } = await supabase
  .from('email_migrations')
  .select('cutoff_date, status')
  .eq('user_id', data.user.id)
  .maybeSingle()
if (mig && new Date(mig.cutoff_date) < new Date() && mig.status !== 'migrated') {
  await supabase.auth.signOut()
  return {
    error: 'Seu prazo de migração expirou. Entre em contato com giovanni@scient.cc para reativar.',
  }
}
```

### Implementação 3 — Magic link com identidade visual SCIENT

**Templates HTML em `supabase/email-templates/`:**

`magic-link.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Seu link de acesso · GTM BlackBox</title>
  </head>
  <body
    style="margin:0;padding:0;background:#ffffff;font-family:Sora,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111111;"
  >
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background:#ffffff;"
    >
      <tr>
        <td align="center" style="padding:48px 24px;">
          <table
            role="presentation"
            width="480"
            cellpadding="0"
            cellspacing="0"
            style="max-width:480px;"
          >
            <tr>
              <td style="padding-bottom:32px;">
                <p
                  style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#585858;"
                >
                  SCIENT · GTM BlackBox
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <h1 style="margin:0;font-size:28px;font-weight:300;line-height:1.2;color:#111111;">
                  Seu link de acesso
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:32px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#111111;">
                  Clique no botão abaixo para entrar na sua conta. O link expira em 1 hora.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:32px;">
                <a
                  href="{{ .ConfirmationURL }}"
                  style="display:inline-block;background:#0030E8;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:13px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;"
                >
                  Entrar no GTM BlackBox
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#585858;">
                  Se você não solicitou este e-mail, ignore. Ninguém terá acesso à sua conta sem
                  clicar no link.
                </p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #E6E6E6;padding-top:24px;">
                <p
                  style="margin:0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#585858;"
                >
                  Scientific AI Native GTM
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

Variantes para `confirm-signup.html`, `reset-password.html`, `change-email.html` seguem o mesmo padrão visual com texto adaptado.

**Aplicar no Supabase Dashboard:**

- Authentication → Email Templates → para cada template, colar HTML do arquivo correspondente
- Salvar e testar mandando para email de teste

**Decisão sobre passwordless:**

- **Recomendo:** mudar fluxo principal para magic link
- Login form: só campo email + botão "Receber link"
- Manter `signInWithPassword` apenas como fallback opcional

```ts
// login/actions.ts (versão magic link)
const { error } = await supabase.auth.signInWithOtp({
  email: parsed.data.email,
  options: {
    shouldCreateUser: false, // não cria conta, só loga
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  },
})
```

### Implementação 4 — Trilha de onboarding com Resend + Vercel Cron

**Setup inicial (manual, fazer com Giovanni):**

1. Criar conta em [resend.com](https://resend.com) (free tier 3.000 emails/mês)
2. Verificar domínio `scient.cc` (DNS records SPF/DKIM/DMARC) — Giovanni precisa fazer
3. Criar API key
4. Adicionar `RESEND_API_KEY=re_...` em `.env.local` E em Vercel env vars
5. Adicionar `RESEND_FROM_EMAIL=GTM BlackBox <noreply@scient.cc>` em ambos

**Migration SQL:**

```sql
-- supabase/migrations/20260502_002_email_drip.sql
CREATE TABLE public.email_drip_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INT NOT NULL DEFAULT 0, -- 0..5 (0 = welcome enviado, 5 = sequência completa)
  next_send_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed BOOLEAN NOT NULL DEFAULT false,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_drip_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own drip" ON public.email_drip_state
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger: ao criar profile, inicializar drip state
CREATE OR REPLACE FUNCTION public.init_drip_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.email_drip_state (user_id, current_step, next_send_at)
  VALUES (NEW.id, 0, NOW() + INTERVAL '5 minutes')  -- welcome em 5min após signup
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS init_drip_after_signup ON public.profiles;
CREATE TRIGGER init_drip_after_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.init_drip_on_signup();
```

**Conteúdo dos emails em `content/emails/onboarding/`:**

`01-bem-vindo.mdx`:

```mdx
---
order: 1
delayHours: 0
subject: 'Bem-vindo ao GTM BlackBox'
preheader: 'A Engenharia de Go-to-Market em uma única plataforma'
---

Você acabou de criar sua conta no GTM BlackBox. Em ~90 minutos você sai com um diagnóstico priorizado e um plano de capacity multi-motion.

A plataforma tem 4 módulos:

1. **Ebook** · 12 capítulos com a metodologia (~3h leitura)
2. **Diagnóstico** · 5 pilares + radar + roadmap por gargalo (~90min)
3. **Templates** · 8 implementáveis com rubrica 0-3
4. **Forecast** · capacity multi-motion + plano de hiring

O caminho mais rápido pro primeiro insight é o **Diagnóstico**. Comece por lá.

[CTA: Fazer diagnóstico → /diagnostico]
```

`02-ebook.mdx` (delayHours: 48):

```mdx
---
order: 2
delayHours: 48
subject: 'Como ler o ebook em 3h'
preheader: 'Capítulos 1, 8 e 11 são os mais densos. Comece pelo 1.'
---

(...conteúdo educacional sobre o ebook...)
```

E assim por diante para `03-diagnostico.mdx` (delayHours: 120), `04-templates.mdx` (delayHours: 216), `05-forecast.mdx` (delayHours: 336).

**Renderer de email (`src/lib/email/render-onboarding.ts`):**

- Lê o MDX da sequência
- Aplica template HTML SCIENT (mesmo design dos magic links)
- Substitui placeholders ({{nome}}, {{cta_url}})
- Retorna HTML final pronto para o Resend

**Cron handler (`src/app/api/cron/onboarding-drip/route.ts`):**

```ts
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { renderOnboardingEmail } from '@/lib/email/render-onboarding'

export async function GET(request: Request) {
  // Auth check: só Vercel Cron pode chamar
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(process.env.RESEND_API_KEY!)

  // Pega users que têm next_send_at <= now e current_step < 5 e !unsubscribed
  const { data: users } = await supabase
    .from('email_drip_state')
    .select('user_id, current_step, profiles(nome, email:auth.users(email))')
    .lte('next_send_at', new Date().toISOString())
    .lt('current_step', 5)
    .eq('unsubscribed', false)
    .limit(100)

  const sent = []
  for (const u of users ?? []) {
    const nextStep = u.current_step + 1
    const { html, subject } = await renderOnboardingEmail(nextStep, u.profiles)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: u.profiles.email,
      subject,
      html,
    })

    const delays = [0, 48, 120, 216, 336] // hours after step 0
    const nextDelay = delays[nextStep] ? delays[nextStep] - delays[u.current_step] : 0
    await supabase
      .from('email_drip_state')
      .update({
        current_step: nextStep,
        last_sent_at: new Date().toISOString(),
        next_send_at: new Date(Date.now() + nextDelay * 3600000).toISOString(),
      })
      .eq('user_id', u.user_id)

    sent.push(u.user_id)
  }

  return Response.json({ sent: sent.length })
}
```

**`vercel.json`:**

```json
{
  "crons": [
    {
      "path": "/api/cron/onboarding-drip",
      "schedule": "0 14 * * *"
    }
  ]
}
```

Roda todo dia às 14h UTC (~11h BRT).

**Opt-out:**

- Página `/email-preferences` permite usuário marcar `unsubscribed = true`
- Link em todos os emails: `https://gtm-blackbox.vercel.app/email-preferences?token={hashed-user-id}`

## DECISÕES JÁ CONFIRMADAS POR GIOVANNI (não pergunte de novo)

| #   | Decisão                         | Resposta                                                                                                                                                                                 |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Cutoff date users atuais        | 14 dias                                                                                                                                                                                  |
| 2   | Bloqueio automático após cutoff | **Sim**, com mensagem clara orientando re-login com work email                                                                                                                           |
| 3   | Magic link substitui senha      | **Não** — login aceita ambos (magic link OU senha)                                                                                                                                       |
| 4   | Provider transacional           | **Resend**                                                                                                                                                                               |
| 5   | Domínio remetente               | **`giovanni@scient.cc` para TODOS os emails** (transacionais Supabase Auth, drip formal SCIENT, email pessoal D7, email de migração) — Giovanni quer caixa única para concentrar replies |
| 5b  | Reply-To                        | `giovanni@scient.cc` em todos. Replies caem direto na caixa dele.                                                                                                                        |
| 6   | Sequência drip                  | **7 emails em 30 dias** — 6 formais SCIENT + 1 pessoal Giovanni                                                                                                                          |
| 7   | Lista de domínios pessoais      | proposta aceita (50+ domínios)                                                                                                                                                           |
| 8   | Copy dos emails                 | Giovanni quer que eu escreva, usando skill `marketing:email-sequence` para tom de voz                                                                                                    |

## CONSTRAINTS / O QUE NÃO PODE FAZER

1. ❌ Não fazer signup automático ou login automático em nome do usuário
2. ❌ Não armazenar senhas em plaintext (Supabase já cuida, mas validar que nada vaza nos logs)
3. ❌ Não enviar emails sem opt-in claro (transacionais OK, marketing precisa consent)
4. ❌ Não usar libs de email pesadas (mjml-server, etc.) — HTML inline é suficiente
5. ❌ Não tocar nas migrations existentes (`20260427_001_init_schema.sql`) — criar novas
6. ❌ Não comitar `.env.local` ou nenhuma chave do Resend/Supabase
7. ❌ Não fazer deploy manual — só via push para main
8. ❌ Não bloquear users existentes IMEDIATAMENTE — sempre dar prazo de 14 dias
9. ❌ Não escrever HTML de email com fontes externas (`@import url`) — clientes de email não suportam. Usar `font-family` com fallback nativo.
10. ❌ Não criar componente React que renderiza email (`react-email`, etc.) — usar string template simples para manter o controle e leveza

## CRITÉRIO DE SUCESSO

1. ✅ Tentativa de signup com `algo@gmail.com` → erro inline claro: "Use seu e-mail corporativo"
2. ✅ Signup com `algo@scient.cc` → sucesso, recebe email de confirmação com identidade SCIENT (cor #0030E8, fonte Sora, layout limpo)
3. ✅ Magic link no signup/login com layout SCIENT
4. ✅ User existente (gmail) loga e vê banner amarelo: "Seu cadastro usa e-mail pessoal. Migre em X dias."
5. ✅ User existente recebe email transacional explicando migração (com identidade SCIENT)
6. ✅ Após cutoff date, login do user com email pessoal retorna mensagem: "Seu prazo expirou, contate giovanni@scient.cc"
7. ✅ Após signup novo, user recebe email "bem-vindo" em ~5min com CTA para Diagnóstico
8. ✅ User recebe os 5 emails da sequência nos dias certos (validar manualmente alterando `next_send_at` no banco para forçar disparo)
9. ✅ Link "não quero mais receber" funciona e marca `unsubscribed = true`
10. ✅ Cron `/api/cron/onboarding-drip` é disparado pela Vercel diariamente
11. ✅ `npm run lint` passa, `npm run build` passa
12. ✅ Pre-commit hook não bloqueia (sem strings banidas)

## ORDEM DE EXECUÇÃO RECOMENDADA

**Este prompt foi dividido em forks por escopo. Execute na ordem:**

### FASE A — Setup pré-requisito (Giovanni faz manualmente, bloqueio)

1. Criar conta Resend
2. Verificar domínio `scient.cc` (DNS SPF/DKIM/DMARC)
3. Gerar API key Resend
4. Adicionar em `.env.local` e Vercel: `RESEND_API_KEY`, `CRON_SECRET` (gerar com `openssl rand -hex 32`)

### FASE B — Auth hardening (este prompt, escopo direto)

1. Implementar work email validator (`personal-email-domains.ts` + atualizar signup/login actions + UX no form)
2. Customizar Supabase email templates (HTML SCIENT no Dashboard + arquivar em `supabase/email-templates/`)
3. Adicionar opção "Magic Link" no login (manter senha como fallback)
4. Implementar migration table + banner (SQL `20260502_001_email_migration.sql` + componente Banner + integrar no layout)
5. Página `/migrar-email` com instruções
6. Bloqueio após cutoff date no `login/actions.ts`
7. Email transacional de aviso para users com email pessoal (script one-shot via Supabase service role + Resend)

### FASE C — Drip infra (FORK separado: `PROMPT_DRIP_LOGIC_FORK.md`)

- Fila assíncrona, dispatcher, decisores condicionais, email pessoal Giovanni, testes
- Executar após Fase B em produção

### FASE D — Copy dos emails (FORK ainda a ser criado)

- Escrever os 6 corpos formais (com 6+2+2+1+5+1+1 = ~18 variants no total) usando skill `marketing:email-sequence`
- Escrever as 5 ramificações do email pessoal Giovanni
- Substituir placeholders TODO nos MDX

### FASE E — Smoke test + launch

- Testar todo o fluxo end-to-end com user de teste em preview env
- Push para `main` → deploy prod
- Monitorar Resend dashboard nos primeiros 50 envios

## CONTEXTO ADICIONAL ÚTIL

- **Banco de dados:** Supabase project `aqohksffwzutqlorioxf` em `https://aqohksffwzutqlorioxf.supabase.co`
- **Variáveis de ambiente em `.env.local` (NÃO COMITAR):**
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://aqohksffwzutqlorioxf.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_***
  SUPABASE_SERVICE_ROLE_KEY=sb_secret_***
  NEXT_PUBLIC_SITE_URL=http://localhost:3000  # ou produção em Vercel
  RESEND_API_KEY=re_***  # adicionar
  RESEND_FROM_EMAIL=GTM BlackBox <noreply@scient.cc>  # adicionar
  CRON_SECRET=<random-secret>  # adicionar (Vercel auto-gera ou configurar)
  ```
- **Pre-commit hook bloqueia strings de cliente:** Amicci, V4, LIV, CRMBonus, Galileo, Plannera, Assertiva, Housi, Piwi, Cortex, LigueLead, Octo, Magazord, Vick, etc. **Não usar essas strings em nenhum email/conteúdo.**
- **Tom de voz SCIENT (importante para emails):**
  - Não use exclamação
  - Não use emoji (exceto se MUITO funcional)
  - Frases curtas, técnicas, direto ao ponto
  - Use "você" (não "vocês")
  - Não diga "esperamos que goste" — diga o que fazer
  - Inspiração: Edson Rigonatti, Mark Roberge

## FORMA DE REPORTAR PROGRESSO

Para cada feature implementada:

- ✅ feita (1 linha) — link/snippet do código
- ⚠️ parcial — o que falta
- ❌ falhou — erro específico

No final, reporte:

- Lista de commits criados
- Tabela `email_drip_state` populada com pelo menos 1 user de teste
- Screenshot de email "bem-vindo" recebido em produção
- Confirmação de que o cron rodou pelo menos 1 vez (Vercel logs)

---

**Tese final:** este é um trabalho de ~6-10h focado em qualidade de UX de auth. Não é refactor pesado. Cada feature é independente e pode ser implementada/deployada separadamente. Comece pelo work email validator (mais rápido e maior valor imediato — bloqueia signups ruins amanhã quando os 50 testers chegarem).
