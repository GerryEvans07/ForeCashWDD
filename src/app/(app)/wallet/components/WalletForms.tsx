'use client'

import { Save, Trash2 } from 'lucide-react'
import Flash from '@/components/Flash'
import { useAksi } from '@/lib/useAksi'
import { rupiah } from '@/lib/format'
import { konfirmasiNominal } from '@/app/(app)/transaksi/components/TxForm'
import type { WalletSaldo } from '@/lib/data'
import { hapusWallet, tambahWallet, ubahWallet } from '../actions'

const LABEL_TIPE = { tunai: 'Tunai', bank: 'Bank', ewallet: 'E-Wallet' }

function PilihTipe({ id, value }: { id?: string; value?: string }) {
  return (
    <select id={id} name="tipe" defaultValue={value} className="w-full px-3 py-2 text-xs border">
      {Object.entries(LABEL_TIPE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  )
}

/** Satu baris wallet: ubah nama/tipe/saldo awal, atau hapus. */
export function BarisWallet({ w }: { w: WalletSaldo }) {
  const ubah = useAksi(ubahWallet, { resetOk: false, sebelum: (f) => konfirmasiNominal(f, 'saldo_awal') })
  const hapus = useAksi(hapusWallet, { resetOk: false, sebelum: () => confirm('Hapus wallet ini?') })
  const hasil = hapus.hasil?.error ? hapus.hasil : ubah.hasil

  return (
    <div className="border-b last:border-0 pb-3 space-y-2">
      <Flash hasil={hasil} />
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
        <form onSubmit={ubah.onSubmit} className="sm:col-span-10 grid grid-cols-1 sm:grid-cols-10 gap-2 items-end">
          <input type="hidden" name="id" value={w.id} />
          <div className="sm:col-span-4">
            <label htmlFor={`n${w.id}`} className="text-[11px] font-bold">Nama</label>
            <input id={`n${w.id}`} name="nama" defaultValue={w.nama} required maxLength={50} className="w-full px-3 py-2 text-xs border" />
          </div>
          <div className="sm:col-span-3"><label htmlFor={`t${w.id}`} className="text-[11px] font-bold">Tipe</label><PilihTipe id={`t${w.id}`} value={w.tipe} /></div>
          <div className="sm:col-span-2">
            <label htmlFor={`s${w.id}`} className="text-[11px] font-bold">Saldo awal</label>
            <input id={`s${w.id}`} type="number" name="saldo_awal" min="0" defaultValue={w.saldo_awal} className="w-full px-3 py-2 text-xs border" />
          </div>
          <div className="sm:col-span-1">
            <button disabled={ubah.pending} className="hs-btn bg-hsBlue text-white px-3 py-2 text-xs w-full" title="Simpan" aria-label={`Simpan wallet ${w.nama}`}><Save size={14} /></button>
          </div>
        </form>
        <form onSubmit={hapus.onSubmit} className="sm:col-span-2">
          <input type="hidden" name="id" value={w.id} />
          <button disabled={hapus.pending} className="hs-btn bg-hsRed text-white px-3 py-2 text-xs w-full" title="Hapus" aria-label={`Hapus wallet ${w.nama}`}><Trash2 size={14} /></button>
        </form>
      </div>
      <p className="text-xs text-slate-500">Saldo saat ini: <strong>{rupiah(w.saldo)}</strong></p>
    </div>
  )
}

export function TambahWallet() {
  const { hasil, pending, onSubmit, ref } = useAksi(tambahWallet, { sebelum: (f) => konfirmasiNominal(f, 'saldo_awal') })
  return (
    <form ref={ref} onSubmit={onSubmit} className="hs-card p-5 space-y-3 h-fit">
      <h4 className="text-sm font-black">Tambah Wallet</h4>
      <Flash hasil={hasil} />
      <div><label htmlFor="wn" className="text-xs font-bold">Nama</label><input id="wn" name="nama" required maxLength={50} placeholder="BCA, GoPay, Tunai" className="w-full px-3 py-2 text-xs border" /></div>
      <div><label htmlFor="wt" className="text-xs font-bold">Tipe</label><PilihTipe id="wt" /></div>
      <div><label htmlFor="ws" className="text-xs font-bold">Saldo awal (Rp)</label><input id="ws" type="number" name="saldo_awal" min="0" defaultValue={0} className="w-full px-3 py-2 text-xs border" /></div>
      <button disabled={pending} className="hs-btn bg-hsOrange text-white w-full py-2.5 text-xs disabled:opacity-60">Simpan Wallet</button>
    </form>
  )
}
