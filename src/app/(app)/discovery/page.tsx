import { requireAuth } from '@/lib/supabase/server'
import { getIcpDefaultsAction } from '@/app/actions/discovery.actions'
import { DiscoveryClient } from '@/components/discovery/discovery-client'

export default async function DiscoveryPage() {
  const { user } = await requireAuth()
  const initialIcp = await getIcpDefaultsAction()
  const userInitials = user.email?.slice(0, 2).toUpperCase() ?? 'SP'

  return <DiscoveryClient initialIcp={initialIcp} userInitials={userInitials} />
}
