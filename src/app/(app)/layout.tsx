import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { AgentChat } from '@/components/chat/agent-chat'
import { requireAuth } from '@/lib/supabase/server'
import { getBusinessProfile } from '@/lib/queries/cached'

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

  return (
    <div className="flex h-screen bg-muted">
      <div className="hidden lg:flex">
        <AppSidebar displayName={rawName} email={email} initials={initials} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
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
    </div>
  )
}
