// Pantau Anak, khusus orang tua (port dari php-version/pages/ortu.php).
// Data anak hanya bisa DILIHAT: RLS di database menolak semua perubahan dari akun orang tua.
import Link from 'next/link'
import Flash from '@/components/Flash'
import LaporanBulanan from '@/components/LaporanBulanan'
import WarningBanner from '@/components/WarningBanner'
import { wajibLogin } from '@/lib/auth'
import { ambilForecast } from '@/lib/data'
import { rupiah } from '@/lib/format'
import { ambilLaporan } from '@/lib/laporan'
import { hariIni, namaBulan, tgl } from '@/lib/tanggal'
import FormHubung from './components/FormHubung'

export const metadata = { title: 'Pantau Anak' }

type Anak = { id: string; nama: string; avatar: string }

export default async function PantauPage({ searchParams }: { searchParams: Promise<{ anak?: string; ok?: string }> }) {
  const { supabase, profil } = await wajibLogin('orangtua')
  const sp = await searchParams

  const { data: links } = await supabase
    .from('parent_links')
    .select('anak:profiles!parent_links_student_id_fkey(id, nama, avatar)')
    .eq('parent_id', profil.id)
  const anakList = ((links ?? []) as unknown as { anak: Anak | null }[])
    .map((l) => l.anak).filter((a): a is Anak => !!a)
    .sort((a, b) => a.nama.localeCompare(b.nama))

  // hanya anak yang terhubung yang bisa dipilih
  const anak = anakList.find((a) => a.id === sp.anak) ?? anakList[0] ?? null
  const bulan = hariIni().slice(0, 7)

  const data = anak
    ? await Promise.all([
        ambilForecast(supabase, anak.id),
        ambilLaporan(supabase, anak.id, bulan),
        supabase.from('transactions').select('id, tanggal, jenis, nominal, keterangan, kategori:categories(nama)')
          .eq('user_id', anak.id).neq('jenis', 'transfer')
          .order('tanggal', { ascending: false }).order('id', { ascending: false }).limit(8),
      ])
    : null

  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div><p className="text-xs text-slate-500">Data hanya dapat dilihat. Perubahan dilakukan oleh mahasiswa sendiri.</p></div>
        <div className="flex flex-wrap gap-2">
          {anakList.map((a) => (
            <Link key={a.id} href={`/pantau?anak=${a.id}`} className={`nav-tab ${a.id === anak?.id ? 'active' : 'bg-white'} px-4 py-2 text-xs`}>{a.nama}</Link>
          ))}
        </div>
      </div>

      {sp.ok && anak && <Flash hasil={{ ok: `Terhubung dengan ${anak.nama}.` }} />}
      <FormHubung />

      {!anak || !data ? (
        <p className="hs-card p-6 text-sm text-slate-500">
          Belum ada akun anak yang terhubung. Minta anak membuka menu <b>Akun</b> di ForeCash untuk melihat kode hubung.
        </p>
      ) : (
        (() => {
          const [f, r, recent] = data
          const transaksi = (recent.data ?? []) as unknown as { id: number; tanggal: string; jenis: string; nominal: number; keterangan: string; kategori: { nama: string } | null }[]
          return (
            <>
              {/* banner memakai avatar anak, bukan avatar orang tua */}
              <WarningBanner f={f} avatarId={anak.avatar} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="hs-card p-5"><p className="text-xs font-bold text-slate-500">Total Saldo</p><p className="text-xl font-black">{rupiah(f.saldo)}</p></div>
                <div className="hs-card p-5"><p className="text-xs font-bold text-slate-500">Burn Rate / Hari</p><p className="text-xl font-black">{rupiah(f.burn)}</p></div>
                <div className="hs-card p-5"><p className="text-xs font-bold text-slate-500">Pemasukan Bulan Ini</p><p className="text-xl font-black text-hsGreen">{rupiah(r.masuk)}</p></div>
                <div className="hs-card p-5"><p className="text-xs font-bold text-slate-500">Pengeluaran Bulan Ini</p><p className="text-xl font-black text-hsRed">{rupiah(r.keluar)}</p></div>
              </div>
              <p className="text-sm font-bold -mb-2">Laporan {namaBulan(bulan)}</p>
              <LaporanBulanan r={r} />
              <div className="hs-card p-5 space-y-2">
                <h4 className="text-sm font-black">Transaksi Terakhir</h4>
                {transaksi.length === 0 && <p className="text-xs text-slate-500">Belum ada transaksi.</p>}
                {transaksi.map((t) => (
                  <div key={t.id} className="flex justify-between gap-2 text-sm border-b last:border-0 py-2">
                    <span className="min-w-0"><b>{t.keterangan}</b> <span className="text-xs text-slate-500">· {tgl(t.tanggal)} · {t.kategori?.nama ?? '-'}</span></span>
                    <b className={`shrink-0 ${t.jenis === 'pemasukan' ? 'text-hsGreen' : 'text-hsRed'}`}>{t.jenis === 'pemasukan' ? '+' : '−'}{rupiah(t.nominal)}</b>
                  </div>
                ))}
              </div>
            </>
          )
        })()
      )}
    </>
  )
}
