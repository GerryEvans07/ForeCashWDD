// Dipanggil oleh src/proxy.ts di setiap request:
// 1) memperbarui cookie sesi Supabase supaya login tidak tiba-tiba keluar,
// 2) mengarahkan ke /login kalau belum login tapi membuka halaman dalam.
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { RUTE_TERLINDUNGI } from '@/lib/navigation'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response // .env.local belum diisi

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const terlindungi = RUTE_TERLINDUNGI.some((r) => path === r || path.startsWith(r + '/'))
  if (!user && terlindungi) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.search = ''
    return NextResponse.redirect(login)
  }

  return response
}
