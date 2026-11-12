// Tujuan kembali setelah: login Google, klik link konfirmasi email, klik link lupa password.
// Supabase mengirim ?code=..., di sini ditukar menjadi sesi login (cookie).
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailSelamatDatang } from '@/lib/email'
import { halamanUtama, type Role } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // hanya izinkan tujuan di dalam situs ini (mencegah redirect ke situs lain)
      if (next && next.startsWith('/') && !next.startsWith('//')) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      const { data: profil } = await supabase.from('profiles').select('nama, role').eq('id', data.user.id).single()

      // akun baru (misalnya login Google pertama kali): kirim email selamat datang
      const umurMenit = (Date.now() - new Date(data.user.created_at).getTime()) / 60000
      if (umurMenit < 10 && data.user.email && profil) {
        await emailSelamatDatang(data.user.email, profil.nama).catch(() => null)
      }

      return NextResponse.redirect(`${origin}${halamanUtama((profil?.role ?? 'mahasiswa') as Role)}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`)
}
