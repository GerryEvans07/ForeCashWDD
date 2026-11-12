// Prediksi & Notifikasi (port dari php-version/pages/prediksi.php).
import Link from 'next/link'
import WarningBanner from '@/components/WarningBanner'
import PetSvg from '@/components/PetSvg'
import { PETS } from '@/lib/pets'
import { wajibLogin } from '@/lib/auth'
import { ambilForecast, ambilPetDipakai, ambilWallet } from '@/lib/data'
import { hariIni } from '@/lib/tanggal'
import ProyeksiPanel from './components/ProyeksiPanel'
import { DaftarJadwal, TambahJadwalForm, type Jadwal } from './components/Jadwal'

export const metadata = { title: 'Prediksi' }

export default async function PrediksiPage() {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const uid = profil.id
  const hari = hariIni()

  const [wallets, teman] = await Promise.all([ambilWallet(supabase, uid), ambilPetDipakai(supabase, uid)])
  const [f, jadwalRes] = await Promise.all([
    ambilForecast(supabase, uid, wallets),
    supabase.from('income_schedules').select('id, sumber, nominal, tanggal_perkiraan').eq('user_id', uid).eq('status', 'menunggu').order('tanggal_perkiraan'),
  ])
  const jadwal = (jadwalRes.data ?? []).map((j) => ({ ...j, nominal: Number(j.nominal) })) as Jadwal[]

  return (
    <>
      <div>
        <p className="text-xs text-slate-500">Dihitung otomatis dari transaksi: burn rate = total pengeluaran {f.hari} hari terakhir ÷ {f.hari}.</p>
      </div>

      <WarningBanner
        f={f}
        avatarId={profil.avatar}
        buddy={teman && (
          <Link href="/petualangan" className="fc-hero-buddy" title={`${PETS[teman]?.nama ?? 'Teman hemat'} menemanimu`}>
            <PetSvg id={teman} size={64} />
          </Link>
        )}
      />

      <ProyeksiPanel
        hariIni={hari} saldo={f.saldo} burn={f.burn} runway={f.runway} habis={f.habis}
        pemasukanBerikut={f.next?.tanggal_perkiraan ?? null} sisaHari={f.sisaHari}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DaftarJadwal jadwal={jadwal} wallets={wallets} hariIni={hari} />
        <TambahJadwalForm />
      </div>
    </>
  )
}
