// Hasil dari Server Action: pesan sukses (ok) atau pesan error.
// Pengganti flash() di versi PHP.
export type Hasil = { ok?: string; error?: string } | null

export const gagal = (error: string): Hasil => ({ error })
export const sukses = (ok: string): Hasil => ({ ok })

/** Ambil teks dari FormData (selalu string, sudah di-trim). */
export function teks(fd: FormData, nama: string): string {
  const v = fd.get(nama)
  return typeof v === 'string' ? v.trim() : ''
}

/** Ambil angka dari FormData (0 kalau kosong / tidak valid). */
export function angka(fd: FormData, nama: string): number {
  const n = Number(teks(fd, nama))
  return Number.isFinite(n) ? n : 0
}
