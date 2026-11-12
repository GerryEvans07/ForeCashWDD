'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { wajibLogin } from '@/lib/auth'
import { gagal, teks, type Hasil } from '@/lib/aksi'

/** Orang tua memasukkan kode hubung dari akun anak. */
export async function hubungkanAnak(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase } = await wajibLogin('orangtua')
  const kode = teks(fd, 'kode').toUpperCase()
  if (!/^[A-Z0-9]{8}$/.test(kode)) return gagal('Kode hubung terdiri dari 8 huruf/angka.')

  const { data, error } = await supabase.rpc('hubungkan_anak', { kode })
  if (error) return gagal(error.message)
  const anak = (data as { id: string; nama: string }[] | null)?.[0]
  revalidatePath('/pantau')
  redirect(`/pantau?anak=${anak?.id ?? ''}&ok=1`)
}
