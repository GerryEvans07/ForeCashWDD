'use server'

// Aksi halaman Transaksi (pengganti blok "if POST" di transaksi.php & transaksi_edit.php).
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { wajibLogin } from '@/lib/auth'
import { angka, gagal, sukses, teks, type Hasil } from '@/lib/aksi'
import { ambilFile, hapusStruk, simpanStruk } from '@/lib/struk'
import { hariIni } from '@/lib/tanggal'
import type { Jenis } from '@/lib/data'

type TxValid = {
  jenis: Jenis; nominal: number; keterangan: string; tanggal: string
  wallet_id: number; wallet_tujuan_id: number | null; category_id: number | null
}

/** Validasi isian transaksi (port dari validate_tx() di includes/tx_form.php). */
async function validasiTx(supabase: SupabaseClient, uid: string, fd: FormData): Promise<TxValid | string> {
  const j = teks(fd, 'jenis')
  const jenis = (['pemasukan', 'pengeluaran', 'transfer'] as const).find((x) => x === j)
  const nominal = Math.round(angka(fd, 'nominal') * 100) / 100
  let keterangan = teks(fd, 'keterangan').slice(0, 150)
  const tanggal = teks(fd, 'tanggal')
  const wallet = angka(fd, 'wallet_id')
  const tujuan = angka(fd, 'wallet_tujuan_id')
  const kat = angka(fd, 'category_id')

  if (!jenis) return 'Jenis transaksi tidak valid.'
  if (nominal <= 0) return 'Nominal harus lebih dari 0.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || Number.isNaN(Date.parse(tanggal))) return 'Tanggal tidak valid.'
  if (tanggal > hariIni()) return 'Tanggal tidak boleh melebihi hari ini.'

  const { data: wallets } = await supabase.from('wallets').select('id').eq('user_id', uid)
  const milik = (id: number) => (wallets ?? []).some((w) => w.id === id)
  if (!milik(wallet)) return 'Wallet tidak valid.'

  if (jenis === 'transfer') {
    if (!milik(tujuan)) return 'Pilih wallet tujuan.'
    if (tujuan === wallet) return 'Wallet asal dan tujuan tidak boleh sama.'
    if (!keterangan) keterangan = 'Transfer antar wallet'
    return { jenis, nominal, keterangan, tanggal, wallet_id: wallet, wallet_tujuan_id: tujuan, category_id: null }
  }

  const { data: c } = await supabase.from('categories').select('id').eq('id', kat).eq('jenis', jenis).maybeSingle()
  if (!c) return 'Pilih kategori yang sesuai.'
  if (!keterangan) return 'Keterangan wajib diisi.'
  return { jenis, nominal, keterangan, tanggal, wallet_id: wallet, wallet_tujuan_id: null, category_id: kat }
}

function segarkan() {
  revalidatePath('/transaksi')
  revalidatePath('/beranda')
}

export async function tambahTransaksi(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const v = await validasiTx(supabase, profil.id, fd)
  if (typeof v === 'string') return gagal(v)

  let bukti: string | null = null
  const file = ambilFile(fd)
  if (file) {
    const up = await simpanStruk(supabase, profil.id, file)
    if (up.error) return gagal(up.error)
    bukti = up.path!
  }

  const { error } = await supabase.from('transactions').insert({ ...v, user_id: profil.id, bukti })
  if (error) {
    await hapusStruk(supabase, bukti)
    return gagal('Transaksi gagal disimpan: ' + error.message)
  }
  segarkan()
  return sukses('Transaksi tersimpan.')
}

export async function ubahTransaksi(id: number, _prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const { data: lama } = await supabase.from('transactions').select('id, bukti').eq('id', id).eq('user_id', profil.id).maybeSingle()
  if (!lama) return gagal('Transaksi tidak ditemukan.')

  const v = await validasiTx(supabase, profil.id, fd)
  if (typeof v === 'string') return gagal(v)

  // foto baru menggantikan foto lama; centang "hapus" menghapus foto tanpa pengganti
  let bukti: string | null = lama.bukti
  const file = ambilFile(fd)
  if (file) {
    const up = await simpanStruk(supabase, profil.id, file)
    if (up.error) return gagal(up.error)
    bukti = up.path!
  } else if (teks(fd, 'hapus_bukti')) {
    bukti = null
  }

  const { error } = await supabase.from('transactions').update({ ...v, bukti }).eq('id', id).eq('user_id', profil.id)
  if (error) return gagal('Transaksi gagal disimpan: ' + error.message)
  if (bukti !== lama.bukti) await hapusStruk(supabase, lama.bukti)

  segarkan()
  redirect('/transaksi?ok=ubah')
}

export async function hapusTransaksi(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const id = angka(fd, 'id')
  const { data } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', profil.id).select('bukti').maybeSingle()
  if (!data) return gagal('Transaksi tidak ditemukan.')
  await hapusStruk(supabase, data.bukti)
  segarkan()
  return sukses('Transaksi dihapus.')
}

export async function simpanBatasHarian(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const batas = Math.max(0, angka(fd, 'batas_harian'))
  const { error } = await supabase.from('profiles').update({ batas_harian: batas }).eq('id', profil.id)
  if (error) return gagal('Gagal menyimpan: ' + error.message)
  segarkan()
  revalidatePath('/pencapaian')
  revalidatePath('/petualangan')
  return sukses('Batas harian diperbarui.')
}

export async function tambahKategori(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const nama = teks(fd, 'nama').slice(0, 50)
  const jenis = teks(fd, 'jenis') === 'pemasukan' ? 'pemasukan' : 'pengeluaran'
  if (!nama) return gagal('Nama kategori wajib diisi.')
  const { error } = await supabase.from('categories').insert({ user_id: profil.id, nama, jenis })
  if (error) return gagal('Gagal menyimpan: ' + error.message)
  revalidatePath('/transaksi')
  return sukses('Kategori ditambahkan.')
}

export async function hapusKategori(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  await supabase.from('categories').delete().eq('id', angka(fd, 'id')).eq('user_id', profil.id)
  revalidatePath('/transaksi')
  return sukses('Kategori dihapus.')
}
