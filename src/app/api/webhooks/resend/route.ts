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

  const { data: queueRow } = await sb
    .from('email_queue')
    .select('id, user_id')
    .eq('resend_message_id', event.data.email_id)
    .maybeSingle()

  const queueRowTyped = queueRow as { id: number; user_id: string } | null

  await sb.from('email_events').insert({
    resend_message_id: event.data.email_id,
    email_queue_id: queueRowTyped?.id ?? null,
    user_id: queueRowTyped?.user_id ?? null,
    event_type: event.type,
    to_email: event.data.to[0] ?? '',
    bounce_type: event.data.bounce?.type ?? null,
    complaint_type: event.data.complaint?.type ?? null,
    subject: event.data.subject ?? null,
    raw: event as unknown as Record<string, unknown>,
  })

  return Response.json({ ok: true })
}
