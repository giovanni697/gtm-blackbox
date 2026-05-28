export default function ResultadoLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-6 py-12 md:px-10 md:py-16">
      <div className="h-3 w-24 rounded bg-scient-divider" />
      <div className="mt-3 h-9 w-64 rounded bg-scient-divider" />
      <div className="mt-8 grid grid-cols-5 gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded bg-scient-divider" />
        ))}
      </div>
      <div className="mt-8 h-64 rounded bg-scient-divider" />
      <div className="mt-6 flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded bg-scient-divider" />
        ))}
      </div>
    </div>
  )
}
