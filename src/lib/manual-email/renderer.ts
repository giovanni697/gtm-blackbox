const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gtm.scient.cc'

export function buildTrackedEmail(opts: {
  trackingId: string
  subject: string
  bodyHtml: string
  ctaText: string
  ctaUrl: string
  feedbackQuestion: string
}): string {
  const { trackingId, subject, bodyHtml, ctaText, ctaUrl, feedbackQuestion } = opts

  const trackedCtaUrl = `${BASE_URL}/api/track/click/${trackingId}?url=${encodeURIComponent(ctaUrl)}`
  const feedbackUrl = `${BASE_URL}/feedback/${trackingId}?q=${encodeURIComponent(feedbackQuestion)}`
  const trackedFeedbackUrl = `${BASE_URL}/api/track/click/${trackingId}?url=${encodeURIComponent(feedbackUrl)}`
  const pixelUrl = `${BASE_URL}/api/track/open/${trackingId}`
  const unsubUrl = `${BASE_URL}/email-preferences`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Sora,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:48px 24px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;">

        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#585858;">SCIENT · GTM BlackBox</p>
        </td></tr>

        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:26px;font-weight:300;line-height:1.2;color:#111111;">${esc(subject)}</h1>
        </td></tr>

        <tr><td style="padding-bottom:32px;font-size:14px;line-height:1.7;color:#111111;">${bodyHtml}</td></tr>

        <tr><td style="padding-bottom:32px;">
          <a href="${esc(trackedCtaUrl)}" style="display:inline-block;background:#0030E8;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:13px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">${esc(ctaText)}</a>
        </td></tr>

        <tr><td style="padding-bottom:32px;border-top:1px solid #E6E6E6;padding-top:28px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:500;color:#111111;">Uma pergunta rápida:</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#111111;font-style:italic;">${esc(feedbackQuestion)}</p>
          <a href="${esc(trackedFeedbackUrl)}" style="display:inline-block;border:1px solid #111111;color:#111111;text-decoration:none;padding:10px 20px;font-size:12px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">Responder</a>
        </td></tr>

        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:13px;line-height:1.5;color:#111111;">Giovanni Salvador<br><span style="color:#585858;">CEO @ SCIENT</span></p>
          <p style="margin:6px 0 0;font-size:12px;color:#585858;">
            <a href="https://linkedin.com/in/giovannibsalvador" style="color:#0030E8;text-decoration:none;">linkedin.com/in/giovannibsalvador</a>
          </p>
        </td></tr>

        <tr><td style="border-top:1px solid #E6E6E6;padding-top:20px;">
          <p style="margin:0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#585858;">Scientific AI Native GTM</p>
          <p style="margin:8px 0 0;font-size:10px;color:#585858;">
            <a href="${esc(unsubUrl)}" style="color:#585858;">não quero mais receber</a>
          </p>
        </td></tr>

        <tr><td>
          <img src="${esc(pixelUrl)}" width="1" height="1" alt="" style="display:block;border:0;outline:none;" />
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
