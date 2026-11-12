import Segera from '@/components/Segera'
import { wajibLogin } from '@/lib/auth'

export const metadata = { title: 'Pantau Anak' }

export default async function Page() {
  await wajibLogin('orangtua')
  return <Segera tahap={11} isi="Ringkasan keuangan anak untuk orang tua (hanya lihat)." />
}
