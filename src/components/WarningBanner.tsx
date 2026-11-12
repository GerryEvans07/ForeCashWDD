// Banner peringatan dini (port dari php-version/includes/layout/warning.php).
// Langitnya ikut status: cerah (aman), senja (waspada), mendung + hujan (kritis).
import { Check, Zap, TriangleAlert } from 'lucide-react'
import Avatar, { moodFor } from '@/components/Avatar'
import type { Forecast } from '@/lib/forecast'
import { rupiah } from '@/lib/format'
import { tgl, tambahHari, hariIni } from '@/lib/tanggal'

const LABEL = { aman: 'Aman', waspada: 'Waspada', kritis: 'Kritis' }
const DOT = { aman: '#2EBD74', waspada: '#F0A000', kritis: '#FF5B5B' }
const KATA = { aman: 'Aman, lanjutkan!', waspada: 'Pelan-pelan ya...', kritis: 'Gawat, rem dulu!' }
const BUKIT1 = { aman: '#7FD6A0', waspada: '#F4B860', kritis: '#A79FCB' }
const BUKIT2 = { aman: '#4CC283', waspada: '#E89A3C', kritis: '#8C83B8' }

type Props = {
  f: Forecast
  avatarId: string
  /** teman hemat yang menemani (diisi mulai Tahap 10) */
  buddy?: React.ReactNode
}

export default function WarningBanner({ f, avatarId, buddy }: Props) {
  const st = f.status
  const hari = hariIni()

  // hari-hari menuju pemasukan berikutnya: koin = hari yang masih tertutup saldo
  const hariTotal = f.sisaHari ? Math.min(45, f.sisaHari) : 0
  const hariAman = f.runway === null ? hariTotal : Math.min(hariTotal, f.runway)

  return (
    <section className="fc-hero" data-status={st} aria-label="Peringatan dini">
      <svg className="fc-hero-scene" viewBox="0 0 1200 320" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        {st === 'aman' && (
          <>
            <circle cx="840" cy="70" r="120" fill="#FFF3B0" opacity=".55" />
            <image href="/logo.svg" x="770" y="0" width="140" height="140" />
            <g fill="#fff" opacity=".9"><ellipse cx="640" cy="70" rx="60" ry="20" /><ellipse cx="680" cy="55" rx="40" ry="24" /><ellipse cx="1000" cy="40" rx="46" ry="14" /></g>
          </>
        )}
        {st === 'waspada' && (
          <>
            <circle cx="830" cy="210" r="150" fill="#FFB347" opacity=".35" />
            <image href="/logo.svg" x="765" y="130" width="130" height="130" />
            <g fill="#FFF4DB" opacity=".9"><ellipse cx="650" cy="80" rx="70" ry="18" /><ellipse cx="1010" cy="50" rx="50" ry="14" /></g>
          </>
        )}
        {st === 'kritis' && (
          <>
            <image href="/logo.svg" x="790" y="60" width="110" height="110" opacity=".55" />
            <g fill="#8E86B5"><ellipse cx="830" cy="80" rx="110" ry="40" /><ellipse cx="890" cy="60" rx="70" ry="42" /><ellipse cx="760" cy="70" rx="60" ry="34" /></g>
            <g stroke="#7FA4E6" strokeWidth="5" strokeLinecap="round" className="fc-rain">
              <line x1="770" y1="130" x2="762" y2="150" /><line x1="815" y1="140" x2="807" y2="160" /><line x1="860" y1="128" x2="852" y2="148" />
              <line x1="905" y1="138" x2="897" y2="158" /><line x1="790" y1="175" x2="782" y2="195" /><line x1="880" y1="178" x2="872" y2="198" />
            </g>
          </>
        )}
        {/* bukit */}
        <path d="M640 320 C760 210 880 200 1000 250 C1080 280 1150 240 1200 220 L1200 320 Z" fill={BUKIT1[st]} />
        <path d="M760 320 C860 260 980 250 1090 290 C1140 305 1180 300 1200 296 L1200 320 Z" fill={BUKIT2[st]} />
      </svg>

      <div className="fc-hero-text">
        <span className="fc-hero-badge">
          <span className="fc-hero-dot" style={{ background: DOT[st] }}>
            {st === 'aman' ? <Check size={12} strokeWidth={3.5} /> : st === 'waspada' ? <b>!</b> : <Zap size={12} strokeWidth={3} />}
          </span>
          Status {LABEL[st]}
        </span>

        <h2>
          {f.burn <= 0 ? (
            'Belum ada pengeluaran yang tercatat.'
          ) : f.saldo <= 0 ? (
            'Saldo sudah habis.'
          ) : (
            <>Saldo cukup sampai <span className="fc-hero-date">{tgl(f.habis!)}</span></>
          )}
        </h2>

        <p>
          {f.next ? (
            <>
              {f.next.sumber} datang {tgl(f.next.tanggal_perkiraan)}, {f.sisaHari} hari lagi.
              {st !== 'aman' && f.batasAman !== null && (
                <> Supaya cukup, belanja maksimal <strong>{rupiah(f.batasAman)}</strong> per hari.</>
              )}
            </>
          ) : (
            'Belum ada jadwal pemasukan. Tambahkan di menu Prediksi supaya peringatannya lebih tepat.'
          )}
        </p>

        {f.terlambat.map((t) => (
          <p key={t.id} style={{ color: '#C22C2C' }}>
            <TriangleAlert size={15} className="inline -mt-0.5" /> {t.sumber} ({rupiah(t.nominal)}) belum datang sejak {tgl(t.tanggal_perkiraan)}.
          </p>
        ))}

        {hariTotal > 0 ? (
          <div className="fc-days">
            <div className="fc-days-head">
              <span>Hari menuju pemasukan</span>
              <span>{hariAman} dari {hariTotal} hari tertutup saldo</span>
            </div>
            <div className="fc-days-row">
              {Array.from({ length: hariTotal }, (_, idx) => {
                const i = idx + 1
                const kelas = i === hariTotal ? 'is-pay' : i <= hariAman ? 'is-ok' : 'is-short'
                return <span key={i} className={`fc-day ${kelas}`} title={tgl(tambahHari(hari, i))} />
              })}
            </div>
            <div className="fc-days-legend">
              <span><i className="fc-day is-ok" /> Saldo cukup</span>
              {hariAman < hariTotal - 1 && <span><i className="fc-day is-short" /> Saldo kurang</span>}
              <span><i className="fc-day is-pay" /> Pemasukan</span>
            </div>
          </div>
        ) : f.runway !== null ? (
          <div className="fc-days"><div className="fc-days-head"><span>Daya tahan saldo</span><span>{f.runway} hari lagi</span></div></div>
        ) : null}
      </div>

      {/* maskot bereaksi: ekspresi avatar mengikuti status keuangan */}
      <div className="fc-hero-mascot">
        <div className="fc-bubble">{KATA[st]}</div>
        <div className="fc-hero-avatar character-bounce"><Avatar id={avatarId} mood={moodFor(st)} size={136} /></div>
        {buddy}
      </div>
    </section>
  )
}
