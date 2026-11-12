// Layout untuk semua halaman setelah login (folder (app) tidak muncul di URL).
import { LogOut } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { wajibLogin } from '@/lib/auth'
import { keluar } from '@/lib/actions/auth'
import { hariIni, jamSekarang, tglPanjang, sapaan } from '@/lib/tanggal'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profil } = await wajibLogin()

  return (
    <AppShell
      user={{ nama: profil.nama, avatar: profil.avatar, role: profil.role }}
      tanggal={tglPanjang(hariIni())}
      sapaan={sapaan(jamSekarang())}
      logout={
        <form action={keluar}>
          <button className="fc-logout w-full text-left">
            <LogOut size={14} className="inline -mt-0.5" /> Keluar
          </button>
        </form>
      }
    >
      {children}
    </AppShell>
  )
}
