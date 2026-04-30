export default function DiagnosticoLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-6 py-12 md:px-10 md:py-16">
      <div className="h-3 w-20 rounded bg-scient-divider" />
      <div className="mt-3 h-9 w-72 rounded bg-scient-divider" />
      <div className="mt-4 h-4 w-full rounded bg-scient-divider" />
      <div className="mt-1.5 h-4 w-2/3 rounded bg-scient-divider" />
      <div className="mt-10 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded bg-scient-divider" />
        ))}
      </div>
      <div className="mt-8 h-11 w-48 rounded bg-scient-divider" />
    </div>
  )
}
