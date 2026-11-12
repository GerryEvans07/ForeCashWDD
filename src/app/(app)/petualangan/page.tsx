import Segera from '@/components/Segera'
import { wajibLogin } from '@/lib/auth'

export const metadata = { title: 'Petualangan' }

export default async function Page() {
  await wajibLogin('mahasiswa')
  return <Segera tahap={10} isi="Peta perjalanan, telur, koleksi 12 teman hemat." />
}
