'use server'

import { requireAuth } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ApiResponse } from '@/lib/api-response'
import { fail } from '@/lib/api-response'

export async function signOutAction(): Promise<ApiResponse<null>> {
  try {
    const { supabase } = await requireAuth()
    await supabase.auth.signOut()
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    console.error('[Auth] Sign out failed:', error)
    return fail('LOGOUT_FAILED', 'Abmeldung fehlgeschlagen')
  }
  redirect('/login')
}
