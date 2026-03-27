import { Suspense } from 'react'
import { loadSettingsData } from '@/app/actions/settings.actions'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const data = await loadSettingsData()

  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Laden...</div>}>
      <SettingsClient
        profile={data.profile}
        icp={data.icp}
        email={data.email}
      />
    </Suspense>
  )
}
