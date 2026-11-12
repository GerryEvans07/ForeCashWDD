import Segera from '@/components/Segera'

export const metadata = { title: 'Masuk' }

export default function Page() {
  return (
    <main id="loginPage" className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full"><Segera tahap={3} isi="Login, daftar, login Google, lupa password." /></div>
    </main>
  )
}
