// Peta Petualangan sebagai satu SVG (port dari journey_svg() & journey_deco() di php-version/includes/journey.php).
// Jalan berliku dari pemasukan terakhir sampai pemasukan berikutnya, satu titik = satu hari.
import Avatar, { moodFor } from '@/components/Avatar'
import PetSvg from '@/components/PetSvg'
import type { HariPeta } from '@/lib/pets'
import type { Status } from '@/lib/forecast'
import { rupiah } from '@/lib/format'
import { tgl } from '@/lib/tanggal'

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const TEMA = {
  aman: { ground: '#CFEFC9', road: '#92D6A6', line: '#FFFFFF' },
  waspada: { ground: '#FFE6A8', road: '#F2C46D', line: '#FFF6DA' },
  kritis: { ground: '#E3ECF8', road: '#FFFFFF', line: '#B9C8E0' },
}
const KET = {
  baik: 'hari baik', boros: 'melewati batas harian', kosong: 'tidak mencatat', hariini: 'hari ini',
  cukup: 'saldo diperkirakan cukup', kurang: 'saldo diperkirakan habis', gajian: 'pemasukan datang',
}
// [isi, garis, garis putus-putus, tanda, warna tanda]
const GAYA: Record<string, [string, string, string, string, string]> = {
  baik: ['KOIN', '#E8860E', '', '✓', '#7A3E00'],
  boros: ['#FF8F8F', '#E25555', '', '!', '#fff'],
  kosong: ['#F2EDE4', '#CFC6B5', '6 5', '', ''],
  cukup: ['#FFFFFF', '#F5C04A', '', '', ''],
  kurang: ['#FFE5E5', '#FF5B5B', '6 5', '', ''],
}

function Pohon({ tema, x, y, s }: { tema: Status; x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {tema === 'aman' && (
        <><rect x="-4" y="0" width="8" height="22" rx="3" fill="#A0714F" /><circle cy="-8" r="20" fill="#4CC283" /><circle cx="-8" cy="-14" r="8" fill="#7FDBA0" /></>
      )}
      {tema === 'waspada' && (
        <><rect x="-4" y="0" width="8" height="22" rx="3" fill="#8C5A35" /><circle cy="-8" r="20" fill="#F2913A" /><circle cx="10" cy="-16" r="10" fill="#E8642B" /><circle cx="-8" cy="-14" r="7" fill="#FFC266" /></>
      )}
      {tema === 'kritis' && (
        <><rect x="-4" y="6" width="8" height="16" rx="3" fill="#8C6A4F" /><path d="M0 -34 L22 10 L-22 10 Z" fill="#3E9E7E" /><path d="M0 -34 L10 -14 L-10 -14 Z" fill="#fff" /><path d="M-22 10 L22 10 L18 4 L-18 4Z" fill="#fff" opacity=".8" /></>
      )}
    </g>
  )
}

function Dekorasi({ tema, W, H, rowH, top, rows }: { tema: Status; W: number; H: number; rowH: number; top: number; rows: number }) {
  const gunung = { aman: ['#8FC9A0', '#6FB487'], waspada: ['#E8B470', '#D99A4E'], kritis: ['#B9C8E0', '#9FB2D3'] }[tema]
  const pohon: React.ReactNode[] = []
  for (let r = 0; r < rows; r++) {
    const y = top + r * rowH + rowH / 2
    if (y > H - 40) break
    ;[0.18, 0.47, 0.8].forEach((fx, k) => {
      if ((r + k) % 2) return
      pohon.push(<Pohon key={`${r}-${k}`} tema={tema} x={W * fx + (r % 2 ? 24 : -18)} y={y + 8} s={W > 600 ? 1 : 0.8} />)
    })
  }
  return (
    <>
      <path d={`M${W * 0.55} 60 L${W * 0.66} 8 L${W * 0.76} 60 Z`} fill={gunung[0]} />
      <path d={`M${W * 0.68} 60 L${W * 0.8} 0 L${W * 0.92} 60 Z`} fill={gunung[1]} />
      {tema === 'kritis' && <path d={`M${W * 0.77} 15 L${W * 0.8} 0 L${W * 0.83} 15 Z`} fill="#fff" />}
      {pohon}
      {tema === 'aman' && (
        <><ellipse cx={W * 0.12} cy={H - 34} rx={W * 0.09} ry="20" fill="#7CC8F2" /><text x={W * 0.1} y={H - 26} fontSize="20">🦆</text></>
      )}
      {tema === 'waspada' && (
        <><text x={W * 0.08} y={H - 24} fontSize="24">🍂</text><text x={W * 0.86} y={H - 30} fontSize="22">🍁</text></>
      )}
      {tema === 'kritis' && (
        <>
          {Array.from({ length: 18 }, (_, i) => (
            <circle key={i} cx={(i * 137) % W} cy={(i * 89) % H} r="3" fill="#fff" className="fc-snow" style={{ animationDelay: `${i % 6}s` }} />
          ))}
          <text x={W * 0.08} y={H - 24} fontSize="26">⛄</text>
        </>
      )}
    </>
  )
}

type Props = {
  hari: HariPeta[]
  /** jumlah titik per baris */
  cols: number
  W: number
  rowH: number
  tema: Status
  avatarId: string
  /** semua teman hemat yang dimiliki */
  pets: string[]
  dipakai: string | null
}

export default function PetaPerjalanan({ hari, cols, W, rowH, tema, avatarId, pets, dipakai }: Props) {
  const n = hari.length
  const mx = W * 0.1
  const top = 90
  const rows = Math.ceil(n / cols)
  const H = top + (rows - 1) * rowH + 110
  const step = (W - 2 * mx) / Math.max(1, cols - 1)

  // posisi titik: baris ganjil berjalan dari kanan ke kiri (jalan berliku)
  const pos = hari.map((_, i) => {
    const r = Math.floor(i / cols)
    let c = i % cols
    if (r % 2) c = cols - 1 - c
    return [mx + c * step, top + r * rowH] as const
  })

  // jalan: garis lurus per baris, belokan setengah lingkaran di ujung
  let d = `M${Math.round(pos[0][0])} ${pos[0][1]}`
  for (let i = 1; i < n; i++) {
    const [x, y] = pos[i]
    const [px, py] = pos[i - 1]
    if (y !== py) {
      const sweep = Math.floor((i - 1) / cols) % 2 ? 0 : 1
      d += ` A${rowH / 2} ${rowH / 2} 0 0 ${sweep} ${Math.round(px)} ${y}`
      if (Math.round(px) !== Math.round(x)) d += ` L${Math.round(x)} ${y}`
    } else d += ` L${Math.round(x)} ${y}`
  }
  const t = TEMA[tema]
  // id gradien harus unik: di halaman ada dua peta (versi lebar & versi HP)
  const idKoin = `fcCoin${cols}`
  const lainnya = pets.filter((p) => p !== dipakai)

  return (
    <svg className="fc-map-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Peta perjalanan menuju pemasukan berikutnya">
      <defs>
        <radialGradient id={idKoin} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFE7A0" /><stop offset=".55" stopColor="#FFB23E" /><stop offset="1" stopColor="#E8860E" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={t.ground} />
      <Dekorasi tema={tema} W={W} H={H} rowH={rowH} top={top} rows={rows} />
      <path d={d} stroke={t.road} strokeWidth={cols > 5 ? 40 : 34} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={t.line} strokeWidth="4" fill="none" strokeDasharray="14 14" strokeLinecap="round" />

      {hari.map((h, i) => {
        const x = Math.round(pos[i][0])
        const y = pos[i][1]
        const [, m, dd] = h.tanggal.split('-').map(Number)
        const label = `${dd}${i === 0 || dd === 1 ? ' ' + BULAN[m - 1] : ''}`
        const info = `${tgl(h.tanggal)} — ${KET[h.status]}${h.keluar ? `, keluar ${rupiah(h.keluar)}` : ''}`

        return (
          <g key={h.tanggal} className={`fc-node fc-node-${h.status}`} transform={`translate(${x} ${y})`}>
            <title>{info}</title>
            {h.status === 'gajian' ? (
              <>
                <circle r="30" fill="#2EBD74" stroke="#fff" strokeWidth="5" />
                <text y="10" textAnchor="middle" fontSize="28">🏁</text>
                <rect x="-46" y="38" width="92" height="24" rx="12" fill="#fff" />
                <text y="55" textAnchor="middle" className="fc-node-label" fill="#1F9A5C">Uang saku</text>
              </>
            ) : h.status === 'hariini' ? (
              <>
                <circle r="28" fill="#fff" stroke="#FF8A1F" strokeWidth="5" />
                <circle r="36" fill="none" stroke="#FF8A1F" strokeWidth="3" opacity=".35" className="fc-pulse" />
                <g className="fc-map-me" transform="translate(-34 -92)"><Avatar id={avatarId} mood={moodFor(tema)} size={68} /></g>
                {dipakai && <g className="fc-map-buddy"><PetSvg id={dipakai} size={40} x={22} y={-64} /></g>}
                <text y="7" textAnchor="middle" className="fc-node-num" fill="#E06A00">{dd}</text>
                <rect x="-36" y="34" width="72" height="22" rx="11" fill="#FF8A1F" />
                <text y="50" textAnchor="middle" className="fc-node-label" fill="#fff">Hari ini</text>
              </>
            ) : (
              <>
                <circle r="20" fill={GAYA[h.status][0] === 'KOIN' ? `url(#${idKoin})` : GAYA[h.status][0]} stroke={GAYA[h.status][1]} strokeWidth="4" strokeDasharray={GAYA[h.status][2] || undefined} />
                {GAYA[h.status][3] && <text y="7" textAnchor="middle" className="fc-node-mark" fill={GAYA[h.status][4]}>{GAYA[h.status][3]}</text>}
                <text y="40" textAnchor="middle" className="fc-node-label" fill="#5B4A36">{label}</text>
              </>
            )}
          </g>
        )
      })}

      {/* teman hemat lain jalan-jalan di sekitar jalan */}
      {lainnya.map((pid, k) => {
        const i = Math.min(n - 1, Math.round(((k * 2 + 1) * n) / (2 * Math.max(1, pets.length))))
        const [x, y] = pos[i]
        const off = y + rowH / 2 > top + (rows - 1) * rowH ? -rowH / 2 : rowH / 2 // di antara dua baris jalan
        return (
          <g key={pid} className="fc-map-pet" style={{ animationDelay: `${(k + 1) * 0.4}s` }}>
            <PetSvg id={pid} size={46} x={Math.round(x - 23 + ((k + 1) % 2 ? 34 : -34))} y={Math.round(y + off - 26)} />
          </g>
        )
      })}
    </svg>
  )
}
