import { createServiceClient } from '@/lib/supabase/service'
import type { UserUsage } from './types'

export async function fetchUserUsage(userId: string): Promise<UserUsage | null> {
  const sb = createServiceClient()

  const [{ data: profile }, { data: diag }, { data: forecast }] = await Promise.all([
    sb.from('profiles').select('id, nome').eq('id', userId).single(),
    sb
      .from('diagnosticos')
      .select('gargalo_pilar')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb.from('forecast_sessions').select('id').eq('user_id', userId).limit(1).maybeSingle(),
  ])

  const { data: authData } = await sb.auth.admin.getUserById(userId)
  if (!profile || !authData?.user) return null

  const profileRow = profile as { id: string; nome: string }
  const diagRow = diag as { gargalo_pilar: number } | null

  return {
    userId,
    email: authData.user.email ?? '',
    nome: profileRow.nome,
    didDiagnostico: !!diagRow,
    didForecast: !!forecast,
    openedTemplates: [],
    readChapters: 0,
    gargalo: (diagRow?.gargalo_pilar ?? null) as UserUsage['gargalo'],
  }
}
