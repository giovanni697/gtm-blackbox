export type EmailType =
  // Drip legado (mantido para histórico, não enfileirado em novos signups)
  | 'drip_d0_welcome'
  | 'drip_d2_radar'
  | 'drip_d5_capitulo'
  | 'personal_giovanni'
  | 'drip_d9_template'
  | 'drip_d14_verification'
  | 'drip_d30_checkpoint'
  // Régua fixa — 10 e-mails em 30 dias úteis
  | 'cad_du01_welcome'
  | 'cad_du03_radar'
  | 'cad_du05_capitulo'
  | 'cad_du07_template'
  | 'cad_du10_forecast'
  | 'cad_du13_certificacao'
  | 'cad_du15_checkpoint'
  | 'cad_du18_giovanni'
  | 'cad_du22_certificacao'
  | 'cad_du30_final'

export type EmailStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'cancelled' | 'dry_run'

export interface QueuedEmail {
  id: number
  user_id: string
  email_type: EmailType
  variant: string | null
  payload: Record<string, unknown>
  scheduled_for: string
  status: EmailStatus
  attempts: number
  max_attempts: number
  last_error: string | null
  sent_at: string | null
  resend_message_id: string | null
}

export interface UserUsage {
  userId: string
  email: string
  nome: string
  didDiagnostico: boolean
  didForecast: boolean
  openedTemplates: string[]
  readChapters: number
  gargalo: 1 | 2 | 3 | 4 | 5 | null
}

export interface RenderedEmail {
  subject: string
  html?: string
  text?: string
  from: string
  replyTo?: string
}
