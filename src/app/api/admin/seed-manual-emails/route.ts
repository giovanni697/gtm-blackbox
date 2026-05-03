import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { MANUAL_EMAILS } from '@/lib/manual-email/content'
import { buildTrackedEmail } from '@/lib/manual-email/renderer'

// 2026-05-05 08:00 BRT = 11:00 UTC
const SCHEDULED_FOR = '2026-05-05T11:00:00.000Z'

export async function POST() {
  // verify caller is admin
  const sb = createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (user?.email !== 'giovanni@scient.cc') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  // check if already seeded
  const { count } = await service
    .from('manual_emails')
    .select('*', { count: 'exact', head: true })
    .eq('campaign', 'activation-wave-1')

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'already_seeded' }, { status: 409 })
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
      campaign: 'activation-wave-1',
      scheduled_for: SCHEDULED_FOR,
      status: 'scheduled',
    }
  })

  const { error } = await service.from('manual_emails').insert(rows)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ inserted: rows.length })
}
