/**
 * Weekly email dispatch — runs every Monday at 11:00 UTC (08:00 BRT).
 * Sends personalized emails to all active users not yet emailed this week.
 *
 * Segments:
 *   no_profile   → push to complete profile
 *   onboarded    → push to start diagnostic
 *   dropped      → re-engage (paused mid-wizard)
 *   diagnosed    → push to run Forecast
 *   power_user   → weekly check-in
 *
 * Deduplication: skips users with a sent email in the last 6 days.
 * Fatigue guard: skips users with 4+ sent emails and zero opens/clicks.
 */
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'
import { getSegment } from '@/lib/weekly-email/segments'
import { buildWeeklyTemplate } from '@/lib/weekly-email/templates'
import { buildTrackedEmail } from '@/lib/manual-email/renderer'
import type { ProfileRow, DiagnosticoRow, WizardRow } from '@/lib/weekly-email/segments'

// ISO week label e.g. "weekly-2026-W19"
function isoWeekLabel(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `weekly-${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb = createServiceClient()
  const campaign = isoWeekLabel()

  // ── 1. Load all data in parallel ─────────────────────────────────────────────
  const [
    { data: profiles },
    { data: diagnosticos },
    { data: wizardSessions },
    { data: recentlySent },
    { data: fatiguedUsers },
  ] = await Promise.all([
    sb.from('profiles').select('*'),

    // latest diagnostic per user (most recent)
    sb
      .from('diagnosticos')
      .select('user_id, estagio, gargalo_pilar, percentual_maturidade, ai_ready, created_at')
      .order('created_at', { ascending: false }),

    // users who have any wizard session
    sb.from('wizard_sessions').select('user_id'),

    // users already emailed in the last 6 days
    sb
      .from('manual_emails')
      .select('user_id')
      .eq('status', 'sent')
      .gte('sent_at', new Date(Date.now() - 6 * 86400 * 1000).toISOString()),

    // users with 4+ sent emails and no engagement (open or click)
    sb
      .from('manual_emails')
      .select('user_id')
      .eq('status', 'sent')
      .is('opened_at', null)
      .is('clicked_at', null),
  ])

  const allProfiles = (profiles ?? []) as ProfileRow[]
  const allDiags = (diagnosticos ?? []) as DiagnosticoRow[]
  const allWizard = (wizardSessions ?? []) as WizardRow[]

  // index latest diag per user
  const latestDiag: Record<string, DiagnosticoRow> = {}
  for (const d of allDiags) {
    if (!latestDiag[d.user_id]) latestDiag[d.user_id] = d
  }

  // sets for fast lookup
  const wizardUsers = new Set((allWizard ?? []).map((w) => w.user_id))
  const recentlySentUsers = new Set((recentlySent ?? []).map((r) => r.user_id))

  // fatigue: users with 4+ unengaged emails
  const unengagedCount: Record<string, number> = {}
  for (const r of fatiguedUsers ?? []) {
    unengagedCount[r.user_id] = (unengagedCount[r.user_id] ?? 0) + 1
  }
  const fatiguedSet = new Set(
    Object.entries(unengagedCount)
      .filter(([, n]) => n >= 4)
      .map(([id]) => id),
  )

  // ── 2. Build + send emails ────────────────────────────────────────────────────
  const results: Array<{ name: string; email: string; segment: string; ok: boolean }> = []

  for (const profile of allProfiles) {
    // skip recently emailed
    if (recentlySentUsers.has(profile.id)) continue
    // skip fatigued users
    if (fatiguedSet.has(profile.id)) continue

    const hasDiag = !!latestDiag[profile.id]
    const hasWizard = wizardUsers.has(profile.id)
    const segment = getSegment(profile, hasDiag, hasWizard)
    const template = buildWeeklyTemplate(profile, segment, latestDiag[profile.id] ?? null)

    const trackingId = crypto.randomUUID()
    const bodyHtml = buildTrackedEmail({
      trackingId,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      ctaText: template.ctaText,
      ctaUrl: template.ctaUrl,
      feedbackQuestion: template.feedbackQuestion,
    })

    // insert row
    const { error: insertError } = await sb.from('manual_emails').insert({
      tracking_id: trackingId,
      to_email: profile.id, // placeholder — need auth email
      to_name: profile.nome,
      user_id: profile.id,
      subject: template.subject,
      body_html: bodyHtml,
      campaign,
      status: 'sending',
    })

    if (insertError) {
      results.push({ name: profile.nome, email: '', segment, ok: false })
      continue
    }

    // fetch real email from auth
    const { data: authUser } = await sb.auth.admin.getUserById(profile.id)
    const toEmail = authUser?.user?.email
    if (!toEmail) {
      await sb
        .from('manual_emails')
        .update({ status: 'failed', error_message: 'email not found in auth' })
        .eq('tracking_id', trackingId)
      results.push({ name: profile.nome, email: '', segment, ok: false })
      continue
    }

    // update with real email
    await sb.from('manual_emails').update({ to_email: toEmail }).eq('tracking_id', trackingId)

    // send via Resend
    const { error: sendError } = await resend.emails.send({
      from: 'Giovanni Salvador <giovanni@scient.cc>',
      to: toEmail,
      subject: template.subject,
      html: bodyHtml,
      headers: { 'X-Tracking-Id': trackingId },
    })

    const ok = !sendError
    await sb
      .from('manual_emails')
      .update(
        ok
          ? { status: 'sent', sent_at: new Date().toISOString() }
          : { status: 'failed', error_message: sendError?.message },
      )
      .eq('tracking_id', trackingId)

    results.push({ name: profile.nome, email: toEmail, segment, ok })
  }

  const sent = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length
  const skipped = allProfiles.length - results.length

  return NextResponse.json({
    campaign,
    total_users: allProfiles.length,
    sent,
    failed,
    skipped,
    results,
  })
}
