// Pengganti current_user() dan require_login() di versi PHP.
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Role = 'mahasiswa' | 'orangtua'

export type Profil = {
  id: string
  nama: string
  role: Role
  kode_hubung: string | null
  batas_harian: number
  avatar: string
}

/** Ambil user yang sedang login + profilnya. null kalau belum login.
 *  cache(): dalam satu kali buka halaman, query ini hanya jalan sekali. */
export const getSesi = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, nama, role, kode_hubung, batas_harian, avatar')
    .eq('id', user.id)
    .single()
  if (!data) return null

  const profil: Profil = { ...data, batas_harian: Number(data.batas_harian) }
  return { supabase, user, profil }
})

/** Wajib login. Kalau role diisi, user dengan role lain diarahkan ke halaman utamanya. */
export async function wajibLogin(role?: Role) {
  const sesi = await getSesi()
  if (!sesi) redirect('/login')
  if (role && sesi.profil.role !== role) redirect(halamanUtama(sesi.profil.role))
  return sesi
}

export function halamanUtama(role: Role) {
  return role === 'orangtua' ? '/pantau' : '/beranda'
}
