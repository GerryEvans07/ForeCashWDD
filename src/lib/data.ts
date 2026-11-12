// Pengambil data dari Supabase yang dipakai banyak halaman.
// Semua query otomatis dibatasi RLS: user hanya mendapat datanya sendiri
// (atau data anak, untuk orang tua). uid tetap dikirim supaya orang tua
// bisa memilih anak mana yang dilihat.
import type { SupabaseClient } from '@supabase/supabase-js'
import { forecast, type JadwalPemasukan } from '@/lib/forecast'
import { hariIni, tambahHari } from '@/lib/tanggal'

export type Jenis = 'pemasukan' | 'pengeluaran' | 'transfer'
export type WalletSaldo = { id: number; nama: string; tipe: 'tunai' | 'bank' | 'ewallet'; saldo_awal: number; saldo: number }

/** Saldo per wallet (view wallet_saldo). Pengganti wallets_with_balance() di PHP. */
export async function ambilWallet(supabase: SupabaseClient, uid: string): Promise<WalletSaldo[]> {
  const { data, error } = await supabase
    .from('wallet_saldo')
    .select('id, nama, tipe, saldo_awal, saldo')
    .eq('user_id', uid)
    .order('id')
  if (error) throw error
  return (data ?? []).map((w) => ({ ...w, saldo_awal: Number(w.saldo_awal), saldo: Number(w.saldo) }))
}

/** Ambil semua data yang dibutuhkan forecast(), lalu hitung. */
export async function ambilForecast(supabase: SupabaseClient, uid: string, wallets?: WalletSaldo[]) {
  const hari = hariIni()
  const dari = tambahHari(hari, -14) // burn rate maksimal 14 hari

  const [w, pertama, keluar, jadwal] = await Promise.all([
    wallets ? Promise.resolve(wallets) : ambilWallet(supabase, uid),
    supabase.from('transactions').select('tanggal').eq('user_id', uid).eq('jenis', 'pengeluaran')
      .order('tanggal', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('transactions').select('tanggal, nominal').eq('user_id', uid).eq('jenis', 'pengeluaran').gt('tanggal', dari),
    supabase.from('income_schedules').select('id, sumber, nominal, tanggal_perkiraan, status').eq('user_id', uid).eq('status', 'menunggu'),
  ])
  if (pertama.error) throw pertama.error
  if (keluar.error) throw keluar.error
  if (jadwal.error) throw jadwal.error

  return forecast({
    hariIni: hari,
    saldo: w.reduce((s, x) => s + x.saldo, 0),
    pengeluaranPertama: pertama.data?.tanggal ?? null,
    pengeluaran: (keluar.data ?? []).map((p) => ({ tanggal: p.tanggal, nominal: Number(p.nominal) })),
    jadwal: (jadwal.data ?? []).map((j) => ({ ...j, nominal: Number(j.nominal) }) as JadwalPemasukan),
  })
}

/** Teman hemat yang sedang menemani (untuk banner & peta). null kalau belum ada. */
export async function ambilPetDipakai(supabase: SupabaseClient, uid: string): Promise<string | null> {
  const { data } = await supabase.from('user_pets').select('pet_id').eq('user_id', uid).eq('dipakai', true).maybeSingle()
  return data?.pet_id ?? null
}

/** Emoji kategori untuk daftar transaksi (sama dengan kategori_emoji() di PHP). */
export function kategoriEmoji(nama: string | null | undefined, jenis: Jenis = 'pengeluaran'): string {
  if (jenis === 'transfer') return '🔁'
  const map: Record<string, string> = {
    'Makan & Minum': '🍜', Transportasi: '🛵', 'Kos / Sewa': '🏠', 'Kebutuhan Kuliah': '📚', Hiburan: '🎬',
    'Uang Saku': '💰', 'Kerja Sampingan': '💼', Beasiswa: '🎓', 'Pelunasan Utang/Piutang': '🤝',
  }
  return (nama && map[nama]) || (jenis === 'pemasukan' ? '💵' : '🧾')
}
