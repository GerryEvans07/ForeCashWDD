// ForeCash Assistant (pengganti api/chatbot.php).
// Menerima { pesan } dan membalas { jawaban }. Jawaban dihitung dari data user yang sedang login.
import { NextResponse } from 'next/server'
import { getSesi } from '@/lib/auth'
import { buatJawaban, deteksiIntent, kebutuhanData, type DataBot } from '@/lib/chatbot'
import { ambilForecast, ambilWallet } from '@/lib/data'
import { namaDepan } from '@/lib/format'
import { ambilGamify } from '@/lib/gamify'
import { ambilLaporan } from '@/lib/laporan'
import { hariIni } from '@/lib/tanggal'

export async function POST(req: Request) {
  const sesi = await getSesi()
  if (!sesi || sesi.profil.role !== 'mahasiswa') {
    return NextResponse.json({ error: 'Silakan login sebagai mahasiswa.' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as { pesan?: unknown }
  const pesan = typeof body.pesan === 'string' ? body.pesan.trim().slice(0, 200) : ''
  if (!pesan) return NextResponse.json({ error: 'Pertanyaan kosong.' }, { status: 400 })

  const { supabase, profil } = sesi
  const uid = profil.id
  const intent = deteksiIntent(pesan)
  const perlu = kebutuhanData(intent)
  const data: DataBot = { namaDepan: namaDepan(profil.nama) }

  // ambil data seperlunya saja, sesuai jenis pertanyaan
  const wallets = perlu.wallets || perlu.forecast ? await ambilWallet(supabase, uid) : undefined
  if (wallets) data.wallets = wallets
  if (perlu.forecast) data.f = await ambilForecast(supabase, uid, wallets)
  if (perlu.laporan) {
    const r = await ambilLaporan(supabase, uid, hariIni().slice(0, 7))
    data.kategoriTeratas = r.perKategori[0] ? { ...r.perKategori[0], totalKeluar: r.keluar } : null
  }
  if (perlu.utang) {
    const { data: d } = await supabase.from('debts').select('arah, nominal').eq('user_id', uid).eq('status', 'belum')
    const rows = d ?? []
    const sum = (arah: string) => rows.filter((x) => x.arah === arah).reduce((s, x) => s + Number(x.nominal), 0)
    const n = (arah: string) => rows.filter((x) => x.arah === arah).length
    data.utang = { piutangTotal: sum('piutang'), piutangN: n('piutang'), utangTotal: sum('utang'), utangN: n('utang') }
  }
  if (perlu.gamify && data.f) {
    const g = await ambilGamify(supabase, uid, profil.batas_harian, data.f.status)
    data.gamify = {
      level: g.level, levelNama: g.levelNama, poin: g.poin, streak: g.streak,
      badgeDapat: g.badges.filter((b) => b.dapat).length, badgeTotal: g.badges.length,
    }
  }

  return NextResponse.json({ jawaban: buatJawaban(intent, data) })
}
