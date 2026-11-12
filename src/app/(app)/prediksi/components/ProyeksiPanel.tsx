'use client'

// Hasil perhitungan + simulasi "bagaimana jika" + grafik proyeksi saldo 30 hari.
// Port dari bagian kartu & <canvas> Chart.js di php-version/pages/prediksi.php, grafiknya pakai recharts.
import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { proyeksi } from '@/lib/forecast'
import { rupiah } from '@/lib/format'
import { tgl, tglPendek } from '@/lib/tanggal'

type Props = {
  hariIni: string
  saldo: number
  burn: number
  runway: number | null
  habis: string | null
  pemasukanBerikut: string | null
  sisaHari: number | null
}

const WARNA_GARIS = '#FF8A1F' // oranye koin ForeCash
const WARNA_GAJIAN = '#E8A500' // garis tanggal pemasukan

function ribuan(v: number) {
  // tanpa "Rp" supaya label sumbu tidak terpotong jadi dua baris
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}jt`
  return v === 0 ? '0' : `${Math.round(v / 1000)}rb`
}

export default function ProyeksiPanel({ hariIni, saldo, burn, runway, habis, pemasukanBerikut, sisaHari }: Props) {
  // simulasi: kalau pengeluaran per hari diubah, berapa lama saldo bertahan?
  const [sim, setSim] = useState(String(Math.round(burn)))
  const simBurn = Number(sim)
  const burnDipakai = simBurn > 0 ? simBurn : burn
  const data = proyeksi({ saldo, burn: burnDipakai }, hariIni, 30).map((p) => ({ ...p, label: tglPendek(p.tanggal) }))
  const tandaGajian = sisaHari !== null && sisaHari <= 30 ? data[sisaHari]?.label : undefined

  let hasilSim = ''
  if (simBurn > 0) {
    const run = Math.floor(Math.max(0, saldo) / simBurn)
    hasilSim = `Saldo bertahan ${run} hari` +
      (sisaHari !== null ? (run >= sisaHari ? ' — aman sampai pemasukan berikutnya.' : ` — masih kurang ${sisaHari - run} hari.`) : '.')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="hs-card p-6 space-y-4">
        <h4 className="text-sm font-black border-b pb-2">Hasil Perhitungan</h4>
        <div className="text-sm space-y-2">
          <p className="flex justify-between gap-2"><span className="text-slate-500">Total saldo</span><b>{rupiah(saldo)}</b></p>
          <p className="flex justify-between gap-2"><span className="text-slate-500">Burn rate</span><b>{rupiah(burn)}/hari</b></p>
          <p className="flex justify-between gap-2"><span className="text-slate-500">Runway</span><b>{runway !== null ? `${runway} hari` : '-'}</b></p>
          <p className="flex justify-between gap-2"><span className="text-slate-500">Perkiraan saldo habis</span><b>{habis ? tgl(habis) : '-'}</b></p>
          <p className="flex justify-between gap-2"><span className="text-slate-500">Pemasukan berikutnya</span><b>{pemasukanBerikut ? tgl(pemasukanBerikut) : '-'}</b></p>
        </div>
        <div className="pt-3 border-t space-y-2">
          <label htmlFor="simBurn" className="text-xs font-bold">Simulasi: jika pengeluaran per hari menjadi</label>
          <input id="simBurn" type="number" min="0" step="1000" value={sim} onChange={(e) => setSim(e.target.value)} className="w-full px-3 py-2 text-xs border" />
          {hasilSim && <p className="text-xs font-bold text-hsBlue" aria-live="polite">{hasilSim}</p>}
        </div>
      </div>

      <div className="lg:col-span-2 hs-card p-6 space-y-3">
        <h4 className="text-sm font-black">Proyeksi Saldo 30 Hari ke Depan</h4>
        <div className="h-64" role="img" aria-label={`Grafik proyeksi saldo: dari ${rupiah(saldo)} hari ini, berkurang ${rupiah(burnDipakai)} per hari.`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="isiSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={WARNA_GARIS} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={WARNA_GARIS} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F6EBCF" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8C7A63' }} tickLine={false} axisLine={{ stroke: '#F2E2B8' }} interval="preserveStartEnd" minTickGap={18} />
              <YAxis tickFormatter={ribuan} tick={{ fontSize: 11, fill: '#8C7A63' }} tickLine={false} axisLine={false} width={48} />
              <Tooltip
                cursor={{ stroke: '#8C7A63', strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0].payload as (typeof data)[number]
                  return (
                    <div className="hs-card px-3 py-2 text-xs" style={{ borderRadius: 14 }}>
                      <p className="text-slate-500 font-bold">{tgl(p.tanggal)}</p>
                      <p className="font-black text-sm">{rupiah(p.saldo)}</p>
                    </div>
                  )
                }}
              />
              {tandaGajian && (
                <ReferenceLine x={tandaGajian} stroke={WARNA_GAJIAN} strokeWidth={3} label={{ value: 'Pemasukan', position: 'insideTopRight', fill: '#2D2216', fontSize: 11, fontWeight: 700 }} />
              )}
              <Area type="monotone" dataKey="saldo" stroke={WARNA_GARIS} strokeWidth={2} fill="url(#isiSaldo)" dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {tandaGajian && <p className="text-[11px] text-slate-500">Garis kuning menandai tanggal pemasukan berikutnya.</p>}
      </div>
    </div>
  )
}
