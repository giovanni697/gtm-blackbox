export default function HubLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-6 py-12 md:px-10 md:py-16">
      <div className="h-3 w-16 rounded bg-scient-divider" />
      <div className="mt-3 h-9 w-56 rounded bg-scient-divider" />
      <div className="mt-4 h-4 w-full max-w-2xl rounded bg-scient-divider" />
      <div className="mt-1.5 h-4 w-3/4 max-w-lg rounded bg-scient-divider" />
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded bg-scient-divider" />
        ))}
      </div>
    </div>
  )
}
