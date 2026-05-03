import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ManualEmail {
  id: string
  tracking_id: string
  to_email: string
  to_name: string
  subject: string
  body_html: string
}

export async function POST() {
  const sb = createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (user?.email !== 'giovanni@scient.cc') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: emails, error } = await service
    .from('manual_emails')
    .select('id, tracking_id, to_email, to_name, subject, body_html')
    .eq('status', 'scheduled')
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (emails ?? []) as ManualEmail[]

  const results = await Promise.allSettled(
    rows.map(async (row) => {
      const { error: sendError } = await resend.emails.send({
        from: 'Giovanni Salvador <giovanni@scient.cc>',
        to: row.to_email,
        subject: row.subject,
        html: row.body_html,
        headers: { 'X-Tracking-Id': row.tracking_id },
      })

      if (sendError) {
        await service
          .from('manual_emails')
          .update({ status: 'failed', error_message: sendError.message })
          .eq('id', row.id)
        throw new Error(sendError.message)
      }

      await service
        .from('manual_emails')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id)
    }),
  )

  return NextResponse.json({
    sent: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
  })
}
