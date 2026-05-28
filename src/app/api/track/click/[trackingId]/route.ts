import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/** Domínios permitidos para redirect. Impede open-redirect abuse. */
const ALLOWED_HOSTS = new Set([
  'gtm-blackbox.vercel.app',
  'gtm-blackbox.com',
  'localhost',
  '127.0.0.1',
])

function isSafeRedirectUrl(raw: string): boolean {
  // Caminhos relativos são sempre seguros
  if (raw.startsWith('/') && !raw.startsWith('//')) return true
  try {
    const parsed = new URL(raw)
    // Só permite http/https
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    return ALLOWED_HOSTS.has(parsed.hostname)
  } catch {
    return false
  }
}

export async function GET(req: NextRequest, { params }: { params: { trackingId: string } }) {
  const { trackingId } = params
  const rawUrl = req.nextUrl.searchParams.get('url') ?? '/'

  // Rejeita redirects para domínios externos não autorizados
  const destination = isSafeRedirectUrl(rawUrl) ? rawUrl : '/'

  const sb = createServiceClient()
  // only mark clicked_at on first click
  await sb
    .from('manual_emails')
    .update({ clicked_at: new Date().toISOString() })
    .eq('tracking_id', trackingId)
    .is('clicked_at', null)

  return NextResponse.redirect(
    destination.startsWith('/') ? new URL(destination, req.url) : destination,
    { status: 302 },
  )
}
