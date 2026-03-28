import { Bell } from 'lucide-react'
import { requireAuth } from '@/lib/supabase/server'
import { getGroupedNotificationsAction } from '@/app/actions/agent-logs.actions'
import { EmptyState } from '@/components/shared/empty-state'
import { AppTopbar } from '@/components/layout/app-topbar'
import { MobileHeader } from '@/components/layout/mobile-header'
import { NotificationsClient } from './notifications-client'

export default async function NotificationsPage() {
  await requireAuth()

  const result = await getGroupedNotificationsAction()
  const groups = result.success ? result.data : []
  const hasNotifications = groups.length > 0

  return (
    <div className="flex h-full flex-1 flex-col">
      {hasNotifications ? (
        <>
          <div className="hidden lg:block">
            <NotificationsClient groups={groups} variant="desktop" />
          </div>
          <div className="lg:hidden">
            <NotificationsClient groups={groups} variant="mobile" />
          </div>
        </>
      ) : (
        <>
          <div className="hidden lg:block">
            <AppTopbar title="Benachrichtigungen" />
          </div>
          <MobileHeader title="Benachrichtigungen" backHref="/dashboard" />
          <div className="flex flex-1 items-center justify-center p-8">
            <EmptyState
              icon={Bell}
              title="Noch keine Benachrichtigungen"
              description="Sobald es Aktivitäten gibt, wirst du hier benachrichtigt."
              primaryAction={{
                label: 'Zum Dashboard',
                href: '/dashboard',
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
