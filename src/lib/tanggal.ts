// Semua urusan tanggal memakai zona waktu Asia/Jakarta (WIB).
// Penting: server Vercel memakai jam UTC, jadi tanpa ini "hari ini" bisa mundur sehari
// antara jam 00.00–07.00 WIB.
// Format tanggal di seluruh aplikasi: string 'YYYY-MM-DD' (sama dengan kolom DATE di database).

const ZONA = 'Asia/Jakarta'
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/** Tanggal hari ini di WIB, contoh '2026-11-13'. */
export function hariIni(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** Jam sekarang di WIB (0–23). */
export function jamSekarang(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, hour: '2-digit', hourCycle: 'h23' }).format(now))
}

/** Tambah/kurang hari dari tanggal 'YYYY-MM-DD'. */
export function tambahHari(tgl: string, n: number): string {
  const d = new Date(tgl + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Selisih hari dari a ke b (b - a). Sama dengan date_diff()->days di PHP untuk b >= a. */
export function selisihHari(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000)
}

/** Format '13 Nov 2026'. */
export function tgl(t: string): string {
  const [y, m, d] = t.slice(0, 10).split('-').map(Number)
  return `${d} ${BULAN[m - 1]} ${y}`
}

/** Format 'Jumat, 13 Nov 2026'. */
export function tglPanjang(t: string): string {
  const hari = new Date(t + 'T00:00:00Z').getUTCDay()
  return `${HARI[hari]}, ${tgl(t)}`
}

/** Format pendek untuk sumbu grafik, contoh '13/11'. */
export function tglPendek(t: string): string {
  const [, m, d] = t.split('-').map(Number)
  return `${d}/${m}`
}

/** Hari dalam minggu, Senin = 1 ... Minggu = 7 (sama dengan date('N') di PHP). */
export function hariKe(t: string): number {
  const d = new Date(t + 'T00:00:00Z').getUTCDay()
  return d === 0 ? 7 : d
}

export function sapaan(jam: number): string {
  return jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 18 ? 'Selamat sore' : 'Selamat malam'
}
