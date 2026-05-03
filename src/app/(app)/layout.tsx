import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { MigrationBanner } from '@/components/auth/MigrationBanner'
import { getMigrationStatus } from '@/lib/auth/email-migration'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome')
    .eq('id', user.id)
    .single()

  const userMeta = {
    nome: profile?.nome ?? null,
    email: user.email ?? null,
  }

  const migration = getMigrationStatus(user.email)

  return (
    <div className="flex min-h-screen flex-col bg-scient-bg">
      {migration.needsMigration ? <MigrationBanner status={migration} /> : null}
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar user={userMeta} />
        <MobileNav user={userMeta} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
