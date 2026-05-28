export default function ForecastResultadoLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-6 py-12 md:px-10 md:py-16">
      <div className="h-3 w-24 rounded bg-scient-divider" />
      <div className="mt-3 h-9 w-72 rounded bg-scient-divider" />
      <div className="mt-8 grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded bg-scient-divider" />
        ))}
      </div>
      <div className="mt-8 h-72 rounded bg-scient-divider" />
      <div className="mt-6 flex flex-col gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <div key={i} className="h-10 rounded bg-scient-divider" />
        ))}
      </div>
    </div>
  )
}
