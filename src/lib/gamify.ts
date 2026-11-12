// Gamifikasi: streak, badge, poin, level, tantangan mingguan.
// Port 1:1 dari php-version/includes/gamify.php. Semua dihitung dari data yang ada, tanpa tabel tambahan.
// Fungsi gamify() murni (diuji di tests/gamify.test.ts); data diambil oleh ambilGamify().
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Status } from './forecast.ts'
import { hariIni as hariIniWib, hariKe, tambahHari } from './tanggal.ts'

export const LEVELS: [number, string][] = [[0, 'Pemula'], [200, 'Hemat Muda'], [400, 'Pengatur Cerdas'], [600, 'Master Budget'], [800, 'Legenda ForeCash']]
export const BATAS_TANTANGAN = 200000

export type Badge = { icon: string; nama: string; ket: string; now: number; max: number; dapat: boolean }

export type GamifyInput = {
  hariIni: string
  /** semua tanggal yang ada transaksinya (boleh berulang) */
  tanggalTransaksi: string[]
  jumlahTransaksi: number
  batasHarian: number
  /** total pengeluaran per tanggal, minimal 7 hari terakhir */
  pengeluaranPerHari: Record<string, number>
  jumlahDebt: number
  utangAktif: number
  piutangLunas: number
  punyaJadwal: boolean
  status: Status
  /** total pengeluaran kategori "Makan & Minum" sejak Senin minggu ini */
  makanMingguIni: number
}

export type Gamify = {
  streak: number
  badges: Badge[]
  poin: number
  level: number
  levelNama: string
  prevPoin: number
  nextPoin: number | null
  nextNama: string | null
  tantangan: { judul: string; now: number; max: number; sisaHari: number }
}

/** Berapa hari berturut-turut mencatat transaksi (boleh belum mencatat hari ini). */
export function hitungStreak(tanggal: string[], hariIni: string): number {
  const ada = new Set(tanggal)
  let d = ada.has(hariIni) ? hariIni : tambahHari(hariIni, -1)
  let n = 0
  while (ada.has(d)) {
    n++
    d = tambahHari(d, -1)
  }
  return n
}

/** Senin minggu ini (minggu dihitung Senin–Minggu, seperti 'monday this week' di PHP). */
export function seninMingguIni(hariIni: string): string {
  return tambahHari(hariIni, -(hariKe(hariIni) - 1))
}

export function gamify(i: GamifyInput): Gamify {
  const streak = hitungStreak(i.tanggalTransaksi, i.hariIni)

  // hari hemat: 7 hari terakhir yang pengeluarannya tidak melebihi batas harian
  let hariHemat = 0
  if (i.batasHarian > 0) {
    for (let k = 0; k < 7; k++) {
      if ((i.pengeluaranPerHari[tambahHari(i.hariIni, -k)] ?? 0) <= i.batasHarian) hariHemat++
    }
  }

  const mentah: [string, string, string, number, number][] = [
    ['📝', 'Pencatat Pemula', 'Catat 10 transaksi', Math.min(i.jumlahTransaksi, 10), 10],
    ['🔥', 'Rajin Mencatat', 'Streak mencatat 7 hari', Math.min(streak, 7), 7],
    ['🐷', 'Hemat Seminggu', i.batasHarian > 0 ? '7 hari terakhir di bawah batas harian' : 'Atur batas harian dulu di menu Transaksi', hariHemat, 7],
    ['🤝', 'Bebas Utang', 'Tidak punya utang yang belum lunas', i.jumlahDebt && !i.utangAktif ? 1 : 0, 1],
    ['💸', 'Penagih Andal', 'Lunasi 3 piutang dari teman', Math.min(i.piutangLunas, 3), 3],
    ['📅', 'Perencana', 'Tambahkan jadwal pemasukan', i.punyaJadwal ? 1 : 0, 1],
    ['🛡️', 'Aman Terkendali', 'Status peringatan sedang Aman', i.status === 'aman' ? 1 : 0, 1],
  ]
  const badges: Badge[] = mentah.map(([icon, nama, ket, now, max]) => ({ icon, nama, ket, now, max, dapat: now >= max }))

  // setiap badge 100 poin, setiap hari streak 10 poin (maks. 30 hari)
  const poin = badges.filter((b) => b.dapat).length * 100 + Math.min(streak, 30) * 10
  let li = 0
  LEVELS.forEach(([min], idx) => { if (poin >= min) li = idx })
  const next = LEVELS[li + 1] ?? null

  return {
    streak, badges, poin,
    level: li + 1, levelNama: LEVELS[li][1], prevPoin: LEVELS[li][0],
    nextPoin: next?.[0] ?? null, nextNama: next?.[1] ?? null,
    tantangan: {
      judul: `Makan & minum minggu ini di bawah Rp ${BATAS_TANTANGAN.toLocaleString('id-ID')}`,
      now: i.makanMingguIni, max: BATAS_TANTANGAN, sisaHari: 7 - hariKe(i.hariIni),
    },
  }
}

/** Ambil data dari Supabase lalu hitung gamifikasi. */
export async function ambilGamify(supabase: SupabaseClient, uid: string, batasHarian: number, status: Status): Promise<Gamify> {
  const hari = hariIniWib()
  const senin = seninMingguIni(hari)

  const [tgl, jumlah, keluar7, debts, jadwal, makan] = await Promise.all([
    supabase.from('transactions').select('tanggal').eq('user_id', uid).order('tanggal', { ascending: false }).limit(1000),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', uid),
    supabase.from('transactions').select('tanggal, nominal').eq('user_id', uid).eq('jenis', 'pengeluaran').gt('tanggal', tambahHari(hari, -7)),
    supabase.from('debts').select('arah, status').eq('user_id', uid),
    supabase.from('income_schedules').select('id', { count: 'exact', head: true }).eq('user_id', uid),
    supabase.from('transactions').select('nominal, categories!inner(nama)').eq('user_id', uid).eq('jenis', 'pengeluaran')
      .gte('tanggal', senin).eq('categories.nama', 'Makan & Minum'),
  ])

  const perHari: Record<string, number> = {}
  for (const t of keluar7.data ?? []) perHari[t.tanggal] = (perHari[t.tanggal] ?? 0) + Number(t.nominal)
  const d = debts.data ?? []

  return gamify({
    hariIni: hari,
    tanggalTransaksi: (tgl.data ?? []).map((t) => t.tanggal),
    jumlahTransaksi: jumlah.count ?? 0,
    batasHarian,
    pengeluaranPerHari: perHari,
    jumlahDebt: d.length,
    utangAktif: d.filter((x) => x.arah === 'utang' && x.status === 'belum').length,
    piutangLunas: d.filter((x) => x.arah === 'piutang' && x.status === 'lunas').length,
    punyaJadwal: (jadwal.count ?? 0) > 0,
    status,
    makanMingguIni: (makan.data ?? []).reduce((s, t) => s + Number(t.nominal), 0),
  })
}
