import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import type { Decision } from './decisores'
import type { EmailType, RenderedEmail } from './types'

const EMAILS_DIR = path.join(process.cwd(), 'content', 'emails', 'onboarding')

// Mapeia novos tipos da régua para os MDX dos drips existentes
const CADENCE_ALIAS: Record<string, string> = {
  cad_du01_welcome: 'drip_d0_welcome',
  cad_du03_radar: 'drip_d2_radar',
  cad_du05_capitulo: 'drip_d5_capitulo',
  cad_du07_template: 'drip_d9_template',
  cad_du15_checkpoint: 'drip_d14_verification',
  cad_du30_final: 'drip_d30_checkpoint',
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildShell(subject: string, bodyHtml: string, ctaText: string, ctaUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Sora,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:48px 24px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#585858;">SCIENT · GTM BlackBox</p>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:28px;font-weight:300;line-height:1.2;color:#111111;">${escapeHtml(subject)}</h1>
        </td></tr>
        <tr><td style="padding-bottom:32px;font-size:14px;line-height:1.6;color:#111111;">${bodyHtml}</td></tr>
        <tr><td style="padding-bottom:32px;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#0030E8;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:13px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">${escapeHtml(ctaText)}</a>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:13px;line-height:1.5;color:#111111;">Giovanni Salvador<br><span style="color:#585858;">CEO @ SCIENT</span></p>
          <p style="margin:6px 0 0;font-size:12px;color:#585858;">
            <a href="https://linkedin.com/in/giovannibsalvador" style="color:#0030E8;text-decoration:none;">linkedin.com/in/giovannibsalvador</a>
          </p>
        </td></tr>
        <tr><td style="border-top:1px solid #E6E6E6;padding-top:24px;">
          <p style="margin:0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#585858;">Scientific AI Native GTM</p>
          <p style="margin:8px 0 0;font-size:10px;color:#585858;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/email-preferences" style="color:#585858;">não quero mais receber</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function renderScientEmail(
  type: EmailType,
  decision: Decision,
): Promise<RenderedEmail> {
  const resolvedType = CADENCE_ALIAS[type] ?? type
  const filename = `${resolvedType}__${decision.variant}.mdx`
  const filepath = path.join(EMAILS_DIR, filename)

  let raw: string
  try {
    raw = await fs.readFile(filepath, 'utf-8')
  } catch {
    const fallback = path.join(EMAILS_DIR, `${type}__default.mdx`)
    raw = await fs.readFile(fallback, 'utf-8')
  }

  const parsed = matter(raw)
  const { subject, ctaText, ctaUrl } = parsed.data as {
    subject: string
    ctaText: string
    ctaUrl: string
  }

  let bodyHtml = parsed.content
  for (const [key, value] of Object.entries(decision.payload)) {
    bodyHtml = bodyHtml.replaceAll(`{{${key}}}`, String(value ?? ''))
  }
  bodyHtml = bodyHtml
    .trim()
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  let finalSubject = subject
  let finalCtaUrl = ctaUrl
  for (const [key, value] of Object.entries(decision.payload)) {
    finalSubject = finalSubject.replaceAll(`{{${key}}}`, String(value ?? ''))
    finalCtaUrl = finalCtaUrl.replaceAll(`{{${key}}}`, String(value ?? ''))
  }

  return {
    subject: finalSubject,
    html: buildShell(finalSubject, bodyHtml, ctaText, finalCtaUrl),
    from: 'Giovanni Salvador <giovanni@mail.scient.cc>',
    replyTo: 'giovanni@scient.cc',
  }
}
