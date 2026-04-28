import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildForecastClaudePrompt, buildForecastTxt } from '@/lib/forecast/prompt-builder'
import type { ForecastInput, ForecastOutput } from '@/lib/forecast/types'
import { ExportClient } from '@/app/(app)/diagnostico/exportar/ExportClient'

export default async function ForecastExportar() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('empresa')
    .eq('id', user!.id)
    .single()

  const { data: session } = await supabase
    .from('forecast_sessions')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!session || !profile?.empresa) redirect('/forecast/wizard')

  const inputs = session.inputs as ForecastInput
  const outputs = session.outputs as ForecastOutput

  const txt = buildForecastTxt(profile.empresa, inputs, outputs)
  const prompt = buildForecastClaudePrompt(profile.empresa, inputs, outputs)

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Forecast · Exportar
      </p>
      <h1 className="mt-2 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
        Plano de Capacity exportável
      </h1>
      <p className="mt-3 max-w-2xl font-sora text-sm leading-relaxed text-scient-gray">
        TXT pronto para colar em e-mail/doc. Prompt Claude para gerar artefato visual com a
        identidade da sua empresa.
      </p>

      <ExportClient txt={txt} prompt={prompt} empresa={profile.empresa} />
    </div>
  )
}
