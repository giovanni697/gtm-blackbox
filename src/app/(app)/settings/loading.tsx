export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-10 md:px-8">
      <div className="h-7 w-24 rounded bg-scient-divider" />
      <div className="mt-2 h-4 w-64 rounded bg-scient-divider" />
      <div className="mt-8 h-px w-full rounded bg-scient-divider" />
      <div className="mt-6 flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 rounded bg-scient-divider" />
        ))}
      </div>
      <div className="mt-6 h-32 rounded bg-scient-divider" />
    </div>
  )
}
