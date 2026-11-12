'use client'

import { Tags, X } from 'lucide-react'
import Flash from '@/components/Flash'
import { useAksi } from '@/lib/useAksi'
import { hapusKategori, tambahKategori } from '../actions'

type Kat = { id: number; nama: string; jenis: string }

function ChipKategori({ k }: { k: Kat }) {
  const { pending, onSubmit } = useAksi(hapusKategori, { resetOk: false })
  return (
    <form onSubmit={onSubmit} className="inline-flex items-center gap-1 bg-slate-100 rounded-full pl-3 pr-1 py-1 text-[11px] font-bold">
      <input type="hidden" name="id" value={k.id} />
      {k.nama}
      <button disabled={pending} className="w-5 h-5 rounded-full hover:bg-white inline-flex items-center justify-center" title="Hapus" aria-label={`Hapus kategori ${k.nama}`}>
        <X size={12} />
      </button>
    </form>
  )
}

export default function KategoriSaya({ kategori }: { kategori: Kat[] }) {
  const { hasil, pending, onSubmit, ref } = useAksi(tambahKategori)
  return (
    <div className="hs-card p-5 space-y-3">
      <h4 className="text-sm font-black"><Tags size={15} className="inline -mt-0.5 text-hsOrange" /> Kategori Saya</h4>
      <Flash hasil={hasil} />
      <form ref={ref} onSubmit={onSubmit} className="space-y-2">
        <input name="nama" maxLength={50} placeholder="Mis. Print/Fotokopi" aria-label="Nama kategori" className="w-full px-3 py-2 text-xs border" />
        <div className="flex gap-2">
          <select name="jenis" aria-label="Jenis kategori" className="w-full px-3 py-2 text-xs border">
            <option value="pengeluaran">Pengeluaran</option>
            <option value="pemasukan">Pemasukan</option>
          </select>
          <button disabled={pending} className="hs-btn bg-hsOrange text-white px-3 py-2 text-xs">Tambah</button>
        </div>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {kategori.map((k) => <ChipKategori key={k.id} k={k} />)}
        {kategori.length === 0 && <p className="text-xs text-slate-500">Kategori bawaan sudah tersedia. Tambahkan kategori khusus di sini.</p>}
      </div>
    </div>
  )
}
