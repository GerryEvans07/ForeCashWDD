'use server'

// Aksi halaman Prediksi (port dari blok "if POST" di php-version/pages/prediksi.php).
import { revalidatePath } from 'next/cache'
import { wajibLogin } from '@/lib/auth'
import { angka, gagal, sukses, teks, type Hasil } from '@/lib/aksi'
import { hariIni } from '@/lib/tanggal'

function segarkan() {
  revalidatePath('/prediksi')
  revalidatePath('/beranda')
  revalidatePath('/pencapaian')
  revalidatePath('/petualangan')
}

export async function tambahJadwal(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const sumber = teks(fd, 'sumber').slice(0, 50)
  const nominal = angka(fd, 'nominal')
  const tanggal = teks(fd, 'tanggal')
  if (!sumber || nominal <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return gagal('Sumber, nominal, dan tanggal wajib diisi.')

  const { error } = await supabase.from('income_schedules').insert({ user_id: profil.id, sumber, nominal, tanggal_perkiraan: tanggal })
  if (error) return gagal('Gagal menyimpan: ' + error.message)
  segarkan()
  return sukses('Jadwal pemasukan ditambahkan.')
}

/** Uang sudah datang: jadwal ditandai diterima dan otomatis dicatat sebagai pemasukan. */
export async function jadwalDiterima(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const id = angka(fd, 'id')
  const walletId = angka(fd, 'wallet_id')

  const { data: w } = await supabase.from('wallets').select('id').eq('id', walletId).eq('user_id', profil.id).maybeSingle()
  if (!w) return gagal('Pilih wallet tujuan.')

  // ubah status dulu (hanya kalau masih "menunggu"), supaya klik dua kali tidak mencatat dua kali
  const { data: s } = await supabase
    .from('income_schedules').update({ status: 'diterima' })
    .eq('id', id).eq('user_id', profil.id).eq('status', 'menunggu')
    .select('sumber, nominal').maybeSingle()
  if (!s) return gagal('Jadwal tidak ditemukan atau sudah diterima.')

  const { data: kat } = await supabase.from('categories').select('id').is('user_id', null).eq('nama', 'Uang Saku').eq('jenis', 'pemasukan').maybeSingle()
  const { error } = await supabase.from('transactions').insert({
    user_id: profil.id, wallet_id: walletId, category_id: kat?.id ?? null, jenis: 'pemasukan',
    nominal: s.nominal, keterangan: s.sumber, tanggal: hariIni(),
  })
  if (error) {
    await supabase.from('income_schedules').update({ status: 'menunggu' }).eq('id', id).eq('user_id', profil.id)
    return gagal('Gagal mencatat transaksi: ' + error.message)
  }
  segarkan()
  revalidatePath('/transaksi')
  return sukses('Pemasukan diterima dan dicatat ke transaksi.')
}

export async function hapusJadwal(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  await supabase.from('income_schedules').delete().eq('id', angka(fd, 'id')).eq('user_id', profil.id)
  segarkan()
  return sukses('Jadwal dihapus.')
}
