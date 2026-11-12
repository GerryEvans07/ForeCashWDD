import Segera from '@/components/Segera'
import { wajibLogin } from '@/lib/auth'

export const metadata = { title: 'Pencapaian' }

export default async function Page() {
  await wajibLogin('mahasiswa')
  return <Segera tahap={9} isi="Poin, level, streak, badge, tantangan mingguan." />
}
