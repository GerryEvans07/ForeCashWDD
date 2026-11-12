// Avatar karakter SVG (port dari php-version/includes/avatar.php).
// Ekspresi mengikuti status keuangan: happy (aman), neutral (waspada), worried (kritis).

export type Mood = 'happy' | 'neutral' | 'worried'
type Gaya = 'bob' | 'bun' | 'curly' | 'swoop' | 'spiky' | 'beanie'
type Ekstra = 'freckles' | 'glasses' | 'bow'

export const AVATARS: Record<string, { nama: string; kulit: string; rambut: string; gaya: Gaya; baju: string; ekstra: Ekstra[] }> = {
  a1: { nama: 'Koko', kulit: '#F2C9A0', rambut: '#6B4226', gaya: 'bob', baju: '#5B8DEF', ekstra: ['freckles'] },
  a2: { nama: 'Rara', kulit: '#FFD9C2', rambut: '#E8590C', gaya: 'bun', baju: '#43B883', ekstra: [] },
  a3: { nama: 'Bima', kulit: '#8D5A3B', rambut: '#2B1B14', gaya: 'curly', baju: '#FFC83D', ekstra: [] },
  a4: { nama: 'Lili', kulit: '#F6D2B8', rambut: '#1F2937', gaya: 'swoop', baju: '#8B6FE8', ekstra: ['bow'] },
  a5: { nama: 'Dodo', kulit: '#C68B59', rambut: '#3B2F2F', gaya: 'spiky', baju: '#FF7043', ekstra: ['glasses'] },
  a6: { nama: 'Nana', kulit: '#BFD7FF', rambut: '#3056D3', gaya: 'beanie', baju: '#E96868', ekstra: [] },
}

export function moodFor(status: string): Mood {
  return ({ aman: 'happy', waspada: 'neutral', kritis: 'worried' } as const)[status as 'aman'] ?? 'happy'
}

export function validAvatar(id: string | null | undefined): string {
  return id && AVATARS[id] ? id : 'a1'
}

const INK = '#292929'

function RambutBelakang({ gaya, r }: { gaya: Gaya; r: string }) {
  if (gaya === 'bob') return <rect x="12" y="16" width="76" height="62" rx="24" fill={r} />
  if (gaya === 'bun') return <circle cx="50" cy="12" r="11" fill={r} />
  if (gaya === 'swoop') return <rect x="14" y="18" width="72" height="54" rx="22" fill={r} />
  return null
}

function RambutDepan({ gaya, r }: { gaya: Gaya; r: string }) {
  switch (gaya) {
    case 'bob':
      return <path d="M18 42 C18 22 32 16 50 16 C68 16 82 22 82 42 C74 34 62 32 50 33 C38 32 26 34 18 42 Z" fill={r} />
    case 'bun':
      return <path d="M18 40 C18 22 32 18 50 18 C68 18 82 22 82 40 C70 32 30 32 18 40 Z" fill={r} />
    case 'swoop':
      return <path d="M18 46 C16 22 34 14 52 15 C70 16 84 24 82 40 C70 30 52 28 40 34 C30 38 24 42 18 46 Z" fill={r} />
    case 'curly':
      return (
        <>
          {[22, 33, 44, 56, 67, 78].map((x) => <circle key={'a' + x} cx={x} cy="26" r="9" fill={r} />)}
          {[28, 40, 52, 64, 74].map((x) => <circle key={'b' + x} cx={x} cy="18" r="9" fill={r} />)}
        </>
      )
    case 'spiky':
      return <polygon points="18,42 19,18 30,26 36,10 46,23 54,8 62,23 70,12 74,26 82,18 82,42 70,32 50,30 30,32" fill={r} />
    case 'beanie':
      return (
        <>
          <rect x="14" y="12" width="72" height="26" rx="13" fill={r} />
          <rect x="14" y="31" width="72" height="8" rx="4" fill="#1E3A8A" />
          <circle cx="50" cy="10" r="6" fill="#FFC83D" />
        </>
      )
  }
}

const ALIS: Record<Mood, string> = {
  happy: 'M31 41 L44 41 M56 41 L69 41',
  neutral: 'M31 42 L44 41 M56 41 L69 42',
  worried: 'M31 43 L44 38 M56 38 L69 43',
}
const MULUT: Record<Mood, string> = {
  happy: 'M43 69 Q50 77 57 69',
  neutral: 'M45 72 L55 72',
  worried: 'M44 74 Q50 68 56 74',
}

export default function Avatar({ id, mood = 'happy', size = 64 }: { id?: string | null; mood?: Mood; size?: number }) {
  const a = AVATARS[validAvatar(id)]
  const r = a.rambut
  const k = a.kulit
  const px = mood === 'worried' ? 0 : 1
  const py = mood === 'worried' ? 52 : 55

  return (
    <svg viewBox="0 0 100 108" width={size} height={Math.round(size * 1.08)} role="img" aria-label={`Avatar ${a.nama}`}>
      <RambutBelakang gaya={a.gaya} r={r} />
      <rect x="40" y="80" width="20" height="10" fill={k} />
      <rect x="24" y="86" width="52" height="22" rx="10" fill={a.baju} />
      <rect x="18" y="22" width="64" height="64" rx="20" fill={k} />
      <circle cx="17" cy="56" r="6" fill={k} />
      <circle cx="83" cy="56" r="6" fill={k} />
      <RambutDepan gaya={a.gaya} r={r} />
      <g stroke={INK} strokeWidth="3.5" strokeLinecap="round"><path d={ALIS[mood]} /></g>
      <circle cx="38" cy="54" r="9" fill="#fff" />
      <circle cx="62" cy="54" r="9" fill="#fff" />
      <circle cx={38 + px} cy={py} r="4.5" fill={INK} className="hs-eye" />
      <circle cx={62 + px} cy={py} r="4.5" fill={INK} className="hs-eye" />
      <ellipse cx="29" cy="68" rx="6" ry="3.5" fill="#F472B6" opacity=".4" />
      <ellipse cx="71" cy="68" rx="6" ry="3.5" fill="#F472B6" opacity=".4" />
      <g stroke={INK} strokeWidth="3" strokeLinecap="round"><path d={MULUT[mood]} fill="none" /></g>
      {a.ekstra.includes('freckles') &&
        [30, 34, 66, 70].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 64 : 62} r="1.3" fill="#A0522D" />)}
      {a.ekstra.includes('glasses') && (
        <g fill="none" stroke={INK} strokeWidth="2.5">
          <circle cx="38" cy="54" r="12" />
          <circle cx="62" cy="54" r="12" />
          <path d="M47 53 Q50 50 53 53" />
        </g>
      )}
      {a.ekstra.includes('bow') && (
        <g fill="#F472B6">
          <polygon points="70,20 80,14 80,26" />
          <polygon points="90,20 80,14 80,26" />
          <circle cx="80" cy="20" r="3" />
        </g>
      )}
    </svg>
  )
}
