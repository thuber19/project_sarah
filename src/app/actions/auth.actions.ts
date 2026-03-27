'use server'

import { requireAuth } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOutAction() {
  const { supabase } = await requireAuth()
  await supabase.auth.signOut()
  redirect('/login')
}
