// Potongan tampilan gamifikasi (port dari level_bar_html() & tantangan_html() di gamify.php).
// Dipakai di Beranda dan Pencapaian.
import type { Gamify } from '@/lib/gamify'
import { rupiah } from '@/lib/format'

export function LevelBar({ g }: { g: Gamify }) {
  const pct = g.nextPoin ? Math.round(((g.poin - g.prevPoin) / (g.nextPoin - g.prevPoin)) * 100) : 100
  const ket = g.nextPoin ? `${g.nextPoin - g.poin} poin lagi menuju ${g.nextNama}` : 'Level tertinggi tercapai!'
  return (
    <>
      <div className="flex justify-between text-xs font-bold">
        <span>Level {g.level} · {g.levelNama}</span>
        <span>{g.poin} poin</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3 mt-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Kemajuan level">
        <div className="bg-hsPurple h-3 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-slate-500 mt-1">{ket}</p>
    </>
  )
}

export function Tantangan({ t }: { t: Gamify['tantangan'] }) {
  const pct = Math.min(100, Math.round((t.now / t.max) * 100))
  const lewat = t.now > t.max
  const ket = lewat ? 'tantangan gagal minggu ini' : `sisa ${rupiah(t.max - t.now)}, ${t.sisaHari} hari lagi`
  return (
    <>
      <p className="text-sm font-bold">{t.judul}</p>
      <div className="w-full bg-slate-100 rounded-full h-3 mt-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Kemajuan tantangan">
        <div className={`${lewat ? 'bg-hsRed' : 'bg-hsGreen'} h-3 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`text-[11px] mt-1 ${lewat ? 'text-hsRed font-bold' : 'text-slate-500'}`}>{rupiah(t.now)} terpakai · {ket}</p>
    </>
  )
}
