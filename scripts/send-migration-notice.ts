/**
 * scripts/send-migration-notice.ts
 *
 * Avisa via e-mail os usuários cadastrados com domínio pessoal (gmail/hotmail/etc.)
 * que precisam migrar para um e-mail corporativo até o cutoff (16 de maio de 2026).
 *
 * Modos:
 *   --dry-run   (padrão) lista os destinatários e mostra preview do corpo, NÃO envia
 *   --only-me   envia somente para giovanni@scient.cc (smoke test pessoal)
 *   --send      envia para TODOS os usuários com e-mail pessoal
 *
 * Uso:
 *   npx tsx scripts/send-migration-notice.ts                 # dry-run
 *   npx tsx scripts/send-migration-notice.ts --only-me       # teste no inbox do Giovanni
 *   npx tsx scripts/send-migration-notice.ts --send          # disparo real
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Carrega .env.local manualmente (sem dotenv como dep)
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const k = trimmed.slice(0, eq).trim()
    const v = trimmed.slice(eq + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}
loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const RESEND_KEY = process.env.RESEND_API_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE || !RESEND_KEY) {
  console.error(
    '❌ Faltam variáveis: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY',
  )
  process.exit(1)
}

// Lista compartilhada com src/lib/auth/personal-email-domains.ts
// Mantida em sync manualmente (script roda fora do Next, sem path alias).
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
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
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.com.br',
  'yahoo.es',
  'ymail.com',
  'rocketmail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'aim.com',
  'protonmail.com',
  'proton.me',
  'pm.me',
  'tutanota.com',
  'tutanota.de',
  'tutamail.com',
  'gmx.com',
  'gmx.de',
  'gmx.net',
  'gmx.at',
  'web.de',
  't-online.de',
  'yandex.com',
  'yandex.ru',
  'mail.ru',
  'inbox.ru',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'foxmail.com',
  'uol.com.br',
  'bol.com.br',
  'terra.com.br',
  'ig.com.br',
  'r7.com',
  'oi.com.br',
  'globo.com',
  'globomail.com',
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

function isPersonalEmail(email: string): boolean {
  const domain = email.toLowerCase().trim().split('@')[1]
  return !!domain && PERSONAL_EMAIL_DOMAINS.has(domain)
}

interface User {
  id: string
  email: string
  nome: string | null
}

async function listPersonalEmailUsers(supa: ReturnType<typeof createClient>): Promise<User[]> {
  const { data: authData, error } = await supa.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error

  const users: User[] = []
  for (const u of authData.users) {
    if (!u.email || !isPersonalEmail(u.email)) continue
    // Tenta pegar nome do profile (não bloqueante se faltar)
    const { data: profile } = await supa
      .from('profiles')
      .select('nome')
      .eq('id', u.id)
      .maybeSingle()
    users.push({ id: u.id, email: u.email, nome: (profile?.nome as string | undefined) ?? null })
  }
  return users
}

function firstName(nome: string | null): string {
  if (!nome) return 'oi'
  const first = nome.trim().split(/\s+/)[0]
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

function buildEmailBody(user: User): { subject: string; html: string; text: string } {
  const greeting = firstName(user.nome)
  const subject = 'Rapidinho sobre seu acesso ao GTM BlackBox'

  const html = `<p>Oi ${greeting},</p>

<p>Vi que você se cadastrou no GTM BlackBox com ${user.email}.</p>

<p>A partir dessa semana, a plataforma só aceitará e-mails corporativos. Você precisará migrar em 14 dias — até 16 de maio.</p>

<p>—</p>

<p><strong>Por que estamos pedindo isso</strong></p>

<p>O próximo passo do produto é deixar a plataforma <em>agent-ready</em>: você pluga seu próprio agente e consome os dados, templates e diagnósticos direto. Pra isso precisamos de uma abordagem mais técnica com seu e-mail de trabalho — SSO, integrações com Slack e Calendar, e uma infra que só funciona em domínio corporativo.</p>

<p>Quem concluiu o diagnóstico, roadmap e forecast nas semanas anteriores vai receber as novidades primeiro.</p>

<p>—</p>

<p><strong>Como migrar (3 passos)</strong></p>

<p>1. Faz logout do app.</p>

<p>2. Cria conta nova em <a href="https://gtm-blackbox.vercel.app/signup">gtm-blackbox.vercel.app/signup</a> com seu e-mail corporativo.</p>

<p>3. Me responde esse e-mail avisando — transfiro seus dados (diagnóstico, roadmap, forecast) pra conta nova em até 24h.</p>

<p>—</p>

<p>Se travar em qualquer coisa, me responde aqui mesmo.</p>

<p>Giovanni<br>CEO @ SCIENT<br><a href="https://linkedin.com/in/giovannibsalvador">Me mande mensagem no LinkedIn →</a></p>`

  // Plain-text fallback (clientes que não renderizam HTML)
  const text = `Oi ${greeting},

Vi que você se cadastrou no GTM BlackBox com ${user.email}.

A partir dessa semana, a plataforma só aceitará e-mails corporativos. Você precisará migrar em 14 dias — até 16 de maio.

—

Por que estamos pedindo isso

O próximo passo do produto é deixar a plataforma agent-ready: você pluga seu próprio agente e consome os dados, templates e diagnósticos direto. Pra isso precisamos de uma abordagem mais técnica com seu e-mail de trabalho — SSO, integrações com Slack e Calendar, e uma infra que só funciona em domínio corporativo.

Quem concluiu o diagnóstico, roadmap e forecast nas semanas anteriores vai receber as novidades primeiro.

—

Como migrar (3 passos)

1. Faz logout do app.

2. Cria conta nova em https://gtm-blackbox.vercel.app/signup com seu e-mail corporativo.

3. Me responde esse e-mail avisando — transfiro seus dados (diagnóstico, roadmap, forecast) pra conta nova em até 24h.

—

Se travar em qualquer coisa, me responde aqui mesmo.

Giovanni
CEO @ SCIENT
Me mande mensagem no LinkedIn: https://linkedin.com/in/giovannibsalvador`

  return { subject, html, text }
}

interface SendResult {
  email: string
  status: 'sent' | 'skipped' | 'failed'
  messageId?: string
  error?: string
}

async function send(
  resend: Resend,
  user: User,
  body: { subject: string; html: string; text: string },
): Promise<SendResult> {
  try {
    const res = await resend.emails.send({
      from: 'Giovanni Salvador <giovanni@mail.scient.cc>',
      to: user.email,
      replyTo: 'giovanni@scient.cc',
      subject: body.subject,
      html: body.html,
      text: body.text,
    })
    if (res.error) return { email: user.email, status: 'failed', error: res.error.message }
    return { email: user.email, status: 'sent', messageId: res.data?.id }
  } catch (e) {
    return {
      email: user.email,
      status: 'failed',
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--send') && !args.includes('--only-me')
  const onlyMe = args.includes('--only-me')
  const realSend = args.includes('--send')

  const mode = dryRun ? 'DRY RUN' : onlyMe ? 'ONLY-ME (smoke test)' : 'SEND (real)'
  console.log(`\n=== Migration Notice — ${mode} ===\n`)

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const users = await listPersonalEmailUsers(supa)
  console.log(`✓ ${users.length} user(s) com e-mail pessoal encontrados\n`)

  if (users.length === 0) {
    console.log('Nada a fazer.')
    return
  }

  // Distribuição por domínio
  const byDomain = new Map<string, number>()
  for (const u of users) {
    const d = u.email.split('@')[1].toLowerCase()
    byDomain.set(d, (byDomain.get(d) ?? 0) + 1)
  }
  console.log('Distribuição por domínio:')
  for (const [d, c] of [...byDomain].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${d.padEnd(20)} ${c}`)
  }
  console.log()

  if (dryRun) {
    console.log('Preview do corpo do e-mail (com dados do primeiro user):')
    console.log('─'.repeat(60))
    const preview = buildEmailBody(users[0])
    console.log(`From:     Giovanni Salvador <giovanni@mail.scient.cc>`)
    console.log(`Reply-To: giovanni@scient.cc`)
    console.log(`To:       ${users[0].email}`)
    console.log(`Subject:  ${preview.subject}\n`)
    console.log(preview.text)
    console.log('─'.repeat(60))
    console.log()
    console.log('💡 Para mandar APENAS para giovanni@scient.cc (smoke test):')
    console.log('   npx tsx scripts/send-migration-notice.ts --only-me')
    console.log()
    console.log('💡 Para mandar pra TODOS os usuários acima:')
    console.log('   npx tsx scripts/send-migration-notice.ts --send')
    return
  }

  let recipients: User[]
  if (onlyMe) {
    // Smoke test: usa o primeiro user real pra montar o body, mas envia pra giovanni@scient.cc
    const fakeUser: User = {
      id: 'preview',
      email: 'giovanni@scient.cc',
      nome: users[0].nome ?? 'Giovanni',
    }
    recipients = [fakeUser]
    console.log(`→ Enviando 1 e-mail de teste para giovanni@scient.cc\n`)
  } else if (realSend) {
    recipients = users
    console.log(`→ Enviando para ${users.length} usuários reais\n`)
    console.log('⚠️  Aguardando 5s para confirmar (Ctrl+C cancela)...')
    await new Promise((r) => setTimeout(r, 5000))
  } else {
    return
  }

  const resend = new Resend(RESEND_KEY)
  const results: SendResult[] = []

  for (const user of recipients) {
    const body = buildEmailBody(user)
    const r = await send(resend, user, body)
    results.push(r)
    const icon = r.status === 'sent' ? '✓' : r.status === 'failed' ? '✗' : '·'
    console.log(`${icon} ${r.email.padEnd(40)} ${r.status}${r.error ? ` — ${r.error}` : ''}`)
    // throttle leve para não estourar rate limit (Resend free = 2 req/s)
    if (recipients.length > 5) await new Promise((r) => setTimeout(r, 600))
  }

  const sent = results.filter((r) => r.status === 'sent').length
  const failed = results.filter((r) => r.status === 'failed').length
  console.log()
  console.log(`Total: ${results.length} | enviados: ${sent} | falharam: ${failed}`)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
