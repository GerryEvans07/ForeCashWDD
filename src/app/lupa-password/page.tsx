'use client'

// Minta link reset kata sandi. Email dikirim oleh Supabase Auth.
// Pesan setelah submit selalu sama (seperti versi PHP), jadi orang lain
// tidak bisa mengecek email mana yang terdaftar.
import { useState } from 'react'
import Link from 'next/link'
import AuthLayout from '@/components/AuthLayout'
import { createClient } from '@/lib/supabase/client'

export default function LupaPasswordPage() {
  const [email, setEmail] = useState('')
  const [terkirim, setTerkirim] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      // setelah klik link di email: tukar kode jadi sesi, lalu ke halaman ganti kata sandi
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (error && /rate limit|too many|security purposes/i.test(error.message)) {
      return setError('Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi.')
    }
    setTerkirim(true)
  }

  return (
    <AuthLayout judul="Lupa Kata Sandi" sub="Masukkan email akunmu. Kami kirim link untuk membuat kata sandi baru.">
      <div className="hs-card p-6 sm:p-8 space-y-5 text-left">
        {terkirim ? (
          <p className="text-sm font-bold text-emerald-700 bg-emerald-50 rounded-xl px-3 py-3" role="status">
            Jika email tersebut terdaftar, link reset sudah dikirim. Cek kotak masuk (atau folder spam). Link berlaku 1 jam.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-sm font-bold text-hsRed" role="alert">{error}</p>}
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@student.umn.ac.id" className="w-full px-4 py-3 border text-sm font-semibold" />
            </div>
            <button disabled={loading} className="hs-btn bg-hsOrange text-white w-full py-3.5 text-base disabled:opacity-60">
              {loading ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
          </form>
        )}
        <p className="text-center"><Link href="/login" className="text-xs font-bold text-hsOrange hover:underline">Kembali ke login</Link></p>
      </div>
    </AuthLayout>
  )
}
