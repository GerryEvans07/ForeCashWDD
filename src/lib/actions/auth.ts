'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Tombol Keluar di sidebar. */
export async function keluar() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
