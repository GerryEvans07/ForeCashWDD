'use client'

// Form Login & Registrasi (port dari php-version/pages/login.php) + tombol login Google.
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import AvatarPicker from '@/components/AvatarPicker'

type Mode = 'masuk' | 'daftar'

// pesan error Supabase (bahasa Inggris) -> bahasa Indonesia
function pesanError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email atau kata sandi salah.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Email sudah digunakan.'
  if (m.includes('email not confirmed')) return 'Email belum dikonfirmasi. Cek kotak masuk email kamu.'
  if (m.includes('password should be') || m.includes('at least')) return 'Kata sandi minimal 8 karakter.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.'
  if (m.includes('provider is not enabled')) return 'Login Google belum diaktifkan di Supabase.'
  return 'Terjadi kesalahan: ' + msg
}

export default function LoginForm({ mode: modeAwal, info, error: errorAwal }: { mode: Mode; info?: string; error?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(modeAwal)
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'mahasiswa' | 'orangtua'>('mahasiswa')
  const [avatar, setAvatar] = useState('a1')
  const [error, setError] = useState(errorAwal ?? '')
  const [pesan, setPesan] = useState(info ?? '')
  const [loading, setLoading] = useState(false)

  const gantiMode = (m: Mode) => {
    setMode(m)
    setError('')
    setPesan('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setPesan('')
    const supabase = createClient()

    if (mode === 'daftar') {
      if (!nama.trim()) return setError('Nama wajib diisi.')
      if (password.length < 8) return setError('Kata sandi minimal 8 karakter.')
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // dibaca oleh trigger handle_new_user() di database untuk membuat profil
          data: { nama: nama.trim(), role, avatar },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      setLoading(false)
      if (error) return setError(pesanError(error.message))

      // Supabase mengembalikan user tanpa identitas jika email sudah terdaftar
      if (data.user && data.user.identities?.length === 0) return setError('Email sudah digunakan.')

      if (data.session) {
        // "Confirm email" dimatikan di Supabase: langsung masuk
        fetch('/api/email/selamat-datang', { method: 'POST' }).catch(() => null)
        router.replace(role === 'orangtua' ? '/pantau' : '/beranda')
        router.refresh()
      } else {
        setPesan('Akun dibuat. Cek email kamu dan klik link konfirmasi, lalu login.')
        setMode('masuk')
      }
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) return setError(pesanError(error.message))
    // halaman /beranda otomatis mengarahkan orang tua ke /pantau
    router.replace('/beranda')
    router.refresh()
  }

  async function masukGoogle() {
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setLoading(false)
      setError(pesanError(error.message))
    }
    // kalau berhasil, browser pindah ke halaman login Google
  }

  return (
    <div className="hs-card p-6 sm:p-8 space-y-5 text-left">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        {(['masuk', 'daftar'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => gantiMode(m)}
            className={clsx(
              'w-1/2 py-2 text-sm font-bold rounded-xl text-center',
              mode === m ? 'bg-hsYellow text-hsDark shadow-sm' : 'text-slate-500',
            )}
          >
            {m === 'masuk' ? 'Login' : 'Registrasi'}
          </button>
        ))}
      </div>

      {error && <p className="text-sm font-bold text-hsRed" role="alert">{error}</p>}
      {pesan && <p className="text-sm font-bold text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2" role="status">{pesan}</p>}

      <form onSubmit={submit} className="space-y-4">
        {mode === 'daftar' && (
          <>
            <div className="space-y-1">
              <label htmlFor="role" className="text-xs font-bold uppercase tracking-wider">Daftar Sebagai</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="w-full px-4 py-3 border text-sm font-semibold">
                <option value="mahasiswa">🎓 Mahasiswa</option>
                <option value="orangtua">👨‍👩‍👧 Orang Tua / Wali</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="nama" className="text-xs font-bold uppercase tracking-wider">Nama Lengkap</label>
              <input id="nama" required value={nama} onChange={(e) => setNama(e.target.value)} maxLength={100} placeholder="Nama lengkap" className="w-full px-4 py-3 border text-sm font-semibold" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider">Pilih Avatar</p>
              <AvatarPicker value={avatar} onChange={setAvatar} />
            </div>
          </>
        )}
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@student.umn.ac.id" autoComplete="email" className="w-full px-4 py-3 border text-sm font-semibold" />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider">Kata Sandi</label>
          <input
            id="password"
            type="password"
            required
            minLength={mode === 'daftar' ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === 'daftar' ? 'new-password' : 'current-password'}
            className="w-full px-4 py-3 border text-sm font-semibold"
          />
        </div>
        {mode === 'masuk' && (
          <p className="text-right -mt-2">
            <Link href="/lupa-password" className="text-xs font-bold text-hsOrange hover:underline">Lupa kata sandi?</Link>
          </p>
        )}
        <button disabled={loading} className="hs-btn bg-hsOrange text-white w-full py-3.5 text-base disabled:opacity-60">
          {loading ? 'Memproses...' : mode === 'daftar' ? 'Buat Akun' : 'Masuk'}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
        <span className="h-px flex-1 bg-slate-100" /> atau <span className="h-px flex-1 bg-slate-100" />
      </div>
      <button type="button" onClick={masukGoogle} disabled={loading} className="hs-btn bg-white text-hsDark w-full py-3 text-sm disabled:opacity-60" style={{ border: "2px solid var(--line)" }}>
        Lanjutkan dengan Google
      </button>
      {mode === 'daftar' && (
        <p className="text-[11px] text-slate-500 -mt-2">Akun dari Google otomatis terdaftar sebagai mahasiswa.</p>
      )}
    </div>
  )
}
