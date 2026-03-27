import { AppSidebar } from '@/components/layout/app-sidebar'
import { requireAuth } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()

  return (
    <div className="flex h-screen bg-muted">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
