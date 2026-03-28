import { AppSidebar } from '@/components/layout/app-sidebar'
import { AgentChat } from '@/components/chat/agent-chat'
import { requireAuth } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase } = await requireAuth()

  // Best-effort display name: business profile → user metadata → email prefix
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('company_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const rawName =
    (profile?.company_name as string | null) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split('@')[0] ??
    'User'

  const initials = rawName.slice(0, 2).toUpperCase()
  const email = user.email ?? ''

  return (
    <div className="flex h-screen bg-muted">
      <AppSidebar displayName={rawName} email={email} initials={initials} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
      <AgentChat />
    </div>
  )
}
