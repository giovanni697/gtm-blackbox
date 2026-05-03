import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const Body = z.object({ feedback: z.string().min(1).max(2000) })

export async function POST(req: NextRequest, { params }: { params: { trackingId: string } }) {
  const { trackingId } = params
  const parsed = Body.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const sb = createServiceClient()
  const { error } = await sb
    .from('manual_emails')
    .update({
      feedback_text: parsed.data.feedback,
      feedback_at: new Date().toISOString(),
    })
    .eq('tracking_id', trackingId)

  if (error) {
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
