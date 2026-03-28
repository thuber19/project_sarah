import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { AgentChat } from '@/components/chat/agent-chat'
import { requireAuth } from '@/lib/supabase/server'
import { getBusinessProfile } from '@/lib/queries/cached'
import { ScoringProgressBanner } from '@/components/layout/scoring-progress-banner'
import { getActiveRun } from '@/app/actions/scoring.actions'
import { Toaster } from 'sonner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAuth()

  // Best-effort display name: business profile → user metadata → email prefix
  // Uses React.cache() — deduplicated if child pages also call getBusinessProfile()
  const profile = await getBusinessProfile()

  // Onboarding redirect: new users without a business profile go to onboarding
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? '/'
  const onOnboarding = pathname.startsWith('/onboarding')
  if (!profile && !onOnboarding) {
    redirect('/onboarding/step-1')
  }

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
      <div className="hidden lg:flex">
        <AppSidebar displayName={rawName} email={email} initials={initials} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <ScoringProgressBanner initialRun={activeRun} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex flex-1 flex-col overflow-y-auto pb-16 lg:pb-0"
        >
          {children}
        </main>
      </div>
      <MobileTabBar />
      <AgentChat />
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
