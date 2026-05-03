import { isPersonalEmail } from './personal-email-domains'

/**
 * Data limite para users com e-mail pessoal migrarem para e-mail corporativo.
 *
 * Setada em 2026-05-16 23:59 BRT (14 dias após o lançamento do bloqueio em 2026-05-02).
 * Após essa data, login com e-mail pessoal deve ser bloqueado.
 *
 * Para alterar: edite o valor abaixo e abra um PR.
 */
export const EMAIL_MIGRATION_CUTOFF = new Date('2026-05-16T23:59:59-03:00')

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type MigrationStatus =
  | { needsMigration: false }
  | {
      needsMigration: true
      daysLeft: number
      expired: boolean
      cutoffDate: string // ISO string para serialização Server → Client Component
    }

/**
 * Avalia se o usuário (identificado por e-mail) precisa migrar e
 * quantos dias faltam até o cutoff.
 *
 * Retorna `needsMigration: false` para qualquer um destes casos:
 * - e-mail vazio/null
 * - e-mail corporativo (não está em PERSONAL_EMAIL_DOMAINS)
 */
export function getMigrationStatus(email: string | null | undefined): MigrationStatus {
  if (!email || !isPersonalEmail(email)) return { needsMigration: false }

  const now = Date.now()
  const cutoff = EMAIL_MIGRATION_CUTOFF.getTime()
  const diffMs = cutoff - now
  const daysLeft = Math.ceil(diffMs / MS_PER_DAY)

  return {
    needsMigration: true,
    daysLeft: Math.max(0, daysLeft),
    expired: diffMs < 0,
    cutoffDate: EMAIL_MIGRATION_CUTOFF.toISOString(),
  }
}

/**
 * Formata o cutoff date para exibição em PT-BR.
 * Ex: "16 de maio"
 */
export function formatCutoffDate(): string {
  return EMAIL_MIGRATION_CUTOFF.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  })
}
