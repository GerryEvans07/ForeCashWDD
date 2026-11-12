// Laporan Bulanan (port dari php-version/pages/laporan.php).
import { FileSpreadsheet } from 'lucide-react'
import LaporanBulanan from '@/components/LaporanBulanan'
import { wajibLogin } from '@/lib/auth'
import { ambilLaporan } from '@/lib/laporan'
import { bulanDariParam, namaBulan } from '@/lib/tanggal'

export const metadata = { title: 'Laporan' }

export default async function LaporanPage({ searchParams }: { searchParams: Promise<{ bulan?: string }> }) {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const bulan = bulanDariParam((await searchParams).bulan)
  const r = await ambilLaporan(supabase, profil.id, bulan)

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <p className="text-sm font-bold">{namaBulan(bulan)}</p>
          <p className="text-xs text-slate-500">Transfer antar wallet tidak dihitung sebagai pemasukan maupun pengeluaran.</p>
        </div>
        <div className="flex gap-2">
          <form method="get" className="flex gap-1">
            <input type="month" name="bulan" defaultValue={bulan} aria-label="Pilih bulan" className="px-3 py-2 text-xs border" />
            <button className="hs-btn bg-hsYellow text-hsDark px-3 py-2 text-xs">Lihat</button>
          </form>
          <a href={`/transaksi/export?bulan=${bulan}`} className="hs-btn bg-hsGreen text-white px-4 py-2 text-xs">
            <FileSpreadsheet size={14} /> Ekspor Excel (.csv)
          </a>
        </div>
      </div>
      <LaporanBulanan r={r} />
    </>
  )
}
