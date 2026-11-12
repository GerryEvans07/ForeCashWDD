// Kirim email selamat datang untuk akun yang baru dibuat.
// Dipanggil setelah daftar (form email) dan dari /auth/callback (login Google pertama kali).
// Hanya dikirim jika akun dibuat kurang dari 10 menit yang lalu, jadi tidak bisa dipakai untuk spam.
import { NextResponse } from 'next/server'
import { getSesi } from '@/lib/auth'
import { emailSelamatDatang } from '@/lib/email'

export async function POST() {
  const sesi = await getSesi()
  if (!sesi?.user.email) return NextResponse.json({ ok: false }, { status: 401 })

  const umurMenit = (Date.now() - new Date(sesi.user.created_at).getTime()) / 60000
  if (umurMenit > 10) return NextResponse.json({ ok: false, alasan: 'bukan akun baru' })

  const hasil = await emailSelamatDatang(sesi.user.email, sesi.profil.nama)
  return NextResponse.json(hasil)
}
