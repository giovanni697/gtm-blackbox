export default function WizardLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse px-6 py-12 md:px-10 md:py-16">
      <div className="h-2 w-full rounded-full bg-scient-divider" />
      <div className="mt-8 h-6 w-16 rounded bg-scient-divider" />
      <div className="mt-4 h-7 w-80 rounded bg-scient-divider" />
      <div className="mt-8 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 rounded bg-scient-divider" />
        ))}
      </div>
      <div className="mt-8 flex justify-between">
        <div className="h-10 w-24 rounded bg-scient-divider" />
        <div className="h-10 w-24 rounded bg-scient-divider" />
      </div>
    </div>
  )
}
