'use client'

// Form transaksi (port dari tx_form_fields() di includes/tx_form.php).
// Dipakai untuk catat baru (halaman Transaksi) dan ubah (halaman Ubah Transaksi).
import { useState } from 'react'
import Link from 'next/link'
import Flash from '@/components/Flash'
import type { Hasil } from '@/lib/aksi'
import type { Jenis } from '@/lib/data'
import { rupiah } from '@/lib/format'
import { hariIni } from '@/lib/tanggal'
import { useAksi } from '@/lib/useAksi'

export type OpsiWallet = { id: number; nama: string; saldo: number }
export type OpsiKategori = { id: number; nama: string; jenis: 'pemasukan' | 'pengeluaran' }
export type NilaiTx = {
  id?: number; jenis: Jenis; nominal?: number; keterangan?: string; tanggal?: string
  wallet_id?: number; wallet_tujuan_id?: number | null; category_id?: number | null; bukti?: string | null
}

// Nominal di atas Rp5.000.000 perlu dikonfirmasi supaya salah ketik (kelebihan nol) tidak langsung tersimpan.
export const BATAS_KONFIRMASI = 5_000_000
export function konfirmasiNominal(form: HTMLFormElement, field = 'nominal'): boolean {
  const input = form.elements.namedItem(field) as HTMLInputElement | null
  const n = input ? Number(input.value) : 0
  if (n >= BATAS_KONFIRMASI && !confirm(`Yakin nominalnya ${rupiah(n)}?\n\nPeriksa lagi jumlah angka nol sebelum menyimpan.`)) {
    input?.focus()
    return false
  }
  return true
}

type Props = {
  aksi: (prev: Hasil, fd: FormData) => Promise<Hasil>
  wallets: OpsiWallet[]
  kategori: OpsiKategori[]
  awal: NilaiTx
  mode: 'baru' | 'ubah'
}

export default function TxForm({ aksi, wallets, kategori, awal, mode }: Props) {
  const { hasil, pending: menyimpan, onSubmit, ref } = useAksi(aksi, { resetOk: mode === 'baru', sebelum: (f) => konfirmasiNominal(f) })
  const [jenis, setJenis] = useState<Jenis>(awal.jenis)
  const transfer = jenis === 'transfer'
  const katJenis = kategori.filter((c) => c.jenis === jenis)

  return (
    <form id="form" ref={ref} onSubmit={onSubmit} className="hs-card p-5 space-y-3">
      <h4 className="text-sm font-black">{mode === 'baru' ? 'Catat Transaksi' : 'Ubah Transaksi'}</h4>
      <Flash hasil={hasil} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="jenis" className="text-xs font-bold">Jenis</label>
          <select id="jenis" name="jenis" value={jenis} onChange={(e) => setJenis(e.target.value as Jenis)} className="w-full px-3 py-2.5 text-sm border">
            <option value="pengeluaran">Pengeluaran</option>
            <option value="pemasukan">Pemasukan</option>
            <option value="transfer">Transfer antar wallet</option>
          </select>
        </div>
        <div>
          <label htmlFor="nominal" className="text-xs font-bold">Nominal (Rp)</label>
          <input id="nominal" type="number" name="nominal" min="1" step="1" required defaultValue={awal.nominal ?? ''} placeholder="25000" className="w-full px-3 py-2.5 text-sm border" />
        </div>
      </div>

      <div>
        <label htmlFor="keterangan" className="text-xs font-bold">Keterangan</label>
        <input id="keterangan" name="keterangan" maxLength={150} defaultValue={awal.keterangan ?? ''} placeholder="Contoh: Makan siang kantin" className="w-full px-3 py-2.5 text-sm border" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!transfer && (
          <div>
            <label htmlFor="category_id" className="text-xs font-bold">Kategori</label>
            {/* key: pilihan kategori di-reset saat jenis berganti */}
            <select key={jenis} id="category_id" name="category_id" defaultValue={awal.jenis === jenis ? awal.category_id ?? undefined : undefined} className="w-full px-3 py-2.5 text-sm border">
              {katJenis.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="tanggal" className="text-xs font-bold">Tanggal</label>
          <input id="tanggal" type="date" name="tanggal" required max={hariIni()} defaultValue={awal.tanggal ?? hariIni()} className="w-full px-3 py-2.5 text-sm border" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="wallet_id" className="text-xs font-bold">
            {transfer ? 'Dari wallet' : 'Wallet'} <span className="font-normal text-slate-400">(opsional)</span>
          </label>
          <select id="wallet_id" name="wallet_id" defaultValue={awal.wallet_id} className="w-full px-3 py-2.5 text-sm border">
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.nama} ({rupiah(w.saldo)})</option>)}
          </select>
        </div>
        {transfer && (
          <div>
            <label htmlFor="wallet_tujuan_id" className="text-xs font-bold">Ke wallet</label>
            <select id="wallet_tujuan_id" name="wallet_tujuan_id" defaultValue={awal.wallet_tujuan_id ?? wallets[1]?.id} className="w-full px-3 py-2.5 text-sm border">
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.nama}</option>)}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">Transfer tidak dihitung sebagai pemasukan/pengeluaran.</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="bukti" className="text-xs font-bold">
          Foto struk <span className="font-normal text-slate-400">(opsional · JPG/PNG/WEBP, maks. 2 MB)</span>
        </label>
        <input id="bukti" type="file" name="bukti" accept="image/jpeg,image/png,image/webp" className="w-full px-3 py-2 text-xs border bg-white" />
        {awal.bukti && awal.id && (
          <div className="flex items-center gap-3 mt-2">
            <a href={`/transaksi/struk/${awal.id}`} target="_blank" rel="noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/transaksi/struk/${awal.id}`} alt="Struk tersimpan" className="w-16 h-16 object-cover rounded-xl border" />
            </a>
            <label className="flex items-center gap-2 text-xs font-bold text-hsRed">
              <input type="checkbox" name="hapus_bukti" value="1" /> Hapus foto ini
            </label>
          </div>
        )}
      </div>

      {mode === 'baru' ? (
        <button disabled={menyimpan} className="hs-btn bg-hsOrange text-white w-full py-3 text-sm disabled:opacity-60">
          {menyimpan ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
      ) : (
        <div className="flex gap-2">
          <Link href="/transaksi" className="hs-btn bg-slate-200 px-4 py-3 text-sm">Batal</Link>
          <button disabled={menyimpan} className="hs-btn bg-hsBlue text-white flex-1 py-3 text-sm disabled:opacity-60">
            {menyimpan ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      )}
    </form>
  )
}
