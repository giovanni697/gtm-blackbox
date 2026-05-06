export type Segment =
  | 'no_profile' // cadastrou, nunca preencheu empresa
  | 'onboarded' // tem perfil, jamais iniciou o diagnóstico
  | 'dropped' // iniciou o wizard mas não concluiu
  | 'diagnosed' // diagnóstico ✓, forecast ✗
  | 'power_user' // diagnóstico ✓ + forecast ✓

export interface ProfileRow {
  id: string
  nome: string
  empresa: string | null
  cargo: string | null
  setor: string | null
  diagnostico_concluido: boolean
  forecast_concluido: boolean
  created_at: string
}

export interface DiagnosticoRow {
  user_id: string
  estagio: string
  gargalo_pilar: number
  percentual_maturidade: number
  ai_ready: boolean
  created_at: string
}

export interface WizardRow {
  user_id: string
}

export function getSegment(
  profile: ProfileRow,
  hasDiagnostico: boolean,
  hasWizard: boolean,
): Segment {
  if (!profile.empresa) return 'no_profile'
  if (profile.diagnostico_concluido && profile.forecast_concluido) return 'power_user'
  if (profile.diagnostico_concluido) return 'diagnosed'
  if (hasWizard) return 'dropped'
  return 'onboarded'
}

export const PILAR_NAMES: Record<number, string> = {
  1: 'Geração de Demanda',
  2: 'Conversão',
  3: 'Expansão',
  4: 'Retenção',
  5: 'Monetização',
}
