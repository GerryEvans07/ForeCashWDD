'use client'

// Tombol hapus kecil dengan konfirmasi. Dipakai di daftar transaksi, wallet, utang, jadwal.
import { Trash2 } from 'lucide-react'
import { useAksi } from '@/lib/useAksi'
import type { Hasil } from '@/lib/aksi'

type Props = {
  aksi: (prev: Hasil, fd: FormData) => Promise<Hasil>
  id: number
  pesan?: string
  /** tampilkan pesan error di samping tombol (misalnya "wallet masih dipakai") */
  tampilError?: boolean
}

export default function TombolHapus({ aksi, id, pesan = 'Hapus data ini?', tampilError = true }: Props) {
  const { hasil, pending, onSubmit } = useAksi(aksi, { resetOk: false, sebelum: () => confirm(pesan) })
  return (
    <form onSubmit={onSubmit} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {tampilError && hasil?.error && <span className="text-[11px] font-bold text-hsRed">{hasil.error}</span>}
      <button disabled={pending} className="w-8 h-8 rounded-full bg-red-50 text-hsRed text-xs inline-flex items-center justify-center disabled:opacity-50" title="Hapus" aria-label="Hapus">
        <Trash2 size={14} />
      </button>
    </form>
  )
}
