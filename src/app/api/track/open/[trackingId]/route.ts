import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// 1×1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export async function GET(_req: NextRequest, { params }: { params: { trackingId: string } }) {
  const { trackingId } = params

  const sb = createServiceClient()
  // only mark opened_at on first open
  await sb
    .from('manual_emails')
    .update({ opened_at: new Date().toISOString() })
    .eq('tracking_id', trackingId)
    .is('opened_at', null)

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
    },
  })
}
