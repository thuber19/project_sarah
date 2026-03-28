import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { AgentChat } from '@/components/chat/agent-chat'
import { requireAuth } from '@/lib/supabase/server'
import { ScoringProgressBanner } from '@/components/layout/scoring-progress-banner'
import { getActiveRun } from '@/app/actions/scoring.actions'
import { Toaster } from 'sonner'

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

  const activeRun = await getActiveRun()

  return (
    <div className="flex h-screen bg-muted">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Zum Hauptinhalt springen
      </a>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <AppSidebar displayName={rawName} email={email} initials={initials} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <ScoringProgressBanner initialRun={activeRun} />
        <main id="main-content" className="flex flex-1 flex-col overflow-y-auto pb-16 md:pb-0">{children}</main>
      </div>
      {/* Mobile bottom tab bar — hidden on desktop */}
      <MobileTabBar />
      <AgentChat />
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
