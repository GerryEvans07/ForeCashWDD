// Laporan bulanan (port dari report_data() di php-version/includes/report.php).
// Transfer antar wallet tidak dihitung. Dipakai halaman Laporan dan Pantau Anak.
import type { SupabaseClient } from '@supabase/supabase-js'
import { rentangBulan } from './tanggal.ts'

export type BarisLaporan = { jenis: string; nominal: number; kategori: string | null }
export type Laporan = {
  masuk: number
  keluar: number
  /** pengeluaran per kategori, terbesar dulu */
  perKategori: { kategori: string; total: number }[]
  /** persen pemasukan yang tidak terpakai; null kalau belum ada pemasukan */
  rasio: number | null
}

/** pembulatan seperti round() di PHP (0,5 menjauhi nol) */
const bulat = (x: number) => Math.sign(x) * Math.round(Math.abs(x))

/** Hitung ringkasan dari daftar transaksi (fungsi murni, diuji di tests/laporan.test.ts). */
export function ringkasLaporan(baris: BarisLaporan[]): Laporan {
  let masuk = 0
  let keluar = 0
  const per = new Map<string, number>()
  for (const b of baris) {
    const n = Number(b.nominal)
    if (b.jenis === 'pemasukan') masuk += n
    if (b.jenis === 'pengeluaran') {
      keluar += n
      const k = b.kategori ?? 'Tanpa kategori'
      per.set(k, (per.get(k) ?? 0) + n)
    }
  }
  const perKategori = [...per].map(([kategori, total]) => ({ kategori, total })).sort((a, b) => b.total - a.total)
  const rasio = masuk > 0 ? bulat(((masuk - keluar) / masuk) * 100) : null
  return { masuk, keluar, perKategori, rasio }
}

/** Ambil transaksi satu bulan dari Supabase lalu ringkas. */
export async function ambilLaporan(supabase: SupabaseClient, uid: string, bulan: string): Promise<Laporan> {
  const [dari, sampai] = rentangBulan(bulan)
  const { data, error } = await supabase
    .from('transactions')
    .select('jenis, nominal, kategori:categories(nama)')
    .eq('user_id', uid).in('jenis', ['pemasukan', 'pengeluaran'])
    .gte('tanggal', dari).lt('tanggal', sampai)
  if (error) throw error
  const rows = (data ?? []) as unknown as { jenis: string; nominal: number; kategori: { nama: string } | null }[]
  return ringkasLaporan(rows.map((r) => ({ jenis: r.jenis, nominal: Number(r.nominal), kategori: r.kategori?.nama ?? null })))
}
