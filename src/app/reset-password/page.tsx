'use client'

// Buat kata sandi baru. Halaman ini dibuka dari link email (lewat /auth/callback),
// jadi user sudah punya sesi sementara saat sampai di sini.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'cek' | 'siap' | 'invalid'>('cek')
  const [password, setPassword] = useState('')
  const [ulang, setUlang] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setStatus(data.user ? 'siap' : 'invalid'))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Kata sandi minimal 8 karakter.')
    if (password !== ulang) return setError('Konfirmasi kata sandi tidak sama.')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setLoading(false)
      return setError(/different from the old/i.test(error.message) ? 'Kata sandi baru harus berbeda dari yang lama.' : 'Gagal menyimpan: ' + error.message)
    }
    await supabase.auth.signOut()
    router.replace('/login?info=reset')
  }

  return (
    <AuthLayout judul="Kata Sandi Baru">
      <div className="hs-card p-6 sm:p-8 space-y-5 text-left">
        {status === 'cek' && <p className="text-sm text-slate-500">Memeriksa link...</p>}
        {status === 'invalid' && (
          <>
            <p className="text-sm font-bold text-hsRed">Link sudah kedaluwarsa atau sudah pernah dipakai.</p>
            <Link href="/lupa-password" className="hs-btn bg-hsOrange text-white w-full py-3">Minta link baru</Link>
          </>
        )}
        {status === 'siap' && (
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-sm font-bold text-hsRed" role="alert">{error}</p>}
            <div className="space-y-1">
              <label htmlFor="pw" className="text-xs font-bold uppercase tracking-wider">Kata Sandi Baru</label>
              <input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="w-full px-4 py-3 border text-sm font-semibold" />
            </div>
            <div className="space-y-1">
              <label htmlFor="pw2" className="text-xs font-bold uppercase tracking-wider">Ulangi Kata Sandi</label>
              <input id="pw2" type="password" required minLength={8} value={ulang} onChange={(e) => setUlang(e.target.value)} autoComplete="new-password" className="w-full px-4 py-3 border text-sm font-semibold" />
            </div>
            <button disabled={loading} className="hs-btn bg-hsOrange text-white w-full py-3.5 text-base disabled:opacity-60">
              {loading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
