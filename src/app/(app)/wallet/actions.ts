'use server'

// Aksi halaman Kelola Wallet (port dari php-version/pages/wallet.php).
import { revalidatePath } from 'next/cache'
import { wajibLogin } from '@/lib/auth'
import { angka, gagal, sukses, teks, type Hasil } from '@/lib/aksi'

const TIPE = ['tunai', 'bank', 'ewallet'] as const

function isian(fd: FormData) {
  const t = teks(fd, 'tipe')
  return {
    nama: teks(fd, 'nama').slice(0, 50),
    tipe: TIPE.find((x) => x === t) ?? 'tunai',
    saldo_awal: Math.max(0, angka(fd, 'saldo_awal')),
  }
}

function segarkan() {
  revalidatePath('/wallet')
  revalidatePath('/beranda')
  revalidatePath('/transaksi')
}

export async function tambahWallet(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const w = isian(fd)
  if (!w.nama) return gagal('Nama wallet wajib diisi.')
  const { error } = await supabase.from('wallets').insert({ ...w, user_id: profil.id })
  if (error) return gagal('Gagal menyimpan: ' + error.message)
  segarkan()
  return sukses('Wallet ditambahkan.')
}

export async function ubahWallet(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const w = isian(fd)
  if (!w.nama) return gagal('Nama wallet wajib diisi.')
  const { data, error } = await supabase.from('wallets').update(w).eq('id', angka(fd, 'id')).eq('user_id', profil.id).select('id')
  if (error) return gagal('Gagal menyimpan: ' + error.message)
  if (!data?.length) return gagal('Wallet tidak ditemukan.')
  segarkan()
  return sukses('Wallet diperbarui.')
}

export async function hapusWallet(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const id = angka(fd, 'id')

  const [{ count: jumlahWallet }, { count: dipakai }] = await Promise.all([
    supabase.from('wallets').select('id', { count: 'exact', head: true }).eq('user_id', profil.id),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', profil.id).or(`wallet_id.eq.${id},wallet_tujuan_id.eq.${id}`),
  ])
  if ((jumlahWallet ?? 0) <= 1) return gagal('Minimal harus ada satu wallet.')
  if (dipakai) return gagal('Wallet masih dipakai di transaksi, tidak dapat dihapus.')

  await supabase.from('wallets').delete().eq('id', id).eq('user_id', profil.id)
  segarkan()
  return sukses('Wallet dihapus.')
}
