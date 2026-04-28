import { ChapterNav } from '@/components/ebook/ChapterNav'
import { listChapters } from '@/lib/content/readEbook'

export default async function EbookLayout({ children }: { children: React.ReactNode }) {
  const chapters = await listChapters()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <ChapterNav chapters={chapters} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
