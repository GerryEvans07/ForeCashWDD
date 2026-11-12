// Petualangan (port dari php-version/pages/petualangan.php):
// peta perjalanan menuju uang saku, telur yang menetas setelah 7 hari baik, koleksi 12 teman hemat.
import Link from 'next/link'
import PetaPerjalanan from '@/components/PetaPerjalanan'
import { EggSvg } from '@/components/PetSvg'
import { wajibLogin } from '@/lib/auth'
import { ambilForecast } from '@/lib/data'
import { PETS, TELUR_TARGET, dataPeta, hitungHariBaik, progresTelur } from '@/lib/pets'
import { hariIni, tambahHari } from '@/lib/tanggal'
import KoleksiPet from './components/KoleksiPet'

export const metadata = { title: 'Petualangan' }

export default async function PetualanganPage() {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const uid = profil.id
  const hari = hariIni()

  const [f, petRes, txRes, pemasukanRes] = await Promise.all([
    ambilForecast(supabase, uid),
    supabase.from('user_pets').select('pet_id, menetas_pada, dipakai').eq('user_id', uid).order('menetas_pada').order('id'),
    supabase.from('transactions').select('tanggal, jenis, nominal').eq('user_id', uid).gt('tanggal', tambahHari(hari, -120)),
    supabase.from('transactions').select('tanggal').eq('user_id', uid).eq('jenis', 'pemasukan').lte('tanggal', hari)
      .order('tanggal', { ascending: false }).limit(1).maybeSingle(),
  ])

  // koleksi yang sudah dimiliki
  const owned: Record<string, string> = {}
  let dipakai: string | null = null
  for (const r of petRes.data ?? []) {
    if (!PETS[r.pet_id]) continue
    owned[r.pet_id] = r.menetas_pada
    if (r.dipakai) dipakai = r.pet_id
  }

  // telur: hari baik sejak hewan terakhir menetas
  const transaksi = (txRes.data ?? []).map((t) => ({ ...t, nominal: Number(t.nominal) }))
  const hariBaik = hitungHariBaik(transaksi, profil.batas_harian)
  let progress = progresTelur(hariBaik, Object.values(owned))

  // telur penuh -> menetas jadi teman acak yang belum dimiliki
  let baru: string | null = null
  const belumPunya = Object.keys(PETS).filter((id) => !owned[id])
  if (progress >= TELUR_TARGET && belumPunya.length > 0) {
    const pilih = belumPunya[crypto.getRandomValues(new Uint32Array(1))[0] % belumPunya.length]
    const { error } = await supabase.from('user_pets')
      .upsert({ user_id: uid, pet_id: pilih, menetas_pada: hari, dipakai: !dipakai }, { onConflict: 'user_id,pet_id', ignoreDuplicates: true })
    if (!error) {
      baru = pilih
      owned[pilih] = hari
      if (!dipakai) dipakai = pilih
      progress = 0
    }
  }

  // data peta
  const keluarPerHari: Record<string, number> = {}
  for (const t of transaksi) if (t.jenis === 'pengeluaran') keluarPerHari[t.tanggal] = (keluarPerHari[t.tanggal] ?? 0) + t.nominal
  const j = dataPeta({
    hariIni: hari,
    pemasukanBerikut: f.next?.tanggal_perkiraan ?? null,
    pemasukanTerakhir: pemasukanRes.data?.tanggal ?? null,
    saldo: f.saldo,
    runway: f.runway,
    keluarPerHari,
    dicatat: new Set(transaksi.map((t) => t.tanggal)),
    hariBaik,
  })
  const hitung = (s: string) => j.hari.filter((h) => h.status === s).length
  const hariKe = j.hari.findIndex((h) => h.status === 'hariini')
  const petSaya = Object.keys(owned)

  return (
    <>
      <div><p className="text-xs text-slate-500">Setiap titik adalah satu hari menuju uang saku berikutnya. Hari baik membuat telur menetas jadi teman baru.</p></div>

      {/* ringkasan perjalanan */}
      <section className="fc-journey-bar">
        <span className="fc-pill"><span className="fc-tile fc-tile-orange">🚶</span><span><b>Hari ke-{hariKe < 0 ? '-' : hariKe + 1}</b> dari {j.hari.length}</span></span>
        <span className="fc-pill"><span className="fc-tile fc-tile-yellow">🪙</span><span><b>{hitung('baik')}</b> hari baik</span></span>
        <span className="fc-pill"><span className="fc-tile fc-tile-red">⚠️</span><span><b>{hitung('boros')}</b> hari boros</span></span>
        <span className="fc-pill"><span className="fc-tile fc-tile-purple">🐾</span><span><b>{petSaya.length}/{Object.keys(PETS).length}</b> teman</span></span>
      </section>

      {/* peta: versi lebar (7 titik per baris) dan versi HP (4 titik per baris) */}
      <section className="fc-map" data-tema={f.status}>
        <div className="fc-map-wide">
          <PetaPerjalanan hari={j.hari} cols={7} W={1000} rowH={150} tema={f.status} avatarId={profil.avatar} pets={petSaya} dipakai={dipakai} />
        </div>
        <div className="fc-map-narrow">
          <PetaPerjalanan hari={j.hari} cols={4} W={420} rowH={140} tema={f.status} avatarId={profil.avatar} pets={petSaya} dipakai={dipakai} />
        </div>
        {!j.adaJadwal && (
          <p className="fc-map-note">
            Belum ada jadwal pemasukan, jadi ujung peta belum ada garis finisnya. <Link href="/prediksi" className="fc-link">Tambah jadwal</Link>
          </p>
        )}
        <div className="fc-map-legend">
          <span><i className="fc-lg fc-lg-baik" /> Hari baik</span>
          <span><i className="fc-lg fc-lg-boros" /> Melewati batas</span>
          <span><i className="fc-lg fc-lg-kosong" /> Tidak mencatat</span>
          <span><i className="fc-lg fc-lg-cukup" /> Saldo cukup</span>
          <span><i className="fc-lg fc-lg-kurang" /> Saldo habis</span>
        </div>
      </section>

      <div className="fc-pet-area">
        {/* telur */}
        <section className="hs-card fc-egg-card">
          <div className={`fc-egg ${progress >= TELUR_TARGET - 2 ? 'is-shaking' : ''}`}><EggSvg progress={progress} size={120} /></div>
          <h3>Telur sedang dierami</h3>
          <p className="text-sm text-slate-500">Menetas setelah {TELUR_TARGET} hari baik: mencatat transaksi dan belanja tidak melewati batas harian.</p>
          <div className="fc-egg-bar"><span style={{ width: `${Math.round((Math.min(progress, TELUR_TARGET) / TELUR_TARGET) * 100)}%` }} /></div>
          <p className="fc-egg-count">{Math.min(progress, TELUR_TARGET)}/{TELUR_TARGET} hari baik</p>
          {profil.batas_harian <= 0 && (
            <p className="text-xs text-slate-500">
              Batas harian belum diatur, jadi setiap hari yang dicatat dihitung hari baik. <Link href="/transaksi" className="fc-link">Atur batas</Link>
            </p>
          )}
        </section>

        <KoleksiPet owned={owned} dipakai={dipakai} baru={baru} />
      </div>
    </>
  )
}
