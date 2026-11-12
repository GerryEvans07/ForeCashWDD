import Segera from '@/components/Segera'
import { wajibLogin } from '@/lib/auth'

export const metadata = { title: 'Prediksi' }

export default async function Page() {
  await wajibLogin('mahasiswa')
  return <Segera tahap={7} isi="Jadwal pemasukan dan grafik proyeksi saldo harian." />
}
