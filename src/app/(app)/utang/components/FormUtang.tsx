'use client'

// Form Split Bill (dengan pratinjau per orang) dan form Catat Utang/Piutang.
import { useState } from 'react'
import { Calculator, Plus } from 'lucide-react'
import Flash from '@/components/Flash'
import { useAksi } from '@/lib/useAksi'
import { rupiah } from '@/lib/format'
import { bagianSplit, daftarTeman } from '@/lib/utang'
import { konfirmasiNominal } from '@/app/(app)/transaksi/components/TxForm'
import { catatUtang, splitBill } from '../actions'

export function SplitBillForm() {
  const { hasil, pending, onSubmit, ref } = useAksi(splitBill, { sebelum: (f) => konfirmasiNominal(f, 'total') })
  const [total, setTotal] = useState('')
  const [teman, setTeman] = useState('')
  const [ikut, setIkut] = useState(true)
  const nama = daftarTeman(teman)
  const per = Number(total) > 0 && nama.length ? bagianSplit(Number(total), nama.length, ikut) : null

  function reset() {
    setTotal('')
    setTeman('')
    setIkut(true)
  }

  return (
    <form id="split" ref={ref} onSubmit={onSubmit} onReset={reset} className="hs-card p-5 space-y-3">
      <h4 className="text-sm font-black"><Calculator size={15} className="inline -mt-0.5 text-hsPurple" /> Split Bill</h4>
      <Flash hasil={hasil} />
      <div><label htmlFor="sj" className="text-xs font-bold">Judul</label><input id="sj" name="judul" maxLength={150} placeholder="Makan malam angkatan" className="w-full px-3 py-2 text-xs border" /></div>
      <div><label htmlFor="st" className="text-xs font-bold">Total tagihan (Rp)</label><input id="st" type="number" name="total" min="1" required value={total} onChange={(e) => setTotal(e.target.value)} className="w-full px-3 py-2 text-xs border" /></div>
      <div><label htmlFor="sn" className="text-xs font-bold">Nama teman (pisahkan dengan koma)</label><input id="sn" name="teman" required value={teman} onChange={(e) => setTeman(e.target.value)} placeholder="Budi, Siti, Bima" className="w-full px-3 py-2 text-xs border" /></div>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input type="checkbox" name="termasuk_saya" value="1" checked={ikut} onChange={(e) => setIkut(e.target.checked)} /> Saya ikut menanggung bagian
      </label>
      {per !== null && <p className="text-xs font-bold text-hsPurple">{rupiah(per)} per orang · {nama.length} piutang akan dicatat</p>}
      <div><label htmlFor="sd" className="text-xs font-bold">Jatuh tempo (opsional)</label><input id="sd" type="date" name="jatuh_tempo" className="w-full px-3 py-2 text-xs border" /></div>
      <button disabled={pending} className="hs-btn bg-hsPurple text-white w-full py-2.5 text-xs disabled:opacity-60">Bagi & Catat Piutang</button>
    </form>
  )
}

export function CatatUtangForm() {
  const { hasil, pending, onSubmit, ref } = useAksi(catatUtang, { sebelum: (f) => konfirmasiNominal(f) })
  return (
    <form ref={ref} onSubmit={onSubmit} className="hs-card p-5 space-y-3">
      <h4 className="text-sm font-black"><Plus size={15} className="inline -mt-0.5 text-hsGreen" /> Catat Utang / Piutang</h4>
      <Flash hasil={hasil} />
      <div><label htmlFor="dn" className="text-xs font-bold">Nama teman</label><input id="dn" name="nama_teman" required maxLength={100} className="w-full px-3 py-2 text-xs border" /></div>
      <div><label htmlFor="dk" className="text-xs font-bold">Keterangan</label><input id="dk" name="keterangan" required maxLength={150} placeholder="Pinjam untuk ongkos" className="w-full px-3 py-2 text-xs border" /></div>
      <div><label htmlFor="dnom" className="text-xs font-bold">Nominal (Rp)</label><input id="dnom" type="number" name="nominal" min="1" required className="w-full px-3 py-2 text-xs border" /></div>
      <div><label htmlFor="da" className="text-xs font-bold">Posisi</label>
        <select id="da" name="arah" className="w-full px-3 py-2 text-xs border">
          <option value="piutang">Dia utang ke saya (piutang)</option>
          <option value="utang">Saya utang ke dia (utang)</option>
        </select>
      </div>
      <div><label htmlFor="dt" className="text-xs font-bold">Jatuh tempo (opsional)</label><input id="dt" type="date" name="jatuh_tempo" className="w-full px-3 py-2 text-xs border" /></div>
      <button disabled={pending} className="hs-btn bg-hsGreen text-white w-full py-2.5 text-xs disabled:opacity-60">Simpan</button>
    </form>
  )
}
