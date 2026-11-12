// Pesan sukses / error setelah menyimpan (class fc-flash dari versi PHP).
import { CircleCheck, CircleAlert } from 'lucide-react'
import type { Hasil } from '@/lib/aksi'

export default function Flash({ hasil }: { hasil: Hasil }) {
  if (!hasil?.ok && !hasil?.error) return null
  const error = !!hasil.error
  return (
    <div className={`fc-flash ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>
      {error ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
      {hasil.error ?? hasil.ok}
    </div>
  )
}
