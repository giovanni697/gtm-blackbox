export default function TemplateDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-6 py-12 md:px-10 md:py-16">
      <div className="h-3 w-16 rounded bg-scient-divider" />
      <div className="mt-6">
        <div className="h-3 w-32 rounded bg-scient-divider" />
        <div className="mt-3 h-9 w-80 rounded bg-scient-divider" />
        <div className="mt-4 h-3 w-40 rounded bg-scient-divider" />
      </div>
      <div className="mt-10 h-28 rounded bg-scient-divider" />
      <div className="mt-12 flex flex-col gap-3">
        <div className="h-3 w-24 rounded bg-scient-divider" />
        <div className="h-4 w-full rounded bg-scient-divider" />
        <div className="h-4 w-5/6 rounded bg-scient-divider" />
        <div className="h-4 w-4/5 rounded bg-scient-divider" />
      </div>
      <div className="mt-12 flex flex-col gap-3">
        <div className="h-3 w-32 rounded bg-scient-divider" />
        <div className="h-4 w-full rounded bg-scient-divider" />
        <div className="h-4 w-3/4 rounded bg-scient-divider" />
        <div className="h-4 w-full rounded bg-scient-divider" />
      </div>
    </div>
  )
}
