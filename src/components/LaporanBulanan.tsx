// Kartu laporan bulanan: grafik per kategori + ringkasan (port dari report_html() di PHP).
// Dipakai halaman Laporan (mahasiswa) dan Pantau Anak (orang tua).
import GrafikKategori from '@/components/GrafikKategori'
import type { Laporan } from '@/lib/laporan'
import { rupiah } from '@/lib/format'

export default function LaporanBulanan({ r }: { r: Laporan }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="hs-card p-6 space-y-3">
        <h4 className="text-sm font-black">Pengeluaran per Kategori</h4>
        {r.perKategori.length === 0 ? (
          <p className="text-xs text-slate-500">Belum ada pengeluaran di bulan ini.</p>
        ) : (
          <GrafikKategori data={r.perKategori} total={r.keluar} />
        )}
      </div>
      <div className="hs-card p-6 space-y-3 text-sm">
        <h4 className="text-sm font-black">Ringkasan</h4>
        <p className="flex justify-between border-b py-2"><span className="text-slate-500">Total pemasukan</span><b className="text-hsGreen">{rupiah(r.masuk)}</b></p>
        <p className="flex justify-between border-b py-2"><span className="text-slate-500">Total pengeluaran</span><b className="text-hsRed">{rupiah(r.keluar)}</b></p>
        <p className="flex justify-between border-b py-2">
          <span className="text-slate-500">Rasio tabungan</span>
          <b className="text-hsBlue">{r.rasio === null ? '-' : `${r.rasio}%`}</b>
        </p>
        {/* tabel per kategori: angka yang sama dengan grafik, untuk dibaca tanpa grafik */}
        {r.perKategori.map((k) => (
          <p key={k.kategori} className="flex justify-between text-xs gap-2">
            <span>{k.kategori}</span>
            <span>{rupiah(k.total)} <span className="text-slate-500">({r.keluar > 0 ? Math.round((k.total / r.keluar) * 100) : 0}%)</span></span>
          </p>
        ))}
        <p className="text-[11px] text-slate-500 pt-1">Rasio tabungan = (pemasukan − pengeluaran) ÷ pemasukan.</p>
      </div>
    </div>
  )
}
