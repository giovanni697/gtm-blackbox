import { UnsubscribeForm } from './UnsubscribeForm'

export default function EmailPreferencesPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-scient-muted font-sora text-3xs uppercase tracking-widest">
        Preferências de e-mail
      </p>
      <h1 className="text-scient-ink mt-2 font-sora text-3xl font-light">Descadastrar</h1>
      <UnsubscribeForm />
    </div>
  )
}
