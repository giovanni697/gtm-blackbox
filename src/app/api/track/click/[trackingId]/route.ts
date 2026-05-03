import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest, { params }: { params: { trackingId: string } }) {
  const { trackingId } = params
  const url = req.nextUrl.searchParams.get('url') ?? '/'

  const sb = createServiceClient()
  // only mark clicked_at on first click
  await sb
    .from('manual_emails')
    .update({ clicked_at: new Date().toISOString() })
    .eq('tracking_id', trackingId)
    .is('clicked_at', null)

  return NextResponse.redirect(url, { status: 302 })
}
