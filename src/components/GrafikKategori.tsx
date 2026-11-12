'use client'

// Grafik batang pengeluaran per kategori (recharts).
// Satu warna saja dan diurutkan dari yang terbesar, supaya mudah dibandingkan dan tidak "warna-warni".
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { rupiah } from '@/lib/format'

const WARNA = '#FF8A1F' // oranye koin ForeCash

export default function GrafikKategori({ data, total }: { data: { kategori: string; total: number }[]; total: number }) {
  const tinggi = Math.max(160, data.length * 44)
  return (
    <div style={{ height: tinggi }} role="img" aria-label={'Pengeluaran per kategori: ' + data.map((d) => `${d.kategori} ${rupiah(d.total)}`).join(', ')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 96, bottom: 0, left: 0 }} barCategoryGap={10}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="kategori" width={140} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#2D2216', fontWeight: 600 }} />
          <Tooltip
            cursor={{ fill: '#FFF4D6' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as { kategori: string; total: number }
              return (
                <div className="hs-card px-3 py-2 text-xs" style={{ borderRadius: 14 }}>
                  <p className="font-bold">{d.kategori}</p>
                  <p className="font-black text-sm">{rupiah(d.total)}</p>
                  <p className="text-slate-500">{total > 0 ? Math.round((d.total / total) * 100) : 0}% dari total pengeluaran</p>
                </div>
              )
            }}
          />
          <Bar dataKey="total" fill={WARNA} radius={[0, 6, 6, 0]} isAnimationActive={false}>
            <LabelList dataKey="total" position="right" formatter={(v) => rupiah(Number(v)).replace(' ', '\u00a0')} style={{ fontSize: 12, fontWeight: 700, fill: '#2D2216' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
