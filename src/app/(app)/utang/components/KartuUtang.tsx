'use client'

// Kartu satu utang/piutang: tombol Lunas (+ pilih wallet), hapus, dan pengingat WhatsApp.
import { MessageCircle } from 'lucide-react'
import clsx from 'clsx'
import Flash from '@/components/Flash'
import TombolHapus from '@/components/TombolHapus'
import { useAksi } from '@/lib/useAksi'
import { rupiah } from '@/lib/format'
import { tgl } from '@/lib/tanggal'
import { linkPengingatWA } from '@/lib/utang'
import { hapusUtang, tandaiLunas } from '../actions'

export type Utang = {
  id: number; nama_teman: string; keterangan: string; nominal: number
  arah: 'piutang' | 'utang'; jatuh_tempo: string | null
}

export default function KartuUtang({ d, wallets, hariIni }: { d: Utang; wallets: { id: number; nama: string }[]; hariIni: string }) {
  const lunas = useAksi(tandaiLunas, { resetOk: false })
  const telat = !!d.jatuh_tempo && d.jatuh_tempo < hariIni
  const piutang = d.arah === 'piutang'

  return (
    <div className={clsx('hs-card p-5 space-y-3', telat && '!border-red-300')}>
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <span className={clsx('text-[10px] font-black px-2 py-0.5 rounded-full', piutang ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700')}>
            {piutang ? 'PIUTANG · dia utang ke saya' : 'UTANG · saya utang ke dia'}
          </span>
          <p className="font-black mt-2">{d.nama_teman}</p>
          <p className="text-xs text-slate-500">{d.keterangan}</p>
        </div>
        <p className="font-black shrink-0">{rupiah(d.nominal)}</p>
      </div>
      {d.jatuh_tempo && (
        <p className={clsx('text-[11px] font-bold', telat ? 'text-hsRed' : 'text-slate-500')}>
          Jatuh tempo {tgl(d.jatuh_tempo)}{telat && ' — terlewat'}
        </p>
      )}
      <Flash hasil={lunas.hasil?.error ? lunas.hasil : null} />
      <div className="flex gap-2 items-center">
        <form onSubmit={lunas.onSubmit} className="flex gap-2 flex-1">
          <input type="hidden" name="id" value={d.id} />
          <select name="wallet_id" aria-label="Wallet untuk pelunasan" title="Wallet untuk pelunasan" className="flex-1 min-w-0 px-2 py-1.5 text-[11px] border">
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.nama}</option>)}
          </select>
          <button disabled={lunas.pending} className="hs-btn bg-hsGreen text-white px-3 py-1.5 text-[11px] disabled:opacity-60">Lunas</button>
        </form>
        <TombolHapus aksi={hapusUtang} id={d.id} pesan="Hapus catatan ini?" tampilError={false} />
      </div>
      {piutang && (
        <a href={linkPengingatWA(d.nama_teman, d.keterangan, d.nominal)} target="_blank" rel="noopener" className="text-[11px] font-bold text-hsGreen inline-flex items-center gap-1">
          <MessageCircle size={13} /> Kirim pengingat via WhatsApp
        </a>
      )}
    </div>
  )
}
