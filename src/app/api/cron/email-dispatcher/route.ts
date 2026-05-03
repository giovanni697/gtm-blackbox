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
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const sb = createServiceClient()
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const dryRun = process.env.DRIP_DRY_RUN === 'true'

  const { data: emails, error } = await sb
    .from('email_queue')
    .select(
      'id, user_id, email_type, variant, payload, scheduled_for, status, attempts, max_attempts, last_error, sent_at, resend_message_id',
    )
    .eq('status', 'queued')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(50)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const results: { id: number; status: string; error?: string }[] = []

  for (const email of (emails ?? []) as QueuedEmail[]) {
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

      const sendOptions = rendered.html
        ? {
            from: rendered.from,
            to: usage.email,
            subject: rendered.subject,
            html: rendered.html,
            replyTo: rendered.replyTo,
          }
        : {
            from: rendered.from,
            to: usage.email,
            subject: rendered.subject,
            text: rendered.text ?? '',
            replyTo: rendered.replyTo,
          }
      const sendRes = await resend.emails.send(sendOptions)

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
          ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
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
