'use client'

// Kerangka halaman setelah login: sidebar (desktop), header halaman, tab bar bawah (HP).
// Port dari php-version/includes/layout/header.php + footer.php. Class CSS-nya sama.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Eye } from 'lucide-react'
import clsx from 'clsx'
import Avatar from '@/components/Avatar'
import { MENU_MAHASISWA, MENU_ORANGTUA, JUDUL_HALAMAN } from '@/lib/navigation'
import { namaDepan } from '@/lib/format'

export type ShellUser = { nama: string; avatar: string; role: 'mahasiswa' | 'orangtua' }

type Props = {
  user: ShellUser
  /** contoh 'Jumat, 13 Nov 2026' (dihitung di server dalam WIB) */
  tanggal: string
  /** contoh 'Selamat pagi' */
  sapaan: string
  /** tombol keluar (form server action), diisi mulai Tahap 3 */
  logout?: React.ReactNode
  children: React.ReactNode
}

export default function AppShell({ user, tanggal, sapaan, logout, children }: Props) {
  const pathname = usePathname()
  const menus = user.role === 'orangtua' ? MENU_ORANGTUA : MENU_MAHASISWA
  const home = menus[0].href
  // halaman tanpa menu sendiri ikut menyalakan menu induknya (Kelola Wallet -> Beranda)
  const induk: Record<string, string> = { '/wallet': '/beranda' }
  const path = induk[pathname] ?? pathname
  const aktif = (href: string) => path === href || path.startsWith(href + '/')
  const judul = pathname === '/beranda' ? `${sapaan}, ${namaDepan(user.nama)}!` : JUDUL_HALAMAN[pathname] ?? 'ForeCash'

  return (
    <div className="fc-body">
      {/* ===== Sidebar (layar lebar) ===== */}
      <aside className="fc-side" aria-label="Menu utama">
        <Link href={home} className="fc-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="fc-brand-logo" />
          <span>
            <span className="fc-brand-name">ForeCash</span>
            <span className="fc-brand-tag">Uang aman sampai kiriman berikutnya</span>
          </span>
        </Link>

        <nav className="fc-nav">
          {menus.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={clsx('fc-nav-item', aktif(m.href) && 'is-active')}
              aria-current={aktif(m.href) ? 'page' : undefined}
            >
              <span className={`fc-tile fc-tile-${m.warna}`}><m.icon size={17} strokeWidth={2.5} /></span>
              {m.label}
            </Link>
          ))}
        </nav>

        <div className="fc-side-foot">
          <Link href="/akun" className={clsx('fc-me', aktif('/akun') && 'is-active')}>
            <span className="fc-me-avatar"><Avatar id={user.avatar} size={44} /></span>
            <span className="min-w-0">
              <span className="fc-me-name">{user.nama}</span>
              <span className="fc-me-role">{user.role === 'orangtua' ? 'Orang tua' : 'Mahasiswa'} · Akun</span>
            </span>
          </Link>
          {logout ?? (
            <Link href="/login" className="fc-logout">
              <LogOut size={14} className="inline -mt-0.5" /> Keluar
            </Link>
          )}
        </div>
      </aside>

      <div className="fc-main">
        {user.role === 'orangtua' && (
          <div className="fc-parent-strip">
            <Eye size={14} className="inline -mt-0.5" /> Mode pantau: data anak hanya bisa dilihat, tidak bisa diubah.
          </div>
        )}

        <header className="fc-top">
          <Link href={home} className="fc-top-logo" aria-label="ForeCash">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" />
          </Link>
          <div className="min-w-0">
            <p className="fc-top-date">{tanggal}</p>
            <h1 className="fc-top-title">{judul}</h1>
          </div>
          <Link href="/akun" className="fc-top-avatar" aria-label="Akun">
            <Avatar id={user.avatar} size={40} />
          </Link>
        </header>

        <main className="fc-content">{children}</main>
      </div>

      {/* ===== Tab bar bawah (HP) ===== */}
      <nav className="fc-tabbar" aria-label="Menu utama">
        {menus.map((m) => (
          <Link key={m.href} href={m.href} className={clsx(aktif(m.href) && 'is-active')}>
            <span className={`fc-tile fc-tile-${m.warna}`}><m.icon size={15} strokeWidth={2.5} /></span>
            <span>{m.pendek}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
