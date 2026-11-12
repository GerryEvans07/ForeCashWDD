// Kerangka halaman login / lupa / reset password (latar #loginPage dari versi PHP).
import Link from 'next/link'

export default function AuthLayout({ children, judul, sub }: { children: React.ReactNode; judul?: string; sub?: React.ReactNode }) {
  return (
    <div id="loginPage" className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Logo ForeCash" className="w-32 h-32 mx-auto character-bounce drop-shadow-xl" />
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-hsDark">{judul ?? 'ForeCash'}</h1>
          {sub && <p className="text-sm font-medium text-slate-600 px-4">{sub}</p>}
        </div>
        {children}
        <Link href="/" className="text-xs font-bold text-slate-500 inline-block">← Kembali ke beranda</Link>
      </div>
    </div>
  )
}
