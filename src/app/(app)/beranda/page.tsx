import Segera from '@/components/Segera'
import { wajibLogin } from '@/lib/auth'

export const metadata = { title: 'Beranda' }

export default async function Page() {
  await wajibLogin('mahasiswa')
  return <Segera tahap={4} isi="Banner peringatan dini, total saldo, burn rate, ringkasan utang, aksi cepat, wallet, transaksi terakhir." />
}
