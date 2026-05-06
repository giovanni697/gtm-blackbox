/**
 * Seeds the 9 activation-wave-1 emails into manual_emails.
 * Run: npx tsx scripts/seed-activation-wave-1.ts
 */
import { createClient } from '@supabase/supabase-js'
import { MANUAL_EMAILS } from '../src/lib/manual-email/content'
import { buildTrackedEmail } from '../src/lib/manual-email/renderer'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

// 2026-05-05 08:00 BRT = 11:00 UTC
const SCHEDULED_FOR = '2026-05-05T11:00:00.000Z'
const CAMPAIGN = 'activation-wave-1'

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

async function main() {
  // guard against double-seeding
  const { count } = await sb
    .from('manual_emails')
    .select('*', { count: 'exact', head: true })
    .eq('campaign', CAMPAIGN)

  if ((count ?? 0) > 0) {
    console.log(`⚠️  Já existem ${count} email(s) com campaign=${CAMPAIGN}. Abortando.`)
    process.exit(0)
  }

  const rows = MANUAL_EMAILS.map((draft) => {
    const trackingId = crypto.randomUUID()
    const bodyHtml = buildTrackedEmail({
      trackingId,
      subject: draft.subject,
      bodyHtml: draft.bodyHtml,
      ctaText: draft.ctaText,
      ctaUrl: draft.ctaUrl,
      feedbackQuestion: draft.feedbackQuestion,
    })
    return {
      tracking_id: trackingId,
      to_email: draft.toEmail,
      to_name: draft.toName,
      user_id: draft.userId,
      subject: draft.subject,
      body_html: bodyHtml,
      campaign: CAMPAIGN,
      scheduled_for: SCHEDULED_FOR,
      status: 'scheduled',
    }
  })

  const { error, data } = await sb
    .from('manual_emails')
    .insert(rows)
    .select('id, to_name, to_email, subject')

  if (error) {
    console.error('❌ Erro ao inserir:', error.message)
    process.exit(1)
  }

  console.log(`✅ ${data?.length} emails inseridos com sucesso:\n`)
  data?.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.to_name} <${r.to_email}>\n     ${r.subject}`)
  })
  console.log(`\n📅 Agendados para: ${SCHEDULED_FOR} (segunda 08h BRT)`)
}

main()
