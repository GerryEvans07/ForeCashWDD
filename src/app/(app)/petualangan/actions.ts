'use server'

import { revalidatePath } from 'next/cache'
import { wajibLogin } from '@/lib/auth'
import { gagal, sukses, teks, type Hasil } from '@/lib/aksi'
import { PETS } from '@/lib/pets'

/** Pilih teman hemat yang menemani di peta & banner (hanya satu). */
export async function pakaiPet(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase } = await wajibLogin('mahasiswa')
  const pet = teks(fd, 'pet')
  if (!PETS[pet]) return gagal('Teman hemat tidak dikenal.')
  const { error } = await supabase.rpc('pakai_pet', { p_pet: pet })
  if (error) return gagal(error.message)
  revalidatePath('/petualangan')
  revalidatePath('/beranda')
  revalidatePath('/prediksi')
  return sukses(`${PETS[pet].nama} sekarang menemanimu.`)
}
