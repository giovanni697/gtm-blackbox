export default function EbookChapterLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-6 pb-20 pt-10 md:px-10 md:pt-16">
      <div className="h-3 w-20 rounded bg-scient-divider" />
      <div className="mt-3 h-9 w-72 rounded bg-scient-divider" />
      <div className="mt-4 h-3 w-32 rounded bg-scient-divider" />
      <div className="mt-12 flex flex-col gap-3">
        <div className="h-4 w-full rounded bg-scient-divider" />
        <div className="h-4 w-full rounded bg-scient-divider" />
        <div className="h-4 w-5/6 rounded bg-scient-divider" />
        <div className="mt-4 h-4 w-full rounded bg-scient-divider" />
        <div className="h-4 w-4/5 rounded bg-scient-divider" />
        <div className="h-4 w-full rounded bg-scient-divider" />
        <div className="mt-4 h-4 w-2/3 rounded bg-scient-divider" />
        <div className="h-4 w-full rounded bg-scient-divider" />
        <div className="h-4 w-5/6 rounded bg-scient-divider" />
      </div>
      <div className="mt-16 border-t border-scient-divider pt-10">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-20 rounded bg-scient-divider" />
          <div className="h-20 rounded bg-scient-divider" />
        </div>
      </div>
    </div>
  )
}
