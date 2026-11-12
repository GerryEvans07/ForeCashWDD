// Supabase untuk Server Component, Server Action, dan Route Handler.
// Sesi login dibaca dari cookie, jadi query otomatis mengikuti RLS user yang login.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // dipanggil dari Server Component: aman diabaikan, sesi diperbarui oleh proxy.ts
          }
        },
      },
    },
  )
}
