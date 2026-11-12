import Segera from '@/components/Segera'
import { wajibLogin } from '@/lib/auth'

export const metadata = { title: 'Transaksi' }

export default async function Page() {
  await wajibLogin('mahasiswa')
  return <Segera tahap={5} isi="Pemasukan, pengeluaran, transfer antar-wallet, foto struk, edit, batas harian, kategori sendiri, ekspor CSV." />
}
