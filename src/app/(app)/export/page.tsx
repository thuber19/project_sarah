import { AppTopbar } from '@/components/layout/app-topbar'
import { ExportContent } from './export-content'

export default function ExportPage() {
  // TODO: Replace with real data from Supabase
  const hasConnection = false

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar title="Export & CRM" />
      <ExportContent hasConnection={hasConnection} />
    </div>
  )
}
