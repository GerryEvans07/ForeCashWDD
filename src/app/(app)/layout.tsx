// Layout untuk semua halaman setelah login (folder (app) tidak muncul di URL).
// Tahap 1: memakai user contoh. Mulai Tahap 3 data user diambil dari Supabase.

import AppShell, { type ShellUser } from '@/components/layout/AppShell'
import { hariIni, jamSekarang, tglPanjang, sapaan } from '@/lib/tanggal'

// tanggal & sapaan dihitung ulang setiap kali halaman dibuka
export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user: ShellUser = { nama: 'Momo Mahasiswa', avatar: 'a2', role: 'mahasiswa' }

  return (
    <AppShell user={user} tanggal={tglPanjang(hariIni())} sapaan={sapaan(jamSekarang())}>
      {children}
    </AppShell>
  )
}
