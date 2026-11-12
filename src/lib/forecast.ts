// Inti ForeCash: burn rate & peringatan dini.
// Port 1:1 dari forecast() dan projection() di php-version/includes/functions.php.
//
// File ini sengaja "murni" (tidak mengambil data sendiri), supaya bisa diuji
// dengan data contoh di tests/forecast.test.ts. Data diambil oleh src/lib/data.ts.
//
// Import memakai akhiran .ts supaya file ini juga bisa dijalankan langsung oleh `npm test`.
import { tambahHari, selisihHari } from './tanggal.ts'

export type Status = 'aman' | 'waspada' | 'kritis'

export type JadwalPemasukan = {
  id: number
  sumber: string
  nominal: number
  tanggal_perkiraan: string // 'YYYY-MM-DD'
  status: 'menunggu' | 'diterima'
}

export type ForecastInput = {
  /** hari ini (WIB), 'YYYY-MM-DD' */
  hariIni: string
  /** total saldo semua wallet */
  saldo: number
  /** tanggal pengeluaran PERTAMA yang pernah dicatat (null kalau belum ada) */
  pengeluaranPertama: string | null
  /** daftar pengeluaran, minimal yang tanggalnya > hari ini - 14 (transfer TIDAK termasuk) */
  pengeluaran: { tanggal: string; nominal: number }[]
  /** jadwal pemasukan */
  jadwal: JadwalPemasukan[]
}

export type Forecast = {
  saldo: number
  /** rata-rata pengeluaran per hari */
  burn: number
  /** jumlah hari yang dipakai untuk menghitung burn rate (3–14) */
  hari: number
  /** saldo cukup untuk berapa hari lagi (null kalau belum ada pengeluaran) */
  runway: number | null
  /** perkiraan tanggal saldo habis */
  habis: string | null
  /** pemasukan berikutnya yang belum lewat */
  next: JadwalPemasukan | null
  /** jumlah hari menuju pemasukan berikutnya */
  sisaHari: number | null
  /** batas belanja per hari supaya cukup sampai pemasukan berikutnya */
  batasAman: number | null
  /** pemasukan yang sudah lewat tanggalnya tapi belum diterima */
  terlambat: JadwalPemasukan[]
  status: Status
}

export const HARI_BURN_MAKS = 14
export const HARI_BURN_MIN = 3

export function forecast(input: ForecastInput): Forecast {
  const { hariIni, saldo, pengeluaranPertama, pengeluaran, jadwal } = input

  // burn rate = rata-rata pengeluaran harian 14 hari terakhir (pengguna baru: min 3, maks 14 hari)
  let hari = HARI_BURN_MAKS
  if (pengeluaranPertama) {
    // PHP: date_diff(...)->days + 1 (date_diff selalu positif)
    const sejak = Math.abs(selisihHari(pengeluaranPertama, hariIni)) + 1
    hari = Math.max(HARI_BURN_MIN, Math.min(HARI_BURN_MAKS, sejak))
  }
  // PHP: tanggal > DATE_SUB(CURDATE(), INTERVAL hari DAY)
  const batasBawah = tambahHari(hariIni, -hari)
  const keluar = pengeluaran.filter((p) => p.tanggal > batasBawah).reduce((s, p) => s + Number(p.nominal), 0)
  const burn = keluar / hari

  const runway = burn > 0 ? Math.floor(Math.max(0, saldo) / burn) : null
  const habis = runway !== null ? tambahHari(hariIni, runway) : null

  const menunggu = jadwal
    .filter((j) => j.status === 'menunggu')
    .sort((a, b) => a.tanggal_perkiraan.localeCompare(b.tanggal_perkiraan) || a.id - b.id)
  const next = menunggu.find((j) => j.tanggal_perkiraan >= hariIni) ?? null
  const terlambat = menunggu.filter((j) => j.tanggal_perkiraan < hariIni)

  const sisaHari = next ? selisihHari(hariIni, next.tanggal_perkiraan) : null
  const batasAman = next && sisaHari !== null && sisaHari > 0 ? Math.max(0, saldo) / sisaHari : null

  // status: aman / waspada (kurang 1–3 hari) / kritis (kurang > 3 hari atau saldo habis)
  let status: Status = 'aman'
  if (saldo <= 0) status = 'kritis'
  else if (runway !== null && sisaHari !== null && runway < sisaHari) {
    status = sisaHari - runway > 3 ? 'kritis' : 'waspada'
  }
  if (status === 'aman' && terlambat.length > 0) status = 'waspada'

  return { saldo, burn, hari, runway, habis, next, sisaHari, batasAman, terlambat, status }
}

/** Proyeksi saldo harian untuk grafik (default 30 hari ke depan). */
export function proyeksi(f: Pick<Forecast, 'saldo' | 'burn'>, hariIni: string, days = 30) {
  const hasil: { tanggal: string; saldo: number }[] = []
  for (let i = 0; i <= days; i++) {
    hasil.push({ tanggal: tambahHari(hariIni, i), saldo: Math.round(Math.max(0, f.saldo - f.burn * i)) })
  }
  return hasil
}
