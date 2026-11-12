import Segera from '@/components/Segera'
import { wajibLogin } from '@/lib/auth'

export const metadata = { title: 'Kelola Wallet' }

export default async function Page() {
  await wajibLogin('mahasiswa')
  return <Segera tahap={5} isi="Tambah, ubah, dan hapus wallet." />
}
