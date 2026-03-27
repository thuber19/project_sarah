import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: businessProfile } = await supabase
    .from('business_profiles')
    .select('id, company_name, industry')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!businessProfile) redirect('/onboarding')

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{businessProfile.company_name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{businessProfile.industry} · {user.email}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Business-Profil eingerichtet. Als nächstes: Lead-Suche starten.
          </p>
        </div>
      </div>
    </div>
  )
}
