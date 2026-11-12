import Segera from '@/components/Segera'
import { wajibLogin } from '@/lib/auth'

export const metadata = { title: 'Utang & Patungan' }

export default async function Page() {
  await wajibLogin('mahasiswa')
  return <Segera tahap={6} isi="Utang, piutang, split bill, pengingat WhatsApp, tombol Lunas." />
}
