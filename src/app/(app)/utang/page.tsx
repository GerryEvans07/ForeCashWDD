// Utang & Patungan (port dari php-version/pages/utang.php).
import { wajibLogin } from '@/lib/auth'
import { ambilWallet } from '@/lib/data'
import { rupiah } from '@/lib/format'
import { hariIni } from '@/lib/tanggal'
import KartuUtang, { type Utang } from './components/KartuUtang'
import { CatatUtangForm, SplitBillForm } from './components/FormUtang'

export const metadata = { title: 'Utang & Patungan' }

export default async function UtangPage() {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const uid = profil.id

  const [belum, lunas, wallets] = await Promise.all([
    supabase.from('debts').select('id, nama_teman, keterangan, nominal, arah, jatuh_tempo').eq('user_id', uid).eq('status', 'belum')
      .order('jatuh_tempo', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }),
    supabase.from('debts').select('id, nama_teman, keterangan, nominal').eq('user_id', uid).eq('status', 'lunas')
      .order('created_at', { ascending: false }).limit(10),
    ambilWallet(supabase, uid),
  ])
  const daftar = (belum.data ?? []).map((d) => ({ ...d, nominal: Number(d.nominal) })) as Utang[]
  const riwayat = lunas.data ?? []
  const hari = hariIni()

  return (
    <>
      <div><p className="text-xs text-slate-500">Catat utang-piutang antarteman dan bagi tagihan bersama.</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {daftar.length === 0 && <p className="hs-card p-5 text-xs text-slate-500 sm:col-span-2">Tidak ada utang atau piutang yang belum lunas.</p>}
            {daftar.map((d) => <KartuUtang key={d.id} d={d} wallets={wallets} hariIni={hari} />)}
          </div>

          {riwayat.length > 0 && (
            <div className="hs-card p-5">
              <h4 className="text-sm font-black mb-2">Riwayat Lunas</h4>
              {riwayat.map((d) => (
                <p key={d.id} className="text-xs py-1 border-b last:border-0">
                  <span className="font-bold">{d.nama_teman}</span> · {d.keterangan} · {rupiah(d.nominal)} <span className="text-hsGreen font-bold">✓</span>
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <SplitBillForm />
          <CatatUtangForm />
        </div>
      </div>
    </>
  )
}
