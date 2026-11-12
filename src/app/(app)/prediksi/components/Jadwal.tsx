'use client'

// Daftar jadwal pemasukan (tombol "Sudah diterima" & hapus) dan form tambah jadwal.
import Flash from '@/components/Flash'
import TombolHapus from '@/components/TombolHapus'
import { useAksi } from '@/lib/useAksi'
import { rupiah } from '@/lib/format'
import { tgl } from '@/lib/tanggal'
import { konfirmasiNominal } from '@/app/(app)/transaksi/components/TxForm'
import { hapusJadwal, jadwalDiterima, tambahJadwal } from '../actions'

export type Jadwal = { id: number; sumber: string; nominal: number; tanggal_perkiraan: string }

function BarisJadwal({ s, wallets, hariIni }: { s: Jadwal; wallets: { id: number; nama: string }[]; hariIni: string }) {
  const terima = useAksi(jadwalDiterima, { resetOk: false })
  const telat = s.tanggal_perkiraan < hariIni
  return (
    <div className="border-b last:border-0 py-2 space-y-2">
      <Flash hasil={terima.hasil?.error ? terima.hasil : null} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[160px]">
          <p className="text-sm font-bold">{s.sumber} · {rupiah(s.nominal)}</p>
          <p className={`text-xs ${telat ? 'text-hsRed font-bold' : 'text-slate-500'}`}>{tgl(s.tanggal_perkiraan)}{telat && ' — TERLAMBAT'}</p>
        </div>
        <form onSubmit={terima.onSubmit} className="flex items-center gap-2">
          <input type="hidden" name="id" value={s.id} />
          <select name="wallet_id" aria-label="Masuk ke wallet" title="Masuk ke wallet" className="px-2 py-1.5 text-[11px] border">
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.nama}</option>)}
          </select>
          <button disabled={terima.pending} className="hs-btn bg-hsGreen text-white px-3 py-1.5 text-[11px] disabled:opacity-60">Sudah diterima</button>
        </form>
        <TombolHapus aksi={hapusJadwal} id={s.id} pesan="Hapus jadwal ini?" tampilError={false} />
      </div>
    </div>
  )
}

export function DaftarJadwal({ jadwal, wallets, hariIni }: { jadwal: Jadwal[]; wallets: { id: number; nama: string }[]; hariIni: string }) {
  return (
    <div className="lg:col-span-2 hs-card p-6 space-y-3">
      <h4 className="text-sm font-black">Jadwal Pemasukan</h4>
      {jadwal.length === 0 && <p className="text-xs text-slate-500">Belum ada jadwal. Tambahkan uang saku, honor, atau beasiswa agar peringatan bisa dihitung.</p>}
      {jadwal.map((s) => <BarisJadwal key={s.id} s={s} wallets={wallets} hariIni={hariIni} />)}
    </div>
  )
}

export function TambahJadwalForm() {
  const { hasil, pending, onSubmit, ref } = useAksi(tambahJadwal, { sebelum: (f) => konfirmasiNominal(f) })
  return (
    <form ref={ref} onSubmit={onSubmit} className="hs-card p-6 space-y-3">
      <h4 className="text-sm font-black">Tambah Jadwal Pemasukan</h4>
      <Flash hasil={hasil} />
      <div><label htmlFor="js" className="text-xs font-bold">Sumber</label><input id="js" name="sumber" required maxLength={50} placeholder="Uang saku dari orang tua" className="w-full px-3 py-2 text-xs border" /></div>
      <div><label htmlFor="jn" className="text-xs font-bold">Perkiraan nominal (Rp)</label><input id="jn" type="number" name="nominal" min="1" required className="w-full px-3 py-2 text-xs border" /></div>
      <div><label htmlFor="jt" className="text-xs font-bold">Tanggal perkiraan</label><input id="jt" type="date" name="tanggal" required className="w-full px-3 py-2 text-xs border" /></div>
      <button disabled={pending} className="hs-btn bg-hsOrange text-white w-full py-2.5 text-xs disabled:opacity-60">Simpan Jadwal</button>
    </form>
  )
}
