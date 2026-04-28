import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ForecastWizardForm } from './ForecastWizardForm'

export default async function ForecastWizardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('empresa, faturamento_atual')
    .eq('id', user!.id)
    .single()

  if (!profile?.faturamento_atual) {
    redirect('/diagnostico/onboarding')
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Forecast · Wizard
      </p>
      <h1 className="mt-2 font-sora text-2xl font-light leading-tight text-scient-dark md:text-3xl">
        Calcular Capacity
      </h1>
      <p className="mt-3 font-sora text-sm leading-relaxed text-scient-gray">
        7 blocos de inputs. Você pode usar valores padrão (benchmarks de mercado) e ajustar só o que
        sabe. Empresa: <strong>{profile.empresa ?? '—'}</strong>
      </p>

      <ForecastWizardForm />
    </div>
  )
}
