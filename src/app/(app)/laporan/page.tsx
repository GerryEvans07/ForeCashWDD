import Segera from '@/components/Segera'
import { wajibLogin } from '@/lib/auth'

export const metadata = { title: 'Laporan' }

export default async function Page() {
  await wajibLogin('mahasiswa')
  return <Segera tahap={8} isi="Pengeluaran per kategori dan laporan bulanan." />
}
