'use client'

// Tampilan ForeCash Assistant: tombol logo yang bisa digeser + panel chat.
// Port dari php-version/assets/js/chatbot.js. Jawaban diambil dari /api/chatbot.
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

type Pesan = { dari: 'user' | 'bot'; teks: string }
const SARAN = ['Kapan uangku habis?', 'Tips hemat', 'Cek saldo', 'Utang & piutang', 'Level aku']
const POS_KEY = 'forecash_bot_pos'

/** Ubah **tebal**, [teks](/link), dan baris baru menjadi elemen React (aman, tanpa HTML mentah). */
function TeksBot({ teks }: { teks: string }) {
  return (
    <>
      {teks.split('\n').map((baris, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {baris.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(\/[^)]*\))/g).map((bag, j) => {
            const tebal = bag.match(/^\*\*([^*]+)\*\*$/)
            if (tebal) return <b key={j}>{tebal[1]}</b>
            const link = bag.match(/^\[([^\]]+)\]\((\/[^)]*)\)$/)
            if (link) return <Link key={j} href={link[2]} className="underline font-bold">{link[1]}</Link>
            return <Fragment key={j}>{bag}</Fragment>
          })}
        </Fragment>
      ))}
    </>
  )
}

export default function Chatbot({ nama }: { nama: string }) {
  const [buka, setBuka] = useState(false)
  const [pesan, setPesan] = useState<Pesan[]>([])
  const [input, setInput] = useState('')
  const [menunggu, setMenunggu] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // posisi tombol: dibatasi supaya tetap di layar (dan tidak menutupi tab bar di HP)
  const batasi = useCallback((p: { x: number; y: number }) => {
    const bawah = window.innerWidth < 1024 ? 100 : 0
    return {
      x: Math.min(Math.max(8, p.x), window.innerWidth - 72),
      y: Math.min(Math.max(8, p.y), window.innerHeight - 72 - bawah),
    }
  }, [])

  useEffect(() => {
    let awal = { x: window.innerWidth - 88, y: window.innerHeight - 96 }
    try {
      const simpan = localStorage.getItem(POS_KEY)
      if (simpan) awal = JSON.parse(simpan)
    } catch { /* abaikan */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- posisi hanya bisa dihitung di browser
    setPos(batasi(awal))
    const ubah = () => setPos((p) => (p ? batasi(p) : p))
    window.addEventListener('resize', ubah)
    return () => window.removeEventListener('resize', ubah)
  }, [batasi])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [pesan, menunggu])

  function toggle() {
    setBuka((b) => {
      if (!b && pesan.length === 0) setPesan([{ dari: 'bot', teks: `Halo ${nama}! Aku ForeCash Assistant. Mau tanya apa soal keuanganmu?` }])
      if (!b) setTimeout(() => inputRef.current?.focus(), 50)
      return !b
    })
  }

  async function tanya(teks: string) {
    if (!teks.trim() || menunggu) return
    setPesan((p) => [...p, { dari: 'user', teks }])
    setMenunggu(true)
    try {
      const res = await fetch('/api/chatbot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pesan: teks }) })
      const j = await res.json()
      setPesan((p) => [...p, { dari: 'bot', teks: j.jawaban ?? j.error ?? 'Terjadi kesalahan.' }])
    } catch {
      setPesan((p) => [...p, { dari: 'bot', teks: 'Maaf, aku tidak bisa terhubung ke server. Coba lagi sebentar.' }])
    } finally {
      setMenunggu(false)
    }
  }

  if (!pos) return null

  // panel dibuka di sisi yang masih muat di layar
  const pw = 352
  const ph = 448
  const panelX = Math.min(Math.max(12, pos.x + 64 - pw), (typeof window !== 'undefined' ? window.innerWidth : 1200) - pw - 12)
  const panelY = pos.y - ph - 12 > 12 ? pos.y - ph - 12 : Math.min(pos.y + 76, (typeof window !== 'undefined' ? window.innerHeight : 800) - ph - 12)

  return (
    <>
      <button
        aria-label="Buka ForeCash Assistant"
        title="ForeCash Assistant (bisa digeser)"
        className="fixed z-[90] w-16 h-16 flex items-center justify-center cursor-grab touch-none select-none bg-transparent"
        style={{ left: pos.x, top: pos.y }}
        onPointerDown={(e) => {
          drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, moved: false }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          const dx = e.clientX - d.sx
          const dy = e.clientY - d.sy
          if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true
          if (d.moved) setPos(batasi({ x: d.ox + dx, y: d.oy + dy }))
        }}
        onPointerUp={() => {
          const d = drag.current
          drag.current = null
          if (!d) return
          if (d.moved) {
            try { localStorage.setItem(POS_KEY, JSON.stringify(pos)) } catch { /* abaikan */ }
          } else toggle()
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="fc-bot-logo w-14 h-14 pointer-events-none" draggable={false} />
      </button>

      {buka && (
        <div className="fixed z-[91] w-[22rem] max-w-[calc(100vw-1.5rem)] hs-card flex flex-col overflow-hidden" style={{ height: '28rem', left: panelX, top: panelY }} role="dialog" aria-label="ForeCash Assistant">
          <div className="flex items-center gap-3 px-4 py-3 bg-hsYellow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="w-9 h-9 shrink-0 drop-shadow" />
            <div className="flex-1">
              <p className="font-black text-sm">ForeCash Assistant</p>
              <p className="text-[10px] font-bold text-hsDark/70">Menjawab dari data keuanganmu</p>
            </div>
            <button onClick={toggle} className="w-8 h-8 rounded-full bg-white/70 font-bold inline-flex items-center justify-center" aria-label="Tutup"><X size={16} /></button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-xs" aria-live="polite">
            {pesan.map((m, i) =>
              m.dari === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="bg-hsOrange text-white rounded-2xl rounded-br-md px-3 py-2 max-w-[80%]">{m.teks}</div>
                </div>
              ) : (
                <div key={i} className="flex gap-2 items-end">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.svg" alt="" className="w-7 h-7 shrink-0 drop-shadow" />
                  <div className="bg-slate-100 rounded-2xl rounded-bl-md px-3 py-2 max-w-[80%] leading-relaxed"><TeksBot teks={m.teks} /></div>
                </div>
              ),
            )}
            {menunggu && <p className="text-slate-500 pl-9">Sedang menghitung...</p>}
          </div>

          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
            {SARAN.map((s) => (
              <button key={s} type="button" onClick={() => tanya(s)} className="bg-slate-100 hover:bg-hsYellow rounded-full px-2.5 py-1 text-[11px] font-bold">{s}</button>
            ))}
          </div>
          <form
            className="flex gap-2 p-3 border-t"
            onSubmit={(e) => {
              e.preventDefault()
              tanya(input)
              setInput('')
            }}
          >
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} maxLength={200} autoComplete="off" placeholder="Tanya sesuatu..." aria-label="Pertanyaan" className="flex-1 px-3 py-2 text-xs border" />
            <button className="hs-btn bg-hsOrange text-white px-4 text-xs">Kirim</button>
          </form>
        </div>
      )}
    </>
  )
}
