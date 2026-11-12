import { redirect } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import LoginForm from './LoginForm'
import { getSesi, halamanUtama } from '@/lib/auth'

export const metadata = { title: 'Login' }

const PESAN: Record<string, string> = {
  reset: 'Kata sandi berhasil diganti. Silakan login dengan kata sandi baru.',
  konfirmasi: 'Email sudah dikonfirmasi. Silakan login.',
}
const ERROR: Record<string, string> = {
  link: 'Link sudah kedaluwarsa atau sudah pernah dipakai. Silakan coba lagi.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string; info?: string; error?: string }> }) {
  // sudah login? langsung ke halaman utama
  const sesi = await getSesi()
  if (sesi) redirect(halamanUtama(sesi.profil.role))

  const sp = await searchParams
  return (
    <AuthLayout
      sub={
        <>
          Atur keuangan mahasiswa lebih tenang dengan <span className="text-hsOrange font-extrabold">Peringatan Dini</span> &amp;{' '}
          <span className="text-hsBlue font-extrabold">Multi-Wallet</span>.
        </>
      }
    >
      <LoginForm
        mode={sp.mode === 'daftar' ? 'daftar' : 'masuk'}
        info={sp.info ? PESAN[sp.info] : undefined}
        error={sp.error ? ERROR[sp.error] : undefined}
      />
    </AuthLayout>
  )
}
