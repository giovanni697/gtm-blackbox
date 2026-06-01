export default function ContentAdminLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-10 md:px-8">
      <div className="h-3 w-20 rounded bg-scient-divider" />
      <div className="mt-2 h-7 w-32 rounded bg-scient-divider" />
      <div className="mt-1 h-4 w-80 rounded bg-scient-divider" />
      <div className="mt-8 flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-scient-divider" />
        ))}
      </div>
      <div className="mt-8 flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-scient-divider" />
        ))}
      </div>
    </div>
  )
}
