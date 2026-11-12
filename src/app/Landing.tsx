'use client'

// Landing page ForeCash (port dari php-version/index.html), termasuk splash pembuka & animasi.
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import './landing.css'

const NAMA = 'ForeCash'

export default function Landing() {
  // splash cukup tampil sekali per kunjungan
  const [splash, setSplash] = useState<'tampil' | 'keluar' | 'hilang'>('tampil')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let sudah = false
    try { sudah = sessionStorage.getItem('fc_splash') === '1' } catch { /* abaikan */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage hanya ada di browser
    if (sudah) setSplash('hilang')
    const t = setTimeout(() => setSplash((s) => (s === 'tampil' ? 'keluar' : s)), 2600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (splash !== 'keluar') return
    try { sessionStorage.setItem('fc_splash', '1') } catch { /* abaikan */ }
    const t = setTimeout(() => setSplash('hilang'), 900)
    return () => clearTimeout(t)
  }, [splash])

  // section muncul saat di-scroll
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('show')
          io.unobserve(en.target)
        }
      })
    }, { threshold: 0.2 })
    ref.current?.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="fc-landing">
      <div className={splash === 'tampil' ? '' : 'anim'} ref={ref}>
        {splash !== 'hilang' && (
          <div className={`splash ${splash === 'keluar' ? 'done' : ''}`} aria-hidden="true" onClick={() => setSplash('keluar')}>
            <div className="splash-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" className="splash-logo" />
              <div className="splash-shadow" />
              <div className="splash-name">
                {NAMA.split('').map((c, i) => <span key={i} style={{ animationDelay: `${1.0 + i * 0.06}s` }}>{c}</span>)}
              </div>
              <div className="splash-tag">Mindful Spending, Smarter Planning</div>
            </div>
            <span className="splash-skip">klik untuk lewati</span>
          </div>
        )}

        <div className="page">
          <nav>
            <a href="#" className="logo" aria-label="ForeCash Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" className="logo-3d" />
              <span>ForeCash</span>
            </a>
            <div className="nav-links">
              <a href="#about">Tentang ForeCash</a>
              <a href="#mindful">Mindful Spending</a>
            </div>
            <Link href="/login" className="nav-button">Mulai Sekarang</Link>
          </nav>

          <main>
            <section className="hero" id="start">
              <div className="hero-copy">
                <div className="eyebrow"><span className="eyebrow-dot" /> Financial wellness, made simple</div>
                <h1>Mindful Spending,<br />Smarter Planning.</h1>
                <p>Kelola uang dengan lebih tenang, lebih sadar, dan tanpa membuat keuangan terasa rumit.</p>
                <div className="hero-actions">
                  <Link href="/login" className="primary">MULAI SEKARANG!</Link>
                  <a href="#mindful" className="secondary">Pelajari lebih lanjut →</a>
                </div>
              </div>

              <div className="illustration" aria-hidden="true">
                <div className="sun" />
                <div className="stem" />
                <div className="leaf" />
                <div className="coin"><div className="coin-face" /><div className="coin-smile" /></div>
                <div className="wallet"><div className="wallet-face" /><div className="wallet-smile" /></div>
                <div className="blue-card"><div className="card-face" /><div className="card-smile" /></div>
                <div className="spark one">✦</div>
                <div className="spark two">✦</div>
                <div className="spark three">✦</div>
              </div>
            </section>

            <section className="intro reveal" id="about">
              <h2>Keuangan yang terasa lebih ringan.</h2>
              <p>ForeCash hadir dengan pendekatan yang sederhana dan ramah, supaya merencanakan keuangan terasa seperti kebiasaan baik, bukan pekerjaan yang melelahkan.</p>
              <span className="mini-note">Pelan-pelan. Konsisten. Lebih sadar.</span>
            </section>

            <section className="intro reveal" id="mindful">
              <h2>Spend with intention.</h2>
              <p>Bukan tentang menghabiskan lebih sedikit. Ini tentang memahami ke mana uangmu pergi dan membuat pilihan yang sesuai dengan tujuanmu.</p>
            </section>
          </main>

          <footer>© 2026 ForeCash · Mindful Spending, Smarter Planning</footer>
        </div>
      </div>
    </div>
  )
}
