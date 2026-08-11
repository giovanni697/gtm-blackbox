export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'

interface ManualEmail {
  id: string
  tracking_id: string
  to_email: string
  to_name: string
  subject: string
  body_html: string
}

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (process.env.EMAIL_SENDING_PAUSED === 'true') {
    return NextResponse.json({ paused: true, sent: 0 })
  }

  const sb = createServiceClient()

  // Pick emails scheduled for now (within ±10 min window) or overdue and still scheduled
  const { data: emails, error } = await sb
    .from('manual_emails')
    .select('id, tracking_id, to_email, to_name, subject, body_html')
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (emails ?? []) as ManualEmail[]
  if (rows.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const results = await Promise.allSettled(
    rows.map(async (row) => {
      const { error: sendError } = await resend.emails.send({
        from: 'Giovanni Salvador <giovanni@mail.scient.cc>',
        replyTo: 'giovanni@scient.cc',
        to: row.to_email,
        subject: row.subject,
        html: row.body_html,
        headers: {
          'X-Tracking-Id': row.tracking_id,
        },
      })

      if (sendError) {
        await sb
          .from('manual_emails')
          .update({ status: 'failed', error_message: sendError.message })
          .eq('id', row.id)
        throw new Error(sendError.message)
      }

      await sb
        .from('manual_emails')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id)
    }),
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
