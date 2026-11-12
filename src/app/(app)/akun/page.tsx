import Segera from '@/components/Segera'
import { wajibLogin } from '@/lib/auth'

export const metadata = { title: 'Akun' }

export default async function Page() {
  await wajibLogin()
  return <Segera tahap={11} isi="Avatar, profil, ganti password, kode hubung orang tua." />
}
