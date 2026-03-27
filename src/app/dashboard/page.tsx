import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOutAction } from '@/app/actions/auth.actions'

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{businessProfile.company_name}</h1>
            <p className="mt-1 text-sm text-zinc-500">{businessProfile.industry} · {user.email}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Abmelden
            </button>
          </form>
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
