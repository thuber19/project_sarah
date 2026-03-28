import { Suspense } from 'react'
import { loadSettingsData } from '@/app/actions/settings.actions'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const result = await loadSettingsData()

  if (!result.success) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Einstellungen konnten nicht geladen werden.
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Laden...
        </div>
      }
    >
      <SettingsClient
        profile={result.data.profile}
        icp={result.data.icp}
        email={result.data.email}
      />
    </Suspense>
  )
}
