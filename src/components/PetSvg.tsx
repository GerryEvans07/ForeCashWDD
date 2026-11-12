// Gambar teman hemat & telur (port dari pet_svg() dan egg_svg() di php-version/includes/pets.php).
import { PETS, type TipePet } from '@/lib/pets'

const INK = '#2D2216'

function Telinga({ tipe, c, d }: { tipe: TipePet; c: string; d: string }) {
  switch (tipe) {
    case 'pig':
      return <path d="M26 30 L22 14 L38 24 Z M74 30 L78 14 L62 24 Z" fill={d} />
    case 'bunny':
      return (
        <>
          <ellipse cx="36" cy="16" rx="8" ry="20" fill={c} stroke={d} strokeWidth="3" />
          <ellipse cx="64" cy="16" rx="8" ry="20" fill={c} stroke={d} strokeWidth="3" />
          <ellipse cx="36" cy="18" rx="3.5" ry="12" fill="#FFC4D6" />
          <ellipse cx="64" cy="18" rx="3.5" ry="12" fill="#FFC4D6" />
        </>
      )
    case 'bear':
      return (
        <>
          <circle cx="26" cy="30" r="11" fill={d} /><circle cx="74" cy="30" r="11" fill={d} />
          <circle cx="26" cy="30" r="5" fill={c} /><circle cx="74" cy="30" r="5" fill={c} />
        </>
      )
    case 'leaf':
      return (
        <>
          <path d="M50 26 C50 18 52 12 56 8" stroke="#2E8B57" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M55 12 C64 2 78 6 80 12 C70 20 60 18 55 12Z" fill="#4CC283" />
        </>
      )
    case 'cat':
      return <path d="M22 36 L24 12 L42 26 Z M78 36 L76 12 L58 26 Z" fill={c} stroke={d} strokeWidth="3" strokeLinejoin="round" />
    case 'frog':
      return (
        <>
          <circle cx="32" cy="26" r="12" fill={c} stroke={d} strokeWidth="3" />
          <circle cx="68" cy="26" r="12" fill={c} stroke={d} strokeWidth="3" />
        </>
      )
    case 'cloud':
      return (
        <>
          <circle cx="30" cy="38" r="14" fill={c} /><circle cx="50" cy="28" r="17" fill={c} /><circle cx="70" cy="38" r="14" fill={c} />
        </>
      )
    case 'tuft':
      return <path d="M44 24 C44 14 52 12 54 18 C56 10 64 12 60 22" stroke={d} strokeWidth="4" fill="none" strokeLinecap="round" />
    case 'cow':
      return (
        <>
          <path d="M20 34 C10 28 10 22 18 22 C24 22 28 28 30 32 Z M80 34 C90 28 90 22 82 22 C76 22 72 28 70 32 Z" fill={d} />
          <path d="M34 24 C32 16 36 14 38 18 M66 24 C68 16 64 14 62 18" stroke="#C9A36A" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )
    case 'fox':
      return (
        <>
          <path d="M22 38 L20 10 L44 28 Z M78 38 L80 10 L56 28 Z" fill={c} stroke={d} strokeWidth="3" strokeLinejoin="round" />
          <path d="M24 32 L23 18 L36 28 Z M76 32 L77 18 L64 28 Z" fill="#FFF1E5" />
        </>
      )
  }
}

type Props = { id: string; size?: number; x?: number; y?: number; className?: string }

export default function PetSvg({ id, size = 64, x, y, className }: Props) {
  const p = PETS[id] ?? PETS.celeng
  const { warna: c, gelap: d, tipe } = p
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} x={x} y={y} className={className} role="img" aria-label={p.nama}>
      <ellipse cx="50" cy="94" rx="30" ry="5" fill="#000" opacity=".12" />
      <Telinga tipe={tipe} c={c} d={d} />
      <ellipse cx="50" cy="60" rx="38" ry="33" fill={c} />
      <ellipse cx="50" cy="60" rx="38" ry="33" fill="none" stroke={d} strokeWidth="3" />
      <ellipse cx="38" cy="44" rx="12" ry="6" fill="#fff" opacity=".5" transform="rotate(-20 38 44)" />
      {tipe === 'cow' && (
        <>
          <ellipse cx="32" cy="66" rx="9" ry="7" fill="#5A4636" opacity=".85" />
          <ellipse cx="72" cy="52" rx="7" ry="6" fill="#5A4636" opacity=".85" />
        </>
      )}
      {(tipe === 'fox' || tipe === 'bear') && <ellipse cx="50" cy="76" rx="18" ry="12" fill="#FFF6E8" opacity=".8" />}
      <circle cx="37" cy="58" r="5.5" fill={INK} className="hs-eye" />
      <circle cx="63" cy="58" r="5.5" fill={INK} className="hs-eye" />
      <circle cx="35.5" cy="56" r="2" fill="#fff" />
      <circle cx="61.5" cy="56" r="2" fill="#fff" />
      <ellipse cx="27" cy="68" rx="6" ry="3.5" fill="#FF7FA0" opacity=".45" />
      <ellipse cx="73" cy="68" rx="6" ry="3.5" fill="#FF7FA0" opacity=".45" />
      {tipe === 'pig' ? (
        <>
          <ellipse cx="50" cy="70" rx="10" ry="7" fill={d} />
          <circle cx="46" cy="70" r="2" fill={INK} /><circle cx="54" cy="70" r="2" fill={INK} />
        </>
      ) : (
        <path d="M45 70 Q50 75 55 70" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function EggSvg({ progress, size = 120 }: { progress: number; size?: number }) {
  return (
    <svg viewBox="0 0 100 110" width={size} height={Math.round(size * 1.1)} aria-hidden="true">
      <ellipse cx="50" cy="104" rx="30" ry="5" fill="#000" opacity=".12" />
      <path d="M50 6 C74 6 88 44 88 66 C88 90 70 102 50 102 C30 102 12 90 12 66 C12 44 26 6 50 6Z" fill="#FFF3D6" stroke="#E9D29A" strokeWidth="3" />
      <circle cx="34" cy="40" r="7" fill="#FFC83D" /><circle cx="64" cy="30" r="5" fill="#FF8A1F" />
      <circle cx="70" cy="72" r="8" fill="#8B6CF0" opacity=".7" /><circle cx="30" cy="80" r="5" fill="#2EBD74" opacity=".7" />
      <ellipse cx="36" cy="28" rx="8" ry="14" fill="#fff" opacity=".7" transform="rotate(25 36 28)" />
      {progress >= 3 && <path d="M38 58 L46 64 L42 70 L50 74" stroke="#8C6A3F" strokeWidth="3" fill="none" strokeLinecap="round" />}
      {progress >= 5 && <path d="M62 46 L56 52 L62 58 L56 62" stroke="#8C6A3F" strokeWidth="3" fill="none" strokeLinecap="round" />}
    </svg>
  )
}
