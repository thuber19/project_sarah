import { AppSidebar } from '@/components/layout/app-sidebar'
import { requireAuth } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()

  return (
    <div className="flex h-screen bg-muted">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
